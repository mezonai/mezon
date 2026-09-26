// Exercises the actual TypeScript pipeline and worklet together with an in-memory audio graph.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const workletSource = fs.readFileSync(
	path.resolve(__dirname, '../../../../../../../../../apps/chat/src/assets/mezon-ns/mezon-ns-processor.js'),
	'utf8'
);
const pipelineSource = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'MezonNsAudioPipeline.ts'), 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText;
const flush = () => new Promise((done) => setImmediate(done));

function createHarness() {
	const logs = [];
	let Processor;
	vm.runInNewContext(workletSource, {
		AudioWorkletProcessor: class {
			constructor() {
				this.port = { postMessage() {} };
			}
		},
		registerProcessor(_name, implementation) {
			Processor = implementation;
		}
	});
	const stats = {
		logs,
		loads: 0,
		downloads: 0,
		resets: 0,
		frames: 0,
		disposals: 0,
		failNextDownload: false,
		failInference: false,
		blockInitialization: false
	};
	const timers = new Map();
	let nextTimer = 0;
	const contexts = [];
	class Engine {
		async loadModel() {
			stats.loads++;
			if (stats.blockInitialization)
				await new Promise((done) => {
					stats.releaseInitialization = done;
				});
		}
		reset() {
			stats.resets++;
		}
		async processFrame(_input, output) {
			stats.frames++;
			stats.lastInput = _input.slice();
			if (stats.failInference) throw new Error('inference failed');
			output.fill(0.01);
		}
		async dispose() {
			stats.disposals++;
		}
	}
	class Context {
		constructor() {
			this.sampleRate = 16000;
			this.state = 'suspended';
			this.audioWorklet = { addModule: async () => {} };
			contexts.push(this);
		}
		createMediaStreamSource(stream) {
			this.inputTrack = stream.tracks[0];
			return {
				connect: (node) => {
					this.node = node;
				},
				disconnect() {}
			};
		}
		createMediaStreamDestination() {
			const track = {
				enabled: true,
				stopped: false,
				stop() {
					this.stopped = true;
				}
			};
			return { stream: { getAudioTracks: () => [track] }, disconnect() {} };
		}
		async resume() {
			this.state = 'running';
			this.startup = this.pump(16);
		}
		async close() {
			this.state = 'closed';
		}
		async pump(quanta) {
			for (let i = 0; i < quanta && this.state === 'running'; i++) {
				const input = new Float32Array(128).fill(this.inputTrack.enabled ? 0.4 : 0);
				this.lastOutput = new Float32Array(128);
				this.node.processor.process([[input]], [[this.lastOutput]]);
				await flush();
			}
		}
	}
	class WorkletNode {
		constructor() {
			this.processor = new Processor();
			this.port = {
				postMessage: (data) => queueMicrotask(() => this.processor.port.onmessage?.({ data })),
				close() {}
			};
			this.processor.port.postMessage = (data) => queueMicrotask(() => this.port.onmessage?.({ data }));
		}
		connect() {}
		disconnect() {}
	}
	const sandbox = {
		exports: {},
		require: (name) => {
			if (name === 'onnxruntime-web') return { env: { wasm: {} } };
			if (name === './mezon-onnx-engine') return { MezonNSEngine: Engine };
			throw new Error(`Unexpected import: ${name}`);
		},
		fetch: async () => {
			stats.downloads++;
			if (stats.failNextDownload) {
				stats.failNextDownload = false;
				throw new Error('network failed');
			}
			return { ok: true, arrayBuffer: async () => new ArrayBuffer(16) };
		},
		window: { AudioContext: Context },
		AudioContext: Context,
		AudioWorkletNode: WorkletNode,
		MediaStream: class {
			constructor(tracks) {
				this.tracks = tracks;
			}
		},
		process: { env: { NODE_ENV: 'development' } },
		AbortController,
		Float32Array,
		Uint8Array,
		console: { info: (...args) => logs.push(args), debug: (...args) => logs.push(args), warn() {} },
		setTimeout: (fn) => {
			const id = ++nextTimer;
			timers.set(id, fn);
			return id;
		},
		clearTimeout: (id) => timers.delete(id)
	};
	vm.runInNewContext(pipelineSource, sandbox);
	return {
		Pipeline: sandbox.exports.MezonNsAudioPipeline,
		stats,
		contexts,
		timeout() {
			for (const callback of [...timers.values()]) callback();
		}
	};
}

