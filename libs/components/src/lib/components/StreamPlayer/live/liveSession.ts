import type { LiveFailure, LivePhase, LiveSource, LiveSourcesUpdate } from '@mezon/store';
import { waitConnected } from '../whep';
import { LiveCompositor, startIntervalWorker } from './compositor';
import { LiveMixer, openLiveCameraStream, openLiveMicStream } from './mixer';
import { h264Preferences, mungeOpusStereo } from './sdp';
import { WhipError, classifyWhip, deleteWhip, publishWhip } from './whip';

const CONNECT_TIMEOUT_MS = 15_000;
const DISCONNECTED_GRACE_MS = 5_000;
const SUSPEND_GAP_MS = 5_000;
const MAX_RECONNECT_ATTEMPTS = 6;
const MAX_BACKOFF_MS = 16_000;
const VIDEO_MAX_BITRATE = 4_000_000;
const VIDEO_MAX_FRAMERATE = 30;
const AUDIO_MAX_BITRATE = 128_000;
const ENDPOINT_TIMEOUT_MS = 10_000;

export type LiveEndpoint = {
	token: string;
	whip_url: string;
};

export interface LiveSessionOptions {
	channelId: string;
	fetchEndpoint: () => Promise<LiveEndpoint | null>;
	onPhase: (phase: LivePhase, attempt?: number) => void;
	onSources: (sources: LiveSourcesUpdate) => void;
	onFailure: (failure: LiveFailure) => void;
	onSourceIssue: (source: LiveSource, kind: 'start' | 'ended') => void;
	screen: MediaStream | null;
	camera: MediaStream | null;
	mic: MediaStream | null;
	audioContext: AudioContext;
	systemAudioOn?: boolean;
}

class WallClockWatch {
	private lastTick: number;
	private suspended = false;

	constructor(now: number) {
		this.lastTick = now;
	}

	observe(now: number): boolean {
		if (now - this.lastTick > SUSPEND_GAP_MS) {
			this.suspended = true;
		}
		this.lastTick = now;
		return this.suspended;
	}

	onConnected(now: number): void {
		this.lastTick = now;
		this.suspended = false;
	}
}

function stopMediaStream(stream: MediaStream | null): void {
	if (!stream) return;
	for (const track of stream.getTracks()) {
		track.onended = null;
		track.stop();
	}
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
	return new Promise<T | null>((resolve) => {
		const timer = setTimeout(() => resolve(null), ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			() => {
				clearTimeout(timer);
				resolve(null);
			}
		);
	});
}

function backoffMs(attempt: number): number {
	const shift = Math.min(4, Math.max(0, attempt - 1));
	return Math.min(MAX_BACKOFF_MS, 1000 * 2 ** shift);
}

async function applySenderParameters(videoSender: RTCRtpSender, audioSender: RTCRtpSender): Promise<void> {
	try {
		const vParams = videoSender.getParameters();
		if (!vParams.encodings || vParams.encodings.length === 0) {
			vParams.encodings = [{}];
		}
		vParams.encodings[0].maxBitrate = VIDEO_MAX_BITRATE;
		vParams.encodings[0].maxFramerate = VIDEO_MAX_FRAMERATE;
		vParams.degradationPreference = 'maintain-resolution';
		await videoSender.setParameters(vParams).catch(async () => {
			const fallbackParams = videoSender.getParameters();
			if (!fallbackParams.encodings || fallbackParams.encodings.length === 0) {
				fallbackParams.encodings = [{}];
			}
			fallbackParams.encodings[0].maxBitrate = VIDEO_MAX_BITRATE;
			fallbackParams.encodings[0].maxFramerate = VIDEO_MAX_FRAMERATE;
			await videoSender.setParameters(fallbackParams).catch(() => undefined);
		});
	} catch {
		void 0;
	}

	try {
		const aParams = audioSender.getParameters();
		if (!aParams.encodings || aParams.encodings.length === 0) {
			aParams.encodings = [{}];
		}
		aParams.encodings[0].maxBitrate = AUDIO_MAX_BITRATE;
		await audioSender.setParameters(aParams).catch(() => undefined);
	} catch {
		void 0;
	}
}

