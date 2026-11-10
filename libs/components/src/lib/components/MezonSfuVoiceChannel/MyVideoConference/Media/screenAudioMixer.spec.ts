import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SfuMuteSync } from '../sfuReconnect';
import { ScreenAudioMixer, reportedMute } from './screenAudioMixer';

const originalMediaStream = Object.getOwnPropertyDescriptor(globalThis, 'MediaStream');

class FakeMediaStream {
	private readonly tracks: MediaStreamTrack[];

	constructor(tracks: MediaStreamTrack[] = []) {
		this.tracks = tracks;
	}

	getAudioTracks(): MediaStreamTrack[] {
		return this.tracks;
	}
}

type FakeSourceNode = {
	stream: FakeMediaStream;
	connect: ReturnType<typeof jest.fn>;
	disconnect: ReturnType<typeof jest.fn>;
};

const createFakeTrack = (id: string) =>
	({
		id,
		kind: 'audio',
		stop: jest.fn()
	}) as unknown as MediaStreamTrack & { stop: ReturnType<typeof jest.fn> };

const createFakeAudioContext = () => {
	const destinationTrack = createFakeTrack('mixed-out');
	const destination = {
		stream: new FakeMediaStream([destinationTrack])
	};
	const sources: FakeSourceNode[] = [];
	const context = {
		destinationTrack,
		destination,
		sources,
		createMediaStreamDestination: jest.fn(() => destination),
		createMediaStreamSource: jest.fn((stream: FakeMediaStream) => {
			const node: FakeSourceNode = {
				stream,
				connect: jest.fn(),
				disconnect: jest.fn()
			};
			sources.push(node);
			return node;
		}),
		resume: jest.fn(() => Promise.resolve()),
		close: jest.fn(() => Promise.resolve())
	};
	return context;
};

beforeEach(() => {
	Object.defineProperty(globalThis, 'MediaStream', {
		configurable: true,
		writable: true,
		value: FakeMediaStream
	});
});

afterEach(() => {
	if (originalMediaStream) Object.defineProperty(globalThis, 'MediaStream', originalMediaStream);
	else Reflect.deleteProperty(globalThis, 'MediaStream');
});

describe('ScreenAudioMixer', () => {
	it('connects the screen audio source to the destination and resumes the context on construction', () => {
		const ctx = createFakeAudioContext();
		const screenTrack = createFakeTrack('screen-audio');

		const mixer = new ScreenAudioMixer(ctx as unknown as AudioContext, screenTrack);

		expect(mixer.track).toBe(ctx.destinationTrack);
		expect(ctx.createMediaStreamDestination).toHaveBeenCalledTimes(1);
		expect(ctx.createMediaStreamSource).toHaveBeenCalledTimes(1);
		expect(ctx.sources[0].stream.getAudioTracks()).toEqual([screenTrack]);
		expect(ctx.sources[0].connect).toHaveBeenCalledTimes(1);
		expect(ctx.sources[0].connect).toHaveBeenCalledWith(ctx.destination);
		expect(ctx.resume).toHaveBeenCalledTimes(1);
	});

	it('connects, deduplicates, swaps, and disconnects the microphone track', () => {
		const ctx = createFakeAudioContext();
		const screenTrack = createFakeTrack('screen-audio');
		const micA = createFakeTrack('mic-a');
		const micB = createFakeTrack('mic-b');

		const mixer = new ScreenAudioMixer(ctx as unknown as AudioContext, screenTrack);

		mixer.setMicrophone(micA);
		expect(ctx.sources).toHaveLength(2);
		expect(ctx.sources[1].stream.getAudioTracks()).toEqual([micA]);
		expect(ctx.sources[1].connect).toHaveBeenCalledTimes(1);
		expect(ctx.sources[1].connect).toHaveBeenCalledWith(ctx.destination);
		expect(ctx.sources[1].disconnect).not.toHaveBeenCalled();

		mixer.setMicrophone(micA);
		expect(ctx.sources).toHaveLength(2);
		expect(ctx.sources[1].disconnect).not.toHaveBeenCalled();

		mixer.setMicrophone(micB);
		expect(ctx.sources[1].disconnect).toHaveBeenCalledTimes(1);
		expect(ctx.sources).toHaveLength(3);
		expect(ctx.sources[2].stream.getAudioTracks()).toEqual([micB]);
		expect(ctx.sources[2].connect).toHaveBeenCalledTimes(1);
		expect(ctx.sources[2].connect).toHaveBeenCalledWith(ctx.destination);

		mixer.setMicrophone(null);
		expect(ctx.sources[2].disconnect).toHaveBeenCalledTimes(1);
		expect(ctx.sources).toHaveLength(3);
		expect(ctx.sources[0].disconnect).not.toHaveBeenCalled();
	});

	it('disconnects all sources, stops the output track, and closes the context idempotently on stop', () => {
		const ctx = createFakeAudioContext();
		const screenTrack = createFakeTrack('screen-audio');
		const micA = createFakeTrack('mic-a');

		const mixer = new ScreenAudioMixer(ctx as unknown as AudioContext, screenTrack);
		mixer.setMicrophone(micA);

		mixer.stop();

		expect(ctx.sources[0].disconnect).toHaveBeenCalledTimes(1);
		expect(ctx.sources[1].disconnect).toHaveBeenCalledTimes(1);
		expect(ctx.destinationTrack.stop).toHaveBeenCalledTimes(1);
		expect(ctx.close).toHaveBeenCalledTimes(1);

		mixer.stop();

		expect(ctx.sources[0].disconnect).toHaveBeenCalledTimes(1);
		expect(ctx.sources[1].disconnect).toHaveBeenCalledTimes(1);
		expect(ctx.destinationTrack.stop).toHaveBeenCalledTimes(1);
		expect(ctx.close).toHaveBeenCalledTimes(1);
	});

	it('keeps only the screen audio source connected when microphone starts muted', () => {
		const ctx = createFakeAudioContext();
		const screenTrack = createFakeTrack('screen-audio');

		const mixer = new ScreenAudioMixer(ctx as unknown as AudioContext, screenTrack);
		mixer.setMicrophone(null);

		expect(ctx.sources).toHaveLength(1);
		expect(ctx.sources[0].stream.getAudioTracks()).toEqual([screenTrack]);
		expect(ctx.sources[0].disconnect).not.toHaveBeenCalled();
	});
});

describe('reportedMute', () => {
	it.each([
		[false, false, false],
		[false, true, false],
		[true, false, true],
		[true, true, false]
	])('reportedMute(%s, %s) === %s', (micMuted, screenAudioActive, expected) => {
		expect(reportedMute(micMuted, screenAudioActive)).toBe(expected);
	});

	it('detects a host forced mute while mic is muted and screen audio is active', () => {
		const sync = new SfuMuteSync();
		sync.sent(reportedMute(true, true), 100);
		expect(sync.acknowledge(false)).toBe(1);

		sync.observeSelf(false, reportedMute(true, true), 200);
		expect(sync.deadline).toBeUndefined();

		sync.observeSelf(true, reportedMute(true, true), 300);
		expect(sync.deadline).toBe(600);
		expect(sync.takeForcedMute(600)).toBe(true);
	});
});
