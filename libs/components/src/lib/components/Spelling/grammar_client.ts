import * as ort from 'onnxruntime-web';
import { MezonGrammarClient } from './mezon_grammar.js';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

const MODEL_URL = process.env.NX_MODEL_ONNX;
const ACCENT_MODEL_URL = process.env.NX_MODEL_ACCENT_ONNX;

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
		if (!MODEL_URL || !ACCENT_MODEL_URL) {
			throw new Error('NOT FOUND CDN MODEL URL');
		}

		const newClient = new MezonGrammarClient();

		const results = await Promise.allSettled([
			newClient.loadModel(MODEL_URL, ort as any),
			newClient.loadAccentModel(ACCENT_MODEL_URL, ort as any)
		]);

		results.forEach((result, index) => {
			if (result.status === 'rejected') {
				console.error(index === 0 ? '[Grammar] Intent model load failed:' : '[Grammar] Accent model load failed:', result.reason);
			}
		});

		if (!newClient.isModelLoaded() && !newClient.isAccentModelLoaded()) {
			throw new Error('Không thể tải cả intent model và accent model');
		}

		client = newClient;

		return newClient;
	})();

	try {
		return await loadingPromise;
	} catch (error) {
		// Cho phép retry nếu lần load đầu tiên thất bại.
		loadingPromise = null;
		throw error;
	}
};
