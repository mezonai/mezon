import { getStore, voiceActions } from '@mezon/store';
import { AudioMixer } from './AudioMixer';
import { CanvasCompositor } from './CanvasCompositor';
import type { RecordingSink } from './RecordingSink';
import {
	BLOB_SINK_MAX_BYTES,
	BLOB_SINK_MAX_DURATION_MS,
	RecordingCancelledError,
	buildRecordingFileName,
	createRecordingSink
} from './RecordingSink';
import { WorkerCompositor } from './WorkerCompositor';
import { detectRecorderCapabilities } from './capabilities';
import { accentColorFor } from './renderRecordingFrame';
import type {
	RecordingAudioSource,
	RecordingCompositor,
	RecordingPipeline,
	RecordingResult,
	RecordingSceneTile,
	RecordingStatus,
	WorkerSceneTile
} from './types';

const FRAME_SIZE = { width: 1280, height: 720 };
const VIDEO_BITRATE_CAMERA = 3_500_000;
const VIDEO_BITRATE_SCREEN = 5_500_000;

const WORKER_FPS = 30;
const CANVAS_FPS = 24;
const TIMESLICE_MS = 2000;
const AUDIO_BITRATE = 128_000;
const MAX_TILES = 16;
const AVATAR_SIZE = 160;

export function selectRecordingTiles(tiles: RecordingSceneTile[]): RecordingSceneTile[] {
	if (tiles.length <= MAX_TILES) return tiles;

	const focused = tiles.filter((tile) => tile.focused);
	const rest = tiles.filter((tile) => !tile.focused);
	rest.sort((a, b) => Number(!!b.videoTrack) - Number(!!a.videoTrack));
	return [...focused, ...rest].slice(0, MAX_TILES);
}

export interface StartRecordingOptions {
	channelLabel?: string;
}

export const RECORDING_FRAME_SIZE = FRAME_SIZE;

export type RecorderEvent =
	| { type: 'started' }
	| { type: 'finished'; result: RecordingResult }
	| { type: 'error'; message: string }
	| { type: 'cancelled' };

type RecorderListener = (event: RecorderEvent) => void;

export interface RecordingSource {
	scene: () => RecordingSceneTile[];
	audio: () => RecordingAudioSource[];
}

const avatarBlobCache = new Map<string, Promise<Blob>>();
const avatarFailures = new Set<string>();

function toDevProxyUrl(url: string): string | null {
	if (typeof window === 'undefined') return null;

	const { hostname, origin } = window.location;
	if (hostname !== 'localhost' && hostname !== '127.0.0.1') return null;

	const match = /^https?:\/\/([^/]+)(\/.*)$/.exec(url);
	if (!match) return null;

	const [, host, rest] = match;
	if (!host.includes('imgproxy') || url.startsWith(origin)) return null;

	return `/imgproxy-cors${rest}`;
}

async function loadAvatarBitmap(url: string, size: number): Promise<ImageBitmap | null> {
	if (avatarFailures.has(url)) return null;

	const options: ImageBitmapOptions = { resizeWidth: size, resizeHeight: size, resizeQuality: 'medium' };
	const candidates = [url, toDevProxyUrl(url)].filter(Boolean) as string[];

	for (const candidate of candidates) {
		try {
			let pending = avatarBlobCache.get(candidate);
			if (!pending) {
				pending = fetch(candidate, { mode: 'cors', credentials: 'omit' }).then((response) => {
					if (!response.ok) throw new Error(`avatar ${response.status}`);
					return response.blob();
				});
				avatarBlobCache.set(candidate, pending);
			}
			return await createImageBitmap(await pending, options);
		} catch {
			avatarBlobCache.delete(candidate);
		}
	}

	try {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.decoding = 'async';
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new Error('avatar image load failed'));
			image.src = url;
		});
		return await createImageBitmap(image, options);
	} catch {
		avatarFailures.add(url);
		console.warn(
			'[recording] avatar is not CORS-readable, falling back to initials. The image host must send an Access-Control-Allow-Origin that matches this origin:',
			url
		);
		return null;
	}
}

