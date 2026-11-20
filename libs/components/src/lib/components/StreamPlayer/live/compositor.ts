import { getTrackGeneratorCtor, getTrackProcessorCtor } from '../../MezonSfuVoiceChannel/Recording/capabilities';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const CANVAS_FPS = 30;
const IDLE_REPEAT_MS = 100;
const MAX_FRAME_GAP_MS = 1000;
const FRAME_INTERVAL_SMOOTHING = 0.2;
const SCREEN_DRIVE_TOLERANCE = 1.25;
const PIP_WIDTH = 256;
const PIP_MARGIN = 16;
const PIP_RADIUS = 8;

type CaptureTrack = MediaStreamTrack & {
	requestFrame?: () => void;
};

type CaptureStream = MediaStream & {
	requestFrame?: () => void;
};

type DrawSource = HTMLVideoElement | VideoFrame;

type FrameOutput = {
	track: MediaStreamTrack;
	writer: WritableStreamDefaultWriter<VideoFrame> | null;
	requestCapture: () => void;
};

function createFrameOutput(canvas: HTMLCanvasElement): FrameOutput {
	const GeneratorCtor = getTrackGeneratorCtor();
	if (GeneratorCtor && typeof VideoFrame !== 'undefined') {
		try {
			const generator = new GeneratorCtor({ kind: 'video' });
			return { track: generator, writer: generator.writable.getWriter(), requestCapture: () => undefined };
		} catch {
			void 0;
		}
	}
	const stream = canvas.captureStream(0) as CaptureStream;
	const track = stream.getVideoTracks()[0] as CaptureTrack | undefined;
	if (!track) {
		throw new Error('Canvas video capture unavailable');
	}
	const requestCapture = track.requestFrame ? () => track.requestFrame?.() : () => stream.requestFrame?.();
	return { track, writer: null, requestCapture };
}

type FrameFeed = {
	track: MediaStreamTrack;
	reader: ReadableStreamDefaultReader<VideoFrame>;
	frame: VideoFrame | null;
	lastFrameAt: number;
	frameInterval: number;
};

function startFrameFeed(stream: MediaStream | null): FrameFeed | null {
	const ProcessorCtor = getTrackProcessorCtor();
	const source = stream?.getVideoTracks()[0];
	if (!ProcessorCtor || !source) return null;
	let track: MediaStreamTrack | null = null;
	try {
		track = source.clone();
		const reader = new ProcessorCtor({ track, maxBufferSize: 1 }).readable.getReader();
		return { track, reader, frame: null, lastFrameAt: 0, frameInterval: 0 };
	} catch {
		track?.stop();
		return null;
	}
}

function noteFrameArrival(feed: FrameFeed, now: number): void {
	if (feed.lastFrameAt > 0) {
		const gap = Math.min(now - feed.lastFrameAt, MAX_FRAME_GAP_MS);
		feed.frameInterval = feed.frameInterval > 0 ? feed.frameInterval + (gap - feed.frameInterval) * FRAME_INTERVAL_SMOOTHING : gap;
	}
	feed.lastFrameAt = now;
}

function effectiveFrameInterval(feed: FrameFeed, now: number): number {
	if (feed.lastFrameAt === 0) return Number.POSITIVE_INFINITY;
	return Math.max(feed.frameInterval, now - feed.lastFrameAt);
}

function stopFrameFeed(feed: FrameFeed | null): void {
	if (!feed) return;
	void feed.reader.cancel().catch(() => undefined);
	feed.track.stop();
	feed.frame?.close();
	feed.frame = null;
}

function sourceSize(source: DrawSource): { width: number; height: number } {
	if (source instanceof HTMLVideoElement) {
		return { width: source.videoWidth, height: source.videoHeight };
	}
	return { width: source.displayWidth, height: source.displayHeight };
}

function createSourceVideo(): HTMLVideoElement {
	const video = document.createElement('video');
	video.muted = true;
	video.defaultMuted = true;
	video.playsInline = true;
	video.autoplay = true;
	return video;
}

function attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream | null): void {
	video.srcObject = stream;
	if (stream) {
		void video.play().catch(() => undefined);
	} else {
		video.load();
	}
}

