import { getStore, voiceActions } from '@mezon/store';
import { AudioMixer } from './AudioMixer';
import { CanvasCompositor } from './CanvasCompositor';
import type { RecordingSink } from './RecordingSink';
import {
	BLOB_SINK_MAX_BYTES,
	BLOB_SINK_MAX_DURATION_MS,
	RecordingCancelledError,
	buildRecordingFileName,
	createRecordingSink
} from './RecordingSink';
import { WorkerCompositor } from './WorkerCompositor';
import { detectRecorderCapabilities } from './capabilities';
import { accentColorFor } from './renderRecordingFrame';
import type {
	RecordingAudioSource,
	RecordingCompositor,
	RecordingPipeline,
	RecordingResult,
	RecordingSceneTile,
	RecordingStatus,
	WorkerSceneTile
} from './types';

/**
 * Every source in this app tops out at 720p: screen share is captured with
 * `VideoPresets.h720` (ScreenShareControl.tsx:68, simulcast off) and cameras use
 * LiveKit's h720 default — 640x360 on the external meeting page. Recording into a
 * larger canvas would only upscale. Raise this if those capture presets ever do.
 */
const FRAME_SIZE = { width: 1280, height: 720 };
const VIDEO_BITRATE_CAMERA = 3_500_000;
/** Shared text survives far worse than faces at the same resolution. */
const VIDEO_BITRATE_SCREEN = 5_500_000;

const WORKER_FPS = 30;
/** The fallback composites on the main thread, so it trades frames for smoothness. */
const CANVAS_FPS = 24;
const TIMESLICE_MS = 2000;
const AUDIO_BITRATE = 128_000;
const MAX_TILES = 16;
const AVATAR_SIZE = 160;

/**
 * The subset of tiles that actually reaches the canvas. Exported because the quality
 * pin has to agree with it exactly: pinning a track that is never drawn keeps a
 * hidden decoder alive for nothing, and sizing the pin from the full participant
 * count would ask for a layer far smaller than the tile it ends up filling.
 */
export function selectRecordingTiles(tiles: RecordingSceneTile[]): RecordingSceneTile[] {
	if (tiles.length <= MAX_TILES) return tiles;

	const focused = tiles.filter((tile) => tile.focused);
	const rest = tiles.filter((tile) => !tile.focused);
	rest.sort((a, b) => Number(!!b.videoTrack) - Number(!!a.videoTrack));
	return [...focused, ...rest].slice(0, MAX_TILES);
}

export interface StartRecordingOptions {
	channelLabel?: string;
}

export const RECORDING_FRAME_SIZE = FRAME_SIZE;

export type RecorderEvent =
	| { type: 'started' }
	| { type: 'finished'; result: RecordingResult }
	| { type: 'error'; message: string }
	| { type: 'cancelled' };

type RecorderListener = (event: RecorderEvent) => void;

/** What the mounted call layout can tell the recorder about the room, on demand. */
export interface RecordingSource {
	scene: () => RecordingSceneTile[];
	audio: () => RecordingAudioSource[];
}

/** Avatars are fetched once per URL and re-decoded per session (bitmaps are transferred). */
const avatarBlobCache = new Map<string, Promise<Blob>>();
const avatarFailures = new Set<string>();

/**
 * LOCAL DEV ONLY. imgproxy answers with a hard-coded `Access-Control-Allow-Origin:
 * https://mezon.ai` — it does not echo the caller's origin — so from 127.0.0.1 no
 * avatar can ever be read into a canvas. The dev server proxies `/imgproxy-cors`
 * to it (apps/chat/vite.config.ts), which makes the request same-origin and drops
 * CORS out of the picture. On mezon.ai the direct fetch already passes, so this
 * path never runs in production.
 */
