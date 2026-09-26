// Based on mezonai/mezon-ns commit 3f4b6993676497c58466a8d7e4b9484cde70bddc (web/src/mezon-onnx-engine.js).
import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime Web WASM paths
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;

const FFT_SIZE = 512;
const FREQ_BINS = 257;
const WIN_LENGTH = 400;
const HOP_LENGTH = 160;
const NUM_GRU_LAYERS = 2;
const GRU_HIDDEN_SIZE = 256;
const CONV_STATE_SIZE = 172544;

/**
 * High-performance 512-point Real FFT & Periodic Hann Window (Ported from fast_fft.hpp)
 */
class FastRealFFT512 {
	constructor() {
		this.N = FFT_SIZE;
		this.FREQ_BINS = FREQ_BINS;

		// 1. Bit-reversal permutation
		this.bitRev = new Int32Array(this.N);
		for (let i = 0; i < this.N; i++) {
			let rev = 0;
			let temp = i;
			for (let bit = 0; bit < 9; bit++) {
				rev = (rev << 1) | (temp & 1);
				temp >>= 1;
			}
			this.bitRev[i] = rev;
		}

		// 2. Precompute twiddle factors: exp(-2*pi*i*k/N)
		this.twiddleRe = new Float32Array(this.N / 2);
		this.twiddleIm = new Float32Array(this.N / 2);
		for (let k = 0; k < this.N / 2; k++) {
			const angle = (-2.0 * Math.PI * k) / this.N;
			this.twiddleRe[k] = Math.cos(angle);
			this.twiddleIm[k] = Math.sin(angle);
		}

		// 3. Periodic Hann window (length 400, periodic matches PyTorch)
		this.window = new Float32Array(WIN_LENGTH);
		for (let i = 0; i < WIN_LENGTH; i++) {
			this.window[i] = 0.5 * (1.0 - Math.cos((2.0 * Math.PI * i) / WIN_LENGTH));
		}

		// Scratch buffers
		this.re = new Float32Array(this.N);
		this.im = new Float32Array(this.N);
		this.tempRe = new Float32Array(this.N);
		this.tempIm = new Float32Array(this.N);
	}

	forward(input512, outMag, outPhase) {
		// Bit-reversal copy
		for (let i = 0; i < this.N; i++) {
			const rev = this.bitRev[i];
			this.re[rev] = input512[i];
			this.im[rev] = 0.0;
		}

		// Cooley-Tukey Radix-2 FFT
		for (let len = 2; len <= this.N; len <<= 1) {
			const half = len >> 1;
			const step = this.N / len;
			for (let i = 0; i < this.N; i += len) {
				for (let j = 0; j < half; j++) {
					const k = j * step;
					const uRe = this.re[i + j];
					const uIm = this.im[i + j];
					const vRe = this.re[i + j + half] * this.twiddleRe[k] - this.im[i + j + half] * this.twiddleIm[k];
					const vIm = this.re[i + j + half] * this.twiddleIm[k] + this.im[i + j + half] * this.twiddleRe[k];

					this.re[i + j] = uRe + vRe;
					this.im[i + j] = uIm + vIm;
					this.re[i + j + half] = uRe - vRe;
					this.im[i + j + half] = uIm - vIm;
				}
			}
		}

		// Compute magnitude and phase for bins 0..256
		for (let k = 0; k < FREQ_BINS; k++) {
			const r = this.re[k];
			const im = this.im[k];
			outMag[k] = Math.sqrt(r * r + im * im);
			outPhase[k] = Math.atan2(im, r);
		}
	}

	inverse(inMag, inPhase, out512) {
		// Reconstruct full Hermitian symmetric spectrum
		for (let k = 0; k < FREQ_BINS; k++) {
			this.re[k] = inMag[k] * Math.cos(inPhase[k]);
			this.im[k] = -inMag[k] * Math.sin(inPhase[k]); // Conjugate for IFFT
		}
		for (let k = FREQ_BINS; k < this.N; k++) {
			this.re[k] = this.re[this.N - k];
			this.im[k] = -this.im[this.N - k];
		}

		// Bit-reversal copy
		for (let i = 0; i < this.N; i++) {
			const rev = this.bitRev[i];
			this.tempRe[rev] = this.re[i];
			this.tempIm[rev] = this.im[i];
		}
		this.re.set(this.tempRe);
		this.im.set(this.tempIm);

		// Cooley-Tukey Radix-2 IFFT
		for (let len = 2; len <= this.N; len <<= 1) {
			const half = len >> 1;
			const step = this.N / len;
			for (let i = 0; i < this.N; i += len) {
				for (let j = 0; j < half; j++) {
					const k = j * step;
					const uRe = this.re[i + j];
					const uIm = this.im[i + j];
					const vRe = this.re[i + j + half] * this.twiddleRe[k] - this.im[i + j + half] * this.twiddleIm[k];
					const vIm = this.re[i + j + half] * this.twiddleIm[k] + this.im[i + j + half] * this.twiddleRe[k];

					this.re[i + j] = uRe + vRe;
					this.im[i + j] = uIm + vIm;
					this.re[i + j + half] = uRe - vRe;
					this.im[i + j + half] = uIm - vIm;
				}
			}
		}

		// Scale by 1/N
		const scale = 1.0 / this.N;
		for (let i = 0; i < this.N; i++) {
			out512[i] = this.re[i] * scale;
		}
	}
}