function isVideoDrawable(video: HTMLVideoElement): boolean {
	return video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
}

function drawFitted(ctx: CanvasRenderingContext2D, video: DrawSource): void {
	const { width: vw, height: vh } = sourceSize(video);
	const scale = Math.min(CANVAS_WIDTH / vw, CANVAS_HEIGHT / vh);
	const dw = vw * scale;
	const dh = vh * scale;
	const dx = (CANVAS_WIDTH - dw) / 2;
	const dy = (CANVAS_HEIGHT - dh) / 2;
	ctx.drawImage(video, dx, dy, dw, dh);
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
	const radius = Math.min(r, w / 2, h / 2);
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x + w, y, radius);
	ctx.closePath();
}

function drawPip(ctx: CanvasRenderingContext2D, video: DrawSource): void {
	const { width: vw, height: vh } = sourceSize(video);
	const maxH = CANVAS_HEIGHT - PIP_MARGIN * 2;
	const rawH = Math.round((PIP_WIDTH * vh) / vw);
	const pipH = Math.max(2, Math.min(maxH, rawH));
	const pipW = rawH > maxH ? Math.max(2, Math.round((maxH * vw) / vh)) : PIP_WIDTH;
	const pipX = CANVAS_WIDTH - PIP_MARGIN - pipW;
	const pipY = CANVAS_HEIGHT - PIP_MARGIN - pipH;

	ctx.save();
	ctx.beginPath();
	roundedRectPath(ctx, pipX, pipY, pipW, pipH, PIP_RADIUS);
	ctx.clip();
	ctx.drawImage(video, pipX, pipY, pipW, pipH);
	ctx.restore();
}

export function startIntervalWorker(intervalMs: number, onTick: () => void): () => void {
	if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
		const script = `const id = setInterval(() => postMessage(0), ${intervalMs}); onmessage = () => clearInterval(id);`;
		const blob = new Blob([script], { type: 'application/javascript' });
		const blobUrl = URL.createObjectURL(blob);
		const worker = new Worker(blobUrl);
		worker.onmessage = () => onTick();
		return () => {
			worker.onmessage = null;
			try {
				worker.postMessage(0);
			} catch {
				void 0;
			}
			worker.terminate();
			URL.revokeObjectURL(blobUrl);
		};
	}
	const timer = setInterval(onTick, intervalMs);
	return () => clearInterval(timer);
}

export class LiveCompositor {
	private readonly _canvas: HTMLCanvasElement;
	private readonly ctx: CanvasRenderingContext2D;
	private readonly _track: CaptureTrack;
	private readonly writer: WritableStreamDefaultWriter<VideoFrame> | null;
	private readonly requestCapture: () => void;
	private readonly screenVideo: HTMLVideoElement;
	private readonly cameraVideo: HTMLVideoElement;
	private readonly stopWorker: () => void;
	private screenStream: MediaStream | null = null;
	private cameraStream: MediaStream | null = null;
	private screenFeed: FrameFeed | null = null;
	private cameraFeed: FrameFeed | null = null;
	private lastRenderAt = 0;
	private lastTimestamp = -1;
	private disposed = false;

	constructor() {
		this._canvas = document.createElement('canvas');
		this._canvas.width = CANVAS_WIDTH;
		this._canvas.height = CANVAS_HEIGHT;
		const ctx = this._canvas.getContext('2d', { alpha: false });
		if (!ctx) {
			throw new Error('2D canvas context unavailable');
		}
		this.ctx = ctx;
		this.screenVideo = createSourceVideo();
		this.cameraVideo = createSourceVideo();

		const output = createFrameOutput(this._canvas);
		const track = output.track as CaptureTrack;
		try {
			track.contentHint = 'motion';
		} catch {
			void 0;
		}
		this._track = track;
		this.writer = output.writer;
		this.requestCapture = output.requestCapture;

		this.renderFrame();
		this.stopWorker = startIntervalWorker(1000 / CANVAS_FPS, () => this.onTick());
	}

	get track(): MediaStreamTrack {
		return this._track;
	}

	get canvas(): HTMLCanvasElement {
		return this._canvas;
	}

