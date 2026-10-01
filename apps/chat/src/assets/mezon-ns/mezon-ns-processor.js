/** Bridges 128-sample render quanta and 160-sample Mezon-NS inference frames. */
class MezonNSAudioProcessor extends AudioWorkletProcessor {
	constructor(options) {
		super();
		this.FRAME_SIZE = 160;
		this.RING_SIZE = 4096;
		// Cover short main-thread scheduling pauses without falling back to raw mic audio.
		this.OUTPUT_PREFILL = this.FRAME_SIZE * 6;
		this.FADE_SAMPLES = 320; // 20ms at 16kHz, ramped per sample rather than per quantum.
		this.inBuffer = new Float32Array(this.RING_SIZE);
		this.inWritePos = 0;
		this.inReadPos = 0;
		this.inAvailable = 0;
		this.outBuffer = new Float32Array(this.RING_SIZE);
		this.outWritePos = 0;
		this.outReadPos = 0;
		this.outAvailable = 0;
		this.outputReady = false;
		this.tempFrame = new Float32Array(this.FRAME_SIZE);
		this.requestId = 0;
		this.denoisingEnabled = options?.processorOptions?.denoisingEnabled ?? true;
		this.modeReady = false;
		this.outputEnabled = false;
		this.outputGain = 0;
		this.underrunReported = false;
		this.inferencePort = null;
		// Let the analysis window and model see real microphone samples before readiness.
		this.startupFramesToDiscard = 6;
		this.port.onmessage = ({ data: msg }) => {
			if (!msg) return;
			if (msg.type === 'clean_frame' && msg.requestId === this.requestId) {
				this.acceptCleanFrame(msg);
			} else if (msg.type === 'bind_inference_port') {
				this.inferencePort = msg.port;
				this.inferencePort.onmessage = ({ data }) => {
					if (data?.type === 'clean_frame' && data.requestId === this.requestId) this.acceptCleanFrame(data);
				};
			} else if (msg.type === 'set_mode') {
				this.requestId = msg.requestId;
				this.denoisingEnabled = !!msg.enabled;
				this.modeReady = false;
				this.outputEnabled = false;
				this.outputGain = 0;
				this.underrunReported = false;
				// Discard old queued output; a new enable must wait for fresh filtered frames.
				this.outReadPos = this.outWritePos;
				this.outAvailable = 0;
				this.outputReady = false;
				if (!this.denoisingEnabled) this.acknowledgeMode();
			} else if (msg.type === 'set_output_enabled' && msg.requestId === this.requestId) {
				this.outputEnabled = !!msg.enabled;
				if (!this.outputEnabled) this.outputGain = 0;
			} else if (msg.type === 'dispose') {
				this.inferencePort?.close();
				this.inferencePort = null;
			}
		};
	}

	acceptCleanFrame(msg) {
		if (this.startupFramesToDiscard > 0) {
			this.startupFramesToDiscard--;
			return;
		}
		this.enqueueOutput(msg.frame);
	}

	acknowledgeMode() {
		if (this.modeReady) return;
		this.modeReady = true;
		this.port.postMessage({ type: 'mode_applied', requestId: this.requestId, enabled: this.denoisingEnabled });
	}

	enqueueOutput(frame) {
		for (let i = 0; i < frame.length && this.outAvailable < this.RING_SIZE; i++) {
			this.outBuffer[this.outWritePos] = frame[i];
			this.outWritePos = (this.outWritePos + 1) % this.RING_SIZE;
			this.outAvailable++;
		}
		if (this.outAvailable >= this.OUTPUT_PREFILL) {
			this.outputReady = true;
			this.acknowledgeMode();
		}
	}

	process(inputs, outputs) {
		const inChannel = inputs[0]?.[0];
		const output = outputs[0];
		if (!inChannel || !output?.[0]) return true;
		const outChannel = output[0];
		for (let i = 0; i < inChannel.length; i++) {
			const sample = inChannel[i];
			if (this.inAvailable < this.RING_SIZE) {
				this.inBuffer[this.inWritePos] = sample;
				this.inWritePos = (this.inWritePos + 1) % this.RING_SIZE;
				this.inAvailable++;
			}
		}
		// Inference continues in bypass mode, preserving GRU, convolution, and VAD state.
		while (this.inAvailable >= this.FRAME_SIZE) {
			for (let i = 0; i < this.FRAME_SIZE; i++) {
				this.tempFrame[i] = this.inBuffer[this.inReadPos];
				this.inReadPos = (this.inReadPos + 1) % this.RING_SIZE;
			}
			this.inAvailable -= this.FRAME_SIZE;
			const frame = this.tempFrame.slice();
			(this.inferencePort || this.port).postMessage({ type: 'process_frame', requestId: this.requestId, frame }, [frame.buffer]);
		}
		let underrun = false;
		for (let i = 0; i < outChannel.length; i++) {
			let cleanSample = 0;
			if (this.outputReady && this.outAvailable > 0) {
				cleanSample = this.outBuffer[this.outReadPos];
				this.outReadPos = (this.outReadPos + 1) % this.RING_SIZE;
				this.outAvailable--;
			} else if (this.denoisingEnabled && this.modeReady && this.outputEnabled) {
				underrun = true;
			}
			if (this.outputEnabled && this.modeReady) this.outputGain = Math.min(1, this.outputGain + 1 / this.FADE_SAMPLES);
			else this.outputGain = 0;
			// While ON there is no raw fallback or raw/clean crossfade, even during an underrun.
			const sample = (this.denoisingEnabled ? cleanSample : inChannel[i]) * this.outputGain;
			outChannel[i] = sample;
		}
		if (underrun && !this.underrunReported) {
			this.underrunReported = true;
			this.port.postMessage({ type: 'output_underrun', requestId: this.requestId });
		}
		if (this.outAvailable === 0) this.outputReady = false;
		for (let ch = 1; ch < output.length; ch++) output[ch].set(outChannel);
		return true;
	}
}
registerProcessor('mezon-ns-processor', MezonNSAudioProcessor);