function toDevProxyUrl(url: string): string | null {
	if (typeof window === 'undefined') return null;

	const { hostname, origin } = window.location;
	if (hostname !== 'localhost' && hostname !== '127.0.0.1') return null;

	const match = /^https?:\/\/([^/]+)(\/.*)$/.exec(url);
	if (!match) return null;

	const [, host, rest] = match;
	if (!host.includes('imgproxy') || url.startsWith(origin)) return null;

	return `/imgproxy-cors${rest}`;
}

/**
 * The bitmap ends up on a canvas we read pixels back from, so the image has to
 * arrive CORS-clean — a tainted canvas makes `new VideoFrame(canvas)` throw and
 * would kill the whole recording. Hence the attempts below, and a plain initial
 * circle if every one of them is refused rather than a broken file.
 */
async function loadAvatarBitmap(url: string, size: number): Promise<ImageBitmap | null> {
	if (avatarFailures.has(url)) return null;

	const options: ImageBitmapOptions = { resizeWidth: size, resizeHeight: size, resizeQuality: 'medium' };
	const candidates = [url, toDevProxyUrl(url)].filter(Boolean) as string[];

	for (const candidate of candidates) {
		try {
			let pending = avatarBlobCache.get(candidate);
			if (!pending) {
				pending = fetch(candidate, { mode: 'cors', credentials: 'omit' }).then((response) => {
					if (!response.ok) throw new Error(`avatar ${response.status}`);
					return response.blob();
				});
				avatarBlobCache.set(candidate, pending);
			}
			return await createImageBitmap(await pending, options);
		} catch {
			avatarBlobCache.delete(candidate);
		}
	}

	try {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.decoding = 'async';
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new Error('avatar image load failed'));
			image.src = url;
		});
		return await createImageBitmap(image, options);
	} catch {
		avatarFailures.add(url);
		console.warn(
			'[recording] avatar is not CORS-readable, falling back to initials. The image host must send an Access-Control-Allow-Origin that matches this origin:',
			url
		);
		return null;
	}
}

/**
 * Owns the whole recording lifecycle. A singleton rather than React state because
 * the ControlBar button must be able to start it inside a click handler (the save
 * picker needs user activation) while the layout keeps feeding it scene updates.
 */
class CallRecorderEngine {
	private status: RecordingStatus = 'idle';
	private compositor: RecordingCompositor | null = null;
	private mixer: AudioMixer | null = null;
	private recorder: MediaRecorder | null = null;
	private sink: RecordingSink | null = null;
	private stream: MediaStream | null = null;
	private startedAt = 0;
	private deadlineTimer: number | null = null;

	private tiles: RecordingSceneTile[] = [];
	private sceneSignature = '';
	private audioSources: RecordingAudioSource[] = [];
	private readonly sentAvatars = new Set<string>();
	private readonly listeners = new Set<RecorderListener>();
	private startPromise: Promise<boolean> | null = null;
	private stopPromise: Promise<void> | null = null;
	private source: RecordingSource | null = null;
	/** Survives `finish()` so a recorder failure is not overwritten by a clean stop. */
	private pendingError: string | null = null;

	get isRecording(): boolean {
		return this.status === 'recording' || this.status === 'starting';
	}

	/**
	 * The layout registers itself here instead of pushing on every render. Scene and
	 * audio are then *pulled* at start, which lets the layout skip building them
	 * entirely while idle — the common case, and one that sits on the active-speaker
	 * render path.
	 */
	setSource(source: RecordingSource): () => void {
		this.source = source;
		return () => {
			if (this.source === source) {
				this.source = null;
			}
		};
	}

	/** Capture resolution; the quality pin sizes its hint elements from it. */
	get frameSize(): { width: number; height: number } {
		return FRAME_SIZE;
	}

