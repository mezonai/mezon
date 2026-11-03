import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createElement, type ReactElement } from 'react';
import { SfuAudioTrack } from './SfuAudioTrack';
import { USER_VOLUME_MAX, acquireBoostContext, applyBoostSink, contextSinkSupported, releaseBoostContext, resolveAudioVolume } from './audioVolume';

jest.mock(
	'@mezon/utils',
	() => ({
		setPreferredOutputDeviceId: jest.fn(),
		sinkIdForHtmlMediaElement: (deviceId: string) => (deviceId === 'default' ? '' : deviceId)
	}),
	{ virtual: true }
);

type TestRenderer = { unmount: () => void; update: (element: ReactElement) => void };
const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement, options: { createNodeMock: () => unknown }) => TestRenderer;
}>('react-test-renderer');

const originalAudioContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
const originalMediaStream = Object.getOwnPropertyDescriptor(globalThis, 'MediaStream');
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

class FakeMediaStream {
	tracks: MediaStreamTrack[];
	constructor(tracks: MediaStreamTrack[] = []) {
		this.tracks = tracks;
	}
}

type MockContextInstance = {
	state: AudioContextState;
	destination: object;
	resume: ReturnType<typeof jest.fn>;
	suspend: ReturnType<typeof jest.fn>;
	setSinkId?: ReturnType<typeof jest.fn>;
	sources: Array<{ stream: unknown; connect: ReturnType<typeof jest.fn>; disconnect: ReturnType<typeof jest.fn> }>;
	gains: Array<{ gain: { value: number }; connect: ReturnType<typeof jest.fn>; disconnect: ReturnType<typeof jest.fn> }>;
	createMediaStreamSource: ReturnType<typeof jest.fn>;
	createGain: ReturnType<typeof jest.fn>;
};

let createdContexts: MockContextInstance[] = [];
let renderer: TestRenderer | undefined;

const installMockAudioContext = ({ withSinkId = false, initialState = 'running' as AudioContextState } = {}) => {
	createdContexts = [];
	class MockAudioContext {
		state: AudioContextState = initialState;
		destination = {};
		sources: MockContextInstance['sources'] = [];
		gains: MockContextInstance['gains'] = [];
		resume = jest.fn(() => {
			this.state = 'running';
			return Promise.resolve();
		});
		suspend = jest.fn(() => {
			this.state = 'suspended';
			return Promise.resolve();
		});
		createMediaStreamSource = jest.fn((stream: unknown) => {
			const node = { stream, connect: jest.fn(), disconnect: jest.fn() };
			this.sources.push(node);
			return node;
		});
		createGain = jest.fn(() => {
			const node = { gain: { value: 1 }, connect: jest.fn(), disconnect: jest.fn() };
			this.gains.push(node);
			return node;
		});
		constructor() {
			createdContexts.push(this as unknown as MockContextInstance);
		}
	}
	if (withSinkId) {
		Object.defineProperty(MockAudioContext.prototype, 'setSinkId', {
			configurable: true,
			writable: true,
			value: jest.fn(() => Promise.resolve())
		});
	}
	Object.defineProperty(globalThis, 'AudioContext', {
		configurable: true,
		writable: true,
		value: MockAudioContext
	});
	return MockAudioContext;
};

beforeEach(() => {
	createdContexts = [];
	Object.defineProperty(globalThis, 'MediaStream', { configurable: true, writable: true, value: FakeMediaStream });
	Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: new EventTarget() });
});

afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	for (let i = 0; i < 10; i += 1) {
		releaseBoostContext();
	}
	for (const ctx of createdContexts) {
		ctx.state = 'closed';
	}
	if (originalAudioContext) Object.defineProperty(globalThis, 'AudioContext', originalAudioContext);
	else Reflect.deleteProperty(globalThis, 'AudioContext');
	if (originalMediaStream) Object.defineProperty(globalThis, 'MediaStream', originalMediaStream);
	else Reflect.deleteProperty(globalThis, 'MediaStream');
	if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
	else Reflect.deleteProperty(globalThis, 'document');
});

