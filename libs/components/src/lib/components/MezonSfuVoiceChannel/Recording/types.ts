export type RecordingStatus = 'idle' | 'starting' | 'recording' | 'stopping' | 'error';

export type RecordingPipeline = 'worker' | 'canvas' | 'none';

export interface RecordingSceneTile {
	key: string;
	participantId: string;
	label: string;
	avatarUrl?: string | null;
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
	savedToDisk: boolean;
	durationMs: number;
	bytes: number;
}

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

export interface RecordingCompositor {
	readonly track: MediaStreamTrack;
	setVideoSources(sources: Map<string, MediaStreamTrack>): void;
	setScene(tiles: WorkerSceneTile[]): void;
	setAvatar(key: string, bitmap: ImageBitmap): void;
	stop(): Promise<void>;
}

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
