import { capturePosterFromVideoElement } from './videoPoster';

const WIDTH = 4;
const HEIGHT = 2;

let emptyDraws: number;
let ctx: { drawImage: jest.Mock; getImageData: jest.Mock };
let canvas: { width: number; height: number; getContext: jest.Mock; toBlob: jest.Mock };
let video: {
	duration: number;
	videoWidth: number;
	videoHeight: number;
	currentTime: number;
	onseeked: (() => void) | null;
	onerror: (() => void) | null;
};

const capture = () => capturePosterFromVideoElement(video as unknown as HTMLVideoElement);

beforeEach(() => {
	jest.useFakeTimers();
	emptyDraws = 0;
	ctx = {
		drawImage: jest.fn(),
		getImageData: jest.fn(() => {
			const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
			if (ctx.drawImage.mock.calls.length > emptyDraws) data[data.length - 1] = 255;
			return { data };
		})
	};
	canvas = {
		width: 0,
		height: 0,
		getContext: jest.fn(() => ctx),
		toBlob: jest.fn((done: (blob: Blob) => void, type: string) => done(new Blob(['frame'], { type })))
	};
	video = { duration: 10, videoWidth: WIDTH, videoHeight: HEIGHT, currentTime: 0, onseeked: null, onerror: null };
	Object.assign(globalThis, { window: globalThis, document: { createElement: () => canvas } });
});

afterEach(() => {
	jest.useRealTimers();
});

it('redraws until the seeked frame lands and encodes that frame', async () => {
	emptyDraws = 3;
	const poster = capture();
	expect(video.currentTime).toBe(1);

	video.onseeked?.();
	await jest.advanceTimersByTimeAsync(150);

	expect((await poster)?.type).toBe('image/jpeg');
	expect(ctx.drawImage).toHaveBeenCalledTimes(4);
	expect(canvas.getContext).toHaveBeenCalledWith('2d', { willReadFrequently: true });
	expect(canvas.toBlob).toHaveBeenCalledTimes(1);
});

it('encodes the last draw when no frame lands within the retries', async () => {
	emptyDraws = Infinity;
	const poster = capture();

	video.onseeked?.();
	await jest.advanceTimersByTimeAsync(1000);

	expect((await poster)?.type).toBe('image/jpeg');
	expect(ctx.drawImage).toHaveBeenCalledTimes(21);
	expect(canvas.toBlob).toHaveBeenCalledTimes(1);
	expect(video.onseeked).toBeNull();
});

it('stops redrawing once the capture has timed out', async () => {
	emptyDraws = Infinity;
	const poster = capture();
	await jest.advanceTimersByTimeAsync(2900);

	video.onseeked?.();
	await jest.advanceTimersByTimeAsync(100);
	await expect(poster).resolves.toBeUndefined();
	const draws = ctx.drawImage.mock.calls.length;

	await jest.advanceTimersByTimeAsync(2000);
	expect(ctx.drawImage).toHaveBeenCalledTimes(draws);
	expect(canvas.toBlob).not.toHaveBeenCalled();
	expect(video.onseeked).toBeNull();
});
