// Run directly with node --test; no app build or browser microphone is needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { createHash } = require('node:crypto');
const vm = require('node:vm');

const engineSource = fs.readFileSync(path.join(__dirname, 'mezon-onnx-engine.js'), 'utf8');
const assetPath = path.resolve(__dirname, '../../../../../../../../../apps/chat/src/assets/mezon-ns');

function loadEngine(ort) {
	const source = engineSource.replace("import * as ort from 'onnxruntime-web';", '').replace('export class MezonNSEngine', 'class MezonNSEngine');
	return vm.runInNewContext(`${source}\nMezonNSEngine;`, { ort, Float32Array, Int32Array });
}

function createEngine(options, maskValue = 1) {
	const Engine = loadEngine({
		env: { wasm: {} },
		Tensor: class {
			constructor(_type, data, dims) {
				this.data = data;
				this.dims = dims;
			}
		}
	});
	const engine = new Engine(options);
	// A unity mask isolates the VAD behavior from the learned model's suppression.
	engine.session = {
		inputNames: ['frame_input', 'h_in', 'conv_state_in'],
		async run(feeds) {
			return {
				mask_output: { data: new Float32Array(257).fill(maskValue) },
				h_out: { data: feeds.h_in.data },
				conv_state_out: { data: feeds.conv_state_in.data }
			};
		}
	};
	return engine;
}

async function toneEnergy(engine, amplitude, frames = 60) {
	const input = Float32Array.from({ length: 160 }, (_, i) => amplitude * Math.sin((2 * Math.PI * 1000 * i) / 16000));
	const output = new Float32Array(160);
	let energy = 0;
	for (let frame = 0; frame < frames; frame++) {
		await engine.processFrame(input, output);
		assert.ok(output.every(Number.isFinite));
		// Measure the settled signal after analysis/synthesis and VAD attack.
		if (frame >= frames - 10) energy += output.reduce((sum, value) => sum + value * value, 0);
	}
	return energy;
}

test('VAD is enabled by default and softly attenuates ambient noise without a hard mute', async () => {
	const defaultEnergy = await toneEnergy(createEngine(), 0.002);
	const enabledEnergy = await toneEnergy(createEngine({ enableNoiseGate: true }), 0.002);
	const disabledEnergy = await toneEnergy(createEngine({ enableNoiseGate: false }), 0.002);
	assert.ok(disabledEnergy > 0);
	assert.equal(defaultEnergy, enabledEnergy);
	const ratio = defaultEnergy / disabledEnergy;
	// The revised gate keeps about -18 dB of ambient signal, rather than -40 dB.
	assert.ok(ratio > 0.014 && ratio < 0.018);
});

test('VAD opens for a stronger speech-like signal and closes when background returns', async () => {
	const gated = createEngine();
	const ungated = createEngine({ enableNoiseGate: false });
	await toneEnergy(gated, 0.002);
	await toneEnergy(ungated, 0.002);
	const speechEnergy = await toneEnergy(gated, 0.12);
	const rawSpeechEnergy = await toneEnergy(ungated, 0.12);
	assert.ok(speechEnergy / rawSpeechEnergy > 0.95);
	const noiseEnergy = await toneEnergy(gated, 0.002);
	const rawNoiseEnergy = await toneEnergy(ungated, 0.002);
	assert.ok(noiseEnergy / rawNoiseEnergy > 0.014 && noiseEnergy / rawNoiseEnergy < 0.04);
	// A fresh stream must not inherit an open gate or recurrent audio state.
	gated.reset();
	assert.equal(await toneEnergy(gated, 0.002), await toneEnergy(createEngine(), 0.002));
});

test('VAD opens immediately for soft speech after calibration and holds through short pauses', async () => {
	const engine = createEngine();
	await toneEnergy(engine, 0.0004, 40);
	const speech = Float32Array.from({ length: 160 }, (_, i) => 0.004 * Math.sin((2 * Math.PI * 1000 * i) / 16000));
	const quiet = new Float32Array(160);
	const output = new Float32Array(160);
	await engine.processFrame(speech, output);
	assert.equal(engine.vadState, 1, 'The first speech frame must open the gate');
	for (let i = 0; i < 25; i++) {
		await engine.processFrame(quiet, output);
		assert.equal(engine.vadState, 1, 'Short pauses must not cut off the voice tail');
	}
	await engine.processFrame(quiet, output);
	assert.ok(engine.vadState > 0 && engine.vadState < 1, 'Gate release begins after the hangover');
	for (let i = 0; i < 30; i++) await engine.processFrame(quiet, output);
	assert.ok(engine.vadState < 0.01);
	engine.reset();
	assert.equal(engine.vadState, 0);
	assert.equal(engine.hangoverFrames, 0);
	assert.equal(engine.startupFrames, 0);
});

