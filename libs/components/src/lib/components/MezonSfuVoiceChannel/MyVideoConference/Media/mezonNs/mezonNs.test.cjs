// Run directly with node --test; no app build or browser microphone is needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
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

test('VAD is enabled by default and suppresses steady low-level background by about 40 dB', async () => {
	const defaultEnergy = await toneEnergy(createEngine(), 0.002);
	const enabledEnergy = await toneEnergy(createEngine({ enableNoiseGate: true }), 0.002);
	const disabledEnergy = await toneEnergy(createEngine({ enableNoiseGate: false }), 0.002);
	assert.ok(disabledEnergy > 0);
	assert.equal(defaultEnergy, enabledEnergy);
	assert.ok(defaultEnergy / disabledEnergy < 0.00011);
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
	assert.ok(noiseEnergy / rawNoiseEnergy < 0.0005);
	// A fresh stream must not inherit an open gate or recurrent audio state.
	gated.reset();
	assert.equal(await toneEnergy(gated, 0.002), await toneEnergy(createEngine(), 0.002));
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
	for (let i = 0; i < 8; i++) cleanFrame(worklet);
	assert.ok(worklet.sent.some((message) => message.type === 'mode_applied' && message.requestId === worklet.requestId));
}

test('startup waits for warm live inference frames and readiness never releases output by itself', () => {
	const worklet = createWorklet();
	for (let i = 0; i < 7; i++) cleanFrame(worklet);
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
	for (let i = 0; i < 3; i++) render(worklet);
	assert.ok(render(worklet).every((sample) => sample === 0));
	cleanFrame(worklet);
	assert.ok(render(worklet).every((sample) => sample === 0));
	cleanFrame(worklet);
	assert.ok(render(worklet).every((sample) => Math.abs(sample - 0.01) < 1e-7));
	assert.ok(render(worklet).every((sample) => Math.abs(sample - 0.01) < 1e-7));
	const partial = render(worklet);
	assert.ok(partial.subarray(0, 64).every((sample) => Math.abs(sample - 0.01) < 1e-7));
	assert.ok(partial.subarray(64).every((sample) => sample === 0));
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

test('updated ONNX model runs with the web engine and produces finite stateful audio', async () => {
	const ort = require('onnxruntime-web');
	const Engine = loadEngine(ort);
	const engine = new Engine({ suppressionIntensity: 1.6 });
	try {
		await engine.loadModel(fs.readFileSync(path.join(assetPath, 'mezon_ns.onnx')));
		assert.deepEqual(engine.session.inputNames, ['frame_input', 'h_in', 'conv_state_in']);
		assert.deepEqual(engine.session.outputNames, ['mask_output', 'h_out', 'conv_state_out']);
		await toneEnergy(engine, 0, 3);
		assert.ok((await toneEnergy(engine, 0.12, 20)) > 0);
	} finally {
		await engine.dispose();
	}
});
