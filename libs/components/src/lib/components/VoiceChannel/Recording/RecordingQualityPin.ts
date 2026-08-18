import type { RemoteTrackPublication, RemoteVideoTrack } from 'livekit-client';
import { VideoQuality } from 'livekit-client';

export interface QualityPinRequest {
	key: string;
	publication: RemoteTrackPublication;
	width: number;
	height: number;
}

interface PinEntry {
	element: HTMLVideoElement;
	track: RemoteVideoTrack;
	publication: RemoteTrackPublication;
	previousQuality: VideoQuality;
	width: number;
	height: number;
}

/**
 * Deliberately no `overflow:hidden` and no `contain`. LiveKit decides a track is
 * visible with `elementInfos.some((info) => info.visible)`, fed by an
 * IntersectionObserver — which is geometric. Clipping the host would shrink the
 * pinned elements' visible rect to nothing, and a participant with no on-screen
 * tile (paginated away) would then have *no* visible element at all and get its
 * track paused — exactly the case this pin exists to keep alive. A zero-sized host
 * lets the absolutely-positioned children overflow it, unclipped, at the top-left
 * of the viewport; `opacity:0` keeps them off the screen for the user.
 */
const HOST_STYLE = ['position:fixed', 'left:0', 'top:0', 'width:0', 'height:0', 'opacity:0', 'pointer-events:none', 'z-index:-2147483648'].join(';');

/**
 * The room runs with `adaptiveStream: true`, so LiveKit subscribes to the simulcast
 * layer that fits the *on-screen* tile — often 180p for a grid cell. The recorder
 * composites into a 720p/1080p canvas, so that layer arrives upscaled and mushy.
 *
 * `setVideoDimensions()` cannot fix this on its own: `emitTrackUpdate` takes the
 * **smaller** of the requested and the adaptive-stream dimensions, so the small tile
 * still wins. The only lever that raises the adaptive value itself is an attached
 * element — `updateDimensions()` takes the max across all of them. So while
 * recording we attach an extra hidden video element sized to the tile's size in the
 * recorded frame, and drop it again when recording stops.
 */
export class RecordingQualityPin {
	private host: HTMLDivElement | null = null;
	private readonly entries = new Map<string, PinEntry>();

	sync(requests: QualityPinRequest[]): void {
		const wanted = new Map(requests.map((request) => [request.key, request]));

		for (const [key, entry] of Array.from(this.entries)) {
			const request = wanted.get(key);
			if (!request || request.publication.trackSid !== entry.publication.trackSid) {
				this.release(key);
			}
		}

		for (const request of requests) {
			const track = request.publication.track as RemoteVideoTrack | undefined;
			if (!track || typeof track.attach !== 'function') continue;

			const existing = this.entries.get(request.key);
			if (existing) {
				this.resize(existing, request.width, request.height);
				continue;
			}

			const element = document.createElement('video');
			element.muted = true;
			element.autoplay = true;
			element.playsInline = true;
			element.setAttribute('aria-hidden', 'true');
			this.getHost().appendChild(element);

			const entry: PinEntry = {
				element,
				track,
				publication: request.publication,
				previousQuality: request.publication.videoQuality ?? VideoQuality.HIGH,
				width: 0,
				height: 0
			};
			this.resize(entry, request.width, request.height);

			try {
				track.attach(element);
				// Undoes any sticky LOW left behind by useLowCPUOptimizer.
				request.publication.setVideoQuality(VideoQuality.HIGH);
				this.entries.set(request.key, entry);
			} catch (error) {
				console.error('[recording] failed to pin track quality', request.key, error);
				element.remove();
			}
		}
	}

	releaseAll(): void {
		for (const key of Array.from(this.entries.keys())) {
			this.release(key);
		}
		this.host?.remove();
		this.host = null;
	}

	private resize(entry: PinEntry, width: number, height: number): void {
		if (entry.width === width && entry.height === height) return;
		entry.width = width;
		entry.height = height;
		entry.element.style.cssText = `position:absolute;left:0;top:0;width:${width}px;height:${height}px`;
	}

	private release(key: string): void {
		const entry = this.entries.get(key);
		if (!entry) return;
		this.entries.delete(key);
		try {
			entry.track.detach(entry.element);
			entry.publication.setVideoQuality(entry.previousQuality);
		} catch {
			/* track already gone */
		}
		entry.element.srcObject = null;
		entry.element.remove();
	}

	private getHost(): HTMLDivElement {
		if (!this.host) {
			this.host = document.createElement('div');
			this.host.setAttribute('aria-hidden', 'true');
			this.host.style.cssText = HOST_STYLE;
			document.body.appendChild(this.host);
		}
		return this.host;
	}
}

/**
 * Roughly how big this tile will be in the recorded frame. Only needs to be close:
 * it picks between simulcast layers, which are coarse (180p / 360p / 720p).
 */
export function estimateRecordingTileSize(
	frameWidth: number,
	frameHeight: number,
	tileCount: number,
	isFocused: boolean,
	hasFocus: boolean
): { width: number; height: number } {
	if (isFocused) {
		return { width: frameWidth, height: frameHeight };
	}
	if (hasFocus) {
		const height = Math.round(frameHeight * 0.17);
		return { width: Math.round((height * 16) / 9), height };
	}
	const columns = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, tileCount))));
	const rows = Math.max(1, Math.ceil(tileCount / columns));
	return { width: Math.round(frameWidth / columns), height: Math.round(frameHeight / rows) };
}