describe('resolveAudioVolume', () => {
	it('exposes USER_VOLUME_MAX as 150', () => {
		expect(USER_VOLUME_MAX).toBe(150);
	});

	it('clamps volumes at or below 1 to [0, 1] without boost', () => {
		expect(resolveAudioVolume(-1, undefined, false)).toEqual({ elementVolume: 0, boost: null });
		expect(resolveAudioVolume(0, 'default', true)).toEqual({ elementVolume: 0, boost: null });
		expect(resolveAudioVolume(0.5, 'usb-headset', false)).toEqual({ elementVolume: 0.5, boost: null });
		expect(resolveAudioVolume(1, 'usb-headset', true)).toEqual({ elementVolume: 1, boost: null });
	});

	it('boosts above 1 when output sink is default regardless of AudioContext.setSinkId support', () => {
		expect(resolveAudioVolume(1.5, undefined, false)).toEqual({ elementVolume: 1, boost: 1.5 });
		expect(resolveAudioVolume(1.5, '', false)).toEqual({ elementVolume: 1, boost: 1.5 });
		expect(resolveAudioVolume(1.5, 'default', false)).toEqual({ elementVolume: 1, boost: 1.5 });
		expect(resolveAudioVolume(1.5, 'default', true)).toEqual({ elementVolume: 1, boost: 1.5 });
	});

	it('boosts above 1 with a custom sink when AudioContext.setSinkId is supported and caps at 1 otherwise', () => {
		expect(resolveAudioVolume(1.5, 'usb-headset', true)).toEqual({ elementVolume: 1, boost: 1.5 });
		expect(resolveAudioVolume(1.5, 'usb-headset', false)).toEqual({ elementVolume: 1, boost: null });
	});
});

describe('shared boost AudioContext helpers', () => {
	it('detects AudioContext.prototype.setSinkId support', () => {
		Reflect.deleteProperty(globalThis, 'AudioContext');
		expect(contextSinkSupported()).toBe(false);

		installMockAudioContext({ withSinkId: false });
		expect(contextSinkSupported()).toBe(false);

		installMockAudioContext({ withSinkId: true });
		expect(contextSinkSupported()).toBe(true);
	});

	it('returns null when AudioContext is unavailable or throws', () => {
		Reflect.deleteProperty(globalThis, 'AudioContext');
		expect(acquireBoostContext()).toBeNull();

		Object.defineProperty(globalThis, 'AudioContext', {
			configurable: true,
			writable: true,
			value: function ThrowingAudioContext() {
				throw new Error('not allowed');
			}
		});
		expect(acquireBoostContext()).toBeNull();
	});

	it('ref-counts a single shared AudioContext, suspends at zero, and resumes when re-acquired', () => {
		installMockAudioContext({ initialState: 'suspended' });
		const first = acquireBoostContext();
		expect(first).not.toBeNull();
		expect(createdContexts).toHaveLength(1);
		expect(createdContexts[0].resume).toHaveBeenCalledTimes(1);

		const second = acquireBoostContext();
		expect(second).toBe(first);
		expect(createdContexts).toHaveLength(1);

		releaseBoostContext();
		expect(createdContexts[0].suspend).not.toHaveBeenCalled();

		releaseBoostContext();
		expect(createdContexts[0].suspend).toHaveBeenCalledTimes(1);
		expect(createdContexts[0].state).toBe('suspended');

		const third = acquireBoostContext();
		expect(third).toBe(first);
		expect(createdContexts[0].resume).toHaveBeenCalledTimes(2);
	});

	it('applies sinkId to AudioContext and swallows rejections with console.warn', async () => {
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		const setSinkId = jest.fn<(id: string) => Promise<void>>(() => Promise.resolve());
		const ctxWithSink = { setSinkId } as unknown as AudioContext;

		await applyBoostSink(ctxWithSink, undefined);
		expect(setSinkId).toHaveBeenLastCalledWith('');

		await applyBoostSink(ctxWithSink, 'default');
		expect(setSinkId).toHaveBeenLastCalledWith('');

		await applyBoostSink(ctxWithSink, 'usb-dac');
		expect(setSinkId).toHaveBeenLastCalledWith('usb-dac');

		setSinkId.mockRejectedValueOnce(new Error('device gone'));
		await expect(applyBoostSink(ctxWithSink, 'usb-dac')).resolves.toBeUndefined();
		expect(warnSpy).toHaveBeenCalledTimes(1);

		await expect(applyBoostSink({} as AudioContext, 'usb-dac')).resolves.toBeUndefined();
		warnSpy.mockRestore();
	});
});