class CallRecorderEngine {
	private status: RecordingStatus = 'idle';
	private compositor: RecordingCompositor | null = null;
	private mixer: AudioMixer | null = null;
	private recorder: MediaRecorder | null = null;
	private sink: RecordingSink | null = null;
	private stream: MediaStream | null = null;
	private startedAt = 0;
	private deadlineTimer: number | null = null;

	private tiles: RecordingSceneTile[] = [];
	private sceneSignature = '';
	private audioSources: RecordingAudioSource[] = [];
	private readonly sentAvatars = new Set<string>();
	private readonly listeners = new Set<RecorderListener>();
	private startPromise: Promise<boolean> | null = null;
	private stopPromise: Promise<void> | null = null;
	private source: RecordingSource | null = null;
	private pendingError: string | null = null;

	get isRecording(): boolean {
		return this.status === 'recording' || this.status === 'starting';
	}

	setSource(source: RecordingSource): () => void {
		this.source = source;
		return () => {
			if (this.source === source) {
				this.source = null;
			}
		};
	}

	get frameSize(): { width: number; height: number } {
		return FRAME_SIZE;
	}

	subscribe(listener: RecorderListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private emit(event: RecorderEvent): void {
		this.listeners.forEach((listener) => listener(event));
	}

	private patchStore(patch: Record<string, unknown>): void {
		getStore().dispatch(voiceActions.setRecordingState(patch));
	}

	async start(options: StartRecordingOptions = {}): Promise<boolean> {
		if (this.status !== 'idle') return false;

		this.startPromise = this.beginRecording(options);
		try {
			return await this.startPromise;
		} finally {
			this.startPromise = null;
		}
	}

	private createCompositor(preferred: RecordingPipeline): { compositor: RecordingCompositor; pipeline: RecordingPipeline } {
		if (preferred === 'worker') {
			try {
				return { compositor: new WorkerCompositor(FRAME_SIZE.width, FRAME_SIZE.height, WORKER_FPS), pipeline: 'worker' };
			} catch (error) {
				console.warn('[recording] worker pipeline unavailable, falling back to canvas', error);
			}
		}

		const canvasCompositor = new CanvasCompositor(FRAME_SIZE.width, FRAME_SIZE.height, CANVAS_FPS);
		canvasCompositor.onVisibilityDegraded = () => this.patchStore({ degraded: true });
		return { compositor: canvasCompositor, pipeline: 'canvas' };
	}

	private async beginRecording(options: StartRecordingOptions): Promise<boolean> {
		const capabilities = detectRecorderCapabilities();

		if (!capabilities.supported || !capabilities.codec) {
			this.patchStore({ status: 'error', error: capabilities.reason || 'unsupported' });
			this.emit({ type: 'error', message: capabilities.reason || 'unsupported' });
			return false;
		}

		this.status = 'starting';
		this.pendingError = null;
		this.patchStore({
			status: 'starting',
			error: null,
			degraded: false,
			pipeline: capabilities.pipeline,
			streamingToDisk: capabilities.streamingToDisk
		});

		const { mimeType, extension } = capabilities.codec;
		const fileName = buildRecordingFileName(options.channelLabel, extension);

		try {
			this.sink = await createRecordingSink(fileName, mimeType, extension);
		} catch (error) {
			this.status = 'idle';
			this.patchStore({ status: 'idle' });
			if (error instanceof RecordingCancelledError) {
				this.emit({ type: 'cancelled' });
			} else {
				this.emit({ type: 'error', message: (error as Error).message });
			}
			return false;
		}

		this.tiles = this.source?.scene() ?? [];
		this.sceneSignature = '';
		this.audioSources = this.source?.audio() ?? [];

		const hasScreenShare = this.tiles.some((tile) => tile.isScreenShare && tile.videoTrack);
		const videoBitrate = hasScreenShare ? VIDEO_BITRATE_SCREEN : VIDEO_BITRATE_CAMERA;

		try {
			this.mixer = new AudioMixer();
			await this.mixer.resume();
			this.mixer.sync(this.audioSources);

			const { compositor, pipeline } = this.createCompositor(capabilities.pipeline);
			this.compositor = compositor;
			this.patchStore({ pipeline });
			this.pushScene();

			this.stream = new MediaStream([compositor.track, this.mixer.track]);
			this.recorder = new MediaRecorder(this.stream, {
				mimeType,
				videoBitsPerSecond: videoBitrate,
				audioBitsPerSecond: AUDIO_BITRATE
			});
			this.recorder.ondataavailable = this.handleData;
			this.recorder.onerror = this.handleRecorderError;
			this.recorder.start(TIMESLICE_MS);
		} catch (error) {
			await this.teardown();
			await this.sink?.abort();
			this.sink = null;
			this.status = 'idle';
			this.patchStore({ status: 'error', error: (error as Error).message });
			this.emit({ type: 'error', message: (error as Error).message });
			return false;
		}

		this.startedAt = Date.now();
		this.status = 'recording';

		const deadlineAt = this.sink.streaming ? null : this.startedAt + BLOB_SINK_MAX_DURATION_MS;
		if (deadlineAt) {
			this.deadlineTimer = window.setTimeout(() => this.stop(), BLOB_SINK_MAX_DURATION_MS);
		}

		this.patchStore({ status: 'recording', startedAt: this.startedAt, deadlineAt, streamingToDisk: this.sink.streaming });
		window.addEventListener('beforeunload', this.handleBeforeUnload);
		this.emit({ type: 'started' });
		return true;
	}

	async stop(): Promise<void> {
		if (this.startPromise) {
			await this.startPromise;
		}
		if (this.status !== 'recording' && this.status !== 'starting') return;
		if (this.stopPromise) return this.stopPromise;

		this.status = 'stopping';
		this.patchStore({ status: 'stopping' });

		this.stopPromise = this.finish();
		try {
			await this.stopPromise;
		} finally {
			this.stopPromise = null;
		}
	}

	private async finish(): Promise<void> {
		window.removeEventListener('beforeunload', this.handleBeforeUnload);
		if (this.deadlineTimer) {
			window.clearTimeout(this.deadlineTimer);
			this.deadlineTimer = null;
		}

		const recorder = this.recorder;
		if (recorder && recorder.state !== 'inactive') {
			await new Promise<void>((resolve) => {
				const done = () => resolve();
				recorder.addEventListener('stop', done, { once: true });
				try {
					recorder.stop();
				} catch {
					resolve();
				}
			});
		}

		const durationMs = this.startedAt ? Date.now() - this.startedAt : 0;
		await this.teardown();

		const sink = this.sink;
		this.sink = null;
		this.status = 'idle';

		const failure = this.pendingError;
		this.pendingError = null;

		if (!sink) {
			this.patchStore({ status: failure ? 'error' : 'idle', startedAt: null, deadlineAt: null, error: failure });
			return;
		}

		try {
			const outcome = await sink.finalize();
			this.patchStore({ status: failure ? 'error' : 'idle', startedAt: null, deadlineAt: null, error: failure });
			if (failure) return;
			this.emit({
				type: 'finished',
				result: {
					fileName: sink.fileName,
					savedToDisk: outcome.savedToDisk,
					bytes: outcome.bytes,
					durationMs
				}
			});
		} catch (error) {
			const message = failure || (error as Error).message;
			this.patchStore({ status: 'error', startedAt: null, deadlineAt: null, error: message });
			if (!failure) {
				this.emit({ type: 'error', message });
			}
		}
	}

	private async teardown(): Promise<void> {
		if (this.recorder) {
			this.recorder.ondataavailable = null;
			this.recorder.onerror = null;
			this.recorder = null;
		}
		this.stream = null;

		const compositor = this.compositor;
		this.compositor = null;
		await compositor?.stop();

		const mixer = this.mixer;
		this.mixer = null;
		await mixer?.close();

		this.sentAvatars.clear();
		this.tiles = [];
		this.sceneSignature = '';
		this.audioSources = [];
	}

	private handleData = (event: BlobEvent) => {
		if (!this.sink || !event.data || event.data.size === 0) return;
		this.sink.write(event.data);

		if (!this.sink.streaming && this.sink.bytesWritten > BLOB_SINK_MAX_BYTES) {
			void this.stop();
		}
	};

	private handleRecorderError = (event: Event) => {
		const message = (event as unknown as { error?: DOMException }).error?.message || 'recorder-error';
		this.pendingError = message;
		this.patchStore({ error: message });
		this.emit({ type: 'error', message });
		void this.stop();
	};

	private handleBeforeUnload = (event: BeforeUnloadEvent) => {
		event.preventDefault();
		event.returnValue = '';
	};

	syncScene(tiles: RecordingSceneTile[]): void {
		const signature = tiles
			.map(
				(tile) =>
					`${tile.key}|${tile.videoTrack?.id ?? ''}|${tile.focused ? 1 : 0}|${tile.speaking ? 1 : 0}|${tile.label}|${tile.avatarUrl ?? ''}`
			)
			.join(';');

		const unchanged = signature === this.sceneSignature;
		this.sceneSignature = signature;
		this.tiles = tiles;

		if (!unchanged && (this.status === 'recording' || this.status === 'starting')) {
			this.pushScene();
		}
	}

	syncAudio(sources: RecordingAudioSource[]): void {
		this.audioSources = sources;
		this.mixer?.sync(sources);
	}

	private pushScene(): void {
		const compositor = this.compositor;
		if (!compositor) return;

		const visible = selectRecordingTiles(this.tiles);
		const videoSources = new Map<string, MediaStreamTrack>();
		const workerTiles: WorkerSceneTile[] = [];

		for (const tile of visible) {
			const hasVideo = !!tile.videoTrack && tile.videoTrack.readyState === 'live';
			if (hasVideo && tile.videoTrack) {
				videoSources.set(tile.key, tile.videoTrack);
			}
			const avatarKey = tile.avatarUrl || null;
			const initial = (tile.label || '?').trim().charAt(0).toUpperCase() || '?';
			workerTiles.push({
				videoKey: hasVideo ? tile.key : null,
				avatarKey,
				label: tile.label,
				initial,
				accent: accentColorFor(initial),
				focused: tile.focused,
				contain: tile.isScreenShare,
				speaking: tile.speaking && !tile.isScreenShare
			});
			if (avatarKey) {
				void this.ensureAvatar(avatarKey);
			}
		}

		compositor.setVideoSources(videoSources);
		compositor.setScene(workerTiles);
	}

	private async ensureAvatar(url: string): Promise<void> {
		if (this.sentAvatars.has(url)) return;
		this.sentAvatars.add(url);

		const bitmap = await loadAvatarBitmap(url, AVATAR_SIZE);
		const compositor = this.compositor;

		if (!bitmap) {
			return;
		}
		if (!compositor) {
			bitmap.close();
			this.sentAvatars.delete(url);
			return;
		}

		compositor.setAvatar(url, bitmap);
	}

	inspect(): Record<string, unknown> {
		return {
			status: this.status,
			pipeline: this.compositor instanceof WorkerCompositor ? 'worker' : this.compositor ? 'canvas' : 'none',
			frameSize: FRAME_SIZE,
			tiles: this.tiles.map((tile) => ({
				key: tile.key,
				label: tile.label,
				hasVideo: !!tile.videoTrack,
				focused: tile.focused,
				screenShare: tile.isScreenShare,
				avatar: tile.avatarUrl
			})),
			audio: this.audioSources.map((source) => source.key),
			avatarsLoaded: Array.from(this.sentAvatars)
		};
	}
}

export const sfuCallRecorder = new CallRecorderEngine();

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
	(window as unknown as { __mezonSfuCallRecorder?: CallRecorderEngine }).__mezonSfuCallRecorder = sfuCallRecorder;
}