export class LiveSession {
	readonly channelId: string;
	readonly compositor: LiveCompositor;
	private readonly mixer: LiveMixer;
	private readonly mediaStream: MediaStream;
	private readonly fetchEndpoint: () => Promise<LiveEndpoint | null>;
	private readonly onPhase: (phase: LivePhase, attempt?: number) => void;
	private readonly onSources: (sources: LiveSourcesUpdate) => void;
	private readonly onFailure: (failure: LiveFailure) => void;
	private readonly onSourceIssue: (source: LiveSource, kind: 'start' | 'ended') => void;
	private readonly watch: WallClockWatch;
	private stopWatchWorker: (() => void) | null = null;

	private screenStream: MediaStream | null = null;
	private cameraStream: MediaStream | null = null;
	private micStream: MediaStream | null = null;
	private wantSystemAudio: boolean;
	private screenOn = false;
	private cameraOn = false;
	private micOn = false;
	private systemAudioOn = false;
	private hasSystemAudio = false;

	private pc: RTCPeerConnection | null = null;
	private pcGen = 0;
	private cameraGen = 0;
	private micGen = 0;
	private resource: string | null = null;
	private token = '';
	private staleResource: { resource: string; token: string } | null = null;
	private wasConnected = false;
	private leftConnectedAt = 0;
	private disconnectedTimer: ReturnType<typeof setTimeout> | null = null;
	private cancelSleep: (() => void) | null = null;
	private reconnecting = false;
	private started = false;
	private stopped = false;

	constructor(options: LiveSessionOptions) {
		this.channelId = options.channelId;
		this.fetchEndpoint = options.fetchEndpoint;
		this.onPhase = options.onPhase;
		this.onSources = options.onSources;
		this.onFailure = options.onFailure;
		this.onSourceIssue = options.onSourceIssue;
		this.wantSystemAudio = options.systemAudioOn ?? true;
		this.watch = new WallClockWatch(Date.now());

		this.compositor = new LiveCompositor();
		this.mixer = new LiveMixer(options.audioContext);
		this.mediaStream = new MediaStream([this.compositor.track, this.mixer.track]);

		this.attachInitialScreen(options.screen);
		this.attachInitialCamera(options.camera);
		this.attachInitialMic(options.mic);
	}

	private attachInitialScreen(stream: MediaStream | null): void {
		if (!stream) return;
		const videoTrack = stream.getVideoTracks()[0];
		if (!videoTrack || videoTrack.readyState === 'ended') {
			stopMediaStream(stream);
			return;
		}
		this.screenStream = stream;
		this.screenOn = true;
		const audioTrack = stream.getAudioTracks()[0] ?? null;
		this.hasSystemAudio = Boolean(audioTrack && audioTrack.readyState !== 'ended');
		this.systemAudioOn = Boolean(this.wantSystemAudio && this.hasSystemAudio);
		this.bindScreenTrackListeners(stream, videoTrack, audioTrack);
		this.compositor.setScreen(stream);
		this.connectSystemAudio(this.systemAudioOn && audioTrack ? audioTrack : null);
	}

	private bindScreenTrackListeners(stream: MediaStream, videoTrack: MediaStreamTrack, audioTrack: MediaStreamTrack | null): void {
		videoTrack.onended = () => {
			if (this.stopped || this.screenStream !== stream) return;
			stopMediaStream(stream);
			this.screenStream = null;
			this.screenOn = false;
			this.hasSystemAudio = false;
			this.systemAudioOn = false;
			this.compositor.setScreen(null);
			this.mixer.setSystemAudio(null);
			this.emitSources();
			this.onSourceIssue('screen', 'ended');
		};
		if (audioTrack) {
			audioTrack.onended = () => {
				if (this.stopped || this.screenStream !== stream) return;
				this.hasSystemAudio = false;
				this.systemAudioOn = false;
				this.mixer.setSystemAudio(null);
				this.emitSources();
				this.onSourceIssue('systemAudio', 'ended');
			};
		}
	}

	private attachInitialCamera(stream: MediaStream | null): void {
		if (!stream) return;
		const videoTrack = stream.getVideoTracks()[0];
		if (!videoTrack || videoTrack.readyState === 'ended') {
			stopMediaStream(stream);
			return;
		}
		this.cameraStream = stream;
		this.cameraOn = true;
		this.bindCameraTrackListener(stream, videoTrack);
		this.compositor.setCamera(stream);
	}

	private bindCameraTrackListener(stream: MediaStream, videoTrack: MediaStreamTrack): void {
		videoTrack.onended = () => {
			if (this.stopped || this.cameraStream !== stream) return;
			stopMediaStream(stream);
			this.cameraStream = null;
			this.cameraOn = false;
			this.compositor.setCamera(null);
			this.emitSources();
			this.onSourceIssue('camera', 'ended');
		};
	}