function withClone(track) {
	track.clone = () => ({
		enabled: track.enabled,
		stopped: false,
		stop() {
			this.stopped = true;
		}
	});
	return track;
}

async function readyPipeline(harness, enabled = true, onFailure = () => {}) {
	const input = withClone({ enabled });
	const pipeline = await harness.Pipeline.create(input, onFailure);
	const context = harness.contexts.at(-1);
	await context.startup;
	return { pipeline, input, context };
}

test('readiness keeps capture alive and transmission blocked until explicitly released', async () => {
	const harness = createHarness();
	const { pipeline, input, context } = await readyPipeline(harness);
	try {
		assert.equal(input.enabled, true);
		assert.equal(pipeline.isDenoisingReady, true);
		assert.equal(pipeline.track.enabled, false);
		pipeline.setOutputEnabled(true);
		await context.pump(5);
		assert.equal(pipeline.track.enabled, true);
		assert.ok(context.lastOutput.every((sample) => Math.abs(sample - 0.01) < 1e-7));
	} finally {
		pipeline.dispose();
	}
});

test('toggle reuses the engine, keeps inference running, and never reopens a user-muted output', async () => {
	const harness = createHarness();
	const { pipeline, input, context } = await readyPipeline(harness);
	try {
		pipeline.setOutputEnabled(true);
		assert.equal(await pipeline.setDenoisingEnabled(false), true);
		const frames = harness.stats.frames;
		await context.pump(8);
		assert.ok(harness.stats.frames > frames);
		assert.ok(context.lastOutput.every((sample) => Math.abs(sample - 0.4) < 1e-7));
		input.enabled = false; // User mute is distinct from temporary output gating.
		pipeline.setOutputEnabled(false);
		const mutedFrames = harness.stats.frames;
		const enabling = pipeline.setDenoisingEnabled(true);
		assert.equal(pipeline.track.enabled, false);
		await context.pump(10);
		assert.equal(await enabling, true);
		assert.equal(pipeline.track.enabled, false);
		assert.equal(input.enabled, false);
		assert.equal(harness.stats.frames, mutedFrames);
		assert.equal(harness.stats.loads, 1);
		assert.equal(harness.stats.resets, 1);
	} finally {
		pipeline.dispose();
	}
});

test('rapid on/off/on cancels stale readiness and applies only the latest mode', async () => {
	const harness = createHarness();
	const { pipeline, context } = await readyPipeline(harness);
	try {
		await pipeline.setDenoisingEnabled(false);
		const first = pipeline.setDenoisingEnabled(true);
		const second = pipeline.setDenoisingEnabled(false);
		const latest = pipeline.setDenoisingEnabled(true);
		assert.equal(await first, false);
		assert.equal(await second, false);
		context.node.port.onmessage({ data: { type: 'mode_applied', requestId: 2, enabled: true } });
		assert.equal(pipeline.isDenoisingReady, false);
		await context.pump(12);
		assert.equal(await latest, true);
		assert.equal(pipeline.isDenoisingReady, true);
	} finally {
		pipeline.dispose();
	}
});

test('readiness timeout reports failure and cannot publish raw audio while ON', async () => {
	const harness = createHarness();
	const failures = [];
	const { pipeline } = await readyPipeline(harness, true, (error) => failures.push(error));
	try {
		await pipeline.setDenoisingEnabled(false);
		pipeline.setOutputEnabled(true);
		const enabling = pipeline.setDenoisingEnabled(true);
		harness.timeout();
		assert.equal(await enabling, false);
		assert.equal(failures.length, 1);
		assert.equal(pipeline.isDenoisingReady, false);
		pipeline.setOutputEnabled(true);
		assert.equal(pipeline.track.enabled, false);
	} finally {
		pipeline.dispose();
	}
});

test('inference failure blocks output and reports only one failure', async () => {
	const harness = createHarness();
	const failures = [];
	const { pipeline, context } = await readyPipeline(harness, true, (error) => failures.push(error));
	try {
		pipeline.setOutputEnabled(true);
		harness.stats.failInference = true;
		await context.pump(8);
		assert.equal(failures.length, 1);
		assert.equal(pipeline.isDenoisingReady, false);
		assert.equal(pipeline.track.enabled, false);
	} finally {
		pipeline.dispose();
	}
});