	subscribe(listener: RecorderListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private emit(event: RecorderEvent): void {
		this.listeners.forEach((listener) => listener(event));
	}

	private patchStore(patch: Record<string, unknown>): void {
		getStore().dispatch(voiceActions.setRecordingState(patch));
	}

	/** Must run inside a user gesture — `showSaveFilePicker` needs the activation. */
	async start(options: StartRecordingOptions = {}): Promise<boolean> {
		if (this.status !== 'idle') return false;

		this.startPromise = this.beginRecording(options);
		try {
			return await this.startPromise;
		} finally {
			this.startPromise = null;
		}
	}

	/**
	 * Feature detection picks the worker path, but construction can still fail on a
	 * machine where the features are present — a blob worker refused by CSP, an
	 * OffscreenCanvas that will not allocate. Canvas compositing is a real fallback,
	 * and by this point the user has already chosen where to save, so degrading beats
	 * failing.
	 */
	private createCompositor(preferred: RecordingPipeline): { compositor: RecordingCompositor; pipeline: RecordingPipeline } {
		if (preferred === 'worker') {
			try {
				return { compositor: new WorkerCompositor(FRAME_SIZE.width, FRAME_SIZE.height, WORKER_FPS), pipeline: 'worker' };
			} catch (error) {
				console.warn('[recording] worker pipeline unavailable, falling back to canvas', error);
			}
		}

		const canvasCompositor = new CanvasCompositor(FRAME_SIZE.width, FRAME_SIZE.height, CANVAS_FPS);
		canvasCompositor.onVisibilityDegraded = () => this.patchStore({ degraded: true });
		return { compositor: canvasCompositor, pipeline: 'canvas' };
	}

	private async beginRecording(options: StartRecordingOptions): Promise<boolean> {
		const capabilities = detectRecorderCapabilities();

		if (!capabilities.supported || !capabilities.codec) {
			this.patchStore({ status: 'error', error: capabilities.reason || 'unsupported' });
			this.emit({ type: 'error', message: capabilities.reason || 'unsupported' });
			return false;
		}

		this.status = 'starting';
		this.pendingError = null;
		this.patchStore({
			status: 'starting',
			error: null,
			degraded: false,
			pipeline: capabilities.pipeline,
			streamingToDisk: capabilities.streamingToDisk
		});

		const { mimeType, extension } = capabilities.codec;
		const fileName = buildRecordingFileName(options.channelLabel, extension);

		try {
			this.sink = await createRecordingSink(fileName, mimeType, extension);
		} catch (error) {
			this.status = 'idle';
			this.patchStore({ status: 'idle' });
			if (error instanceof RecordingCancelledError) {
				this.emit({ type: 'cancelled' });
			} else {
				this.emit({ type: 'error', message: (error as Error).message });
			}
			return false;
		}

		// The layout does not push while idle, so the opening scene is pulled here.
		this.tiles = this.source?.scene() ?? [];
		this.sceneSignature = '';
		this.audioSources = this.source?.audio() ?? [];

		// Bitrate is fixed for the whole session, as is the canvas: resizing mid-recording
		// breaks the stream the encoder is already producing.
		const hasScreenShare = this.tiles.some((tile) => tile.isScreenShare && tile.videoTrack);
		const videoBitrate = hasScreenShare ? VIDEO_BITRATE_SCREEN : VIDEO_BITRATE_CAMERA;

		try {
			this.mixer = new AudioMixer();
			await this.mixer.resume();
			this.mixer.sync(this.audioSources);

			const { compositor, pipeline } = this.createCompositor(capabilities.pipeline);
			this.compositor = compositor;
			this.patchStore({ pipeline });
			this.pushScene();

			this.stream = new MediaStream([compositor.track, this.mixer.track]);
			this.recorder = new MediaRecorder(this.stream, {
				mimeType,
				videoBitsPerSecond: videoBitrate,
				audioBitsPerSecond: AUDIO_BITRATE
			});
			this.recorder.ondataavailable = this.handleData;
			this.recorder.onerror = this.handleRecorderError;
			this.recorder.start(TIMESLICE_MS);
		} catch (error) {
			await this.teardown();
			await this.sink?.abort();
			this.sink = null;
			this.status = 'idle';
			this.patchStore({ status: 'error', error: (error as Error).message });
			this.emit({ type: 'error', message: (error as Error).message });
			return false;
		}

		this.startedAt = Date.now();
		this.status = 'recording';

		const deadlineAt = this.sink.streaming ? null : this.startedAt + BLOB_SINK_MAX_DURATION_MS;
		if (deadlineAt) {
			this.deadlineTimer = window.setTimeout(() => this.stop(), BLOB_SINK_MAX_DURATION_MS);
		}

		this.patchStore({ status: 'recording', startedAt: this.startedAt, deadlineAt, streamingToDisk: this.sink.streaming });
		window.addEventListener('beforeunload', this.handleBeforeUnload);
		this.emit({ type: 'started' });
		return true;
	}

	async stop(): Promise<void> {
		// Leaving the call while the save dialog is still open must not tear down
		// half-built state underneath `start()`.
		if (this.startPromise) {
			await this.startPromise;
		}
		if (this.status !== 'recording' && this.status !== 'starting') return;
		if (this.stopPromise) return this.stopPromise;

		this.status = 'stopping';
		this.patchStore({ status: 'stopping' });

		this.stopPromise = this.finish();
		try {
			await this.stopPromise;
		} finally {
			this.stopPromise = null;
		}
	}

	private async finish(): Promise<void> {
		window.removeEventListener('beforeunload', this.handleBeforeUnload);
		if (this.deadlineTimer) {
			window.clearTimeout(this.deadlineTimer);
			this.deadlineTimer = null;
		}

		const recorder = this.recorder;
		if (recorder && recorder.state !== 'inactive') {
			await new Promise<void>((resolve) => {
				const done = () => resolve();
				recorder.addEventListener('stop', done, { once: true });
				try {
					recorder.stop();
				} catch {
					resolve();
				}
			});
		}

		const durationMs = this.startedAt ? Date.now() - this.startedAt : 0;
		await this.teardown();

		const sink = this.sink;
		this.sink = null;
		this.status = 'idle';

		// A failure reported mid-recording is the real outcome; flushing whatever was
		// already written afterwards must not present the session as a clean stop.
		const failure = this.pendingError;
		this.pendingError = null;

		if (!sink) {
			this.patchStore({ status: failure ? 'error' : 'idle', startedAt: null, deadlineAt: null, error: failure });
			return;
		}

		try {
			const outcome = await sink.finalize();
			this.patchStore({ status: failure ? 'error' : 'idle', startedAt: null, deadlineAt: null, error: failure });
			if (failure) return;
			this.emit({
				type: 'finished',
				result: {
					fileName: sink.fileName,
					savedToDisk: outcome.savedToDisk,
					bytes: outcome.bytes,
					durationMs
				}
			});
		} catch (error) {
			const message = failure || (error as Error).message;
			this.patchStore({ status: 'error', startedAt: null, deadlineAt: null, error: message });
			if (!failure) {
				this.emit({ type: 'error', message });
			}
		}
	}

	private async teardown(): Promise<void> {
		if (this.recorder) {
			this.recorder.ondataavailable = null;
			this.recorder.onerror = null;
			this.recorder = null;
		}
		this.stream = null;

		const compositor = this.compositor;
		this.compositor = null;
		await compositor?.stop();

		const mixer = this.mixer;
		this.mixer = null;
		await mixer?.close();

		this.sentAvatars.clear();
		this.tiles = [];
		this.sceneSignature = '';
		this.audioSources = [];
	}

	private handleData = (event: BlobEvent) => {
		if (!this.sink || !event.data || event.data.size === 0) return;
		this.sink.write(event.data);

		if (!this.sink.streaming && this.sink.bytesWritten > BLOB_SINK_MAX_BYTES) {
			void this.stop();
		}
	};

	private handleRecorderError = (event: Event) => {
		const message = (event as unknown as { error?: DOMException }).error?.message || 'recorder-error';
		this.pendingError = message;
		this.patchStore({ error: message });
		this.emit({ type: 'error', message });
		void this.stop();
	};

	private handleBeforeUnload = (event: BeforeUnloadEvent) => {
		event.preventDefault();
		event.returnValue = '';
	};

	/**
	 * Called by the layout on every change *while recording*; a no-op when nothing
	 * visible actually moved. Idle sessions never reach here — the opening scene is
	 * pulled from the registered source in `beginRecording`.
	 */
	syncScene(tiles: RecordingSceneTile[]): void {
		const signature = tiles
			.map(
				(tile) =>
					`${tile.key}|${tile.videoTrack?.id ?? ''}|${tile.focused ? 1 : 0}|${tile.speaking ? 1 : 0}|${tile.label}|${tile.avatarUrl ?? ''}`
			)
			.join(';');

		const unchanged = signature === this.sceneSignature;
		this.sceneSignature = signature;
		this.tiles = tiles;

		if (!unchanged && (this.status === 'recording' || this.status === 'starting')) {
			this.pushScene();
		}
	}

	syncAudio(sources: RecordingAudioSource[]): void {
		this.audioSources = sources;
		this.mixer?.sync(sources);
	}

	private pushScene(): void {
		const compositor = this.compositor;
		if (!compositor) return;

		const visible = selectRecordingTiles(this.tiles);
		const videoSources = new Map<string, MediaStreamTrack>();
		const workerTiles: WorkerSceneTile[] = [];

		for (const tile of visible) {
			const hasVideo = !!tile.videoTrack && tile.videoTrack.readyState === 'live';
			if (hasVideo && tile.videoTrack) {
				videoSources.set(tile.key, tile.videoTrack);
			}
			const avatarKey = tile.avatarUrl || null;
			const initial = (tile.label || '?').trim().charAt(0).toUpperCase() || '?';
			workerTiles.push({
				videoKey: hasVideo ? tile.key : null,
				avatarKey,
				label: tile.label,
				initial,
				accent: accentColorFor(initial),
				focused: tile.focused,
				contain: tile.isScreenShare,
				speaking: tile.speaking && !tile.isScreenShare
			});
			if (avatarKey) {
				void this.ensureAvatar(avatarKey);
			}
		}

		compositor.setVideoSources(videoSources);
		compositor.setScene(workerTiles);
	}

	private async ensureAvatar(url: string): Promise<void> {
		if (this.sentAvatars.has(url)) return;
		this.sentAvatars.add(url);

		const bitmap = await loadAvatarBitmap(url, AVATAR_SIZE);
		const compositor = this.compositor;

		if (!bitmap) {
			// Stays marked. The URL is not readable and the tile falls back to an
			// initial; retrying it on every scene push would achieve nothing.
			return;
		}
		if (!compositor) {
			bitmap.close();
			this.sentAvatars.delete(url);
			return;
		}

		compositor.setAvatar(url, bitmap);
	}

	/** Debug aid: what the recorder currently believes it is drawing. */
	inspect(): Record<string, unknown> {
		return {
			status: this.status,
			pipeline: this.compositor instanceof WorkerCompositor ? 'worker' : this.compositor ? 'canvas' : 'none',
			frameSize: FRAME_SIZE,
			tiles: this.tiles.map((tile) => ({
				key: tile.key,
				label: tile.label,
				hasVideo: !!tile.videoTrack,
				focused: tile.focused,
				screenShare: tile.isScreenShare,
				avatar: tile.avatarUrl
			})),
			audio: this.audioSources.map((source) => source.key),
			avatarsLoaded: Array.from(this.sentAvatars)
		};
	}
}

export const callRecorder = new CallRecorderEngine();

// Dev only: reachable from the console as `__mezonCallRecorder.inspect()` while
// debugging a recording that does not look like the call.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
	(window as unknown as { __mezonCallRecorder?: CallRecorderEngine }).__mezonCallRecorder = callRecorder;
}
