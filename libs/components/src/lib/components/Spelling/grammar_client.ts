import * as ort from 'onnxruntime-web';
import { MezonGrammarClient } from './mezon_grammar.js';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

const MODEL_URL = process.env.NX_MODEL_ONNX;

let client: MezonGrammarClient | null = null;
let loadingPromise: Promise<MezonGrammarClient> | null = null;

export const getGrammarClient = async (): Promise<MezonGrammarClient> => {
	if (client) {
		return client;
	}

	if (loadingPromise) {
		return loadingPromise;
	}

	loadingPromise = (async () => {
		if (!MODEL_URL) {
			throw new Error('NOT FOUND CDN MODEL URL');
		}

		const newClient = new MezonGrammarClient();

		await newClient.loadModel(MODEL_URL, ort as any).catch((reason) => {
			console.error('[QuickReply] Intent model load failed:', reason);
		});

		if (!newClient.isModelLoaded()) {
			throw new Error('Không thể tải intent model');
		}

		client = newClient;

		return newClient;
	})();

	try {
		return await loadingPromise;
	} catch (error) {
		loadingPromise = null;
		throw error;
	}
};
