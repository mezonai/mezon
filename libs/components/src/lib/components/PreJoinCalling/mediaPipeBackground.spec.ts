import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
	BACKGROUND_FRAME_INTERVAL_MS,
	FOREGROUND_FRAME_INTERVAL_MS,
	MediaPipeBackgroundProcessor,
	getTargetFrameIntervalMs
} from './mediaPipeBackground';

type FakeVideoFrame = {
	displayWidth: number;
	displayHeight: number;
	codedWidth: number;
	codedHeight: number;
	timestamp?: number;
	closed: boolean;
	close: jest.Mock<() => void>;
};

const createFakeFrame = (width = 640, height = 360): FakeVideoFrame => {
	const frame: FakeVideoFrame = {
		displayWidth: width,
		displayHeight: height,
		codedWidth: width,
		codedHeight: height,
		closed: false,
		close: jest.fn(() => {
			frame.closed = true;
		})
	};
	return frame;
};

const createFakeCanvas = () => {
	const captureTrack = {
		readyState: 'live' as MediaStreamTrackState,
		stop: jest.fn(() => {
			captureTrack.readyState = 'ended';
		}),
		requestFrame: jest.fn()
	};
	const captureStreamObj = {
		getVideoTracks: () => [captureTrack],
		getTracks: () => [captureTrack]
	};
	const ctx = {
		save: jest.fn(),
		restore: jest.fn(),
		clearRect: jest.fn(),
		translate: jest.fn(),
		scale: jest.fn(),
		drawImage: jest.fn(),
		fillRect: jest.fn(),
		putImageData: jest.fn(),
		getImageData: jest.fn((_x: number, _y: number, w: number, h: number) => ({
			data: new Uint8ClampedArray(w * h * 4),
			width: w,
			height: h
		})),
		createImageData: jest.fn((w: number, h: number) => ({
			data: new Uint8ClampedArray(w * h * 4),
			width: w,
			height: h
		})),
		createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
		filter: 'none',
		fillStyle: '',
		globalAlpha: 1,
		imageSmoothingEnabled: true,
		imageSmoothingQuality: 'medium'
	};
	return {
		width: 640,
		height: 360,
		id: '',
		style: {} as Record<string, string>,
		parentNode: null as { removeChild: jest.Mock } | null,
		getContext: jest.fn(() => ctx),
		captureStream: jest.fn(() => captureStreamObj),
		captureTrack
	};
};

const flushMicrotasks = async (turns = 6) => {
	for (let i = 0; i < turns; i++) {
		await Promise.resolve();
	}
};

