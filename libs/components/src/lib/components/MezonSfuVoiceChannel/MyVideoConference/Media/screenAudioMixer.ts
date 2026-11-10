export function reportedMute(micMuted: boolean, screenAudioActive: boolean): boolean {
	return micMuted && !screenAudioActive;
}

export class ScreenAudioMixer {
	readonly track: MediaStreamTrack;
	private readonly destination: MediaStreamAudioDestinationNode;
	private readonly screenSource: MediaStreamAudioSourceNode;
	private microphoneSource: MediaStreamAudioSourceNode | null = null;
	private microphoneTrack: MediaStreamTrack | null = null;
	private stopped = false;

	constructor(
		private readonly context: AudioContext,
		screenTrack: MediaStreamTrack
	) {
		this.destination = context.createMediaStreamDestination();
		this.screenSource = context.createMediaStreamSource(new MediaStream([screenTrack]));
		this.screenSource.connect(this.destination);
		this.track = this.destination.stream.getAudioTracks()[0];
		void Promise.resolve(context.resume()).catch(() => undefined);
	}

	setMicrophone(track: MediaStreamTrack | null): void {
		if (this.stopped || track === this.microphoneTrack) return;
		this.microphoneSource?.disconnect();
		this.microphoneSource = null;
		this.microphoneTrack = track;
		if (!track) return;
		this.microphoneSource = this.context.createMediaStreamSource(new MediaStream([track]));
		this.microphoneSource.connect(this.destination);
	}

	stop(): void {
		if (this.stopped) return;
		this.stopped = true;
		this.screenSource.disconnect();
		this.microphoneSource?.disconnect();
		this.microphoneSource = null;
		this.microphoneTrack = null;
		this.track.stop();
		void Promise.resolve(this.context.close()).catch(() => undefined);
	}
}