test('ambient calibration does not raise the learned noise floor during continuous speech', async () => {
	const engine = createEngine();
	await toneEnergy(engine, 0.002, 40);
	const floorBeforeSpeech = engine.noiseFloor;
	assert.ok(floorBeforeSpeech > 0.001 && floorBeforeSpeech < 0.002);
	await toneEnergy(engine, 0.03, 100);
	assert.equal(engine.noiseFloor, floorBeforeSpeech, 'Speech must not be learned as background noise');
	assert.equal(engine.vadState, 1);
});

test('silent FFT magnitudes are floored before inference to match the updated model preprocessing', async () => {
	const engine = createEngine();
	const run = engine.session.run;
	let magnitudes;
	engine.session.run = async (feeds) => {
		magnitudes = feeds.frame_input.data.slice();
		return run(feeds);
	};
	await engine.processFrame(new Float32Array(160), new Float32Array(160));
	assert.ok(magnitudes.every((value) => value >= Math.fround(1e-5)));
});

test('quiet speech is normalized for inference without changing its reconstructed loudness', async () => {
	const baseline = createEngine({ enableNoiseGate: false });
	const normalized = createEngine({ enableNoiseGate: false, modelInputTargetDbfs: -20 });
	const input = Float32Array.from({ length: 160 }, (_, i) => 0.003 * Math.sin((2 * Math.PI * 1000 * i) / 16000));
	const baselineOutput = new Float32Array(160);
	const normalizedOutput = new Float32Array(160);
	let baselineMagnitude = 0;
	let normalizedMagnitude = 0;
	for (const [engine, record] of [
		[baseline, (magnitude) => (baselineMagnitude = magnitude)],
		[normalized, (magnitude) => (normalizedMagnitude = magnitude)]
	]) {
		const run = engine.session.run;
		engine.session.run = async (feeds) => {
			record(feeds.frame_input.data[20]);
			return run(feeds);
		};
	}
	for (let frame = 0; frame < 10; frame++) {
		await baseline.processFrame(input, baselineOutput);
		await normalized.processFrame(input, normalizedOutput);
	}
	assert.ok(normalizedMagnitude > baselineMagnitude * 10, 'The model should see a quiet voice in its trained level range');
	assert.deepEqual(normalizedOutput, baselineOutput, 'A unity mask must reconstruct the unamplified microphone signal');
	normalized.reset();
	assert.equal(normalized.modelLevelRms, 0, 'A new stream must not inherit the previous model level');
});

test('tiny negative model gains cannot poison fractional gamma shaping with NaN', async () => {
	assert.equal(await toneEnergy(createEngine({ suppressionIntensity: 1.6 }, -5.960464477539063e-8), 0.12), 0);
});

test('invalid model gains fail explicitly so the pipeline can fall back to native processing', async () => {
	await assert.rejects(toneEnergy(createEngine({}, NaN), 0.12), /non-finite gain mask/);
});

function createWorklet() {
	let Processor;
	vm.runInNewContext(fs.readFileSync(path.join(assetPath, 'mezon-ns-processor.js'), 'utf8'), {
		AudioWorkletProcessor: class {
			constructor() {
				this.sent = [];
				this.port = { postMessage: (message) => this.sent.push(message) };
			}
		},
		registerProcessor(_name, implementation) {
			Processor = implementation;
		}
	});
	return new Processor();
}

function render(worklet) {
	const input = new Float32Array(128).fill(0.4);
	const output = [new Float32Array(128), new Float32Array(128)];
	assert.equal(worklet.process([[input]], [output]), true);
	assert.deepEqual(output[1], output[0]);
	return output[0];
}

function cleanFrame(worklet, value = 0.01, requestId = worklet.requestId) {
	worklet.port.onmessage({ data: { type: 'clean_frame', requestId, frame: new Float32Array(160).fill(value) } });
}

function release(worklet, enabled = true, requestId = worklet.requestId) {
	worklet.port.onmessage({ data: { type: 'set_output_enabled', requestId, enabled } });
}

function warmWorklet(worklet) {
	for (let i = 0; i < 12; i++) cleanFrame(worklet);
	assert.ok(worklet.sent.some((message) => message.type === 'mode_applied' && message.requestId === worklet.requestId));
}

test('startup waits for warm live inference frames and readiness never releases output by itself', () => {
	const worklet = createWorklet();
	for (let i = 0; i < 11; i++) cleanFrame(worklet);
	assert.ok(!worklet.sent.some((message) => message.type === 'mode_applied'));
	assert.ok(render(worklet).every((sample) => sample === 0));
	// The first buffered frame has not been consumed while outputReady is false.
	cleanFrame(worklet);
	assert.ok(worklet.sent.some((message) => message.type === 'mode_applied'));
	assert.ok(render(worklet).every((sample) => sample === 0));
});

