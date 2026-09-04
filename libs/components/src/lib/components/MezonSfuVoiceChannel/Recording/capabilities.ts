import type { RecordingCapableWindow, RecordingPipeline, TrackGeneratorCtor, TrackProcessorCtor } from './types';

export interface RecordingCodecChoice {
	mimeType: string;
	extension: string;
}

const MIME_CANDIDATES: RecordingCodecChoice[] = [
	{ mimeType: 'video/mp4;codecs="avc1.42E01F,mp4a.40.2"', extension: 'mp4' },
	{ mimeType: 'video/mp4;codecs=avc1', extension: 'mp4' },
	{ mimeType: 'video/mp4', extension: 'mp4' },
	{ mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
	{ mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
	{ mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
	{ mimeType: 'video/webm', extension: 'webm' }
];

export interface RecorderCapabilities {
	supported: boolean;
	pipeline: RecordingPipeline;
	codec: RecordingCodecChoice | null;
	streamingToDisk: boolean;
	reason?: string;
}

export function getRecordingWindow(): RecordingCapableWindow | null {
	return typeof window === 'undefined' ? null : (window as RecordingCapableWindow);
}

export function pickRecordingCodec(): RecordingCodecChoice | null {
	if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
		return null;
	}
	for (const candidate of MIME_CANDIDATES) {
		if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
			return candidate;
		}
	}
	return null;
}

export function getTrackProcessorCtor(): TrackProcessorCtor | null {
	const win = getRecordingWindow();
	return win?.MediaStreamTrackProcessor ?? null;
}

export function getTrackGeneratorCtor(): TrackGeneratorCtor | null {
	const win = getRecordingWindow();
	return win?.MediaStreamTrackGenerator ?? null;
}

export function supportsWorkerPipeline(): boolean {
	if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof VideoFrame === 'undefined') {
		return false;
	}
	return !!getTrackProcessorCtor() && !!getTrackGeneratorCtor();
}

export function supportsDiskStreaming(): boolean {
	const win = getRecordingWindow();
	return !!win && typeof win.showSaveFilePicker === 'function' && !!win.isSecureContext;
}

export function detectRecorderCapabilities(): RecorderCapabilities {
	if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
		return { supported: false, pipeline: 'none', codec: null, streamingToDisk: false, reason: 'no-media-recorder' };
	}

	const codec = pickRecordingCodec();
	if (!codec) {
		return { supported: false, pipeline: 'none', codec: null, streamingToDisk: false, reason: 'no-codec' };
	}

	const canvasCaptureSupported = typeof HTMLCanvasElement !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;
	const workerPipeline = supportsWorkerPipeline();

	if (!workerPipeline && !canvasCaptureSupported) {
		return { supported: false, pipeline: 'none', codec, streamingToDisk: false, reason: 'no-capture-path' };
	}

	return {
		supported: true,
		pipeline: workerPipeline ? 'worker' : 'canvas',
		codec,
		streamingToDisk: supportsDiskStreaming()
	};
}
