import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createElement, type ReactElement } from 'react';
import { SfuVideo } from './SfuVideo';

type TestRenderer = { unmount: () => void; update: (element: ReactElement) => void };
// The workspace already includes this renderer but does not include its optional type package.
const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement, options: { createNodeMock: () => EventTarget }) => TestRenderer;
}>('react-test-renderer');

const originalMediaElement = Object.getOwnPropertyDescriptor(globalThis, 'HTMLMediaElement');
let renderer: TestRenderer | undefined;
beforeEach(() => {
	Object.defineProperty(globalThis, 'HTMLMediaElement', { configurable: true, value: { HAVE_CURRENT_DATA: 2 } });
});
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	if (originalMediaElement) Object.defineProperty(globalThis, 'HTMLMediaElement', originalMediaElement);
	else Reflect.deleteProperty(globalThis, 'HTMLMediaElement');
});

const createVideo = (withFrameCallback = true) => {
	let nextId = 0;
	const callbacks = new Map<number, VideoFrameRequestCallback>();
	const video = Object.assign(new EventTarget(), {
		readyState: 0,
		videoWidth: 0,
		srcObject: null as MediaStream | null,
		play: jest.fn(() => Promise.resolve()),
		requestVideoFrameCallback: withFrameCallback
			? jest.fn((callback: VideoFrameRequestCallback) => {
					const id = nextId++;
					callbacks.set(id, callback);
					return id;
				})
			: undefined,
		cancelVideoFrameCallback: jest.fn((id: number) => callbacks.delete(id))
	});
	return {
		video,
		frame: () => {
			const [id, callback] = [...callbacks.entries()][0];
			callbacks.delete(id);
			callback(0, {} as VideoFrameCallbackMetadata);
		}
	};
};

describe('SFU screen frame detection', () => {
	it('does not count a previous stream image as a decoded frame of a replacement stream', () => {
		const { video, frame } = createVideo();
		const onFrame = jest.fn();
		const onFrameStateChange = jest.fn();
		act(() => {
			renderer = create(createElement(SfuVideo, { stream: {} as MediaStream, onFrame, onFrameStateChange }), {
				createNodeMock: () => video
			});
		});
		video.readyState = 2;
		video.videoWidth = 1920;
		frame();
		expect(onFrame).toHaveBeenCalledTimes(1);
		act(() => renderer?.update(createElement(SfuVideo, { stream: {} as MediaStream, onFrame, onFrameStateChange })));
		expect(onFrameStateChange).toHaveBeenLastCalledWith(false);
		expect(onFrame).toHaveBeenCalledTimes(1);
		frame();
		expect(onFrame).toHaveBeenCalledTimes(2);
	});

	it('uses decoded video frames, not timeupdate events, when the browser supports rVFC', () => {
		const { video, frame } = createVideo();
		const onFrame = jest.fn();
		const onFrameStateChange = jest.fn();
		act(() => {
			renderer = create(createElement(SfuVideo, { stream: {} as MediaStream, onFrame, onFrameStateChange }), {
				createNodeMock: () => video
			});
		});
		expect(onFrameStateChange).toHaveBeenLastCalledWith(false);
		video.readyState = 2;
		video.videoWidth = 1920;
		video.dispatchEvent(new Event('timeupdate'));
		expect(onFrame).not.toHaveBeenCalled();
		frame();
		expect(onFrame).toHaveBeenCalledTimes(1);
		expect(onFrameStateChange).toHaveBeenLastCalledWith(true);
		video.dispatchEvent(new Event('timeupdate'));
		expect(onFrame).toHaveBeenCalledTimes(1);
		frame();
		expect(onFrame).toHaveBeenCalledTimes(2);
	});

	it('requires current image data in the fallback for browsers without rVFC', () => {
		const { video } = createVideo(false);
		const onFrame = jest.fn();
		act(() => {
			renderer = create(createElement(SfuVideo, { stream: {} as MediaStream, onFrame }), { createNodeMock: () => video });
		});
		video.dispatchEvent(new Event('playing'));
		expect(onFrame).not.toHaveBeenCalled();
		video.readyState = 2;
		video.dispatchEvent(new Event('loadeddata'));
		expect(onFrame).not.toHaveBeenCalled();
		video.videoWidth = 1920;
		video.dispatchEvent(new Event('loadeddata'));
		expect(onFrame).toHaveBeenCalledTimes(1);
	});

	it('reports PiP state and detaches its media and callbacks on unmount, including callback ID zero', () => {
		const { video } = createVideo();
		const onFrame = jest.fn();
		const onPictureInPictureChange = jest.fn();
		const stream = {} as MediaStream;
		act(() => {
			renderer = create(createElement(SfuVideo, { stream, onFrame, onPictureInPictureChange }), { createNodeMock: () => video });
		});
		video.dispatchEvent(new Event('enterpictureinpicture'));
		video.dispatchEvent(new Event('leavepictureinpicture'));
		expect(onPictureInPictureChange.mock.calls).toEqual([[true], [false]]);
		act(() => renderer?.unmount());
		renderer = undefined;
		expect(video.cancelVideoFrameCallback).toHaveBeenCalledWith(0);
		expect(video.srcObject).toBeNull();
		video.readyState = 2;
		video.videoWidth = 1920;
		video.dispatchEvent(new Event('loadeddata'));
		video.dispatchEvent(new Event('enterpictureinpicture'));
		expect(onFrame).not.toHaveBeenCalled();
		expect(onPictureInPictureChange).toHaveBeenCalledTimes(2);
	});
});