	private attachInitialMic(stream: MediaStream | null): void {
		if (!stream) return;
		const audioTrack = stream.getAudioTracks()[0];
		if (!audioTrack || audioTrack.readyState === 'ended') {
			stopMediaStream(stream);
			return;
		}
		this.micStream = stream;
		this.micOn = true;
		this.bindMicTrackListener(stream, audioTrack);
		if (!this.mixer.setMic(stream)) this.dropMic();
	}

	private bindMicTrackListener(stream: MediaStream, audioTrack: MediaStreamTrack): void {
		audioTrack.onended = () => {
			if (this.stopped || this.micStream !== stream) return;
			stopMediaStream(stream);
			this.micStream = null;
			this.micOn = false;
			this.mixer.setMic(null);
			this.emitSources();
			this.onSourceIssue('mic', 'ended');
		};
	}

	private dropMic(): void {
		stopMediaStream(this.micStream);
		this.micStream = null;
		this.micOn = false;
		this.onSourceIssue('mic', 'start');
	}

	private connectSystemAudio(track: MediaStreamTrack | null): void {
		if (this.mixer.setSystemAudio(track)) return;
		this.systemAudioOn = false;
		this.onSourceIssue('systemAudio', 'start');
	}

	private emitSources(): void {
		if (this.stopped) return;
		this.onSources({
			screenOn: this.screenOn,
			cameraOn: this.cameraOn,
			micOn: this.micOn,
			systemAudioOn: this.systemAudioOn,
			hasSystemAudio: this.hasSystemAudio
		});
	}

	async start(): Promise<void> {
		if (this.started || this.stopped) return;
		this.started = true;
		this.emitSources();

		const h264Codecs = this.resolveH264Codecs();
		if (!h264Codecs) {
			this.fail('unsupported');
			return;
		}

		this.stopWatchWorker = startIntervalWorker(1000, () => {
			this.watch.observe(Date.now());
		});

		const endpoint = await withTimeout(this.fetchEndpoint(), ENDPOINT_TIMEOUT_MS);
		if (this.stopped) return;

		if (!endpoint?.token || !endpoint?.whip_url) {
			await this.runReconnectLoop(h264Codecs, false, undefined);
			return;
		}

		const outcome = await this.connectOnce(endpoint, h264Codecs);
		if (this.stopped) return;

		if (outcome.kind === 'connected') {
			return;
		}
		if (outcome.kind === 'terminal') {
			this.fail(outcome.failure);
			return;
		}
		await this.runReconnectLoop(h264Codecs, outcome.serverBusy, outcome.retryAfterMs);
	}

	private resolveH264Codecs(): RTCRtpCodec[] | null {
		if (typeof RTCRtpSender === 'undefined' || typeof RTCRtpSender.getCapabilities !== 'function') {
			return null;
		}
		const caps = RTCRtpSender.getCapabilities('video');
		if (!caps?.codecs) return null;
		const prefs = h264Preferences(caps.codecs);
		return prefs.length > 0 ? prefs : null;
	}

