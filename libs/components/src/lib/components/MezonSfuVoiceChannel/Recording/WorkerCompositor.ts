import { getTrackGeneratorCtor, getTrackProcessorCtor } from './capabilities';
import { buildCompositorWorkerSource } from './compositorWorkerSource';
import type { RecordingCompositor, TrackGeneratorLike, WorkerSceneTile } from './types';

interface SourceEntry {
	clone: MediaStreamTrack;
	sourceId: string;
}

export interface WorkerCompositorStats {
	framesWritten: number;
	framesDropped: number;
}

export class WorkerCompositor implements RecordingCompositor {
	private readonly worker: Worker;
	private readonly generator: TrackGeneratorLike;
	private readonly sources = new Map<string, SourceEntry>();
	private stopped = false;

	stats: WorkerCompositorStats = { framesWritten: 0, framesDropped: 0 };
	onStats?: (stats: WorkerCompositorStats) => void;

	constructor(width: number, height: number, fps: number) {
		const GeneratorCtor = getTrackGeneratorCtor();
		if (!GeneratorCtor) {
			throw new Error('MediaStreamTrackGenerator unavailable');
		}

		const blob = new Blob([buildCompositorWorkerSource()], { type: 'application/javascript' });
		const url = URL.createObjectURL(blob);
		this.worker = new Worker(url);
		URL.revokeObjectURL(url);

		this.worker.onmessage = (event: MessageEvent) => {
			if (event.data?.type === 'stats') {
				this.stats = { framesWritten: event.data.framesWritten, framesDropped: event.data.framesDropped };
				this.onStats?.(this.stats);
			}
		};

		this.generator = new GeneratorCtor({ kind: 'video' });
		const writable = this.generator.writable;
		this.worker.postMessage({ type: 'init', width, height, fps, writable }, [writable as unknown as Transferable]);
	}

	get track(): MediaStreamTrack {
		return this.generator;
	}

	setVideoSources(next: Map<string, MediaStreamTrack>): void {
		if (this.stopped) return;

		for (const [key, entry] of Array.from(this.sources)) {
			const incoming = next.get(key);
			if (!incoming || incoming.id !== entry.sourceId) {
				this.dropSource(key);
			}
		}

		const ProcessorCtor = getTrackProcessorCtor();
		if (!ProcessorCtor) return;

		for (const [key, track] of next) {
			if (this.sources.has(key) || track.readyState !== 'live') continue;
			try {
				const clone = track.clone();
				const processor = new ProcessorCtor({ track: clone, maxBufferSize: 2 });
				const readable = processor.readable;
				this.sources.set(key, { clone, sourceId: track.id });
				this.worker.postMessage({ type: 'addSource', key, readable }, [readable as unknown as Transferable]);
			} catch (error) {
				console.error('[recording] failed to attach video source', key, error);
			}
		}
	}

	setScene(tiles: WorkerSceneTile[]): void {
		if (this.stopped) return;
		this.worker.postMessage({ type: 'scene', tiles });
	}

	setAvatar(key: string, bitmap: ImageBitmap): void {
		if (this.stopped) {
			bitmap.close();
			return;
		}
		this.worker.postMessage({ type: 'avatar', key, bitmap }, [bitmap]);
	}

	private dropSource(key: string): void {
		const entry = this.sources.get(key);
		if (!entry) return;
		this.sources.delete(key);
		this.worker.postMessage({ type: 'removeSource', key });
		entry.clone.stop();
	}

	async stop(): Promise<void> {
		if (this.stopped) return;
		this.stopped = true;

		for (const key of Array.from(this.sources.keys())) {
			this.dropSource(key);
		}

		await new Promise<void>((resolve) => {
			const finish = () => {
				window.clearTimeout(timeout);
				this.worker.removeEventListener('message', onMessage);
				resolve();
			};
			const onMessage = (event: MessageEvent) => {
				if (event.data?.type === 'stopped') {
					finish();
				}
			};
			const timeout = window.setTimeout(finish, 2000);
			this.worker.addEventListener('message', onMessage);
			this.worker.postMessage({ type: 'stop' });
		});

		this.worker.terminate();
		this.generator.stop();
	}
}
