import type { MezonNSEngine } from './mezon-onnx-engine';

const assetBase = () => `${process.env.NODE_ENV === 'production' ? '/chat' : ''}/assets/mezon-ns/`;
const ASSET_VERSION = '3f4b699-v5';
const LOG_PREFIX = '[MezonSFU][Mezon-NS]';
const READY_TIMEOUT_MS = 5000;
let resourcesPromise: Promise<{ model: Uint8Array; Engine: typeof MezonNSEngine }> | undefined;

const loadResources = () => {
	if (!resourcesPromise) {
		resourcesPromise = (async () => {
			const ort = await import('onnxruntime-web');
			ort.env.wasm.numThreads = 1;
			ort.env.wasm.simd = true;
			ort.env.wasm.wasmPaths = assetBase();
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 15000);
			try {
				const [response, { MezonNSEngine: Engine }] = await Promise.all([
					fetch(`${assetBase()}mezon_ns.onnx?v=${ASSET_VERSION}`, { signal: controller.signal }),
					import('./mezon-onnx-engine')
				]);
				if (!response.ok) throw new Error(`Mezon-NS model download failed (${response.status})`);
				const model = new Uint8Array(await response.arrayBuffer());
				return { model, Engine };
			} finally {
				clearTimeout(timeout);
			}
		})().catch((error) => {
			resourcesPromise = undefined; // Allow retry after a temporary network failure.
			throw error;
		});
	}
	return resourcesPromise;
};

type PendingMode = {
	id: number;
	enabled: boolean;
	promise: Promise<boolean>;
	resolve: (applied: boolean) => void;
	timeout: ReturnType<typeof setTimeout>;
};

export class MezonNsAudioPipeline {
	readonly track: MediaStreamTrack;
	private disposed = false;
	private failed = false;
	private outputEnabled = false;
	private preparingWhileMuted = false;
	private denoisingEnabled = true;
	private modeReady = false;
	private warmedUp = false;
	private modeId = 0;
	private pendingMode: PendingMode | null = null;
	private warnedAboutOverrun = false;
	private queuedFrames = 0;
	private processing = Promise.resolve();

	private constructor(
		readonly inputTrack: MediaStreamTrack,
		private readonly analysisTrack: MediaStreamTrack,
		private readonly context: AudioContext,
		private readonly engine: MezonNSEngine,
		private readonly source: MediaStreamAudioSourceNode,
		private readonly worklet: AudioWorkletNode,
		private readonly destination: MediaStreamAudioDestinationNode,
		private readonly onFailure: (error: unknown) => void
	) {
		this.track = destination.stream.getAudioTracks()[0];
		this.track.enabled = false;
	}

	get isDenoisingReady(): boolean {
		return !this.disposed && !this.failed && this.modeReady && this.denoisingEnabled;
	}

	static async preload(): Promise<void> {
		await loadResources();
	}

	private waitForMode(enabled: boolean, id: number): Promise<boolean> {
		this.cancelPendingMode();
		this.modeReady = false;
		this.denoisingEnabled = enabled;
		this.track.enabled = false;
		let resolve!: (applied: boolean) => void;
		const promise = new Promise<boolean>((done) => {
			resolve = done;
		});
		const timeout = setTimeout(() => this.fail(new Error('Mezon-NS did not produce ready audio in time')), READY_TIMEOUT_MS);
		this.pendingMode = { id, enabled, promise, resolve, timeout };
		return promise;
	}

	private cancelPendingMode(): void {
		if (!this.pendingMode) return;
		clearTimeout(this.pendingMode.timeout);
		this.pendingMode.resolve(false);
		this.pendingMode = null;
	}

	// The analysis clone is never published. It can hear the microphone while
	// the output waits for noise suppression to finish applying.
	setPreparationEnabled(enabled: boolean): void {
		this.preparingWhileMuted = enabled;
		this.analysisTrack.enabled = this.inputTrack.enabled || enabled;
	}

	setOutputEnabled(enabled: boolean): void {
		this.analysisTrack.enabled = this.inputTrack.enabled || this.preparingWhileMuted;
		this.outputEnabled = enabled;
		this.syncOutputEnabled();
	}

	private syncOutputEnabled(): void {
		const enabled = this.outputEnabled && this.modeReady && !this.disposed && !this.failed;
		this.track.enabled = enabled;
		if (!this.disposed) this.worklet.port.postMessage({ type: 'set_output_enabled', requestId: this.modeId, enabled });
	}

	setDenoisingEnabled(enabled: boolean): Promise<boolean> {
		if (this.disposed || this.failed) return Promise.resolve(false);
		if (this.pendingMode?.enabled === enabled) return this.pendingMode.promise;
		if (this.modeReady && this.denoisingEnabled === enabled) return Promise.resolve(true);
		const id = ++this.modeId;
		const ready = this.waitForMode(enabled, id);
		this.worklet.port.postMessage({ type: 'set_mode', requestId: id, enabled });
		return ready;
	}

	private fail(error: unknown): void {
		if (this.disposed || this.failed) return;
		this.failed = true;
		this.modeReady = false;
		this.track.enabled = false;
		this.cancelPendingMode();
		this.onFailure(error);
	}