	private async connectOnce(
		endpoint: LiveEndpoint,
		h264Codecs: RTCRtpCodec[]
	): Promise<{ kind: 'connected' } | { kind: 'terminal'; failure: LiveFailure } | { kind: 'retry'; serverBusy: boolean; retryAfterMs?: number }> {
		const myGen = ++this.pcGen;
		const pc = new RTCPeerConnection();
		let videoTransceiver: RTCRtpTransceiver;
		let audioTransceiver: RTCRtpTransceiver;

		try {
			videoTransceiver = pc.addTransceiver(this.compositor.track, {
				direction: 'sendonly',
				streams: [this.mediaStream]
			});
			audioTransceiver = pc.addTransceiver(this.mixer.track, {
				direction: 'sendonly',
				streams: [this.mediaStream]
			});
		} catch {
			pc.close();
			return { kind: 'retry', serverBusy: false };
		}

		if (typeof videoTransceiver.setCodecPreferences !== 'function') {
			pc.close();
			return { kind: 'terminal', failure: 'unsupported' };
		}

		try {
			videoTransceiver.setCodecPreferences(h264Codecs);
		} catch {
			pc.close();
			return { kind: 'terminal', failure: 'unsupported' };
		}

		let mungedOffer: string;
		try {
			const offer = await pc.createOffer();
			if (!offer.sdp) {
				pc.close();
				return { kind: 'terminal', failure: 'unsupported' };
			}
			mungedOffer = mungeOpusStereo(offer.sdp);
			await pc.setLocalDescription({ type: 'offer', sdp: mungedOffer });
		} catch {
			pc.close();
			return { kind: 'retry', serverBusy: false };
		}

		if (this.stopped || myGen !== this.pcGen) {
			pc.close();
			return { kind: 'retry', serverBusy: false };
		}

		let published: { resource: string; answer: string };
		try {
			published = await publishWhip(endpoint.whip_url, endpoint.token, mungedOffer);
		} catch (err) {
			pc.close();
			if (err instanceof WhipError) {
				const classified = classifyWhip(err.status);
				if (classified !== 'retry') {
					return { kind: 'terminal', failure: classified };
				}
				return { kind: 'retry', serverBusy: err.status === 503, retryAfterMs: err.retryAfterMs };
			}
			return { kind: 'retry', serverBusy: false };
		}

		if (this.stopped || myGen !== this.pcGen) {
			pc.close();
			void deleteWhip(published.resource, endpoint.token);
			return { kind: 'retry', serverBusy: false };
		}

		try {
			await pc.setRemoteDescription({ type: 'answer', sdp: published.answer });
		} catch {
			pc.close();
			void deleteWhip(published.resource, endpoint.token);
			return { kind: 'retry', serverBusy: false };
		}

		await applySenderParameters(videoTransceiver.sender, audioTransceiver.sender);

		if (this.stopped || myGen !== this.pcGen) {
			pc.close();
			void deleteWhip(published.resource, endpoint.token);
			return { kind: 'retry', serverBusy: false };
		}

		this.pc = pc;
		this.resource = published.resource;
		this.token = endpoint.token;

		const connected = await waitConnected(pc, CONNECT_TIMEOUT_MS);
		if (this.stopped || myGen !== this.pcGen) {
			return { kind: 'retry', serverBusy: false };
		}

		if (!connected) {
			pc.onconnectionstatechange = null;
			pc.close();
			if (this.pc === pc) {
				this.pc = null;
			}
			this.staleResource = { resource: published.resource, token: endpoint.token };
			this.resource = null;
			return { kind: 'retry', serverBusy: false };
		}

		const now = Date.now();
		this.wasConnected = true;
		this.leftConnectedAt = now;
		this.watch.onConnected(now);
		this.reconnecting = false;
		this.onPhase('live');
		this.bindHealthMonitor(pc, myGen, h264Codecs);
		return { kind: 'connected' };
	}

	private bindHealthMonitor(pc: RTCPeerConnection, gen: number, h264Codecs: RTCRtpCodec[]): void {
		let currentlyConnected = true;
		pc.onconnectionstatechange = () => {
			if (this.stopped || gen !== this.pcGen || this.pc !== pc) return;
			const state = pc.connectionState;
			if (state === 'connected') {
				currentlyConnected = true;
				if (this.disconnectedTimer) {
					clearTimeout(this.disconnectedTimer);
					this.disconnectedTimer = null;
				}
				const now = Date.now();
				this.wasConnected = true;
				this.leftConnectedAt = now;
				this.watch.onConnected(now);
				return;
			}
			if (currentlyConnected) {
				currentlyConnected = false;
				this.leftConnectedAt = Date.now();
			}
			if (state === 'failed') {
				if (this.disconnectedTimer) {
					clearTimeout(this.disconnectedTimer);
					this.disconnectedTimer = null;
				}
				void this.runReconnectLoop(h264Codecs, false, undefined);
				return;
			}
			if (state === 'disconnected' && !this.disconnectedTimer) {
				this.disconnectedTimer = setTimeout(() => {
					this.disconnectedTimer = null;
					if (this.stopped || gen !== this.pcGen || this.pc !== pc) return;
					void this.runReconnectLoop(h264Codecs, false, undefined);
				}, DISCONNECTED_GRACE_MS);
			}
		};
	}

