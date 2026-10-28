import { getTrackGeneratorCtor, getTrackProcessorCtor, supportsWorkerPipeline } from '../../Recording/capabilities';
import type { TrackGeneratorLike } from '../../Recording/types';
import { paintScreenDrawFrame } from './paintScreenDraw';
import type { ScreenDrawSession } from './ScreenDrawSession';

const OVERLAY_INTERVAL_MS = 40;
const WORKER_STOP_TIMEOUT_MS = 1000;

const WORKER_SOURCE = `
let reader = null;
let writer = null;
let overlay = null;
let lastFrame = null;
let canvas = null;
let context = null;
let width = 0;
let height = 0;
let lastTimestamp = 0;
let writing = false;
let dirty = false;
let stopped = false;

function nextTimestamp() {
	lastTimestamp = Math.max(Math.round(performance.now() * 1000), lastTimestamp + 1);
	return lastTimestamp;
}

function compose(frame) {
	const timestamp = nextTimestamp();
	if (!overlay) return new VideoFrame(frame, { timestamp });
	if (!canvas || canvas.width !== width || canvas.height !== height) {
		canvas = new OffscreenCanvas(width, height);
		context = canvas.getContext('2d', { alpha: false });
	}
	context.drawImage(frame, 0, 0, width, height);
	context.drawImage(overlay, 0, 0, width, height);
	return new VideoFrame(canvas, { timestamp, alpha: 'discard' });
}

function emit() {
	if (stopped || !lastFrame || !writer) return;
	if (writing) {
		dirty = true;
		return;
	}
	dirty = false;
	let output;
	try {
		output = compose(lastFrame);
	} catch (error) {
		return;
	}
	writing = true;
	writer.write(output).catch(function () {
		output.close();
	}).then(function () {
		writing = false;
		if (dirty) emit();
	});
}

function pump() {
	reader.read().then(function (result) {
		if (result.done || stopped) {
			if (result.value) result.value.close();
			return;
		}
		const frame = result.value;
		if (frame.displayWidth !== width || frame.displayHeight !== height) {
			width = frame.displayWidth;
			height = frame.displayHeight;
			self.postMessage({ type: 'size', width: width, height: height });
		}
		if (lastFrame) lastFrame.close();
		lastFrame = frame;
		emit();
		pump();
	}, function () {});
}

self.onmessage = function (event) {
	const data = event.data;
	if (data.type === 'init') {
		reader = data.readable.getReader();
		writer = data.writable.getWriter();
		pump();
		return;
	}
	if (data.type === 'overlay') {
		if (overlay) overlay.close();
		overlay = data.bitmap;
		emit();
		return;
	}
	if (data.type === 'stop') {
		stopped = true;
		if (reader) reader.cancel().catch(function () {});
		if (lastFrame) lastFrame.close();
		if (overlay) overlay.close();
		lastFrame = null;
		overlay = null;
		self.postMessage({ type: 'stopped' });
	}
};
`;

export const supportsScreenAnnotation = supportsWorkerPipeline;

export class ScreenAnnotationCompositor {
	private readonly worker: Worker;
	private readonly generator: TrackGeneratorLike;
	private readonly source: MediaStreamTrack;
	private readonly unsubscribe: () => void;
	private canvas: OffscreenCanvas | null = null;
	private frameWidth = 0;
	private frameHeight = 0;
	private flushTimer: number | undefined;
	private lastFlushAt = 0;
	private overlayVisible = false;
	private stopped = false;

	constructor(
		track: MediaStreamTrack,
		private readonly session: ScreenDrawSession
	) {
		const ProcessorCtor = getTrackProcessorCtor();
		const GeneratorCtor = getTrackGeneratorCtor();
		if (!ProcessorCtor || !GeneratorCtor) throw new Error('MediaStreamTrackProcessor unavailable');

		const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'application/javascript' }));
		this.worker = new Worker(url);
		URL.revokeObjectURL(url);
		this.worker.onmessage = (event: MessageEvent) => {
			if (event.data?.type !== 'size') return;
			this.frameWidth = event.data.width;
			this.frameHeight = event.data.height;
			this.invalidate();
		};

		this.source = track.clone();
		this.generator = new GeneratorCtor({ kind: 'video' });
		this.generator.contentHint = track.contentHint;
		const readable = new ProcessorCtor({ track: this.source, maxBufferSize: 2 }).readable;
		const writable = this.generator.writable;
		this.worker.postMessage({ type: 'init', readable, writable }, [readable, writable] as unknown as Transferable[]);
		this.unsubscribe = session.subscribe(this.invalidate);
	}

	get track(): MediaStreamTrack {
		return this.generator;
	}

	async applyScreenShareMode(constraints: MediaTrackConstraints, contentHint: string) {
		this.generator.contentHint = contentHint;
		if (this.source.readyState === 'live') await this.source.applyConstraints(constraints);
	}

	stop() {
		if (this.stopped) return;
		this.stopped = true;
		this.unsubscribe();
		window.clearTimeout(this.flushTimer);
		let timeout = 0;
		const terminate = () => {
			window.clearTimeout(timeout);
			this.worker.terminate();
		};
		timeout = window.setTimeout(terminate, WORKER_STOP_TIMEOUT_MS);
		this.worker.onmessage = (event: MessageEvent) => {
			if (event.data?.type === 'stopped') terminate();
		};
		this.worker.postMessage({ type: 'stop' });
		this.source.stop();
		this.generator.stop();
	}

	private invalidate = () => {
		if (this.stopped || this.flushTimer !== undefined) return;
		const delay = Math.max(0, OVERLAY_INTERVAL_MS - (performance.now() - this.lastFlushAt));
		this.flushTimer = window.setTimeout(this.flush, delay);
	};

	private flush = () => {
		this.flushTimer = undefined;
		if (this.stopped || !this.frameWidth || !this.frameHeight) return;
		this.lastFlushAt = performance.now();
		const state = this.session.state;
		if (!state.hasContent()) {
			if (!this.overlayVisible) return;
			this.overlayVisible = false;
			this.worker.postMessage({ type: 'overlay', bitmap: null });
			return;
		}
		let canvas = this.canvas;
		if (!canvas || canvas.width !== this.frameWidth || canvas.height !== this.frameHeight) {
			canvas = new OffscreenCanvas(this.frameWidth, this.frameHeight);
			this.canvas = canvas;
		}
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		paintScreenDrawFrame(ctx, state, this.frameWidth, this.frameHeight, this.session.canvas[0]);
		const bitmap = canvas.transferToImageBitmap();
		this.overlayVisible = true;
		this.worker.postMessage({ type: 'overlay', bitmap }, [bitmap]);
	};
}