/**
 * Mezon Noise Suppression Engine for Web (React / Web Audio)
 */
export class MezonNSEngine {
	constructor(options = {}) {
		this.suppressionIntensity = options.suppressionIntensity ?? 1.0;
		// Match upstream's VAD default while preserving an explicit opt-out.
		this.enableNoiseGate = options.enableNoiseGate ?? true;
		this.attenuationLimitDb = options.attenuationLimitDb ?? 0.0;

		this.fft = new FastRealFFT512();

		// Internal state buffers
		this.inputBuffer = new Float32Array(WIN_LENGTH);
		this.outputBuffer = new Float32Array(WIN_LENGTH + HOP_LENGTH);
		this.windowedFrame = new Float32Array(FFT_SIZE);
		this.magSpec = new Float32Array(FREQ_BINS);
		this.phaseSpec = new Float32Array(FREQ_BINS);
		this.cleanMagSpec = new Float32Array(FREQ_BINS);
		this.synthFrame = new Float32Array(FFT_SIZE);

		// Recurrent GRU hidden state: shape [2, 1, 256]
		this.gruHidden = new Float32Array(NUM_GRU_LAYERS * 1 * GRU_HIDDEN_SIZE);
		// Stateful Causal Convolution cache: shape [1, 172544]
		this.convState = new Float32Array(CONV_STATE_SIZE);

		// Normalize the overlap-add output by the periodic sum of squared windows.
		this.wolaNormFactors = new Float32Array(HOP_LENGTH);
		const win = this.fft.window;
		for (let i = 0; i < HOP_LENGTH; i++) {
			let sumSq = 0.0;
			for (let k = 0; i + k * HOP_LENGTH < WIN_LENGTH; k++) {
				const w = win[i + k * HOP_LENGTH];
				sumSq += w * w;
			}
			this.wolaNormFactors[i] = sumSq > 1e-8 ? 1.0 / sumSq : 1.0;
		}

		// Adaptive noise floor & VAD state
		this.noiseFloor = 0.005;
		this.vadState = 0.0;

		this.session = null;
	}

	/**
	 * Load the ONNX model from URL or ArrayBuffer.
	 */
	async loadModel(modelUrlOrBuffer = '/mezon_ns.onnx') {
		const sessionOptions = {
			executionProviders: ['wasm'],
			graphOptimizationLevel: 'all'
		};

		if (typeof modelUrlOrBuffer === 'string') {
			this.session = await ort.InferenceSession.create(modelUrlOrBuffer, sessionOptions);
		} else {
			this.session = await ort.InferenceSession.create(modelUrlOrBuffer, sessionOptions);
		}

		this.reset();
	}

	async dispose() {
		await this.session?.release();
		this.session = null;
	}

	reset() {
		this.inputBuffer.fill(0.0);
		this.outputBuffer.fill(0.0);
		this.gruHidden.fill(0.0);
		this.convState.fill(0.0);
		this.noiseFloor = 0.005;
		this.vadState = 0.0;
	}