	setScreen(stream: MediaStream | null): void {
		if (this.disposed) return;
		this.screenStream = stream;
		attachStreamToVideo(this.screenVideo, stream);
		stopFrameFeed(this.screenFeed);
		this.screenFeed = startFrameFeed(stream);
		if (this.screenFeed) void this.pumpFrames(this.screenFeed);
	}

	setCamera(stream: MediaStream | null): void {
		if (this.disposed) return;
		this.cameraStream = stream;
		attachStreamToVideo(this.cameraVideo, stream);
		stopFrameFeed(this.cameraFeed);
		this.cameraFeed = startFrameFeed(stream);
		if (this.cameraFeed) void this.pumpFrames(this.cameraFeed);
	}

	private async pumpFrames(feed: FrameFeed): Promise<void> {
		for (;;) {
			const result = await feed.reader.read().catch(() => null);
			const frame = result && !result.done ? result.value : null;
			if (!frame) {
				this.dropFeed(feed);
				return;
			}
			if (this.disposed || (feed !== this.screenFeed && feed !== this.cameraFeed)) {
				frame.close();
				return;
			}
			feed.frame?.close();
			feed.frame = frame;
			noteFrameArrival(feed, performance.now());
			if (feed === this.drivingFeed()) this.renderFrame();
		}
	}

	private dropFeed(feed: FrameFeed): void {
		stopFrameFeed(feed);
		if (this.screenFeed === feed) this.screenFeed = null;
		if (this.cameraFeed === feed) this.cameraFeed = null;
	}

	private drivingFeed(): FrameFeed | null {
		if (!this.screenStream) return this.cameraFeed;
		if (!this.screenFeed) return null;
		if (!this.cameraFeed) return this.screenFeed;
		const now = performance.now();
		const screenInterval = effectiveFrameInterval(this.screenFeed, now);
		const cameraInterval = effectiveFrameInterval(this.cameraFeed, now);
		return screenInterval <= cameraInterval * SCREEN_DRIVE_TOLERANCE ? this.screenFeed : this.cameraFeed;
	}

	private onTick(): void {
		const frameDriven = this.screenStream ? this.screenFeed !== null : this.cameraFeed !== null;
		if (frameDriven && performance.now() - this.lastRenderAt < IDLE_REPEAT_MS) return;
		this.renderFrame();
	}

	private drawSource(feed: FrameFeed | null, video: HTMLVideoElement): DrawSource | null {
		if (feed?.frame) return feed.frame;
		return isVideoDrawable(video) ? video : null;
	}

	private renderFrame(): void {
		if (this.disposed) return;
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		const camera = this.cameraStream ? this.drawSource(this.cameraFeed, this.cameraVideo) : null;
		if (this.screenStream) {
			const screen = this.drawSource(this.screenFeed, this.screenVideo);
			if (screen) {
				drawFitted(this.ctx, screen);
			}
			if (camera) {
				drawPip(this.ctx, camera);
			}
		} else if (camera) {
			drawFitted(this.ctx, camera);
		}

		this.lastRenderAt = performance.now();
		this.emitFrame();
	}

	private emitFrame(): void {
		if (!this.writer) {
			this.requestCapture();
			return;
		}
		const desiredSize = this.writer.desiredSize;
		if (desiredSize === null || desiredSize <= 0) return;
		const timestamp = Math.max(Math.round(this.lastRenderAt * 1000), this.lastTimestamp + 1);
		let frame: VideoFrame;
		try {
			frame = new VideoFrame(this._canvas, { timestamp });
		} catch {
			return;
		}
		this.lastTimestamp = timestamp;
		void this.writer.write(frame).catch(() => frame.close());
	}

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		this.stopWorker();
		stopFrameFeed(this.screenFeed);
		stopFrameFeed(this.cameraFeed);
		this.screenFeed = null;
		this.cameraFeed = null;
		this.screenStream = null;
		this.cameraStream = null;
		attachStreamToVideo(this.screenVideo, null);
		attachStreamToVideo(this.cameraVideo, null);
		void this.writer?.close().catch(() => undefined);
		this._track.stop();
		this._canvas.remove();
	}
}
