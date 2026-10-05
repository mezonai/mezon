export type BackgroundMode = 'none' | 'bg-1' | 'bg-2' | 'bg-3' | 'bg-4' | 'bg-5';

export interface BackgroundOption {
	id: BackgroundMode;
	label: string;
	url: string;
}

export const VIRTUAL_BACKGROUNDS: BackgroundOption[] = [
	{
		id: 'none',
		label: 'None',
		url: ''
	},
	{
		id: 'bg-1',
		label: 'Background 1',
		url: 'https://cdn.komu.vn/vtbg/pasted-image-1791187790282-0.png'
	},
	{
		id: 'bg-2',
		label: 'Background 2',
		url: 'https://cdn.komu.vn/vtbg/pasted-image-1791187812257-0.png'
	},
	{
		id: 'bg-3',
		label: 'Background 3',
		url: 'https://cdn.komu.vn/vtbg/pasted-image-1791187833198-0.png'
	},
	{
		id: 'bg-4',
		label: 'Background 4',
		url: 'https://cdn.komu.vn/vtbg/pasted-image-1791187852816-0.png'
	},
	{
		id: 'bg-5',
		label: 'Background 5',
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
				script.crossOrigin = 'anonymous';
				script.async = true;
				script.onload = () => {
					script.dataset.loaded = 'true';
					res();
				};
				script.onerror = (err) => rej(err);
				document.head.appendChild(script);
			});
		};

		loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
			.then(() => loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js'))
			.then(() => resolve())
			.catch((err) => {
				console.error('Failed to load MediaPipe Selfie Segmentation scripts from CDN:', err);
				reject(err);
			});
	});

	return scriptLoadingPromise;
}

export class MediaPipeBackgroundProcessor {
	public readonly width = MODEL_WIDTH;
	public readonly height = MODEL_HEIGHT;

	private mode: BackgroundMode = 'none';
	private mirrorCamera = true;
	private edgeFeather = 2;

	private videoElement: HTMLVideoElement | null = null;
	private inputStream: MediaStream | null = null;

	private maskCanvas: HTMLCanvasElement;
	private maskCtx: CanvasRenderingContext2D | null;
	private bgCanvas: HTMLCanvasElement;
	private bgCtx: CanvasRenderingContext2D | null;
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
		this.maskCanvas = document.createElement('canvas');
		this.maskCanvas.width = this.width;
		this.maskCanvas.height = this.height;
		this.maskCtx = this.maskCanvas.getContext('2d');

		this.bgCanvas = document.createElement('canvas');
		this.bgCanvas.width = this.width;
		this.bgCanvas.height = this.height;
		this.bgCtx = this.bgCanvas.getContext('2d');

		this.fgCanvas = document.createElement('canvas');
		this.fgCanvas.width = this.width;
		this.fgCanvas.height = this.height;
		this.fgCtx = this.fgCanvas.getContext('2d');

		this.outputCanvas = document.createElement('canvas');
		this.outputCanvas.width = this.width;
		this.outputCanvas.height = this.height;
		this.outCtx = this.outputCanvas.getContext('2d');

