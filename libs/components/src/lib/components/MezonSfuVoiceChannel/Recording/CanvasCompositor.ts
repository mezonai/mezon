import type { RecordingDrawItem } from './renderRecordingFrame';
import { renderRecordingFrame } from './renderRecordingFrame';
import type { RecordingCompositor, WorkerSceneTile } from './types';

interface VideoEntry {
	element: HTMLVideoElement;
	sourceId: string;
}

export class CanvasCompositor implements RecordingCompositor {
	private readonly canvas: HTMLCanvasElement;
	private readonly ctx: CanvasRenderingContext2D;
	private readonly stream: MediaStream;
	private readonly videos = new Map<string, VideoEntry>();
	private readonly avatars = new Map<string, ImageBitmap>();
	private readonly host: HTMLDivElement;
	private readonly frameInterval: number;

	private tiles: WorkerSceneTile[] = [];
	private rafId = 0;
	private lastDrawAt = 0;
	private stopped = false;

	onVisibilityDegraded?: () => void;

	constructor(width: number, height: number, fps: number) {
		this.frameInterval = 1000 / fps;

		this.canvas = document.createElement('canvas');
		this.canvas.width = width;
		this.canvas.height = height;

		const ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
		if (!ctx) {
			throw new Error('2d context unavailable');
		}
		this.ctx = ctx;

		this.host = document.createElement('div');
		this.host.setAttribute('aria-hidden', 'true');
		this.host.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1';
		document.body.appendChild(this.host);

		this.stream = this.canvas.captureStream(fps);
		document.addEventListener('visibilitychange', this.handleVisibilityChange);
		this.rafId = requestAnimationFrame(this.loop);
	}

	get track(): MediaStreamTrack {
		return this.stream.getVideoTracks()[0];
	}

	setVideoSources(next: Map<string, MediaStreamTrack>): void {
		if (this.stopped) return;

		for (const [key, entry] of Array.from(this.videos)) {
			const incoming = next.get(key);
			if (!incoming || incoming.id !== entry.sourceId) {
				this.dropVideo(key);
			}
		}

		for (const [key, track] of next) {
			if (this.videos.has(key) || track.readyState !== 'live') continue;
			const element = document.createElement('video');
			element.muted = true;
			element.autoplay = true;
			element.playsInline = true;
			element.srcObject = new MediaStream([track]);
			this.host.appendChild(element);
			element.play().catch(() => {
				/* resumes on its own once frames arrive */
			});
			this.videos.set(key, { element, sourceId: track.id });
		}
	}

	setScene(tiles: WorkerSceneTile[]): void {
		this.tiles = tiles;
	}

	setAvatar(key: string, bitmap: ImageBitmap): void {
		if (this.stopped) {
			bitmap.close();
			return;
		}
		this.avatars.get(key)?.close();
		this.avatars.set(key, bitmap);
	}

	private handleVisibilityChange = () => {
		if (document.hidden && !this.stopped) {
			this.onVisibilityDegraded?.();
		}
	};

	private loop = (timestamp: number) => {
		if (this.stopped) return;
		this.rafId = requestAnimationFrame(this.loop);

		if (timestamp - this.lastDrawAt < this.frameInterval - 1) return;
		this.lastDrawAt = timestamp;

		const items: RecordingDrawItem[] = this.tiles.map((tile) => {
			const video = tile.videoKey ? this.videos.get(tile.videoKey)?.element : undefined;
			const ready = video && video.readyState >= 2 && video.videoWidth > 0;
			return {
				image: ready ? video : null,
				imageWidth: ready ? video.videoWidth : 0,
				imageHeight: ready ? video.videoHeight : 0,
				avatar: tile.avatarKey ? (this.avatars.get(tile.avatarKey) ?? null) : null,
				label: tile.label,
				initial: tile.initial,
				accent: tile.accent,
				focused: tile.focused,
				contain: tile.contain,
				speaking: tile.speaking
			};
		});

		renderRecordingFrame(this.ctx, this.canvas.width, this.canvas.height, items);
	};

	private dropVideo(key: string): void {
		const entry = this.videos.get(key);
		if (!entry) return;
		this.videos.delete(key);
		entry.element.srcObject = null;
		entry.element.remove();
	}

	async stop(): Promise<void> {
		if (this.stopped) return;
		this.stopped = true;

		cancelAnimationFrame(this.rafId);
		document.removeEventListener('visibilitychange', this.handleVisibilityChange);

		for (const key of Array.from(this.videos.keys())) {
			this.dropVideo(key);
		}
		for (const bitmap of this.avatars.values()) {
			bitmap.close();
		}
		this.avatars.clear();
		this.host.remove();

		this.stream.getTracks().forEach((track) => track.stop());
	}
}
