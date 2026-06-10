export const MAX_VIDEO_POSTER_EDGE = 480;
const JPEG_QUALITY = 0.82;
const POSTER_CAPTURE_TIMEOUT_MS = 3000;
const METADATA_LOAD_TIMEOUT_MS = 5000;

export type VideoPosterCaptureResult = {
	width: number;
	height: number;
	posterUrl?: string;
	posterBlob?: Blob;
};

function scaleDimensions(width: number, height: number, maxEdge: number): { width: number; height: number } {
	if (!width || !height || Math.max(width, height) <= maxEdge) {
		return { width: width || maxEdge, height: height || maxEdge };
	}
	const scale = maxEdge / Math.max(width, height);
	return {
		width: Math.round(width * scale),
		height: Math.round(height * scale)
	};
}

export function capturePosterFromVideoElement(video: HTMLVideoElement): Promise<Blob | undefined> {
	return new Promise((resolve, reject) => {
		const seekTarget = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(video.duration, 1) : 0;

		const timeout = window.setTimeout(() => resolve(undefined), POSTER_CAPTURE_TIMEOUT_MS);

		const cleanup = () => {
			window.clearTimeout(timeout);
			video.onseeked = null;
			video.onerror = null;
		};

		video.onerror = () => {
			cleanup();
			reject(new Error('Video poster capture failed'));
		};

		video.onseeked = () => {
			cleanup();
			if (!video.videoWidth || !video.videoHeight) {
				resolve(undefined);
				return;
			}

			const { width, height } = scaleDimensions(video.videoWidth, video.videoHeight, MAX_VIDEO_POSTER_EDGE);
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve(undefined);
				return;
			}
			ctx.drawImage(video, 0, 0, width, height);
			canvas.toBlob((blob) => resolve(blob ?? undefined), 'image/jpeg', JPEG_QUALITY);
		};

		video.currentTime = seekTarget;
	});
}

export async function captureVideoPosterFromUrl(objectUrl: string): Promise<VideoPosterCaptureResult> {
	const video = document.createElement('video');
	video.muted = true;
	video.playsInline = true;
	video.preload = 'metadata';

	try {
		await new Promise<void>((resolve, reject) => {
			const timeout = window.setTimeout(() => {
				cleanup();
				reject(new Error('Timed out loading video metadata'));
			}, METADATA_LOAD_TIMEOUT_MS);

			const cleanup = () => {
				window.clearTimeout(timeout);
				video.onloadedmetadata = null;
				video.onerror = null;
			};

			video.onloadedmetadata = () => {
				cleanup();
				resolve();
			};
			video.onerror = () => {
				cleanup();
				reject(new Error('Failed to load video metadata'));
			};
			video.src = objectUrl;
		});

		const width = video.videoWidth;
		const height = video.videoHeight;
		let posterBlob: Blob | undefined;

		try {
			posterBlob = await capturePosterFromVideoElement(video);
		} catch {
			posterBlob = undefined;
		}

		return {
			width,
			height,
			posterBlob,
			posterUrl: posterBlob ? URL.createObjectURL(posterBlob) : undefined
		};
	} catch {
		return { width: 0, height: 0 };
	} finally {
		video.removeAttribute('src');
		video.load();
	}
}