		// Preload background images directly from URLs
		this.preloadAllBackgrounds();
	}

	private preloadAllBackgrounds(): void {
		VIRTUAL_BACKGROUNDS.forEach((opt) => {
			if (opt.id !== 'none' && opt.url) {
				void this.preloadImage(opt);
			}
		});
	}

	private preloadImage(opt: BackgroundOption): Promise<HTMLImageElement | null> {
		if (this.loadedImages.has(opt.id)) {
			return Promise.resolve(this.loadedImages.get(opt.id) || null);
		}

		return new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				this.loadedImages.set(opt.id, img);
				resolve(img);
			};
			img.onerror = () => {
				const directImg = new Image();
				directImg.onload = () => {
					this.loadedImages.set(opt.id, directImg);
					resolve(directImg);
				};
				directImg.onerror = (e) => {
					console.error(`Failed to load background image directly from ${opt.url}:`, e);
					resolve(null);
				};
				directImg.src = opt.url;
			};
			img.src = opt.url;
		});
	}

	public async initMediaPipe(): Promise<void> {
		if (this.selfieSegmentation) return;
		await loadMediaPipeScripts();
		const SelfieSegmentationClass = (window as WindowWithMediaPipe).SelfieSegmentation;
		if (!SelfieSegmentationClass) {
			throw new Error('MediaPipe SelfieSegmentation is not available on window');
		}

		this.selfieSegmentation = new SelfieSegmentationClass({
			locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
		});

		this.selfieSegmentation.setOptions({
			modelSelection: 1, // 1: Landscape (144x256, ultra-light), 0: General (256x256)
			selfieMode: false
		});

		this.selfieSegmentation.onResults((results: SelfieSegmentationResults) => this.onResults(results));
	}

	public async start(inputStream: MediaStream, initialMode: BackgroundMode = 'none'): Promise<MediaStream> {
		this.stop();
		this.inputStream = inputStream;
		this.mode = initialMode;
		this.isRunning = true;

		this.videoElement = document.createElement('video');
		this.videoElement.autoplay = true;
		this.videoElement.playsInline = true;
		this.videoElement.muted = true;
		this.videoElement.srcObject = inputStream;

		await this.videoElement.play().catch(() => undefined);

		if (this.mode !== 'none') {
			try {
				await this.initMediaPipe();
				const opt = VIRTUAL_BACKGROUNDS.find((b) => b.id === this.mode);
				if (opt) await this.preloadImage(opt);
			} catch (err) {
				console.warn('Failed to initialize MediaPipe upfront, falling back to passthrough:', err);
			}
		}

		this.loop();
		return this.getStream();
	}

	public setMode(newMode: BackgroundMode): void {
		this.mode = newMode;
		if (newMode !== 'none') {
			const opt = VIRTUAL_BACKGROUNDS.find((b) => b.id === newMode);
			if (opt) void this.preloadImage(opt);

			if (!this.selfieSegmentation) {
				void this.initMediaPipe().catch((err) => {
					console.error('Failed to initialize MediaPipe on mode change:', err);
				});
			}
		}
	}

	public getMode(): BackgroundMode {
		return this.mode;
	}

	public setMirror(mirror: boolean): void {
		this.mirrorCamera = mirror;
	}

	public getMirror(): boolean {
		return this.mirrorCamera;
	}

	public setEdgeFeather(feather: number): void {
		this.edgeFeather = Math.max(0, Math.min(8, feather));
	}

	public getStream(fps = 30): MediaStream {
		if (!this.outputStream) {
			this.outputStream = this.outputCanvas.captureStream(fps);
		}
		return this.outputStream;
	}

	public getVideoTrack(fps = 30): MediaStreamTrack | null {
		return this.getStream(fps).getVideoTracks()[0] || null;
	}

	private loop = async (): Promise<void> => {
		if (!this.isRunning || !this.videoElement) return;

		const video = this.videoElement;
		if (!video.videoWidth || video.readyState < 2) {
			this.animationFrameId = requestAnimationFrame(this.loop);
			return;
		}

		if (this.mode === 'none') {
			// Direct passthrough to outputCanvas with no inference
			if (this.outCtx) {
				this.outCtx.save();
				this.outCtx.clearRect(0, 0, this.width, this.height);
				if (this.mirrorCamera) {
					this.outCtx.translate(this.width, 0);
					this.outCtx.scale(-1, 1);
				}
				this.outCtx.drawImage(video, 0, 0, this.width, this.height);
				this.outCtx.restore();
			}
		} else if (!this.isProcessing && this.selfieSegmentation) {
			this.isProcessing = true;
			try {
				await this.selfieSegmentation.send({ image: video });
			} catch (err) {
				console.error('MediaPipe send error:', err);
				this.isProcessing = false;
			}
		}

		if (this.isRunning) {
			this.animationFrameId = requestAnimationFrame(this.loop);
		}
	};

	private onResults(results: SelfieSegmentationResults): void {
		if (!this.outCtx || !this.bgCtx || !this.maskCtx || !this.fgCtx) {
			this.isProcessing = false;
			return;
		}

		// 1. Draw Background Image onto bgCanvas
		this.bgCtx.clearRect(0, 0, this.width, this.height);
		const bgImg = this.loadedImages.get(this.mode);
		if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
			// Draw image covering 640x360 maintaining aspect ratio
			const imgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
			const canvasAspect = this.width / this.height;
			let drawW = this.width;
			let drawH = this.height;
			let drawX = 0;
			let drawY = 0;
			if (imgAspect > canvasAspect) {
				drawW = this.height * imgAspect;
				drawX = (this.width - drawW) / 2;
			} else {
				drawH = this.width / imgAspect;
				drawY = (this.height - drawH) / 2;
			}
			this.bgCtx.drawImage(bgImg, drawX, drawY, drawW, drawH);
		} else {
			// Fallback subtle gradient if image is still loading
			const grad = this.bgCtx.createLinearGradient(0, 0, this.width, this.height);
			grad.addColorStop(0, '#1e293b');
			grad.addColorStop(1, '#0f172a');
			this.bgCtx.fillStyle = grad;
			this.bgCtx.fillRect(0, 0, this.width, this.height);
		}

		// 2. Draw segmentation mask with edge feathering
		this.maskCtx.clearRect(0, 0, this.width, this.height);
		if (this.edgeFeather > 0) {
			this.maskCtx.filter = `blur(${this.edgeFeather}px)`;
		} else {
			this.maskCtx.filter = 'none';
		}
		this.maskCtx.drawImage(results.segmentationMask, 0, 0, this.width, this.height);
		this.maskCtx.filter = 'none';

		// 3. Cut foreground from camera frame
		this.fgCtx.clearRect(0, 0, this.width, this.height);
		this.fgCtx.drawImage(results.image, 0, 0, this.width, this.height);
		this.fgCtx.globalCompositeOperation = 'destination-in';
		this.fgCtx.drawImage(this.maskCanvas, 0, 0, this.width, this.height);
		this.fgCtx.globalCompositeOperation = 'source-over';

		// 4. Composite Background & Foreground into outputCanvas
		this.outCtx.save();
		this.outCtx.clearRect(0, 0, this.width, this.height);
		this.outCtx.drawImage(this.bgCanvas, 0, 0, this.width, this.height);

		if (this.mirrorCamera) {
			this.outCtx.translate(this.width, 0);
			this.outCtx.scale(-1, 1);
		}
		this.outCtx.drawImage(this.fgCanvas, 0, 0, this.width, this.height);
		this.outCtx.restore();

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
		if (this.selfieSegmentation) {
			try {
				void this.selfieSegmentation.close?.();
			} catch {} // eslint-disable-line no-empty
			this.selfieSegmentation = null;
		}
		this.loadedImages.clear();
	}
}