describe('MediaPipeBackgroundProcessor background-tab pipeline', () => {
	const savedDescriptors = new Map<string, PropertyDescriptor | undefined>();
	const setGlobal = (key: string, value: unknown) => {
		if (!savedDescriptors.has(key)) {
			savedDescriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
		}
		Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
	};

	let docHidden = false;
	let docListeners = new Map<string, Set<() => void>>();
	let nowMs = 1000;
	let createdVideos: Array<Record<string, unknown>> = [];
	let rafMock: jest.Mock;

	beforeEach(() => {
		docHidden = false;
		docListeners = new Map();
		nowMs = 1000;
		createdVideos = [];
		rafMock = jest.fn(() => 1);

		const body = {
			appendChild: jest.fn((el: { parentNode?: unknown }) => {
				el.parentNode = body;
			}),
			removeChild: jest.fn((el: { parentNode?: unknown }) => {
				el.parentNode = null;
			})
		};

		const fakeDocument = {
			get hidden() {
				return docHidden;
			},
			body,
			createElement: jest.fn((tag: string) => {
				if (tag === 'canvas') return createFakeCanvas();
				if (tag === 'video') {
					const video = {
						autoplay: false,
						playsInline: false,
						muted: false,
						paused: false,
						readyState: 4,
						videoWidth: 640,
						videoHeight: 360,
						srcObject: null as unknown,
						onpause: null as (() => void) | null,
						style: {} as Record<string, string>,
						parentNode: null as { removeChild: jest.Mock } | null,
						play: jest.fn(() => Promise.resolve())
					};
					createdVideos.push(video);
					return video;
				}
				return {};
			}),
			addEventListener: jest.fn((event: string, listener: () => void) => {
				const set = docListeners.get(event) ?? new Set();
				set.add(listener);
				docListeners.set(event, set);
			}),
			removeEventListener: jest.fn((event: string, listener: () => void) => {
				docListeners.get(event)?.delete(listener);
			})
		};

		class FakeMediaStream {
			private tracks: MediaStreamTrack[];
			constructor(tracks: MediaStreamTrack[] = []) {
				this.tracks = tracks;
			}
			getVideoTracks() {
				return this.tracks;
			}
			getTracks() {
				return this.tracks;
			}
		}

		class FakeVideoFrame {
			displayWidth: number;
			displayHeight: number;
			codedWidth: number;
			codedHeight: number;
			timestamp: number;
			closed = false;
			close = jest.fn(() => {
				this.closed = true;
			});
			constructor(source: { width?: number; height?: number }, init?: { timestamp?: number }) {
				this.displayWidth = source.width ?? 640;
				this.displayHeight = source.height ?? 360;
				this.codedWidth = this.displayWidth;
				this.codedHeight = this.displayHeight;
				this.timestamp = init?.timestamp ?? 0;
			}
		}

		setGlobal('document', fakeDocument);
		setGlobal('window', { location: { hostname: 'example.com' } });
		setGlobal('MediaStream', FakeMediaStream);
		setGlobal('VideoFrame', FakeVideoFrame);
		setGlobal('requestAnimationFrame', rafMock);
		setGlobal(
			'fetch',
			jest.fn(() => Promise.resolve({ ok: false }))
		);
		setGlobal(
			'Image',
			class FakeImage {
				src = '';
			}
		);
		jest.spyOn(performance, 'now').mockImplementation(() => nowMs);
	});

	afterEach(() => {
		jest.restoreAllMocks();
		for (const [key, desc] of savedDescriptors) {
			if (desc) Object.defineProperty(globalThis, key, desc);
			else Reflect.deleteProperty(globalThis, key);
		}
		savedDescriptors.clear();
	});

	it('uses 30 FPS interval when visible and 15 FPS interval when hidden', () => {
		expect(getTargetFrameIntervalMs(false)).toBe(FOREGROUND_FRAME_INTERVAL_MS);
		expect(getTargetFrameIntervalMs(true)).toBe(BACKGROUND_FRAME_INTERVAL_MS);
	});

	it('pumps and emits VideoFrames in a background tab without requestAnimationFrame and throttles to ~15 FPS', async () => {
		const pendingReads: Array<(result: { done: boolean; value?: FakeVideoFrame }) => void> = [];
		const cancelReader = jest.fn(() => Promise.resolve());
		const writtenFrames: FakeVideoFrame[] = [];
		const closeWriter = jest.fn(() => Promise.resolve());
		let generatorCount = 0;

		class FakeTrackProcessor {
			readable = {
				getReader: () => ({
					read: () =>
						new Promise<{ done: boolean; value?: FakeVideoFrame }>((resolve) => {
							pendingReads.push(resolve);
						}),
					cancel: cancelReader
				})
			};
		}

		class FakeTrackGenerator {
			id = `gen-${++generatorCount}`;
			kind = 'video';
			readyState: MediaStreamTrackState = 'live';
			stop = jest.fn(() => {
				this.readyState = 'ended';
			});
			writable = {
				getWriter: () => ({
					desiredSize: 1,
					write: jest.fn((frame: FakeVideoFrame) => {
						writtenFrames.push(frame);
						return Promise.resolve();
					}),
					close: closeWriter
				})
			};
		}

		setGlobal('window', {
			location: { hostname: 'example.com' },
			MediaStreamTrackProcessor: FakeTrackProcessor,
			MediaStreamTrackGenerator: FakeTrackGenerator
		});

		const clonedTrack = {
			readyState: 'live' as MediaStreamTrackState,
			stop: jest.fn(() => {
				clonedTrack.readyState = 'ended';
			})
		};
		const sourceTrack = {
			readyState: 'live' as MediaStreamTrackState,
			clone: jest.fn(() => clonedTrack),
			stop: jest.fn()
		};
		const inputStream = {
			getVideoTracks: () => [sourceTrack],
			getTracks: () => [sourceTrack]
		} as unknown as MediaStream;

		const processor = new MediaPipeBackgroundProcessor();
		await processor.start(inputStream, null);
		expect(processor.isActive()).toBe(true);
		expect(rafMock).not.toHaveBeenCalled();
		expect(createdVideos).toHaveLength(0);

		// Simulate tab switched to background
		docHidden = true;

		// Frame 1 at t=1000 -> emitted
		const f1 = createFakeFrame();
		pendingReads.shift()?.({ done: false, value: f1 });
		await flushMicrotasks();
		expect(writtenFrames).toHaveLength(1);

		// Frame 2 at t=1040 (40ms later, < 66ms background interval) -> skipped, previous frame closed
		nowMs = 1040;
		const f2 = createFakeFrame();
		pendingReads.shift()?.({ done: false, value: f2 });
		await flushMicrotasks();
		expect(f1.close).toHaveBeenCalledTimes(1);
		expect(writtenFrames).toHaveLength(1);

		// Frame 3 at t=1070 (70ms after f1, >= 66ms) -> emitted while still hidden
		nowMs = 1070;
		const f3 = createFakeFrame();
		pendingReads.shift()?.({ done: false, value: f3 });
		await flushMicrotasks();
		expect(writtenFrames).toHaveLength(2);

		// Return to foreground: 35ms after f3 (>= 33ms) -> emitted
		docHidden = false;
		nowMs = 1105;
		const f4 = createFakeFrame();
		pendingReads.shift()?.({ done: false, value: f4 });
		await flushMicrotasks();
		expect(writtenFrames).toHaveLength(3);

		// If caller stops the generated track, getVideoTrack() allocates a fresh live generator and closes old writer
		const firstTrack = processor.getVideoTrack();
		firstTrack?.stop();
		const replacementTrack = processor.getVideoTrack();
		expect(replacementTrack).not.toBe(firstTrack);
		expect(replacementTrack?.readyState).toBe('live');
		expect(closeWriter).toHaveBeenCalledTimes(1);

		// stop() cancels reader, closes latest buffered frame, stops cloned track, leaves original intact
		processor.stop();
		expect(processor.isActive()).toBe(false);
		expect(f4.close).toHaveBeenCalledTimes(1);
		expect(cancelReader).toHaveBeenCalledTimes(1);
		expect(clonedTrack.stop).toHaveBeenCalledTimes(1);
		expect(sourceTrack.stop).not.toHaveBeenCalled();

		processor.destroy();
	});

	it('falls back to Worker interval + video element when MediaStreamTrackProcessor is unavailable and adjusts interval on visibilitychange', async () => {
		const postedIntervals: number[] = [];
		const workerTerminate = jest.fn();
		const workerState: { onMessage: (() => void) | null } = { onMessage: null };

		class FakeWorker {
			set onmessage(handler: (() => void) | null) {
				workerState.onMessage = handler;
			}
			postMessage = jest.fn((value: number) => {
				postedIntervals.push(value);
			});
			terminate = workerTerminate;
		}

		setGlobal('Worker', FakeWorker);
		setGlobal('Blob', class FakeBlob {});
		setGlobal('URL', {
			createObjectURL: jest.fn(() => 'blob:fake-worker'),
			revokeObjectURL: jest.fn()
		});
		setGlobal('window', { location: { hostname: 'example.com' } });

		const sourceTrack = {
			readyState: 'live' as MediaStreamTrackState,
			stop: jest.fn()
		};
		const inputStream = {
			getVideoTracks: () => [sourceTrack],
			getTracks: () => [sourceTrack]
		} as unknown as MediaStream;

		const processor = new MediaPipeBackgroundProcessor();
		await processor.start(inputStream, null);
		expect(rafMock).not.toHaveBeenCalled();
		expect(createdVideos).toHaveLength(1);
		expect(postedIntervals).toEqual([FOREGROUND_FRAME_INTERVAL_MS]);

		// Switch tab to hidden -> worker switches to 66ms (~15 FPS)
		docHidden = true;
		docListeners.get('visibilitychange')?.forEach((fn) => fn());
		expect(postedIntervals).toEqual([FOREGROUND_FRAME_INTERVAL_MS, BACKGROUND_FRAME_INTERVAL_MS]);

		// Tick from worker while hidden still draws & requests a canvas frame
		const outTrack = processor.getVideoTrack() as MediaStreamTrack & { requestFrame?: jest.Mock };
		workerState.onMessage?.();
		await flushMicrotasks();
		expect(outTrack.requestFrame).toHaveBeenCalledTimes(1);

		// Cleanup terminates worker and removes video element
		processor.stop();
		expect(workerTerminate).toHaveBeenCalledTimes(1);
		expect(createdVideos[0].srcObject).toBeNull();
		expect(docListeners.get('visibilitychange')?.size ?? 0).toBe(0);

		processor.destroy();
	});
});