test('preload caches model bytes across microphone changes and retries failed downloads', async () => {
	const harness = createHarness();
	harness.stats.failNextDownload = true;
	await assert.rejects(harness.Pipeline.preload(), /network failed/);
	await harness.Pipeline.preload();
	const first = await readyPipeline(harness);
	first.pipeline.dispose();
	const second = await readyPipeline(harness);
	second.pipeline.dispose();
	assert.equal(harness.stats.downloads, 2); // One failure, one successful cached download.
	assert.equal(harness.stats.loads, 2); // Separate live streams own separate recurrent state.
});

// Execute the room's actual callbacks to check publishing/mute rules alongside the audio graph.
const roomSource = fs.readFileSync(path.join(__dirname, '../../MezonSfuVoiceRoom.tsx'), 'utf8');
const roomAst = ts.createSourceFile('room.tsx', roomSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function roomCallback(hook, marker) {
	let callback;
	function visit(node) {
		if (ts.isCallExpression(node) && node.expression.getText(roomAst) === hook && node.arguments[0]?.getText(roomAst).includes(marker)) {
			callback = node.arguments[0].getText(roomAst);
		}
		ts.forEachChild(node, visit);
	}
	visit(roomAst);
	assert.ok(callback, `Room callback not found: ${marker}`);
	return ts.transpileModule(`(() => { const callback = ${callback}; return callback; })()`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } })
		.outputText;
}
const outgoingCallback = roomCallback('useCallback', 'All publishing paths');
const audioEnabledCallback = roomCallback('useCallback', 'inputTrack.enabled = enabled');
const modeCallback = roomCallback('useLayoutEffect', 'Block transmission');
const initCallback = roomCallback('useEffect', '++mezonNsGenerationRef.current');

function roomSandbox(harness, input, pipeline = null) {
	withClone(input);
	const actions = [];
	const tracks = [input];
	const sender = {
		track: pipeline?.track || input,
		async replaceTrack(track) {
			this.track = track;
		}
	};
	const sandbox = {
		noiseSuppressionEnabled: true,
		noiseSuppressionEnabledRef: { current: true },
		mezonNsPipelineRef: { current: pipeline },
		mezonNsGenerationRef: { current: 0 },
		mezonNsUnavailable: false,
		localAudioTrack: input,
		localStreamRef: {
			current: {
				getAudioTracks: () => tracks,
				getTracks: () => tracks,
				removeTrack: (track) => tracks.splice(tracks.indexOf(track), 1),
				addTrack: (track) => tracks.push(track)
			}
		},
		pcRef: { current: { getTransceivers: () => [{ mid: '0', sender }] } },
		MezonNsAudioPipeline: harness.Pipeline,
		MediaStream: class {
			constructor(tracks) {
				this.tracks = tracks;
			}
		},
		DOMException,
		navigator: {
			mediaDevices: {
				async getUserMedia() {
					throw new Error('Unexpected microphone reopen');
				}
			}
		},
		getMezonNsAudioCaptureOptions: () => ({}),
		getNoiseSuppressionAudioCaptureOptions: () => ({}),
		setMezonNsUnavailable: (value) => {
			sandbox.mezonNsUnavailable = value;
		},
		setProcessedAudioTrack: (track) => {
			sandbox.processedAudioTrack = track;
		},
		setLocalAudioTrack: (track) => {
			sandbox.localAudioTrack = track;
		},
		setSelectedMicrophone() {},
		setLocalPreview() {},
		voiceActions: {
			setNoiseSuppressionReady: (payload) => ({ type: 'ready', payload }),
			setNoiseSuppressionEnabled: (payload) => ({ type: 'enabled', payload })
		},
		dispatch: (action) => actions.push(action),
		handleMezonNsFailure: (error) => {
			throw error;
		},
		console: { debug() {}, warn() {} }
	};
	sandbox.getOutgoingAudioTrack = vm.runInNewContext(outgoingCallback, sandbox);
	sandbox.setAudioTrackEnabled = vm.runInNewContext(audioEnabledCallback, sandbox);
	return { sandbox, actions, sender };
}

