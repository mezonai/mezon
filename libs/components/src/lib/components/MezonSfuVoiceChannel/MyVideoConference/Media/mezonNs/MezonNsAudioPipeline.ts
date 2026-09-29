const assetBase = () => `${process.env.NODE_ENV === 'production' ? '/chat' : ''}/assets/mezon-ns/`;
const ASSET_VERSION = '457ca7c-v3';
const LOG_PREFIX = '[MezonSFU][Mezon-NS]';
const READY_TIMEOUT_MS = 5000;
let resourcesPromise: Promise<Uint8Array> | undefined;

const loadResources = () => {
	if (!resourcesPromise) {
		resourcesPromise = (async () => {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 15000);
			try {
				const response = await fetch(`${assetBase()}mezon_ns_asym_babble.onnx?v=${ASSET_VERSION}`, { signal: controller.signal });
				if (!response.ok) throw new Error(`Mezon-NS model download failed (${response.status})`);
				return new Uint8Array(await response.arrayBuffer());
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
	private modeId = 0;
	private pendingMode: PendingMode | null = null;

	private constructor(
		readonly inputTrack: MediaStreamTrack,
		private readonly analysisTrack: MediaStreamTrack,
		private readonly context: AudioContext,
		private readonly worker: Worker,
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
		this.syncCaptureEnabled();
	}

	setOutputEnabled(enabled: boolean): void {
		this.syncCaptureEnabled();
		this.outputEnabled = enabled;
		this.syncOutputEnabled();
	}

	private syncCaptureEnabled(): void {
		this.analysisTrack.enabled = this.inputTrack.enabled || this.preparingWhileMuted;
		this.worker.postMessage({ type: 'capture_active', enabled: this.analysisTrack.enabled });
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
		if (!window.AudioContext || typeof AudioWorkletNode === 'undefined' || typeof Worker === 'undefined' || typeof MessageChannel === 'undefined')
			throw new Error('Mezon-NS audio workers are unavailable');
		const model = await loadResources();
		let context: AudioContext | undefined;
		let analysisTrack: MediaStreamTrack | undefined;
		let worker: Worker | undefined;
		let pendingPort: MessagePort | undefined;
		let pipeline: MezonNsAudioPipeline | undefined;
		try {
			context = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' });
			if (context.sampleRate !== 16000) throw new Error('Mezon-NS requires 16 kHz audio');
			await context.audioWorklet.addModule(`${assetBase()}mezon-ns-processor.js?v=${ASSET_VERSION}`);
			analysisTrack = inputTrack.clone();
			analysisTrack.enabled = inputTrack.enabled || prepareWhileMuted;
			const source = context.createMediaStreamSource(new MediaStream([analysisTrack]));
			const worklet = new AudioWorkletNode(context, 'mezon-ns-processor', { outputChannelCount: [1] });
			const destination = context.createMediaStreamDestination();
			destination.channelCount = 1;
			worker = new Worker(new URL('./MezonNsInferenceWorker.ts', import.meta.url), { type: 'module' });
			const created = new MezonNsAudioPipeline(inputTrack, analysisTrack, context, worker, source, worklet, destination, onFailure);
			pipeline = created;
			const channel = new MessageChannel();
			pendingPort = channel.port1;
			let resolveWorker!: () => void;
			let rejectWorker!: (error: Error) => void;
			let workerReady = false;
			let warnedAboutBacklog = false;
			let warnedAboutUnderrun = false;
			const initialized = new Promise<void>((resolve, reject) => {
				resolveWorker = resolve;
				rejectWorker = reject;
			});
			worker.onmessage = (event: MessageEvent<{ type: string; error?: string }>) => {
				if (created.disposed || created.failed) return;
				if (event.data?.type === 'ready') {
					workerReady = true;
					resolveWorker();
				} else if (event.data?.type === 'failure') {
					const error = new Error(event.data.error || 'Mezon-NS inference worker failed');
					if (workerReady) created.fail(error);
					else rejectWorker(error);
				} else if (event.data?.type === 'backlog' && !warnedAboutBacklog) {
					warnedAboutBacklog = true;
					console.warn(`${LOG_PREFIX} inference worker backlog`);
				}
			};
			worker.onerror = (event) => {
				event.preventDefault();
				const error = new Error(event.message || 'Mezon-NS inference worker failed');
				if (workerReady) created.fail(error);
				else rejectWorker(error);
			};
			const modelCopy = model.slice(); // Keep the cached model intact when transferring its bytes.
			worker.postMessage(
				{ type: 'init', model: modelCopy.buffer, port: channel.port2, wasmPaths: assetBase(), captureActive: analysisTrack.enabled },
				[modelCopy.buffer, channel.port2]
			);
			let preparationTimeout: ReturnType<typeof setTimeout> | undefined;
			try {
				await Promise.race([
					initialized,
					new Promise<never>((_, reject) => {
						preparationTimeout = setTimeout(() => reject(new Error('Mezon-NS model initialization timed out')), 15000);
					})
				]);
			} finally {
				if (preparationTimeout !== undefined) clearTimeout(preparationTimeout);
			}
			worklet.port.postMessage({ type: 'bind_inference_port', port: channel.port1 }, [channel.port1]);
			pendingPort = undefined;
			created.setPreparationEnabled(prepareWhileMuted);
			const ready = created.waitForMode(true, 0);
			worklet.onprocessorerror = () => created.fail(new Error('Mezon-NS audio processor failed'));
			worklet.port.onmessage = (
				event: MessageEvent<{
					type: string;
					requestId?: number;
					enabled?: boolean;
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
					worker?.postMessage({ type: 'warmed_up' });
					created.syncOutputEnabled();
					pending.resolve(true);
				} else if (message.type === 'output_underrun' && !warnedAboutUnderrun) {
					warnedAboutUnderrun = true;
					console.warn(`${LOG_PREFIX} filtered audio underrun; audio was briefly silent`);
				}
			};
			source.connect(worklet);
			worklet.connect(destination);
			// The readiness timeout also bounds a resume() blocked by browser autoplay rules.
			void context.resume().catch((error) => created.fail(error));
			if (!(await ready) || context.state !== 'running') throw new Error('Mezon-NS audio could not become ready');
			return created;
		} catch (error) {
			pendingPort?.close();
			if (pipeline) pipeline.dispose();
			else {
				worker?.terminate();
				analysisTrack?.stop();
				void context?.close().catch(() => undefined);
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
		this.worklet.port.postMessage({ type: 'dispose' });
		this.worklet.port.close();
		this.worker.onmessage = null;
		this.worker.onerror = null;
		this.worker.terminate();
		this.source.disconnect();
		this.worklet.disconnect();
		this.destination.disconnect();
		this.track.stop();
		this.analysisTrack.stop();
		void this.context.close().catch(() => undefined);
	}
}
