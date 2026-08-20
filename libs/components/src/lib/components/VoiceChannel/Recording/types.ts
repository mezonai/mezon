export type RecordingStatus = 'idle' | 'starting' | 'recording' | 'stopping' | 'error';

export type RecordingPipeline = 'worker' | 'canvas' | 'none';

/**
 * A tile as it should appear in the recorded frame. Built from the same
 * `useTracks()` output the on-screen layout uses, so the file matches the view.
 */
export interface RecordingSceneTile {
	/** Stable identity of the tile: `${participantIdentity}:${source}`. */
	key: string;
	participantId: string;
	label: string;
	avatarUrl?: string | null;
	/** Live video track, or null when the camera is off / not subscribed. */
	videoTrack: MediaStreamTrack | null;
	isScreenShare: boolean;
	focused: boolean;
	speaking: boolean;
}

export interface RecordingAudioSource {
	key: string;
	track: MediaStreamTrack;
}

export interface RecordingResult {
	fileName: string;
	/** True when chunks were streamed to a file the user picked; false for the download fallback. */
	savedToDisk: boolean;
	durationMs: number;
	bytes: number;
}

/** One tile as the worker consumes it — plain data only, no DOM references. */
export interface WorkerSceneTile {
	videoKey: string | null;
	avatarKey: string | null;
	label: string;
	initial: string;
	accent: string;
	focused: boolean;
	contain: boolean;
	speaking: boolean;
}

/**
 * Both pipelines expose the same surface, so the recorder engine never branches
 * on which one it got.
 */
export interface RecordingCompositor {
	/** Composited video track, ready to hand to MediaRecorder. */
	readonly track: MediaStreamTrack;
	/** Adds/removes decoders so the live set matches `sources` exactly. */
	setVideoSources(sources: Map<string, MediaStreamTrack>): void;
	setScene(tiles: WorkerSceneTile[]): void;
	setAvatar(key: string, bitmap: ImageBitmap): void;
	stop(): Promise<void>;
}

/** `MediaStreamTrackProcessor` / `MediaStreamTrackGenerator` are not in lib.dom yet. */
export interface TrackProcessorLike {
	readable: ReadableStream<VideoFrame>;
}

export interface TrackGeneratorLike extends MediaStreamTrack {
	writable: WritableStream<VideoFrame>;
}

export type TrackProcessorCtor = new (init: { track: MediaStreamTrack; maxBufferSize?: number }) => TrackProcessorLike;
export type TrackGeneratorCtor = new (init: { kind: 'video' }) => TrackGeneratorLike;

export interface RecordingCapableWindow extends Window {
	MediaStreamTrackProcessor?: TrackProcessorCtor;
	MediaStreamTrackGenerator?: TrackGeneratorCtor;
	showSaveFilePicker?: (options: {
		suggestedName?: string;
		types?: { description: string; accept: Record<string, string[]> }[];
	}) => Promise<FileSystemFileHandle>;
}