test('room blocks every raw publishing path while noise is requested but no pipeline is ready', async () => {
	const harness = createHarness();
	const input = { enabled: true };
	const { sandbox, sender, actions } = roomSandbox(harness, input);
	assert.equal(sandbox.getOutgoingAudioTrack(input), null);
	vm.runInNewContext(modeCallback, sandbox)();
	await flush();
	assert.equal(input.enabled, true);
	assert.equal(sender.track, null);
	assert.ok(actions.every((action) => action.type !== 'ready' || action.payload === false));
});

test('room restores processed transmission only after fresh readiness, respecting a mute made while waiting', async () => {
	const harness = createHarness();
	const { pipeline, input, context } = await readyPipeline(harness);
	await pipeline.setDenoisingEnabled(false);
	pipeline.setOutputEnabled(true);
	const { sandbox, sender, actions } = roomSandbox(harness, input, pipeline);
	const cleanup = vm.runInNewContext(modeCallback, sandbox)();
	try {
		assert.equal(input.enabled, true);
		assert.equal(pipeline.track.enabled, false);
		assert.equal(sandbox.getOutgoingAudioTrack(input), null);
		sandbox.setAudioTrackEnabled(input, false);
		await context.pump(10);
		assert.equal(pipeline.isDenoisingReady, true);
		assert.equal(sender.track, null);
		assert.equal(pipeline.track.enabled, false);
		assert.ok(actions.some((action) => action.type === 'ready' && action.payload === true));
	} finally {
		cleanup();
		pipeline.dispose();
	}
});

test('room prepares its pipeline before the first toggle without reopening an already raw microphone', async () => {
	const harness = createHarness();
	const input = {
		enabled: true,
		readyState: 'live',
		getSettings: () => ({ noiseSuppression: false, autoGainControl: false }),
		stop() {
			this.readyState = 'ended';
		}
	};
	const { sandbox, sender } = roomSandbox(harness, input);
	sandbox.noiseSuppressionEnabled = false;
	sandbox.noiseSuppressionEnabledRef.current = false;
	const cleanup = vm.runInNewContext(initCallback, sandbox)();
	for (let i = 0; i < 35; i++) await flush();
	const pipeline = sandbox.mezonNsPipelineRef.current;
	try {
		assert.ok(pipeline);
		assert.equal(sender.track, pipeline.track);
		assert.equal(pipeline.track.enabled, true);
		assert.equal(pipeline.isDenoisingReady, false); // Prepared, with raw bypass selected.
		assert.equal(input.readyState, 'live');
		assert.equal(harness.stats.loads, 1);
	} finally {
		cleanup();
		pipeline?.dispose();
	}
});

test('an open mic automatically resumes only on the processed track after readiness', async () => {
	const harness = createHarness();
	const { pipeline, input, context } = await readyPipeline(harness);
	await pipeline.setDenoisingEnabled(false);
	pipeline.setOutputEnabled(true);
	const { sandbox, sender, actions } = roomSandbox(harness, input, pipeline);
	const cleanup = vm.runInNewContext(modeCallback, sandbox)();
	try {
		assert.equal(pipeline.track.enabled, false);
		assert.equal(sandbox.getOutgoingAudioTrack(input), null);
		await context.pump(12);
		assert.equal(sender.track, pipeline.track);
		assert.equal(pipeline.track.enabled, true);
		assert.equal(input.enabled, true);
		assert.ok(actions.some((action) => action.type === 'ready' && action.payload));
		assert.ok(context.lastOutput.every((sample) => sample <= 0.010001));
	} finally {
		cleanup();
		pipeline.dispose();
	}
});

test('cancelling noise before initialization finishes restores the live original microphone', async () => {
	const harness = createHarness();
	const input = { enabled: true, readyState: 'live' };
	const { sandbox, sender } = roomSandbox(harness, input);
	vm.runInNewContext(modeCallback, sandbox)();
	await flush();
	assert.equal(sender.track, null);
	sandbox.noiseSuppressionEnabled = false;
	sandbox.noiseSuppressionEnabledRef.current = false;
	vm.runInNewContext(modeCallback, sandbox)();
	await flush();
	assert.equal(sender.track, input);
});

