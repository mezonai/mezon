import type { RecordingAudioSource } from './types';

interface MixerEntry {
	track: MediaStreamTrack;
	stream: MediaStream;
	source: MediaStreamAudioSourceNode;
	gain: GainNode;
}

/**
 * Mixes every audio track in the room (remote participants, local mic, screen-share
 * audio) into a single track for the recorder. Nodes are added and removed live as
 * people join and leave, so the graph is never rebuilt mid-recording.
 */
export class AudioMixer {
	private readonly context: AudioContext;
	private readonly destination: MediaStreamAudioDestinationNode;
	private readonly entries = new Map<string, MixerEntry>();
	/** Zero-gain source keeps the graph pulling so the destination emits silence, not nothing. */
	private readonly keepAlive: ConstantSourceNode;
	private closed = false;

	constructor() {
		const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		this.context = new Ctor({ sampleRate: 48000, latencyHint: 'playback' });
		this.destination = this.context.createMediaStreamDestination();

		this.keepAlive = this.context.createConstantSource();
		const silence = this.context.createGain();
		silence.gain.value = 0;
		this.keepAlive.connect(silence).connect(this.destination);
		this.keepAlive.start();
	}

	get track(): MediaStreamTrack {
		return this.destination.stream.getAudioTracks()[0];
	}

	async resume(): Promise<void> {
		if (this.context.state === 'suspended') {
			await this.context.resume();
		}
	}

	/** Adds/removes nodes so the graph matches `sources` exactly. */
	sync(sources: RecordingAudioSource[]): void {
		if (this.closed) return;

		const next = new Map<string, MediaStreamTrack>();
		for (const source of sources) {
			if (source.track && source.track.readyState === 'live') {
				next.set(source.key, source.track);
			}
		}

		for (const [key, entry] of this.entries) {
			const incoming = next.get(key);
			if (!incoming || incoming.id !== entry.track.id) {
				this.disconnect(key);
			}
		}

		for (const [key, track] of next) {
			if (this.entries.has(key)) continue;
			try {
				const stream = new MediaStream([track]);
				const source = this.context.createMediaStreamSource(stream);
				const gain = this.context.createGain();
				gain.gain.value = 1;
				source.connect(gain).connect(this.destination);
				this.entries.set(key, { track, stream, source, gain });
			} catch (error) {
				console.error('[recording] failed to add audio source', key, error);
			}
		}
	}

	private disconnect(key: string): void {
		const entry = this.entries.get(key);
		if (!entry) return;
		try {
			entry.source.disconnect();
			entry.gain.disconnect();
		} catch {
			/* node already detached */
		}
		this.entries.delete(key);
	}

	async close(): Promise<void> {
		if (this.closed) return;
		this.closed = true;
		for (const key of Array.from(this.entries.keys())) {
			this.disconnect(key);
		}
		try {
			this.keepAlive.stop();
			this.keepAlive.disconnect();
		} catch {
			/* already stopped */
		}
		try {
			await this.context.close();
		} catch {
			/* already closed */
		}
	}
}
