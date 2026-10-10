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
	initialize?: () => Promise<void>;
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
			'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
		)
			.then(() =>
				loadScriptWithFallback(
					'https://cdn.komu.vn/npm/mediapipe/selfie_segmentation/selfie_segmentation.js',
					'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js'
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

/**
 * Precomputed 256-entry lookup table for smoothstep soft-probability mapping.
 * Avoids hard binary thresholds (which cause jagged pixel steps) while suppressing
 * murky background noise (values < 0.20 -> 0) and preventing foreground translucency (values > 0.80 -> 1).
 */
const SMOOTHSTEP_LUT = new Uint8Array(256);
(function initSmoothstepLut() {
	const edge0 = 0.2;
	const edge1 = 0.8;
	for (let i = 0; i < 256; i++) {
		const x = i / 255;
		const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		const s = t * t * (3 - 2 * t);
		SMOOTHSTEP_LUT[i] = Math.round(s * 255);
	}
})();

interface RectROI {
	x: number;
	y: number;
	w: number;
	h: number;
}

/**
 * Fast Guided Filter for edge-preserving mask upsampling and refinement.
 * Guided by full-resolution camera frame luminance to restore sharp hair strands
 * and silhouette edges while eliminating blockiness and halo artifacts.
 */
class FastGuidedFilter {
	private w: number;
	private h: number;
	private sW: number;
	private sH: number;
	private r: number;
	private eps: number;

	private sI: Float32Array;
	private sP: Float32Array;
	private sIp: Float32Array;
	private sII: Float32Array;

	private meanI: Float32Array;
	private meanP: Float32Array;
	private meanIp: Float32Array;
	private meanII: Float32Array;

	private a: Float32Array;
	private b: Float32Array;
	private meanA: Float32Array;
	private meanB: Float32Array;
	private temp: Float32Array;

	constructor(w: number, h: number, r = 4, eps = 0.005) {
		this.w = w;
		this.h = h;
		this.sW = Math.max(1, w >> 1);
		this.sH = Math.max(1, h >> 1);
		this.r = Math.max(1, r >> 1);
		this.eps = eps;

		const sN = this.sW * this.sH;
		this.sI = new Float32Array(sN);
		this.sP = new Float32Array(sN);
		this.sIp = new Float32Array(sN);
		this.sII = new Float32Array(sN);

		this.meanI = new Float32Array(sN);
		this.meanP = new Float32Array(sN);
		this.meanIp = new Float32Array(sN);
		this.meanII = new Float32Array(sN);

		this.a = new Float32Array(sN);
		this.b = new Float32Array(sN);
		this.meanA = new Float32Array(sN);
		this.meanB = new Float32Array(sN);
		this.temp = new Float32Array(sN);
	}

	private boxFilter(src: Float32Array, dst: Float32Array): void {
		const w = this.sW;
		const h = this.sH;
		const r = this.r;
		const temp = this.temp;

		// Horizontal pass
		for (let y = 0; y < h; y++) {
			const row = y * w;
			let sum = 0;
			for (let x = -r; x <= r; x++) {
				const px = x < 0 ? 0 : x >= w ? w - 1 : x;
				sum += src[row + px];
			}
			temp[row] = sum / (2 * r + 1);

			for (let x = 1; x < w; x++) {
				const addX = x + r < w ? x + r : w - 1;
				const remX = x - r - 1 >= 0 ? x - r - 1 : 0;
				sum += src[row + addX] - src[row + remX];
				temp[row + x] = sum / (2 * r + 1);
			}
		}

		// Vertical pass
		for (let x = 0; x < w; x++) {
			let sum = 0;
			for (let y = -r; y <= r; y++) {
				const py = y < 0 ? 0 : y >= h ? h - 1 : y;
				sum += temp[py * w + x];
			}
			dst[x] = sum / (2 * r + 1);

			for (let y = 1; y < h; y++) {
				const addY = y + r < h ? y + r : h - 1;
				const remY = y - r - 1 >= 0 ? y - r - 1 : 0;
				sum += temp[addY * w + x] - temp[remY * w + x];
				dst[y * w + x] = sum / (2 * r + 1);
			}
		}
	}

	public filter(fullI: Float32Array, fullP: Float32Array, outQ: Float32Array): void {
		const w = this.w;
		const h = this.h;
		const sW = this.sW;
		const sH = this.sH;

		// Subsample I and P (factor of 2)
		for (let sy = 0; sy < sH; sy++) {
			const fy = sy << 1;
			const sRow = sy * sW;
			const fRow = fy * w;
			for (let sx = 0; sx < sW; sx++) {
				const fx = sx << 1;
				const iVal = fullI[fRow + fx];
				const pVal = fullP[fRow + fx];
				const sIdx = sRow + sx;
				this.sI[sIdx] = iVal;
				this.sP[sIdx] = pVal;
				this.sIp[sIdx] = iVal * pVal;
				this.sII[sIdx] = iVal * iVal;
			}
		}

		this.boxFilter(this.sI, this.meanI);
		this.boxFilter(this.sP, this.meanP);
		this.boxFilter(this.sIp, this.meanIp);
		this.boxFilter(this.sII, this.meanII);

		const sN = sW * sH;
		const eps = this.eps;
		for (let i = 0; i < sN; i++) {
			const mI = this.meanI[i];
			const mP = this.meanP[i];
			const varI = this.meanII[i] - mI * mI;
			const covIp = this.meanIp[i] - mI * mP;
			const aVal = covIp / (varI + eps);
			this.a[i] = aVal;
			this.b[i] = mP - aVal * mI;
		}

		this.boxFilter(this.a, this.meanA);
		this.boxFilter(this.b, this.meanB);

		// Bilinear upsample and evaluate q = meanA * I + meanB
		for (let fy = 0; fy < h; fy++) {
			const y0 = fy >> 1;
			const y1 = Math.min(y0 + 1, sH - 1);
			const ty = fy & 1 ? 0.5 : 0;
			const row0 = y0 * sW;
			const row1 = y1 * sW;
			const fRow = fy * w;

			for (let fx = 0; fx < w; fx++) {
				const x0 = fx >> 1;
				const x1 = Math.min(x0 + 1, sW - 1);
				const tx = fx & 1 ? 0.5 : 0;

				const a0 = this.meanA[row0 + x0] * (1 - tx) + this.meanA[row0 + x1] * tx;
				const a1 = this.meanA[row1 + x0] * (1 - tx) + this.meanA[row1 + x1] * tx;
				const aInterp = a0 * (1 - ty) + a1 * ty;

				const b0 = this.meanB[row0 + x0] * (1 - tx) + this.meanB[row0 + x1] * tx;
				const b1 = this.meanB[row1 + x0] * (1 - tx) + this.meanB[row1 + x1] * tx;
				const bInterp = b0 * (1 - ty) + b1 * ty;

				const q = aInterp * fullI[fRow + fx] + bInterp;
				outQ[fRow + fx] = q < 0 ? 0 : q > 1 ? 1 : q;
			}
		}
	}
}

/**
 * Adaptive exposure normalizer that analyzes scene luminance using a tiny 16x16 thumbnail.
 * In low light conditions, it dynamically calculates exposure and contrast boosts to condition
 * the input frame before neural network inference, preventing loss of edge definition around
 * hair, dark clothing, and shadowy backgrounds.
 */
class AdaptiveExposureNormalizer {
	private microCanvas: HTMLCanvasElement;
	private microCtx: CanvasRenderingContext2D | null;
	private smoothedLuminance = 128;
	private lastAnalysisTime = 0;
	public currentBrightness = 1.0;
	public currentContrast = 1.0;
	public isLowLight = false;

	constructor() {
		this.microCanvas = document.createElement('canvas');
		this.microCanvas.width = 16;
		this.microCanvas.height = 16;
		this.microCtx = this.microCanvas.getContext('2d', { willReadFrequently: true });
	}

	public update(source: CanvasImageSource, now: number): void {
		// Sample ~7 times per second (every 140ms) to conserve CPU cycles
		if (now - this.lastAnalysisTime < 140 || !this.microCtx) return;
		this.lastAnalysisTime = now;

		this.microCtx.drawImage(source, 0, 0, 16, 16);
		const data = this.microCtx.getImageData(0, 0, 16, 16).data;

		let totalLuma = 0;
		for (let i = 0; i < 1024; i += 4) {
			// Perceived luminance (ITU-R BT.601 formula)
			totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
		}
		const avgLuma = totalLuma / 256;

		// Exponential moving average for temporal stability (prevents exposure hunting/flickering)
		this.smoothedLuminance = this.smoothedLuminance * 0.82 + avgLuma * 0.18;

		// Low-light threshold: if scene average luminance falls below 85 (on a 0-255 scale)
		if (this.smoothedLuminance < 85) {
			this.isLowLight = true;
			const deficiency = (85 - this.smoothedLuminance) / 85; // 0.0 to 1.0
			this.currentBrightness = 1.0 + deficiency * 0.45; // Up to 1.45x boost
			this.currentContrast = 1.0 + deficiency * 0.25; // Up to 1.25x boost
		} else {
			this.isLowLight = false;
			this.currentBrightness = 1.0;
			this.currentContrast = 1.0;
		}
	}

	public getFilter(): string {
		if (this.currentBrightness > 1.02) {
			return `brightness(${this.currentBrightness.toFixed(2)}) contrast(${this.currentContrast.toFixed(2)})`;
		}
		return 'none';
	}
}

export class MediaPipeBackgroundProcessor {
	public width = MODEL_WIDTH;
	public height = MODEL_HEIGHT;

	private mode: BackgroundMode | null = null;
	private mirrorCamera = false;
	private hasFirstResult = false;
	private lastFrameTime = 0;

	// Input conditioning: adaptive exposure normalizer
	private exposureNormalizer = new AdaptiveExposureNormalizer();

	private videoElement: HTMLVideoElement | null = null;
	private inputStream: MediaStream | null = null;

	// Full-resolution camera frame downscaled/fit to width x height
	private inputCanvas: HTMLCanvasElement;
	private inputCtx: CanvasRenderingContext2D | null;

	// Cropped person ROI canvas sent to MediaPipe (dramatically improves effective resolution)
	private readonly roiWidth = 256;
	private readonly roiHeight = 256;
	private roiCanvas: HTMLCanvasElement;
	private roiCtx: CanvasRenderingContext2D | null;

	// Offscreen canvas where ROI segmentation mask is reprojected to full frame
	private maskCanvas: HTMLCanvasElement;
	private maskCtx: CanvasRenderingContext2D | null;

	// Background canvas for virtual background rendering and pixel extraction
	private bgCanvas: HTMLCanvasElement;
	private bgCtx: CanvasRenderingContext2D | null;

	// Offscreen foreground compositing canvas (holds decontaminated, light-wrapped foreground with soft alpha)
	private fgCanvas: HTMLCanvasElement;
	private fgCtx: CanvasRenderingContext2D | null;

	// Final output canvas
	public readonly outputCanvas: HTMLCanvasElement;
	private outCtx: CanvasRenderingContext2D | null;

	private selfieSegmentation: SelfieSegmentationModel | null = null;
	private initPromise: Promise<void> | null = null;
	private isRunning = false;
	private isProcessing = false;
	private animationFrameId: number | null = null;
	private outputStream: MediaStream | null = null;

	private loadedImages = new Map<BackgroundMode, HTMLImageElement>();

	// Dynamic ROI tracking for effective resolution
	private roi: RectROI = { x: 0, y: 0, w: MODEL_WIDTH, h: MODEL_HEIGHT };
	private pendingRoi: RectROI = { x: 0, y: 0, w: MODEL_WIDTH, h: MODEL_HEIGHT };
	private frameCount = 0;

	// Pre-allocated typed arrays for temporal stability & guided filter
	private guidedFilter: FastGuidedFilter | null = null;
	private prevMask: Float32Array | null = null;
	private tempMask: Float32Array | null = null;
	private guideLum: Float32Array | null = null;
	private refinedMask: Float32Array | null = null;
	private fgImageData: ImageData | null = null;
	private bgImageData: ImageData | null = null;
	private bgDirty = true;

	constructor() {
		this.inputCanvas = document.createElement('canvas');
		this.inputCanvas.width = this.width;
		this.inputCanvas.height = this.height;
		this.inputCtx = this.inputCanvas.getContext('2d', { willReadFrequently: true });

		this.roiCanvas = document.createElement('canvas');
		this.roiCanvas.width = this.roiWidth;
		this.roiCanvas.height = this.roiHeight;
		this.roiCtx = this.roiCanvas.getContext('2d');

		this.maskCanvas = document.createElement('canvas');
		this.maskCanvas.width = this.width;
		this.maskCanvas.height = this.height;
		this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true });

		this.bgCanvas = document.createElement('canvas');
		this.bgCanvas.width = this.width;
		this.bgCanvas.height = this.height;
		this.bgCtx = this.bgCanvas.getContext('2d', { willReadFrequently: true });

		this.fgCanvas = document.createElement('canvas');
		this.fgCanvas.width = this.width;
		this.fgCanvas.height = this.height;
		this.fgCtx = this.fgCanvas.getContext('2d', { willReadFrequently: true });

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

		this.initBuffers(this.width, this.height);

		// Preload background images directly from URLs
		this.preloadAllBackgrounds();
	}

	private initBuffers(width: number, height: number): void {
		const N = width * height;
		this.guidedFilter = new FastGuidedFilter(width, height, 4, 0.005);
		this.prevMask = new Float32Array(N);
		this.tempMask = new Float32Array(N);
		this.guideLum = new Float32Array(N);
		this.refinedMask = new Float32Array(N);
		if (this.fgCtx) {
			this.fgImageData = this.fgCtx.createImageData(width, height);
		}
		this.bgImageData = null;
		this.bgDirty = true;
		this.roi = { x: 0, y: 0, w: width, h: height };
		this.pendingRoi = { x: 0, y: 0, w: width, h: height };
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
						this.bgDirty = true;
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
				this.bgDirty = true;
				resolve(img);
			};
			img.onerror = () => {
				// Retry without crossOrigin if CORS rejected it
				const fallbackImg = new Image();
				fallbackImg.onload = () => {
					this.loadedImages.set(opt.id, fallbackImg);
					this.bgDirty = true;
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
		if (this.initPromise) return this.initPromise;

		this.initPromise = (async () => {
			try {
				await loadMediaPipeScripts();
				const SelfieSegmentationClass = (window as WindowWithMediaPipe).SelfieSegmentation;
				if (!SelfieSegmentationClass) {
					throw new Error('MediaPipe SelfieSegmentation is not available on window');
				}

				const cdnBase = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation';

				const instance = new SelfieSegmentationClass({
					locateFile: (file: string) => `${cdnBase}/${file}`
				});

				const isPortrait = this.height > this.width;
				instance.setOptions({
					modelSelection: isPortrait ? 0 : 1, // 0: General (square, best for mobile portrait), 1: Landscape (144x256, ultra-light)
					selfieMode: false
				});

				instance.onResults((results: SelfieSegmentationResults) => this.onResults(results));

				if (typeof instance.initialize === 'function') {
					await instance.initialize();
				}

				this.selfieSegmentation = instance;
			} catch (err) {
				this.initPromise = null;
				throw err;
			}
		})();

		return this.initPromise;
	}

	private async applyHardwareConstraints(track: MediaStreamTrack | undefined): Promise<void> {
		if (!track || typeof track.getCapabilities !== 'function' || typeof track.applyConstraints !== 'function') {
			return;
		}
		try {
			const capabilities = track.getCapabilities() as Record<string, unknown>;
			const advanced: Record<string, unknown> = {};

			if (Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes('continuous')) {
				advanced.exposureMode = 'continuous';
			}
			if (Array.isArray(capabilities.whiteBalanceMode) && capabilities.whiteBalanceMode.includes('continuous')) {
				advanced.whiteBalanceMode = 'continuous';
			}
			const expComp = capabilities.exposureCompensation as { min?: number; max?: number } | undefined;
			if (expComp && typeof expComp === 'object') {
				const min = expComp.min ?? 0;
				const max = expComp.max ?? 0;
				if (max > min) {
					// Subtle positive bias (+0.3 EV) to prevent dark underexposure in dim rooms
					advanced.exposureCompensation = Math.min(max, Math.max(min, 0.3));
				}
			}

			if (Object.keys(advanced).length > 0) {
				await track.applyConstraints({ advanced: [advanced] } as unknown as MediaTrackConstraints);
			}
		} catch {
			// Silently ignore if camera driver does not support hardware advanced exposure constraints
		}
	}

	public async start(inputStream: MediaStream, initialMode: BackgroundMode | null = null): Promise<MediaStream> {
		this.stop();
		this.inputStream = inputStream;
		this.mode = initialMode;
		this.isRunning = true;
		this.hasFirstResult = false;
		this.bgDirty = true;

		// Apply hardware ISP low-light optimization if supported by the camera device
		const videoTrack = inputStream.getVideoTracks()[0];
		if (videoTrack) {
			void this.applyHardwareConstraints(videoTrack);
		}

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
			this.bgDirty = true;
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
		// Edge softness is handled automatically by the smoothstep curve and Fast Guided Filter
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

		if (this.width !== targetW || this.height !== targetH || !this.guidedFilter) {
			const wasPortrait = this.height > this.width;
			this.width = targetW;
			this.height = targetH;

			this.inputCanvas.width = targetW;
			this.inputCanvas.height = targetH;

			this.maskCanvas.width = targetW;
			this.maskCanvas.height = targetH;

			this.bgCanvas.width = targetW;
			this.bgCanvas.height = targetH;

			this.fgCanvas.width = targetW;
			this.fgCanvas.height = targetH;

			this.outputCanvas.width = targetW;
			this.outputCanvas.height = targetH;
			this.outputCanvas.style.width = `${targetW}px`;
			this.outputCanvas.style.height = `${targetH}px`;

			this.initBuffers(targetW, targetH);

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
				// 1. Draw camera video frame to full-resolution inputCanvas with adaptive temporal denoising
				if (this.inputCtx) {
					// In low light, apply subtle temporal blend (alpha = 0.88) to suppress high-frequency CMOS sensor shot noise
					if (this.exposureNormalizer.isLowLight && this.hasFirstResult) {
						this.inputCtx.globalAlpha = 0.88;
						drawImageCover(this.inputCtx, video, video.videoWidth, video.videoHeight, this.width, this.height);
						this.inputCtx.globalAlpha = 1.0;
					} else {
						drawImageCover(this.inputCtx, video, video.videoWidth, video.videoHeight, this.width, this.height);
					}
				}

				// Update adaptive exposure normalizer using the latest input frame
				this.exposureNormalizer.update(this.inputCanvas, now);

				// 2. Crop ROI for inference with exposure normalization and bilinear anti-aliasing
				this.frameCount++;
				// Periodic keyframe pass (every 60 frames ~ 2s) to check full frame in case a new person entered
				let sendRoi = this.roi;
				if (this.frameCount % 60 === 0) {
					sendRoi = { x: 0, y: 0, w: this.width, h: this.height };
				}
				this.pendingRoi = { ...sendRoi };

				if (this.roiCtx && this.inputCanvas) {
					this.roiCtx.imageSmoothingEnabled = true;
					this.roiCtx.imageSmoothingQuality = 'medium';

					// Apply exposure normalization specifically for the neural network input
					const filter = this.exposureNormalizer.getFilter();
					this.roiCtx.filter = filter;

					this.roiCtx.drawImage(this.inputCanvas, sendRoi.x, sendRoi.y, sendRoi.w, sendRoi.h, 0, 0, this.roiWidth, this.roiHeight);

					this.roiCtx.filter = 'none';
				}

				const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('MediaPipe inference timeout')), 5000));
				await Promise.race([this.selfieSegmentation.send({ image: this.roiCanvas }), timeoutPromise]);
			} catch (err) {
				console.warn('MediaPipe send error or timeout:', err);
				this.isProcessing = false;
			}
		}

		if (this.isRunning) {
			this.animationFrameId = requestAnimationFrame(this.loop);
		}
	};

	private ensureBgImageData(): void {
		if (!this.bgDirty && this.bgImageData) return;
		if (!this.bgCtx) return;

		this.bgCtx.clearRect(0, 0, this.width, this.height);
		const bgImg = this.mode ? this.loadedImages.get(this.mode) : null;
		if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
			drawImageCover(this.bgCtx, bgImg, bgImg.naturalWidth, bgImg.naturalHeight, this.width, this.height);
		} else {
			const grad = this.bgCtx.createLinearGradient(0, 0, this.width, this.height);
			grad.addColorStop(0, '#1e293b');
			grad.addColorStop(1, '#0f172a');
			this.bgCtx.fillStyle = grad;
			this.bgCtx.fillRect(0, 0, this.width, this.height);
		}
		this.bgImageData = this.bgCtx.getImageData(0, 0, this.width, this.height);
		this.bgDirty = false;
	}

	private updateRoiFromBoundingBox(minX: number, maxX: number, minY: number, maxY: number, fgSampleCount: number): void {
		const W = this.width;
		const H = this.height;

		if (fgSampleCount < 20 || minX >= maxX || minY >= maxY) {
			// Person not detected or left the view: reset to full frame
			this.roi = { x: 0, y: 0, w: W, h: H };
			return;
		}

		// If foreground touches boundaries of the pending crop box, expand immediately to avoid clipping
		const touchMargin = 8;
		if (
			minX <= this.pendingRoi.x + touchMargin ||
			maxX >= this.pendingRoi.x + this.pendingRoi.w - touchMargin ||
			minY <= this.pendingRoi.y + touchMargin ||
			maxY >= this.pendingRoi.y + this.pendingRoi.h - touchMargin
		) {
			this.roi = { x: 0, y: 0, w: W, h: H };
			return;
		}

		const boxW = maxX - minX;
		const boxH = maxY - minY;
		const marginX = Math.round(boxW * 0.2);
		const marginYTop = Math.round(boxH * 0.25);
		const marginYBottom = Math.round(boxH * 0.2);

		let targetX = Math.max(0, minX - marginX);
		let targetY = Math.max(0, minY - marginYTop);
		let targetW = Math.min(W - targetX, boxW + marginX * 2);
		let targetH = Math.min(H - targetY, boxH + marginYTop + marginYBottom);

		// Minimum crop dimensions (at least 40% of frame dimensions)
		const minW = Math.round(W * 0.4);
		const minH = Math.round(H * 0.4);
		if (targetW < minW) {
			const diff = minW - targetW;
			targetX = Math.max(0, targetX - Math.round(diff / 2));
			targetW = Math.min(W - targetX, minW);
		}
		if (targetH < minH) {
			const diff = minH - targetH;
			targetY = Math.max(0, targetY - Math.round(diff / 2));
			targetH = Math.min(H - targetY, minH);
		}

		// Smooth ROI transitions using EMA to prevent jittery crop boxes
		this.roi = {
			x: Math.round(this.roi.x * 0.7 + targetX * 0.3),
			y: Math.round(this.roi.y * 0.7 + targetY * 0.3),
			w: Math.round(this.roi.w * 0.7 + targetW * 0.3),
			h: Math.round(this.roi.h * 0.7 + targetH * 0.3)
		};

		// Clamp within bounds
		if (this.roi.x < 0) this.roi.x = 0;
		if (this.roi.y < 0) this.roi.y = 0;
		if (this.roi.x + this.roi.w > W) this.roi.w = W - this.roi.x;
		if (this.roi.y + this.roi.h > H) this.roi.h = H - this.roi.y;
	}

	private onResults(results: SelfieSegmentationResults): void {
		if (!this.outCtx || !this.fgCtx || !this.inputCtx || !this.maskCtx || !this.bgCtx) {
			this.isProcessing = false;
			return;
		}

		if (!this.mode) {
			this.isProcessing = false;
			return;
		}

		this.hasFirstResult = true;

		const W = this.width;
		const H = this.height;
		const N = W * H;

		if (!this.prevMask || !this.tempMask || !this.guideLum || !this.refinedMask || !this.guidedFilter || !this.fgImageData) {
			this.isProcessing = false;
			return;
		}

		// 1. Reproject ROI segmentation mask back onto full-frame mask canvas
		this.maskCtx.clearRect(0, 0, W, H);
		this.maskCtx.drawImage(
			results.segmentationMask,
			0,
			0,
			this.roiWidth,
			this.roiHeight,
			this.pendingRoi.x,
			this.pendingRoi.y,
			this.pendingRoi.w,
			this.pendingRoi.h
		);

		const maskImageData = this.maskCtx.getImageData(0, 0, W, H);
		const rawMaskBytes = maskImageData.data;

		const camImageData = this.inputCtx.getImageData(0, 0, W, H);
		const camBytes = camImageData.data;

		// Ensure background image is loaded and rendered to bgCanvas
		this.ensureBgImageData();
		const bgBytes = this.bgImageData ? this.bgImageData.data : null;

		// 2. Soft probability mapping via Smoothstep curve & Bounding box extraction
		let minX = W;
		let maxX = 0;
		let minY = H;
		let maxY = 0;
		let fgSampleCount = 0;

		for (let i = 0; i < N; i++) {
			const pIdx = i * 4;
			// Probability is stored in red channel (or alpha channel depending on backend)
			const rawProb = Math.max(rawMaskBytes[pIdx], rawMaskBytes[pIdx + 3]);
			const softProb = SMOOTHSTEP_LUT[rawProb] / 255.0;
			this.tempMask[i] = softProb;

			// Sample bounding box on 4x4 grid for fast ROI tracking
			const x = i % W;
			const y = (i / W) | 0;
			if ((x & 3) === 0 && (y & 3) === 0 && softProb > 0.25) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
				fgSampleCount++;
			}
		}

		// Update ROI for next frame based on foreground bounding box + margins
		this.updateRoiFromBoundingBox(minX, maxX, minY, maxY, fgSampleCount);

		// 3. Temporal Stability: Confidence & Motion Aware EMA Smoothing
		// Note on recurrent architecture:
		// Google Meet's segmentation model feeds the previous frame's mask tensor directly into
		// the neural network as an extra input channel (recurrent segmentation). Off-the-shelf
		// MediaPipe SelfieSegmentation JS model accepts only a 3-channel RGB image without
		// retraining. We achieve rock-solid temporal stability by:
		// (a) Dynamically tracking the person's ROI from the previous mask.
		// (b) Applying adaptive EMA temporal smoothing with higher weights where confident
		//     and lower weights at edges and motion to eliminate "boiling" edge jitter.
		const prevMask = this.prevMask;
		const tempMask = this.tempMask;
		const guideLum = this.guideLum;

		for (let i = 0; i < N; i++) {
			const curr = tempMask[i];
			const prev = prevMask[i];

			// Confidence: near 1.0 for solid background or foreground, near 0.0 at edge boundary (curr ~ 0.5)
			const conf = Math.abs(2.0 * curr - 1.0);
			// Motion: frame-to-frame probability change
			const motion = Math.abs(curr - prev);

			// Adaptive EMA blend weight: higher where mask is confident, lower at edges and motion
			let alphaEma = 0.4 + 0.5 * conf - 0.25 * motion;
			if (alphaEma < 0.2) alphaEma = 0.2;
			if (alphaEma > 0.9) alphaEma = 0.9;

			const smoothed = alphaEma * curr + (1.0 - alphaEma) * prev;
			prevMask[i] = smoothed;
			tempMask[i] = smoothed;

			// Guidance image: camera frame luminance
			const pIdx = i * 4;
			guideLum[i] = (0.299 * camBytes[pIdx] + 0.587 * camBytes[pIdx + 1] + 0.114 * camBytes[pIdx + 2]) / 255.0;
		}

		// 4. Upsample low-res mask with Fast Guided Filter using full-res camera frame as guide
		this.guidedFilter.filter(guideLum, tempMask, this.refinedMask);

		// 5. Compositing: Edge Color Decontamination & Light Wrap
		const refinedMask = this.refinedMask;
		const fgImageData = this.fgImageData;
		const fgBytes = fgImageData.data;

		for (let y = 0; y < H; y++) {
			const row = y * W;
			for (let x = 0; x < W; x++) {
				const idx = row + x;
				const a = refinedMask[idx];
				const pIdx = idx * 4;

				if (a <= 0.01) {
					// Background: completely transparent
					fgBytes[pIdx] = 0;
					fgBytes[pIdx + 1] = 0;
					fgBytes[pIdx + 2] = 0;
					fgBytes[pIdx + 3] = 0;
					continue;
				}

				if (a >= 0.99) {
					// Solid foreground: full opacity
					fgBytes[pIdx] = camBytes[pIdx];
					fgBytes[pIdx + 1] = camBytes[pIdx + 1];
					fgBytes[pIdx + 2] = camBytes[pIdx + 2];
					fgBytes[pIdx + 3] = 255;
					continue;
				}

				// --- Edge Transition Zone (0.01 < a < 0.99) ---
				// 5a. Edge Color Decontamination:
				// Sample inward along mask gradient to suppress old room background color bleed
				const xPrev = x > 0 ? idx - 1 : idx;
				const xNext = x < W - 1 ? idx + 1 : idx;
				const yPrev = y > 0 ? idx - W : idx;
				const yNext = y < H - 1 ? idx + W : idx;

				const gx = refinedMask[xNext] - refinedMask[xPrev];
				const gy = refinedMask[yNext] - refinedMask[yPrev];

				const stepX = Math.round(gx * 3);
				const stepY = Math.round(gy * 3);
				const inX = Math.max(0, Math.min(W - 1, x + stepX));
				const inY = Math.max(0, Math.min(H - 1, y + stepY));
				const inPIdx = (inY * W + inX) * 4;

				const deconW = (1.0 - a) * 0.5;
				const rFg = camBytes[pIdx] * (1.0 - deconW) + camBytes[inPIdx] * deconW;
				const gFg = camBytes[pIdx + 1] * (1.0 - deconW) + camBytes[inPIdx + 1] * deconW;
				const bFg = camBytes[pIdx + 2] * (1.0 - deconW) + camBytes[inPIdx + 2] * deconW;

				// 5b. Light Wrap:
				// Bleed ambient illumination from virtual background around the foreground silhouette
				let rBg = 0;
				let gBg = 0;
				let bBg = 0;
				if (bgBytes) {
					const bgX = this.mirrorCamera ? W - 1 - x : x;
					const bgPIdx = (y * W + bgX) * 4;
					rBg = bgBytes[bgPIdx];
					gBg = bgBytes[bgPIdx + 1];
					bBg = bgBytes[bgPIdx + 2];
				}

				const rimEdge = 4.0 * a * (1.0 - a);
				const wrapW = 0.18 * rimEdge;
				const rWrap = rFg * (1.0 - wrapW) + rBg * wrapW;
				const gWrap = gFg * (1.0 - wrapW) + gBg * wrapW;
				const bWrap = bFg * (1.0 - wrapW) + bBg * wrapW;

				fgBytes[pIdx] = rWrap | 0;
				fgBytes[pIdx + 1] = gWrap | 0;
				fgBytes[pIdx + 2] = bWrap | 0;
				fgBytes[pIdx + 3] = (a * 255.0) | 0;
			}
		}

		this.fgCtx.putImageData(fgImageData, 0, 0);

		// 6. Draw Virtual Background and composite Foreground onto outputCanvas
		this.outCtx.save();
		this.outCtx.clearRect(0, 0, W, H);
		this.outCtx.drawImage(this.bgCanvas, 0, 0, W, H);

		if (this.mirrorCamera) {
			this.outCtx.translate(W, 0);
			this.outCtx.scale(-1, 1);
		}
		this.outCtx.drawImage(this.fgCanvas, 0, 0, W, H);
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
		this.initPromise = null;
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
		this.prevMask = null;
		this.tempMask = null;
		this.guideLum = null;
		this.refinedMask = null;
		this.fgImageData = null;
		this.bgImageData = null;
		this.guidedFilter = null;
	}
}