test('model initialization timeout creates no output and cleans up a session that finishes late', async () => {
	const harness = createHarness();
	harness.stats.blockInitialization = true;
	const creating = harness.Pipeline.create({ enabled: true }, () => {});
	const rejected = assert.rejects(creating, /initialization timed out/);
	await flush();
	harness.timeout();
	await rejected;
	assert.equal(harness.contexts.length, 0);
	assert.equal(harness.stats.disposals, 0);
	harness.stats.releaseInitialization();
	await flush();
	assert.equal(harness.stats.disposals, 1);
});

test('disposing while ON is pending settles readiness without releasing output or muting capture', async () => {
	const harness = createHarness();
	const { pipeline, input } = await readyPipeline(harness);
	await pipeline.setDenoisingEnabled(false);
	const pending = pipeline.setDenoisingEnabled(true);
	pipeline.dispose();
	assert.equal(await pending, false);
	assert.equal(input.enabled, true);
	assert.equal(pipeline.track.stopped, true);
	assert.equal(pipeline.isDenoisingReady, false);
});

test('initial native-to-raw capture adoption preserves a user mute made during preparation', async () => {
	const harness = createHarness();
	const input = {
		enabled: true,
		readyState: 'live',
		getSettings: () => ({ noiseSuppression: true, autoGainControl: true }),
		stop() {
			this.readyState = 'ended';
		}
	};
	const raw = withClone({
		enabled: true,
		readyState: 'live',
		getSettings: () => ({ noiseSuppression: false, autoGainControl: false }),
		stop() {
			this.readyState = 'ended';
		}
	});
	const { sandbox, sender } = roomSandbox(harness, input);
	sandbox.navigator.mediaDevices.getUserMedia = async () => ({ getAudioTracks: () => [raw] });
	vm.runInNewContext(modeCallback, sandbox)();
	const cleanup = vm.runInNewContext(initCallback, sandbox)();
	input.enabled = false;
	for (let i = 0; i < 35; i++) await flush();
	const pipeline = sandbox.mezonNsPipelineRef.current;
	try {
		assert.ok(pipeline);
		assert.equal(pipeline.inputTrack, raw);
		assert.equal(raw.enabled, false);
		assert.equal(sender.track, null);
		assert.equal(pipeline.track.enabled, false);
		assert.equal(input.readyState, 'ended');
		assert.equal(sandbox.localAudioTrack, raw);
	} finally {
		cleanup();
		pipeline?.dispose();
	}
});

test('private preparation hears live capture while a previously muted microphone and outgoing audio stay muted', async () => {
	const harness = createHarness();
	const input = withClone({ enabled: false });
	const pipeline = await harness.Pipeline.create(input, () => {}, true);
	const context = harness.contexts.at(-1);
	await context.startup;
	const analysis = context.inputTrack;
	try {
		assert.notEqual(analysis, input);
		assert.equal(analysis.enabled, true);
		assert.equal(input.enabled, false);
		assert.equal(pipeline.isDenoisingReady, true);
		const frames = harness.stats.frames;
		await context.pump(20);
		assert.ok(harness.stats.frames > frames);
		assert.ok(harness.stats.lastInput.some((sample) => sample > 0));
		assert.equal(pipeline.track.enabled, false);
		assert.ok(context.lastOutput.every((sample) => sample === 0));
		// Readiness alone never releases output. The explicit mic click does.
		input.enabled = true;
		pipeline.setPreparationEnabled(false);
		pipeline.setOutputEnabled(true);
		await context.pump(10);
		assert.equal(pipeline.track.enabled, true);
		assert.ok(context.lastOutput.some((sample) => sample > 0));
		input.enabled = false;
		pipeline.setOutputEnabled(false);
		assert.equal(analysis.enabled, false);
	} finally {
		pipeline.dispose();
	}
	assert.equal(analysis.stopped, true);
	assert.equal(input.enabled, false);
});

