import { getPreferredInputDeviceId } from '@mezon/utils';

type ScreenCaptureController = {
	setFocusBehavior: (behavior: 'focus-capturing-application' | 'focus-captured-surface' | 'no-focus-change') => void;
};

export function requestDisplayMedia(withSystemAudio: boolean): Promise<MediaStream> {
	const CaptureControllerCtor = (window as typeof window & { CaptureController?: new () => ScreenCaptureController }).CaptureController;
	const captureController = CaptureControllerCtor ? new CaptureControllerCtor() : undefined;
	const promise = navigator.mediaDevices.getDisplayMedia({
		video: { width: 1920, height: 1080, frameRate: 30 },
		audio: withSystemAudio
			? {
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false,
					suppressLocalAudioPlayback: false,
					restrictOwnAudio: true
				}
			: false,
		...(withSystemAudio ? { systemAudio: 'include' } : {}),
		...(captureController ? { controller: captureController } : {})
	} as DisplayMediaStreamOptions);
	return promise.then((stream) => {
		try {
			captureController?.setFocusBehavior('focus-capturing-application');
		} catch {
			void 0;
		}
		return stream;
	});
}

export async function openLiveMicStream(): Promise<MediaStream> {
	const baseAudio: MediaTrackConstraints = {
		echoCancellation: true,
		noiseSuppression: true,
		autoGainControl: true,
		sampleRate: 48000
	};
	const deviceId = getPreferredInputDeviceId();
	if (deviceId && deviceId !== 'default') {
		try {
			return await navigator.mediaDevices.getUserMedia({
				audio: { ...baseAudio, deviceId: { exact: deviceId } },
				video: false
			});
		} catch (err) {
			const name = (err as DOMException | undefined)?.name;
			if (name !== 'OverconstrainedError' && name !== 'NotFoundError') {
				throw err;
			}
		}
	}
	return navigator.mediaDevices.getUserMedia({ audio: baseAudio, video: false });
}

export async function openLiveCameraStream(): Promise<MediaStream> {
	try {
		return await navigator.mediaDevices.getUserMedia({
			video: { width: 1280, height: 720, frameRate: 30 },
			audio: false
		});
	} catch (err) {
		const name = (err as DOMException | undefined)?.name;
		if (name === 'OverconstrainedError') {
			return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
		}
		throw err;
	}
}

export class LiveMixer {
	private readonly destination: MediaStreamAudioDestinationNode;
	private readonly _track: MediaStreamTrack;
	private readonly keepAliveSource: ConstantSourceNode | null = null;
	private micSource: MediaStreamAudioSourceNode | null = null;
	private micGain: GainNode | null = null;
	private sysSource: MediaStreamAudioSourceNode | null = null;
	private sysGain: GainNode | null = null;
	private disposed = false;

	constructor(private readonly context: AudioContext) {
		this.destination = context.createMediaStreamDestination();
		try {
			this.destination.channelCount = 2;
			this.destination.channelCountMode = 'explicit';
		} catch {
			void 0;
		}
		if (typeof context.createConstantSource === 'function') {
			try {
				const silent = context.createConstantSource();
				silent.offset.value = 0;
				silent.connect(this.destination);
				silent.start();
				this.keepAliveSource = silent;
			} catch {
				this.keepAliveSource = null;
			}
		}
		const audioTrack = this.destination.stream.getAudioTracks()[0];
		if (!audioTrack) {
			throw new Error('Audio destination track unavailable');
		}
		this._track = audioTrack;
		void Promise.resolve(context.resume()).catch(() => undefined);
	}

	get track(): MediaStreamTrack {
		return this._track;
	}

	setMic(stream: MediaStream | null): boolean {
		this.disconnectMic();
		if (this.disposed || !stream) return true;
		const audioTrack = stream.getAudioTracks()[0];
		if (!audioTrack || audioTrack.readyState === 'ended') return false;
		try {
			const source = this.context.createMediaStreamSource(new MediaStream([audioTrack]));
			const gain = this.context.createGain();
			gain.gain.value = 1;
			source.connect(gain);
			gain.connect(this.destination);
			this.micSource = source;
			this.micGain = gain;
			return true;
		} catch {
			this.disconnectMic();
			return false;
		}
	}

	setSystemAudio(track: MediaStreamTrack | null): boolean {
		this.disconnectSystemAudio();
		if (this.disposed || !track) return true;
		if (track.readyState === 'ended') return false;
		try {
			const source = this.context.createMediaStreamSource(new MediaStream([track]));
			const gain = this.context.createGain();
			gain.gain.value = 1;
			source.connect(gain);
			gain.connect(this.destination);
			this.sysSource = source;
			this.sysGain = gain;
			return true;
		} catch {
			this.disconnectSystemAudio();
			return false;
		}
	}

	private disconnectMic(): void {
		this.micSource?.disconnect();
		this.micGain?.disconnect();
		this.micSource = null;
		this.micGain = null;
	}

	private disconnectSystemAudio(): void {
		this.sysSource?.disconnect();
		this.sysGain?.disconnect();
		this.sysSource = null;
		this.sysGain = null;
	}

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		this.disconnectMic();
		this.disconnectSystemAudio();
		if (this.keepAliveSource) {
			try {
				this.keepAliveSource.stop();
			} catch {
				void 0;
			}
			this.keepAliveSource.disconnect();
		}
		this.destination.disconnect();
		this._track.stop();
		void Promise.resolve(this.context.close()).catch(() => undefined);
	}
}
