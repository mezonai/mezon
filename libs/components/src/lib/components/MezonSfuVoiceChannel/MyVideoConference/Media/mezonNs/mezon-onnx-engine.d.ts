export class MezonNSEngine {
	readonly noiseFloor: number;
	readonly vadState: number;
	constructor(options?: { suppressionIntensity?: number; enableNoiseGate?: boolean; attenuationLimitDb?: number });
	loadModel(model: string | Uint8Array): Promise<void>;
	reset(): void;
	processFrame(input: Float32Array, output: Float32Array): Promise<void>;
	dispose(): Promise<void>;
}
