import * as ort from 'onnxruntime-web';
import { MezonNSEngine } from './mezon-onnx-engine';

type InitMessage = {
	type: 'init';
	model: ArrayBuffer;
	port: MessagePort;
	wasmPaths: string;
	captureActive: boolean;
};
type ControlMessage = InitMessage | { type: 'capture_active'; enabled: boolean } | { type: 'warmed_up' };
type FrameMessage = { type: 'process_frame'; requestId: number; frame: Float32Array };

const scope = globalThis as unknown as {
	onmessage: ((event: MessageEvent<ControlMessage>) => void) | null;
	postMessage: (message: { type: string; error?: string }) => void;
};

let engine: MezonNSEngine | undefined;
let audioPort: MessagePort | undefined;
let captureActive = false;
let warmedUp = false;
let failed = false;
let queuedFrames = 0;
let warnedAboutBacklog = false;
let processing = Promise.resolve();

const fail = (cause: unknown) => {
	if (failed) return;
	failed = true;
	audioPort?.close();
	scope.postMessage({ type: 'failure', error: cause instanceof Error ? cause.message : String(cause) });
};

const processFrame = ({ requestId, frame }: FrameMessage) => {
	if (failed || !engine) return;
	if (queuedFrames >= 12) {
		if (!warnedAboutBacklog) {
			warnedAboutBacklog = true;
			scope.postMessage({ type: 'backlog' });
		}
		return;
	}
	queuedFrames++;
	processing = processing
		.then(async () => {
			if (failed || !engine || !audioPort) return;
			const output = new Float32Array(160);
			if (captureActive || !warmedUp) await engine.processFrame(frame, output);
			for (let i = 0; i < output.length; i++) {
				if (!Number.isFinite(output[i])) throw new Error('Mezon-NS produced non-finite audio');
			}
			audioPort.postMessage({ type: 'clean_frame', requestId, frame: output }, [output.buffer]);
		})
		.catch(fail)
		.finally(() => {
			queuedFrames--;
		});
};

scope.onmessage = ({ data }) => {
	if (data.type === 'capture_active') {
		captureActive = data.enabled;
		return;
	}
	if (data.type === 'warmed_up') {
		warmedUp = true;
		return;
	}
	if (data.type !== 'init') return;
	captureActive = data.captureActive;
	audioPort = data.port;
	void (async () => {
		ort.env.wasm.numThreads = 1;
		ort.env.wasm.simd = true;
		ort.env.wasm.wasmPaths = data.wasmPaths;
		const nextEngine = new MezonNSEngine({
			suppressionIntensity: 1.6,
			enableNoiseGate: true,
			attenuationLimitDb: 15,
			modelInputTargetDbfs: -20
		});
		engine = nextEngine;
		await nextEngine.loadModel(new Uint8Array(data.model));
		// Compile the model before any live frame reaches the worklet, then discard synthetic state.
		await nextEngine.processFrame(new Float32Array(160), new Float32Array(160));
		nextEngine.reset();
		if (failed) return;
		audioPort.onmessage = ({ data: message }: MessageEvent<FrameMessage>) => {
			if (message?.type === 'process_frame') processFrame(message);
		};
		scope.postMessage({ type: 'ready' });
	})().catch(fail);
};
