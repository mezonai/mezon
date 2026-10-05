export type BackgroundMode = 'bg-1' | 'bg-2' | 'bg-3' | 'bg-4' | 'bg-5';

export interface BackgroundOption {
	id: BackgroundMode;
	url: string;
}

export const VIRTUAL_BACKGROUNDS: BackgroundOption[] = [
	{
		id: 'bg-1',
		url: 'https://cdn.komu.vn/vtbg/pasted-image-1791187790282-0.png'
	},
	{
		id: 'bg-2',
		url: 'https://cdn.komu.vn/vtbg/pasted-image-1791187812257-0.png'
	},
	{
		id: 'bg-3',
		url: 'https://cdn.komu.vn/vtbg/pasted-image-1791187833198-0.png'
	},
	{
		id: 'bg-4',
		url: 'https://cdn.komu.vn/vtbg/pasted-image-1791187852816-0.png'
	},
	{
		id: 'bg-5',
		url: 'https://cdn.komu.vn/vtbg/pasted-image-1791187892349-0.png'
	}
];

export const MODEL_WIDTH = 640;
export const MODEL_HEIGHT = 360;

interface SelfieSegmentationResults {
	image: CanvasImageSource;
	segmentationMask: CanvasImageSource;
}

interface SelfieSegmentationModel {
	setOptions: (options: { modelSelection: number; selfieMode: boolean }) => void;
	onResults: (listener: (results: SelfieSegmentationResults) => void) => void;
	send: (input: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
	close?: () => Promise<void>;
}

type WindowWithMediaPipe = Window & {
	SelfieSegmentation?: new (config: { locateFile: (file: string) => string }) => SelfieSegmentationModel;
};

let scriptLoadingPromise: Promise<void> | null = null;

export function loadMediaPipeScripts(): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve();
	if ((window as WindowWithMediaPipe).SelfieSegmentation) return Promise.resolve();
	if (scriptLoadingPromise) return scriptLoadingPromise;

	scriptLoadingPromise = new Promise<void>((resolve, reject) => {
		const loadScript = (src: string): Promise<void> => {
			return new Promise((res, rej) => {
				const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
				if (existing) {
					if (existing.dataset.loaded === 'true') {
						res();
						return;
					}
					existing.addEventListener('load', () => res(), { once: true });
					existing.addEventListener('error', (e) => rej(e), { once: true });
					return;
				}
				const script = document.createElement('script');
				script.src = src;
				script.async = true;
				script.onload = () => {
					script.dataset.loaded = 'true';
					res();
				};
				script.onerror = (err) => rej(err);
				document.head.appendChild(script);
			});
		};

		const loadScriptWithFallback = (primarySrc: string, fallbackSrc: string): Promise<void> => {
			return loadScript(primarySrc).catch((err) => {
				console.warn(`Primary script ${primarySrc} not available, trying fallback ${fallbackSrc}:`, err);
				return loadScript(fallbackSrc);
			});
		};

		loadScriptWithFallback(
			'https://cdn.komu.vn/npm/mediapipe/camera_utils/camera_utils.js',
			'https://cdn.jsdelivr.net/npm/mediapipe/camera_utils/camera_utils.js'
		)
			.then(() =>
				loadScriptWithFallback(
					'https://cdn.komu.vn/npm/mediapipe/selfie_segmentation/selfie_segmentation.js',
					'https://cdn.jsdelivr.net/npm/mediapipe/selfie_segmentation/selfie_segmentation.js'
				)
			)
			.then(() => resolve())
			.catch((err) => {
				console.error('Failed to load MediaPipe Selfie Segmentation scripts:', err);
				reject(err);
			});
	});

	return scriptLoadingPromise;
}

export function getBackgroundFetchUrl(url: string): string {
	if (typeof window !== 'undefined') {
		const isDev = Boolean(import.meta.env?.DEV) || ['localhost', '127.0.0.1'].includes(window.location.hostname);
		if (isDev && url.startsWith('https://cdn.komu.vn/')) {
			return url.replace('https://cdn.komu.vn/', '/vtbg-cdn/');
		}
	}
	return url;
}