describe('SfuAudioTrack volume and boost behavior', () => {
	const createAudioElement = () =>
		Object.assign(new EventTarget(), {
			muted: false,
			volume: 1,
			paused: false,
			srcObject: null as MediaStream | null,
			play: jest.fn(() => Promise.resolve()),
			pause: jest.fn(),
			setSinkId: jest.fn(() => Promise.resolve())
		});

	const createTrack = (id = 'track-1') =>
		Object.assign(new EventTarget(), {
			id,
			readyState: 'live'
		}) as unknown as MediaStreamTrack;

	it('keeps WebAudio completely idle for unboosted tracks and updates gain in-place while boosted', () => {
		installMockAudioContext({ withSinkId: true });
		const audio = createAudioElement();
		const track = createTrack();

		act(() => {
			renderer = create(createElement(SfuAudioTrack, { track, muted: false, volume: 1, sinkId: 'default' }), {
				createNodeMock: () => audio
			});
		});
		expect(createdContexts).toHaveLength(0);
		expect(audio.muted).toBe(false);
		expect(audio.volume).toBe(1);

		act(() => {
			renderer?.update(createElement(SfuAudioTrack, { track, muted: false, volume: 0.4, sinkId: 'default' }));
		});
		expect(createdContexts).toHaveLength(0);
		expect(audio.muted).toBe(false);
		expect(audio.volume).toBe(0.4);

		act(() => {
			renderer?.update(createElement(SfuAudioTrack, { track, muted: false, volume: 1.2, sinkId: 'usb-dac' }));
		});
		expect(createdContexts).toHaveLength(1);
		expect(audio.muted).toBe(true);
		expect(audio.volume).toBe(1);
		expect(createdContexts[0].sources).toHaveLength(1);
		expect(createdContexts[0].gains).toHaveLength(1);
		expect(createdContexts[0].gains[0].gain.value).toBe(1.2);

		act(() => {
			renderer?.update(createElement(SfuAudioTrack, { track, muted: false, volume: 1.4, sinkId: 'usb-dac' }));
		});
		expect(createdContexts[0].sources).toHaveLength(1);
		expect(createdContexts[0].gains).toHaveLength(1);
		expect(createdContexts[0].gains[0].gain.value).toBe(1.4);

		act(() => {
			renderer?.update(createElement(SfuAudioTrack, { track, muted: true, volume: 1.4, sinkId: 'usb-dac' }));
		});
		expect(createdContexts[0].gains[0].gain.value).toBe(0);

		act(() => {
			renderer?.update(createElement(SfuAudioTrack, { track, muted: false, volume: 1, sinkId: 'usb-dac' }));
		});
		expect(createdContexts[0].sources[0].disconnect).toHaveBeenCalledTimes(1);
		expect(createdContexts[0].gains[0].disconnect).toHaveBeenCalledTimes(1);
		expect(createdContexts[0].suspend).toHaveBeenCalledTimes(1);
		expect(audio.muted).toBe(false);
		expect(audio.volume).toBe(1);
	});
});