test('enabling rejects stale frames and only fades in fresh filtered audio after release', () => {
	const worklet = createWorklet();
	warmWorklet(worklet);
	worklet.port.onmessage({ data: { type: 'set_mode', requestId: 1, enabled: false } });
	release(worklet);
	for (let i = 0; i < 3; i++) render(worklet);
	assert.ok(render(worklet).every((sample) => Math.abs(sample - 0.4) < 1e-7));
	worklet.port.onmessage({ data: { type: 'set_mode', requestId: 2, enabled: true } });
	assert.ok(render(worklet).every((sample) => sample === 0));
	for (let i = 0; i < 8; i++) cleanFrame(worklet, 0.4, 1);
	release(worklet, true, 1);
	assert.ok(render(worklet).every((sample) => sample === 0));
	assert.ok(!worklet.sent.some((message) => message.type === 'mode_applied' && message.requestId === 2));
	for (let i = 0; i < 8; i++) cleanFrame(worklet);
	assert.ok(worklet.sent.some((message) => message.type === 'mode_applied' && message.requestId === 2));
	assert.ok(render(worklet).every((sample) => sample === 0));
	release(worklet);
	const fade = render(worklet);
	assert.ok(fade[0] > 0 && fade[0] < 0.001);
	assert.ok(fade.every((sample, index) => sample <= 0.01 && (index === 0 || sample >= fade[index - 1])));
	for (let i = 0; i < 2; i++) render(worklet);
	assert.ok(render(worklet).every((sample) => Math.abs(sample - 0.01) < 1e-7));
});

test('user mute holds output silent while inference continues in bypass', () => {
	const worklet = createWorklet();
	warmWorklet(worklet);
	worklet.port.onmessage({ data: { type: 'set_mode', requestId: 1, enabled: false } });
	release(worklet, false);
	const framesBefore = worklet.sent.filter((message) => message.type === 'process_frame').length;
	for (let i = 0; i < 10; i++) assert.ok(render(worklet).every((sample) => sample === 0));
	assert.ok(worklet.sent.filter((message) => message.type === 'process_frame').length > framesBefore);
});

test('filtered underruns are silent and refill without falling back to raw audio', () => {
	const worklet = createWorklet();
	warmWorklet(worklet);
	release(worklet);
	for (let i = 0; i < 8; i++) render(worklet);
	assert.ok(render(worklet).every((sample) => sample === 0));
	assert.equal(worklet.sent.filter((message) => message.type === 'output_underrun').length, 1);
	for (let i = 0; i < 5; i++) cleanFrame(worklet);
	assert.ok(render(worklet).every((sample) => sample === 0));
	cleanFrame(worklet);
	assert.ok(render(worklet).every((sample) => Math.abs(sample - 0.01) < 1e-7));
	assert.ok(render(worklet).every((sample) => Math.abs(sample - 0.01) < 1e-7));
});

test('filtered playout survives a 48 ms inference scheduling pause', () => {
	const worklet = createWorklet();
	warmWorklet(worklet);
	release(worklet);
	for (let i = 0; i < 6; i++) {
		assert.ok(render(worklet).every((sample) => sample > 0));
	}
	for (let i = 0; i < 6; i++) cleanFrame(worklet);
	assert.ok(render(worklet).every((sample) => Math.abs(sample - 0.01) < 1e-7));
});

test('worklet bridges 128-sample quanta and delayed 160-sample frames without periodic gaps', () => {
	const worklet = createWorklet();
	let pending = [];
	let started = false;
	worklet.port.postMessage = (message) => {
		if (message.type === 'process_frame') pending.push(message);
		if (message.type === 'mode_applied') release(worklet);
	};
	for (let quantum = 0; quantum < 100; quantum++) {
		const completed = pending;
		pending = [];
		for (const message of completed) cleanFrame(worklet, 0.01, message.requestId);
		const output = render(worklet);
		if (started) assert.ok(output.every((sample) => Math.abs(sample - 0.01) < 1e-7));
		if (worklet.outputGain === 1) started = true;
	}
	assert.ok(started);
});

test('asym babble ONNX model runs with the web engine and produces finite stateful audio', async () => {
	const ort = require('onnxruntime-web');
	const Engine = loadEngine(ort);
	const engine = new Engine({ suppressionIntensity: 1.6, attenuationLimitDb: 15, modelInputTargetDbfs: -20 });
	try {
		const model = fs.readFileSync(path.join(assetPath, 'mezon_ns_asym_babble.onnx'));
		assert.equal(createHash('sha256').update(model).digest('hex'), 'c68b7e5e728cb846c75cab83df171fba85cc359d5a70532bb588d966c44e70a3');
		await engine.loadModel(model);
		assert.deepEqual(engine.session.inputNames, ['frame_input', 'h_in', 'conv_state_in']);
		assert.deepEqual(engine.session.outputNames, ['mask_output', 'h_out', 'conv_state_out']);
		await toneEnergy(engine, 0, 3);
		const protectedEnergy = await toneEnergy(engine, 0.12, 20);
		const rawEnergy = await toneEnergy(createEngine({ enableNoiseGate: false }), 0.12, 20);
		assert.ok(protectedEnergy / rawEnergy > 0.02, 'The attenuation floor must keep a strong input from becoming silent');
	} finally {
		await engine.dispose();
	}
});