test('room applies noise while mic is already muted, then stops private preparation without unmuting', async () => {
	const harness = createHarness();
	const { pipeline, input, context } = await readyPipeline(harness);
	await pipeline.setDenoisingEnabled(false);
	input.enabled = false;
	pipeline.setOutputEnabled(false);
	const { sandbox, sender, actions } = roomSandbox(harness, input, pipeline);
	const cleanup = vm.runInNewContext(modeCallback, sandbox)();
	try {
		assert.equal(input.enabled, false);
		assert.equal(pipeline.track.enabled, false);
		const frames = harness.stats.frames;
		await context.pump(16);
		assert.ok(actions.some((action) => action.type === 'ready' && action.payload));
		assert.equal(context.inputTrack.enabled, false); // Preparation ended, original mute remains.
		assert.ok(harness.stats.frames > frames);
		assert.equal(input.enabled, false);
		assert.equal(sender.track, null);
		assert.equal(pipeline.track.enabled, false);
	} finally {
		cleanup();
		pipeline.dispose();
	}
});

// Run the actual reducer bodies without importing the store's unrelated services.
const storeSource = fs.readFileSync(path.resolve(__dirname, '../../../../../../../../../libs/store/src/lib/voice/voice.slice.ts'), 'utf8');
const storeAst = ts.createSourceFile('voice.ts', storeSource, ts.ScriptTarget.Latest, true);
function voiceReducer(name) {
	let reducer;
	function visit(node) {
		if (ts.isPropertyAssignment(node) && node.name.getText(storeAst) === name && ts.isArrowFunction(node.initializer)) {
			reducer = node.initializer.getText(storeAst);
		}
		ts.forEachChild(node, visit);
	}
	visit(storeAst);
	assert.ok(reducer, `Reducer not found: ${name}`);
	return vm.runInNewContext(ts.transpileModule(`(${reducer})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText);
}
const setNoise = voiceReducer('setNoiseSuppressionEnabled');
const setMic = voiceReducer('setShowMicrophone');
const setReady = voiceReducer('setNoiseSuppressionReady');

test('noise toggles preserve an open mic intent; readiness automatically resumes that same intent', () => {
	const state = { showMicrophone: true, noiseSuppressionEnabled: false, noiseSuppressionReady: false };
	setNoise(state, { payload: true });
	assert.equal(state.showMicrophone, true);
	assert.equal(state.noiseSuppressionReady, false);
	setReady(state, { payload: true });
	assert.equal(state.showMicrophone, true);
	setNoise(state, { payload: false });
	setNoise(state, { payload: true });
	assert.equal(state.showMicrophone, true);
	assert.equal(state.noiseSuppressionReady, false);
});

test('a mic muted before or during preparation stays muted; early unmute attempts are not queued', () => {
	for (const initiallyEnabled of [true, false]) {
		const state = { showMicrophone: initiallyEnabled, noiseSuppressionEnabled: false, noiseSuppressionReady: false };
		setNoise(state, { payload: true });
		if (initiallyEnabled) setMic(state, { payload: false });
		setMic(state, { payload: true });
		assert.equal(state.showMicrophone, false);
		setReady(state, { payload: true });
		assert.equal(state.showMicrophone, false);
		setNoise(state, { payload: false });
		assert.equal(state.showMicrophone, false);
		setMic(state, { payload: true });
		assert.equal(state.showMicrophone, true);
	}
});

test('private preparation stays silent and readiness releases audio without debug logging or meter messages', async () => {
	const harness = createHarness();
	const input = withClone({ enabled: false });
	const pipeline = await harness.Pipeline.create(input, () => {}, true);
	const context = harness.contexts.at(-1);
	await context.startup;
	const messages = [];
	const postMessage = context.node.processor.port.postMessage;
	context.node.processor.port.postMessage = (message) => {
		messages.push(message.type);
		postMessage(message);
	};
	try {
		assert.equal(pipeline.isDenoisingReady, true);
		assert.equal(input.enabled, false);
		assert.equal(context.inputTrack.enabled, true);
		assert.equal(pipeline.track.enabled, false);
		await context.pump(50);
		assert.ok(context.lastOutput.every((sample) => sample === 0));
		input.enabled = true;
		pipeline.setPreparationEnabled(false);
		pipeline.setOutputEnabled(true);
		await context.pump(10);
		assert.equal(pipeline.track.enabled, true);
		assert.ok(context.lastOutput.some((sample) => sample > 0));
		assert.ok(messages.includes('process_frame'));
		assert.ok(!messages.includes('meter'));
		assert.deepEqual(harness.stats.logs, []);
	} finally {
		pipeline.dispose();
	}
});

test('rapid noise on/off/on never restores a stale mode or a mic muted while applying', async () => {
	const harness = createHarness();
	const { pipeline, input, context } = await readyPipeline(harness);
	await pipeline.setDenoisingEnabled(false);
	pipeline.setOutputEnabled(true);
	const { sandbox, sender, actions } = roomSandbox(harness, input, pipeline);
	let outputEnabled = pipeline.track.enabled;
	let releases = 0;
	Object.defineProperty(pipeline.track, 'enabled', {
		get: () => outputEnabled,
		set: (enabled) => {
			if (enabled && !outputEnabled) releases++;
			outputEnabled = enabled;
		}
	});
	const firstCleanup = vm.runInNewContext(modeCallback, sandbox)();
	firstCleanup();
	sandbox.noiseSuppressionEnabled = false;
	sandbox.noiseSuppressionEnabledRef.current = false;
	const offCleanup = vm.runInNewContext(modeCallback, sandbox)();
	offCleanup();
	sandbox.noiseSuppressionEnabled = true;
	sandbox.noiseSuppressionEnabledRef.current = true;
	const finalCleanup = vm.runInNewContext(modeCallback, sandbox)();
	sandbox.setAudioTrackEnabled(input, false);
	try {
		await context.pump(16);
		assert.equal(pipeline.isDenoisingReady, true);
		assert.equal(sender.track, null);
		assert.equal(input.enabled, false);
		assert.equal(pipeline.track.enabled, false);
		assert.equal(actions.filter((action) => action.type === 'ready' && action.payload).length, 1);
		assert.equal(releases, 0);
	} finally {
		finalCleanup();
		pipeline.dispose();
	}
});

test('failed noise application mutes the microphone before native fallback instead of resuming raw audio', async () => {
	const harness = createHarness();
	const { pipeline, input } = await readyPipeline(harness);
	pipeline.setOutputEnabled(true);
	const { sandbox, actions } = roomSandbox(harness, input, pipeline);
	sandbox.pushToTalkRequestedRef = { current: true };
	sandbox.setPushToTalkActive = (active) => {
		sandbox.pushToTalkActive = active;
	};
	sandbox.toastActions = { addToast: (payload) => ({ type: 'toast', payload }) };
	sandbox.voiceActions.setShowMicrophone = (payload) => ({ type: 'microphone', payload });
	const failure = vm.runInNewContext(roomCallback('useCallback', 'unavailable; restoring native microphone processing'), sandbox);
	failure(new Error('inference failed'), pipeline);
	assert.equal(input.enabled, false);
	assert.equal(pipeline.track.enabled, false);
	assert.equal(pipeline.track.stopped, true);
	assert.equal(sandbox.pushToTalkRequestedRef.current, false);
	assert.equal(sandbox.pushToTalkActive, false);
	assert.ok(actions.find((action) => action.type === 'microphone' && action.payload === false));
	assert.ok(actions.find((action) => action.type === 'enabled' && action.payload === false));
});

test('muting while sender attachment is pending cancels automatic audio resume but completes loading', async () => {
	const harness = createHarness();
	const { pipeline, input, context } = await readyPipeline(harness);
	await pipeline.setDenoisingEnabled(false);
	pipeline.setOutputEnabled(true);
	const { sandbox, sender, actions } = roomSandbox(harness, input, pipeline);
	let finishAttachment;
	sender.replaceTrack = async (track) => {
		sender.track = track;
		await new Promise((done) => {
			finishAttachment = done;
		});
	};
	const cleanup = vm.runInNewContext(modeCallback, sandbox)();
	try {
		await context.pump(12);
		assert.equal(typeof finishAttachment, 'function');
		assert.equal(sender.track, pipeline.track);
		sandbox.setAudioTrackEnabled(input, false);
		finishAttachment();
		await flush();
		assert.equal(input.enabled, false);
		assert.equal(pipeline.track.enabled, false);
		assert.equal(context.inputTrack.enabled, false);
		assert.ok(actions.some((action) => action.type === 'ready' && action.payload));
	} finally {
		cleanup();
		pipeline.dispose();
	}
});