	/**
	 * Process a single 10ms frame (160 samples) of float audio [-1.0, 1.0].
	 * @param {Float32Array} inFrame - 160 samples input
	 * @param {Float32Array} outFrame - 160 samples output
	 */
	async processFrame(inFrame, outFrame) {
		if (!this.session) {
			outFrame.set(inFrame);
			return;
		}

		// 0. Zero-allocation adaptive noise floor tracking & VAD gating
		let gate = 1.0;
		if (this.enableNoiseGate) {
			let sumSq = 0.0;
			for (let i = 0; i < HOP_LENGTH; i++) {
				sumSq += inFrame[i] * inFrame[i];
			}
			const frameRms = Math.sqrt(sumSq / HOP_LENGTH);

			if (frameRms < this.noiseFloor) {
				this.noiseFloor = 0.95 * this.noiseFloor + 0.05 * frameRms;
			} else {
				this.noiseFloor = 0.999 * this.noiseFloor + 0.001 * frameRms;
			}

			const snrRatio = frameRms / Math.max(1e-6, this.noiseFloor);
			if (snrRatio > 2.5) {
				this.vadState = 0.8 * this.vadState + 0.2 * 1.0;
			} else {
				this.vadState = 0.9 * this.vadState + 0.1 * 0.0;
			}
			gate = 0.01 + 0.99 * Math.pow(this.vadState, 1.5);
		}

		// 1. Shift input buffer and append 160 new samples
		this.inputBuffer.copyWithin(0, HOP_LENGTH);
		this.inputBuffer.set(inFrame, WIN_LENGTH - HOP_LENGTH);

		// 2. Apply Periodic Hann Analysis Window
		const win = this.fft.window;
		for (let i = 0; i < WIN_LENGTH; i++) {
			this.windowedFrame[i] = this.inputBuffer[i] * win[i];
		}
		this.windowedFrame.fill(0.0, WIN_LENGTH);

		// 3. Real FFT -> Mag & Phase
		this.fft.forward(this.windowedFrame, this.magSpec, this.phaseSpec);

		// 4. ONNX Model Inference
		const inputTensor = new ort.Tensor('float32', this.magSpec, [1, 1, 1, FREQ_BINS]);
		const hTensor = new ort.Tensor('float32', this.gruHidden, [NUM_GRU_LAYERS, 1, GRU_HIDDEN_SIZE]);

		const feeds = {
			frame_input: inputTensor,
			h_in: hTensor
		};

		if (this.session.inputNames && this.session.inputNames.includes('conv_state_in')) {
			feeds.conv_state_in = new ort.Tensor('float32', this.convState, [1, CONV_STATE_SIZE]);
		}

		const results = await this.session.run(feeds);
		const mask = results.mask_output.data;
		const nextH = results.h_out.data;

		// Update recurrent GRU state
		this.gruHidden.set(nextH);

		// Update convolution state if present
		if (results.conv_state_out) {
			this.convState.set(results.conv_state_out.data);
		}

		// 5. Apply Gain Mask with psychoacoustic gamma, rumble cut, and VAD gating
		const gamma = this.suppressionIntensity > 0 ? this.suppressionIntensity : 1.0;
		const minGain = this.attenuationLimitDb > 0 ? Math.pow(10.0, -this.attenuationLimitDb / 20.0) : 0.0;

		for (let k = 0; k < FREQ_BINS; k++) {
			if (!Number.isFinite(mask[k])) throw new Error('Mezon-NS produced a non-finite gain mask');
			// WASM sigmoid rounding can produce tiny negative gains on silence.
			// Clamp before fractional gamma shaping to avoid NaN in the audio/OLA buffer.
			let m = Math.max(0.0, Math.min(1.0, mask[k]));

			// 5a. Attenuate sub-80Hz mechanical rumble (< 93.75 Hz: bins 0, 1, 2)
			if (k < 3) {
				m *= 0.001;
			}

			// 5b. Psychoacoustic gamma power shaping
			if (gamma !== 1.0) {
				m = Math.pow(m, gamma);
			}

			// 5c. VAD noise gate
			m *= gate;

			// 5d. Optional floor clamp
			if (minGain > 0.0 && m < minGain) {
				m = minGain;
			}

			this.cleanMagSpec[k] = this.magSpec[k] * m;
		}

		// 6. Inverse FFT
		this.fft.inverse(this.cleanMagSpec, this.phaseSpec, this.synthFrame);

		// 7. Synthesis Windowing and Overlap-Add
		for (let i = 0; i < WIN_LENGTH; i++) {
			this.outputBuffer[i] += this.synthFrame[i] * win[i];
		}

		// 8. Copy output hop frame with WOLA synthesis normalization
		for (let i = 0; i < HOP_LENGTH; i++) {
			outFrame[i] = this.outputBuffer[i] * this.wolaNormFactors[i];
		}

		// 9. Shift output buffer
		this.outputBuffer.copyWithin(0, HOP_LENGTH);
		this.outputBuffer.fill(0.0, this.outputBuffer.length - HOP_LENGTH);
	}

	/**
	 * Process a full AudioBuffer or Float32Array offline (for file previews)
	 */
	async processAudioBuffer(inputSamples) {
		const totalSamples = inputSamples.length;
		const outputSamples = new Float32Array(totalSamples);
		const inChunk = new Float32Array(HOP_LENGTH);
		const outChunk = new Float32Array(HOP_LENGTH);

		this.reset();

		let offset = 0;
		while (offset < totalSamples) {
			const len = Math.min(HOP_LENGTH, totalSamples - offset);
			inChunk.fill(0);
			inChunk.set(inputSamples.subarray(offset, offset + len));

			await this.processFrame(inChunk, outChunk);
			outputSamples.set(outChunk.subarray(0, len), offset);

			offset += len;
		}

		return outputSamples;
	}
}
