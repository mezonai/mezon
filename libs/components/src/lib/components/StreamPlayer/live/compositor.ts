const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const CANVAS_FPS = 30;
const PIP_WIDTH = 384;
const PIP_MARGIN = 24;
const PIP_RADIUS = 12;

type CaptureTrack = MediaStreamTrack & {
	requestFrame?: () => void;
};

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

function drawFitted(ctx: CanvasRenderingContext2D, video: HTMLVideoElement): void {
	const vw = video.videoWidth;
	const vh = video.videoHeight;
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

function drawPip(ctx: CanvasRenderingContext2D, video: HTMLVideoElement): void {
	const vw = video.videoWidth;
	const vh = video.videoHeight;
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
	private readonly screenVideo: HTMLVideoElement;
	private readonly cameraVideo: HTMLVideoElement;
	private readonly stopWorker: () => void;
	private screenStream: MediaStream | null = null;
	private cameraStream: MediaStream | null = null;
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

		const captured = this._canvas.captureStream(0);
		const track = captured.getVideoTracks()[0] as CaptureTrack | undefined;
		if (!track) {
			throw new Error('Canvas video capture unavailable');
		}
		try {
			track.contentHint = 'detail';
		} catch {
			void 0;
		}
		this._track = track;

		this.renderFrame();
		this.stopWorker = startIntervalWorker(1000 / CANVAS_FPS, () => this.renderFrame());
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
	}

	setCamera(stream: MediaStream | null): void {
		if (this.disposed) return;
		this.cameraStream = stream;
		attachStreamToVideo(this.cameraVideo, stream);
	}

	private renderFrame(): void {
		if (this.disposed) return;
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		if (this.screenStream) {
			if (isVideoDrawable(this.screenVideo)) {
				drawFitted(this.ctx, this.screenVideo);
			}
			if (this.cameraStream && isVideoDrawable(this.cameraVideo)) {
				drawPip(this.ctx, this.cameraVideo);
			}
		} else if (this.cameraStream && isVideoDrawable(this.cameraVideo)) {
			drawFitted(this.ctx, this.cameraVideo);
		}

		this._track.requestFrame?.();
	}

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		this.stopWorker();
		this.screenStream = null;
		this.cameraStream = null;
		attachStreamToVideo(this.screenVideo, null);
		attachStreamToVideo(this.cameraVideo, null);
		this._track.stop();
		this._canvas.remove();
	}
}