	private async runReconnectLoop(h264Codecs: RTCRtpCodec[], initialServerBusy: boolean, initialRetryAfterMs?: number): Promise<void> {
		if (this.stopped || this.reconnecting) return;
		this.reconnecting = true;
		this.pcGen += 1;

		if (this.disconnectedTimer) {
			clearTimeout(this.disconnectedTimer);
			this.disconnectedTimer = null;
		}
		const oldPc = this.pc;
		this.pc = null;
		if (oldPc) {
			oldPc.onconnectionstatechange = null;
		}

		const now = Date.now();
		const suspended = this.watch.observe(now);
		const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
		const recentlyConnected = this.wasConnected && now - this.leftConnectedAt <= DISCONNECTED_GRACE_MS + 1500;
		const trustTakeover = online && recentlyConnected && !suspended;

		const oldSession = this.resource ? { resource: this.resource, token: this.token } : this.staleResource;
		this.resource = null;
		this.staleResource = null;
		this.wasConnected = false;

		if (oldSession) {
			if (trustTakeover) {
				const deleteStatus = await deleteWhip(oldSession.resource, oldSession.token);
				oldPc?.close();
				if (this.stopped) return;
				const stillOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
				const gapSeen = this.watch.observe(Date.now());
				if (deleteStatus === 404 && stillOnline && !gapSeen) {
					this.fail('replaced');
					return;
				}
			} else {
				void deleteWhip(oldSession.resource, oldSession.token).finally(() => oldPc?.close());
			}
		} else {
			oldPc?.close();
		}

		let lastServerBusy = initialServerBusy;
		let pendingRetryAfterMs = initialRetryAfterMs;

		for (let attempt = 1; attempt <= MAX_RECONNECT_ATTEMPTS; attempt += 1) {
			if (this.stopped) return;
			this.onPhase('reconnecting', attempt);

			const delay = pendingRetryAfterMs !== undefined ? Math.min(MAX_BACKOFF_MS, pendingRetryAfterMs) : backoffMs(attempt);
			pendingRetryAfterMs = undefined;

			await this.sleep(delay);
			if (this.stopped) return;

			this.flushStaleResource();

			const freshEndpoint = await withTimeout(this.fetchEndpoint(), ENDPOINT_TIMEOUT_MS);
			if (this.stopped) return;

			if (!freshEndpoint?.token || !freshEndpoint?.whip_url) {
				lastServerBusy = false;
				continue;
			}

			const outcome = await this.connectOnce(freshEndpoint, h264Codecs);
			if (this.stopped) return;

			if (outcome.kind === 'connected') {
				return;
			}
			if (outcome.kind === 'terminal') {
				this.fail(outcome.failure);
				return;
			}
			lastServerBusy = outcome.serverBusy;
			pendingRetryAfterMs = outcome.retryAfterMs;
		}

		this.fail(lastServerBusy ? 'serverBusy' : 'network');
	}

	private flushStaleResource(): void {
		if (!this.staleResource) return;
		void deleteWhip(this.staleResource.resource, this.staleResource.token);
		this.staleResource = null;
	}

	private sleep(ms: number): Promise<void> {
		if (this.stopped) return Promise.resolve();
		return new Promise<void>((resolve) => {
			const timer = setTimeout(() => {
				this.cancelSleep = null;
				resolve();
			}, ms);
			this.cancelSleep = () => {
				clearTimeout(timer);
				this.cancelSleep = null;
				resolve();
			};
		});
	}

	setScreen(stream: MediaStream | null): void {
		if (this.stopped) {
			stopMediaStream(stream);
			return;
		}
		if (this.screenStream && this.screenStream !== stream) {
			stopMediaStream(this.screenStream);
		}
		if (!stream) {
			this.screenStream = null;
			this.screenOn = false;
			this.hasSystemAudio = false;
			this.systemAudioOn = false;
			this.compositor.setScreen(null);
			this.mixer.setSystemAudio(null);
			this.emitSources();
			return;
		}
		const videoTrack = stream.getVideoTracks()[0];
		if (!videoTrack || videoTrack.readyState === 'ended') {
			stopMediaStream(stream);
			this.screenStream = null;
			this.screenOn = false;
			this.hasSystemAudio = false;
			this.systemAudioOn = false;
			this.compositor.setScreen(null);
			this.mixer.setSystemAudio(null);
			this.emitSources();
			this.onSourceIssue('screen', 'start');
			return;
		}
		const audioTrack = stream.getAudioTracks()[0] ?? null;
		this.screenStream = stream;
		this.screenOn = true;
		this.hasSystemAudio = Boolean(audioTrack && audioTrack.readyState !== 'ended');
		this.systemAudioOn = Boolean(this.wantSystemAudio && this.hasSystemAudio);
		this.bindScreenTrackListeners(stream, videoTrack, audioTrack);
		this.compositor.setScreen(stream);
		this.connectSystemAudio(this.systemAudioOn && audioTrack ? audioTrack : null);
		this.emitSources();
	}