	static async create(inputTrack: MediaStreamTrack, onFailure: (error: unknown) => void, prepareWhileMuted = false): Promise<MezonNsAudioPipeline> {
		if (!window.AudioContext || typeof AudioWorkletNode === 'undefined') throw new Error('AudioWorklet is unavailable');
		const { model, Engine } = await loadResources();
		const engine = new Engine({ suppressionIntensity: 1.6, enableNoiseGate: true });
		let context: AudioContext | undefined;
		let analysisTrack: MediaStreamTrack | undefined;
		let pipeline: MezonNsAudioPipeline | undefined;
		const preparation = (async () => {
			await engine.loadModel(model);
			// Compile/warm the graph before consuming live frames, then reset synthetic state.
			await engine.processFrame(new Float32Array(160), new Float32Array(160));
			engine.reset();
		})();
		try {
			let preparationTimeout: ReturnType<typeof setTimeout> | undefined;
			try {
				await Promise.race([
					preparation,
					new Promise<never>((_, reject) => {
						preparationTimeout = setTimeout(() => reject(new Error('Mezon-NS model initialization timed out')), 15000);
					})
				]);
			} finally {
				if (preparationTimeout !== undefined) clearTimeout(preparationTimeout);
			}
			context = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' });
			if (context.sampleRate !== 16000) throw new Error('Mezon-NS requires 16 kHz audio');
			await context.audioWorklet.addModule(`${assetBase()}mezon-ns-processor.js?v=${ASSET_VERSION}`);
			analysisTrack = inputTrack.clone();
			analysisTrack.enabled = inputTrack.enabled || prepareWhileMuted;
			const source = context.createMediaStreamSource(new MediaStream([analysisTrack]));
			const worklet = new AudioWorkletNode(context, 'mezon-ns-processor', { outputChannelCount: [1] });
			const destination = context.createMediaStreamDestination();
			destination.channelCount = 1;
			const created = new MezonNsAudioPipeline(inputTrack, analysisTrack, context, engine, source, worklet, destination, onFailure);
			pipeline = created;
			created.setPreparationEnabled(prepareWhileMuted);
			const ready = created.waitForMode(true, 0);
			const output = new Float32Array(160);
			worklet.onprocessorerror = () => created.fail(new Error('Mezon-NS audio processor failed'));
			worklet.port.onmessage = (
				event: MessageEvent<{
					type: string;
					requestId?: number;
					enabled?: boolean;
					frame?: Float32Array;
				}>
			) => {
				const message = event.data;
				if (created.disposed || created.failed || !message) return;
				if (message.type === 'mode_applied') {
					const pending = created.pendingMode;
					if (!pending || message.requestId !== pending.id || message.enabled !== pending.enabled) {
						return;
					}
					clearTimeout(pending.timeout);
					created.pendingMode = null;
					created.modeReady = true;
					created.warmedUp = true;
					created.syncOutputEnabled();
					pending.resolve(true);
					return;
				}
				if (message.type !== 'process_frame' || !message.frame) return;
				if (created.queuedFrames >= 6) {
					if (!created.warnedAboutOverrun) {
						created.warnedAboutOverrun = true;
						console.warn(`${LOG_PREFIX} inference backlog; output remains silent on underrun`);
					}
					return;
				}
				created.queuedFrames++;
				const frame = message.frame;
				const requestId = message.requestId;
				created.processing = created.processing
					.then(async () => {
						if (created.disposed || created.failed) return;
						// Ordinary user mute freezes state; the explicit preparation phase
						// continues inference on a private capture clone with outgoing audio muted.
						if (!created.analysisTrack.enabled && created.warmedUp) {
							output.fill(0);
						} else {
							await engine.processFrame(frame, output);
						}
						for (let i = 0; i < output.length; i++) {
							if (!Number.isFinite(output[i])) throw new Error('Mezon-NS produced non-finite audio');
						}
						if (!created.disposed && !created.failed) worklet.port.postMessage({ type: 'clean_frame', requestId, frame: output.slice() });
					})
					.catch((error) => created.fail(error))
					.finally(() => {
						created.queuedFrames--;
					});
			};
			source.connect(worklet);
			worklet.connect(destination);
			// The readiness timeout also bounds a resume() blocked by browser autoplay rules.
			void context.resume().catch((error) => created.fail(error));
			if (!(await ready) || context.state !== 'running') throw new Error('Mezon-NS audio could not become ready');
			return created;
		} catch (error) {
			if (pipeline) pipeline.dispose();
			else {
				analysisTrack?.stop();
				void context?.close().catch(() => undefined);
				// A timed-out ONNX initialization cannot be cancelled. Release its session
				// after it settles, never while an inference is still using it.
				void preparation
					.then(
						() => engine.dispose(),
						() => engine.dispose()
					)
					.catch(() => undefined);
			}
			throw error;
		}
	}

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		this.modeReady = false;
		this.cancelPendingMode();
		this.worklet.port.onmessage = null;
		this.worklet.onprocessorerror = null;
		this.worklet.port.close();
		this.source.disconnect();
		this.worklet.disconnect();
		this.destination.disconnect();
		this.track.stop();
		this.analysisTrack.stop();
		void this.context.close().catch(() => undefined);
		void this.processing.then(() => this.engine.dispose()).catch(() => undefined);
	}
}