export function drawImageCover(
	ctx: CanvasRenderingContext2D,
	img: CanvasImageSource,
	srcW: number,
	srcH: number,
	destW: number,
	destH: number
): void {
	if (!srcW || !srcH) {
		ctx.drawImage(img, 0, 0, destW, destH);
		return;
	}
	const srcAspect = srcW / srcH;
	const destAspect = destW / destH;

	let drawW = destW;
	let drawH = destH;
	let drawX = 0;
	let drawY = 0;

	if (srcAspect > destAspect) {
		drawW = destH * srcAspect;
		drawX = (destW - drawW) / 2;
	} else {
		drawH = destW / srcAspect;
		drawY = (destH - drawH) / 2;
	}

	ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

export class MediaPipeBackgroundProcessor {
	public width = MODEL_WIDTH;
	public height = MODEL_HEIGHT;

	private mode: BackgroundMode | null = null;
	private mirrorCamera = false;
	private hasFirstResult = false;
	private lastFrameTime = 0;

	private videoElement: HTMLVideoElement | null = null;
	private inputStream: MediaStream | null = null;

	// Downscaled input canvas to avoid uploading high-res 1080p/720p frames into WebGL
	private inputCanvas: HTMLCanvasElement;
	private inputCtx: CanvasRenderingContext2D | null;

	// Single offscreen foreground compositing canvas
	private fgCanvas: HTMLCanvasElement;
	private fgCtx: CanvasRenderingContext2D | null;

	public readonly outputCanvas: HTMLCanvasElement;
	private outCtx: CanvasRenderingContext2D | null;

	private selfieSegmentation: SelfieSegmentationModel | null = null;
	private isRunning = false;
	private isProcessing = false;
	private animationFrameId: number | null = null;
	private outputStream: MediaStream | null = null;

	private loadedImages = new Map<BackgroundMode, HTMLImageElement>();

	constructor() {
		this.inputCanvas = document.createElement('canvas');
		this.inputCanvas.width = this.width;
		this.inputCanvas.height = this.height;
		this.inputCtx = this.inputCanvas.getContext('2d', { willReadFrequently: false });

		this.fgCanvas = document.createElement('canvas');
		this.fgCanvas.width = this.width;
		this.fgCanvas.height = this.height;
		this.fgCtx = this.fgCanvas.getContext('2d');

		this.outputCanvas = document.createElement('canvas');
		this.outputCanvas.width = this.width;
		this.outputCanvas.height = this.height;
		this.outputCanvas.id = 'mediapipe-bg-output-canvas';
		this.outputCanvas.style.position = 'fixed';
		this.outputCanvas.style.top = '0';
		this.outputCanvas.style.left = '0';
		this.outputCanvas.style.width = `${this.width}px`;
		this.outputCanvas.style.height = `${this.height}px`;
		this.outputCanvas.style.opacity = '0.01';
		this.outputCanvas.style.pointerEvents = 'none';
		this.outputCanvas.style.zIndex = '-99999';
		if (typeof document !== 'undefined' && document.body) {
			document.body.appendChild(this.outputCanvas);
		}
		this.outCtx = this.outputCanvas.getContext('2d');

		// Preload background images directly from URLs
		this.preloadAllBackgrounds();
	}

	private preloadAllBackgrounds(): void {
		VIRTUAL_BACKGROUNDS.forEach((opt) => {
			void this.preloadImage(opt);
		});
	}

	private async preloadImage(opt: BackgroundOption): Promise<HTMLImageElement | null> {
		if (this.loadedImages.has(opt.id)) {
			const existing = this.loadedImages.get(opt.id);
			if (existing && existing.complete && existing.naturalWidth > 0) {
				return existing;
			}
		}

		const fetchUrl = getBackgroundFetchUrl(opt.url);

		// Try fetching as blob to create same-origin blob URL (guarantees canvas is NEVER tainted)
		try {
			const res = await fetch(fetchUrl);
			if (res.ok) {
				const blob = await res.blob();
				const blobUrl = URL.createObjectURL(blob);
				return await new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.onload = () => {
						this.loadedImages.set(opt.id, img);
						resolve(img);
					};
					img.onerror = (e) => reject(e);
					img.src = blobUrl;
				});
			}
		} catch (err) {
			console.warn(`Fetch blob failed for ${fetchUrl}, falling back to Image element:`, err);
		}

		return new Promise<HTMLImageElement | null>((resolve) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				this.loadedImages.set(opt.id, img);
				resolve(img);
			};
			img.onerror = () => {
				// Retry without crossOrigin if CORS rejected it
				const fallbackImg = new Image();
				fallbackImg.onload = () => {
					this.loadedImages.set(opt.id, fallbackImg);
					resolve(fallbackImg);
				};
				fallbackImg.onerror = (e) => {
					console.error(`Failed to load background image directly from ${opt.url}:`, e);
					resolve(null);
				};
				fallbackImg.src = fetchUrl;
			};
			img.src = fetchUrl;
		});
	}

	public async initMediaPipe(): Promise<void> {
		if (this.selfieSegmentation) return;
		await loadMediaPipeScripts();
		const SelfieSegmentationClass = (window as WindowWithMediaPipe).SelfieSegmentation;
		if (!SelfieSegmentationClass) {
			throw new Error('MediaPipe SelfieSegmentation is not available on window');
		}

		let cdnBase = 'https://cdn.komu.vn/npm/mediapipe/selfie_segmentation';
		try {
			const check = await fetch('https://cdn.komu.vn/npm/mediapipe/selfie_segmentation/selfie_segmentation.wasm', {
				method: 'HEAD'
			});
			if (!check.ok) {
				cdnBase = 'https://cdn.jsdelivr.net/npm/mediapipe/selfie_segmentation';
			}
		} catch {
			cdnBase = 'https://cdn.jsdelivr.net/npm/mediapipe/selfie_segmentation';
		}

		this.selfieSegmentation = new SelfieSegmentationClass({
			locateFile: (file: string) => `${cdnBase}/${file}`
		});

		const isPortrait = this.height > this.width;
		this.selfieSegmentation.setOptions({
			modelSelection: isPortrait ? 0 : 1, // 0: General (square, best for mobile portrait), 1: Landscape (144x256, ultra-light)
			selfieMode: false
		});

		this.selfieSegmentation.onResults((results: SelfieSegmentationResults) => this.onResults(results));
	}

	public async start(inputStream: MediaStream, initialMode: BackgroundMode | null = null): Promise<MediaStream> {
		this.stop();
		this.inputStream = inputStream;
		this.mode = initialMode;
		this.isRunning = true;
		this.hasFirstResult = false;

		this.videoElement = document.createElement('video');
		this.videoElement.autoplay = true;
		this.videoElement.playsInline = true;
		this.videoElement.muted = true;
		this.videoElement.style.position = 'fixed';
		this.videoElement.style.top = '0';
		this.videoElement.style.left = '0';
		this.videoElement.style.width = `${this.width}px`;
		this.videoElement.style.height = `${this.height}px`;
		this.videoElement.style.opacity = '0.01';
		this.videoElement.style.pointerEvents = 'none';
		this.videoElement.style.zIndex = '-99999';
		document.body.appendChild(this.videoElement);
		this.videoElement.srcObject = inputStream;

		this.videoElement.onpause = () => {
			if (this.isRunning && this.videoElement) {
				void this.videoElement.play().catch(() => undefined);
			}
		};

		await this.videoElement.play().catch(() => undefined);

		if (this.mode) {
			void this.initMediaPipe().catch((err) => {
				console.warn('Failed to initialize MediaPipe upfront:', err);
			});
			const opt = VIRTUAL_BACKGROUNDS.find((b) => b.id === this.mode) || VIRTUAL_BACKGROUNDS[0];
			if (opt) {
				void this.preloadImage(opt);
			}
		}

		this.loop();
		return this.getStream();
	}

	public getCanvas(): HTMLCanvasElement {
		return this.outputCanvas;
	}

	public setMode(newMode: BackgroundMode | null): void {
		if (this.mode !== newMode) {
			this.hasFirstResult = false;
		}
		this.mode = newMode;
		if (newMode) {
			const opt = VIRTUAL_BACKGROUNDS.find((b) => b.id === newMode);
			if (opt) void this.preloadImage(opt);

			if (!this.selfieSegmentation) {
				void this.initMediaPipe().catch((err) => {
					console.error('Failed to initialize MediaPipe on mode change:', err);
				});
			}
		}
	}

	public getMode(): BackgroundMode | null {
		return this.mode;
	}

	public setMirror(mirror: boolean): void {
		this.mirrorCamera = mirror;
	}

	public getMirror(): boolean {
		return this.mirrorCamera;
	}

	public setEdgeFeather(_feather: number): void {
		// No-op: Canvas blur filters are intentionally disabled to prevent GPU memory leaks in Firefox
	}

	public getStream(fps = 30): MediaStream {
		if (!this.outputStream || this.outputStream.getVideoTracks().every((t) => t.readyState === 'ended')) {
			this.outputStream = this.outputCanvas.captureStream(fps);
		}
		return this.outputStream;
	}

	public getVideoTrack(fps = 30): MediaStreamTrack | null {
		const stream = this.getStream(fps);
		const track = stream.getVideoTracks()[0];
		if (track && track.readyState === 'live') {
			return track;
		}
		this.outputStream = this.outputCanvas.captureStream(fps);
		return this.outputStream.getVideoTracks()[0] || null;
	}

	private requestOutputFrame(): void {
		if (this.outputStream) {
			const track = this.outputStream.getVideoTracks()[0] as (MediaStreamTrack & { requestFrame?: () => void }) | undefined;
			if (track && typeof track.requestFrame === 'function') {
				try {
					track.requestFrame();
				} catch {} // eslint-disable-line no-empty
			}
		}
	}

	private updateDimensions(videoWidth: number, videoHeight: number): void {
		if (!videoWidth || !videoHeight) return;

		let targetW = MODEL_WIDTH;
		let targetH = MODEL_HEIGHT;

		if (videoHeight > videoWidth) {
			// Portrait mode (e.g. mobile smartphone)
			targetH = 640;
			targetW = Math.round((640 * videoWidth) / videoHeight);
			if (targetW % 2 !== 0) targetW += 1;
		} else {
			// Landscape mode (e.g. desktop webcam)
			targetW = 640;
			targetH = Math.round((640 * videoHeight) / videoWidth);
			if (targetH % 2 !== 0) targetH += 1;
		}

		if (this.width !== targetW || this.height !== targetH) {
			const wasPortrait = this.height > this.width;
			this.width = targetW;
			this.height = targetH;

			this.inputCanvas.width = targetW;
			this.inputCanvas.height = targetH;

			this.fgCanvas.width = targetW;
			this.fgCanvas.height = targetH;

			this.outputCanvas.width = targetW;
			this.outputCanvas.height = targetH;
			this.outputCanvas.style.width = `${targetW}px`;
			this.outputCanvas.style.height = `${targetH}px`;

			const isPortrait = this.height > this.width;
			if (this.selfieSegmentation && wasPortrait !== isPortrait) {
				try {
					this.selfieSegmentation.setOptions({
						modelSelection: isPortrait ? 0 : 1,
						selfieMode: false
					});
				} catch {} // eslint-disable-line no-empty
			}
		}
	}

	private loop = async (): Promise<void> => {
		if (!this.isRunning || !this.videoElement) return;

		const video = this.videoElement;

		// Ensure video is continuously playing even if browser temporarily paused it
		if (video.paused) {
			void video.play().catch(() => undefined);
		}

		if (!video.videoWidth || video.readyState < 2) {
			this.animationFrameId = requestAnimationFrame(this.loop);
			return;
		}

		this.updateDimensions(video.videoWidth, video.videoHeight);

		// Throttle to ~30 FPS to avoid overloading the WebGL command queue and GPU memory
		const now = performance.now();
		if (now - this.lastFrameTime < 33) {
			this.animationFrameId = requestAnimationFrame(this.loop);
			return;
		}
		this.lastFrameTime = now;

		if (!this.mode || !this.selfieSegmentation || !this.hasFirstResult) {
			// Passthrough camera feed until first segmentation result arrives or when no background selected
			if (this.outCtx) {
				this.outCtx.save();
				this.outCtx.clearRect(0, 0, this.width, this.height);
				if (this.mirrorCamera) {
					this.outCtx.translate(this.width, 0);
					this.outCtx.scale(-1, 1);
				}
				drawImageCover(this.outCtx, video, video.videoWidth, video.videoHeight, this.width, this.height);
				this.outCtx.restore();
				this.requestOutputFrame();
			}
		}

		if (this.mode && !this.isProcessing && this.selfieSegmentation) {
			this.isProcessing = true;
			try {
				// Downscale input frame maintaining aspect ratio before sending to MediaPipe
				if (this.inputCtx) {
					drawImageCover(this.inputCtx, video, video.videoWidth, video.videoHeight, this.width, this.height);
				}
				const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('MediaPipe inference timeout')), 1500));
				await Promise.race([this.selfieSegmentation.send({ image: this.inputCanvas }), timeoutPromise]);
			} catch (err) {
				console.warn('MediaPipe send error or timeout:', err);
				this.isProcessing = false;
			}
		}

		if (this.isRunning) {
			this.animationFrameId = requestAnimationFrame(this.loop);
		}
	};

	private onResults(results: SelfieSegmentationResults): void {
		if (!this.outCtx || !this.fgCtx) {
			this.isProcessing = false;
			return;
		}

		if (!this.mode) {
			this.isProcessing = false;
			return;
		}

		this.hasFirstResult = true;

		// 1. Draw Background Image directly onto outputCanvas with proper aspect ratio cover
		this.outCtx.save();
		this.outCtx.clearRect(0, 0, this.width, this.height);
		const bgImg = this.loadedImages.get(this.mode);
		if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
			drawImageCover(this.outCtx, bgImg, bgImg.naturalWidth, bgImg.naturalHeight, this.width, this.height);
		} else {
			// Fallback subtle gradient if image is still loading
			const grad = this.outCtx.createLinearGradient(0, 0, this.width, this.height);
			grad.addColorStop(0, '#1e293b');
			grad.addColorStop(1, '#0f172a');
			this.outCtx.fillStyle = grad;
			this.outCtx.fillRect(0, 0, this.width, this.height);
		}

		// 2. Cut foreground from camera frame using segmentation mask directly
		// (NO ctx.filter = blur: completely eliminates the catastrophic Firefox Canvas2D GPU memory leak!)
		this.fgCtx.clearRect(0, 0, this.width, this.height);
		this.fgCtx.drawImage(results.image, 0, 0, this.width, this.height);
		this.fgCtx.globalCompositeOperation = 'destination-in';
		this.fgCtx.drawImage(results.segmentationMask, 0, 0, this.width, this.height);
		this.fgCtx.globalCompositeOperation = 'source-over';

		// 3. Composite Foreground over Background with selfie mirror
		if (this.mirrorCamera) {
			this.outCtx.translate(this.width, 0);
			this.outCtx.scale(-1, 1);
		}
		this.outCtx.drawImage(this.fgCanvas, 0, 0, this.width, this.height);
		this.outCtx.restore();

		this.requestOutputFrame();
		this.isProcessing = false;
	}

	public stop(): void {
		this.isRunning = false;
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
		if (this.videoElement) {
			this.videoElement.srcObject = null;
			if (this.videoElement.parentNode) {
				this.videoElement.parentNode.removeChild(this.videoElement);
			}
			this.videoElement = null;
		}
		this.isProcessing = false;
	}

	public destroy(): void {
		this.stop();
		if (this.outputStream) {
			this.outputStream.getTracks().forEach((t) => t.stop());
			this.outputStream = null;
		}
		if (this.outputCanvas && this.outputCanvas.parentNode) {
			this.outputCanvas.parentNode.removeChild(this.outputCanvas);
		}
		if (this.selfieSegmentation) {
			try {
				void this.selfieSegmentation.close?.();
			} catch {} // eslint-disable-line no-empty
			this.selfieSegmentation = null;
		}
		this.loadedImages.clear();
	}
}