	setCamera(on: boolean): void {
		if (this.stopped) return;
		const gen = ++this.cameraGen;
		if (!on) {
			stopMediaStream(this.cameraStream);
			this.cameraStream = null;
			this.cameraOn = false;
			this.compositor.setCamera(null);
			this.emitSources();
			return;
		}
		if (this.cameraOn && this.cameraStream) return;
		void openLiveCameraStream()
			.then((stream) => {
				if (this.stopped || gen !== this.cameraGen) {
					stopMediaStream(stream);
					return;
				}
				const videoTrack = stream.getVideoTracks()[0];
				if (!videoTrack || videoTrack.readyState === 'ended') {
					stopMediaStream(stream);
					this.cameraOn = false;
					this.emitSources();
					this.onSourceIssue('camera', 'start');
					return;
				}
				stopMediaStream(this.cameraStream);
				this.cameraStream = stream;
				this.cameraOn = true;
				this.bindCameraTrackListener(stream, videoTrack);
				this.compositor.setCamera(stream);
				this.emitSources();
			})
			.catch(() => {
				if (this.stopped || gen !== this.cameraGen) return;
				this.cameraOn = false;
				this.emitSources();
				this.onSourceIssue('camera', 'start');
			});
	}

	setMic(on: boolean): void {
		if (this.stopped) return;
		const gen = ++this.micGen;
		if (!on) {
			stopMediaStream(this.micStream);
			this.micStream = null;
			this.micOn = false;
			this.mixer.setMic(null);
			this.emitSources();
			return;
		}
		if (this.micOn && this.micStream) return;
		void openLiveMicStream()
			.then((stream) => {
				if (this.stopped || gen !== this.micGen) {
					stopMediaStream(stream);
					return;
				}
				const audioTrack = stream.getAudioTracks()[0];
				if (!audioTrack || audioTrack.readyState === 'ended') {
					stopMediaStream(stream);
					this.micOn = false;
					this.emitSources();
					this.onSourceIssue('mic', 'start');
					return;
				}
				stopMediaStream(this.micStream);
				this.micStream = stream;
				this.micOn = true;
				this.bindMicTrackListener(stream, audioTrack);
				if (!this.mixer.setMic(stream)) this.dropMic();
				this.emitSources();
			})
			.catch(() => {
				if (this.stopped || gen !== this.micGen) return;
				this.micOn = false;
				this.emitSources();
				this.onSourceIssue('mic', 'start');
			});
	}

	setSystemAudio(on: boolean): void {
		if (this.stopped) return;
		this.wantSystemAudio = on;
		const audioTrack = this.screenStream?.getAudioTracks()[0] ?? null;
		this.hasSystemAudio = Boolean(audioTrack && audioTrack.readyState !== 'ended');
		this.systemAudioOn = Boolean(on && this.hasSystemAudio);
		this.connectSystemAudio(this.systemAudioOn && audioTrack ? audioTrack : null);
		this.emitSources();
	}

	private fail(failure: LiveFailure): void {
		if (this.stopped) return;
		this.onFailure(failure);
		this.stop();
	}

	stop(keepalive = false): void {
		if (this.stopped) return;
		this.stopped = true;
		this.pcGen += 1;
		this.cameraGen += 1;
		this.micGen += 1;

		if (this.disconnectedTimer) {
			clearTimeout(this.disconnectedTimer);
			this.disconnectedTimer = null;
		}
		this.cancelSleep?.();
		this.stopWatchWorker?.();
		this.stopWatchWorker = null;

		const activeResource = this.resource ?? this.staleResource?.resource ?? null;
		const activeToken = this.resource ? this.token : (this.staleResource?.token ?? '');
		this.resource = null;
		this.staleResource = null;

		const pc = this.pc;
		this.pc = null;
		if (pc) {
			pc.onconnectionstatechange = null;
		}
		if (activeResource && activeToken) {
			const deleted = deleteWhip(activeResource, activeToken, keepalive);
			if (keepalive) {
				pc?.close();
			} else {
				void deleted.finally(() => pc?.close());
			}
		} else {
			pc?.close();
		}

		stopMediaStream(this.screenStream);
		stopMediaStream(this.cameraStream);
		stopMediaStream(this.micStream);
		this.screenStream = null;
		this.cameraStream = null;
		this.micStream = null;

		this.compositor.dispose();
		this.mixer.dispose();

		this.onPhase('idle');
	}
}
