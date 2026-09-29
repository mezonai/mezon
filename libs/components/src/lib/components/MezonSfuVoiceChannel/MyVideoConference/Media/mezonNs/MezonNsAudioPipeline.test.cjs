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
const pipelineSource = ts.transpileModule(
	fs
		.readFileSync(path.join(__dirname, 'MezonNsAudioPipeline.ts'), 'utf8')
		.replace("new URL('./MezonNsInferenceWorker.ts', import.meta.url)", "'mezon-ns-test-worker'"),
	{
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
	}
).outputText;
const workerSource = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'MezonNsInferenceWorker.ts'), 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText;
const flush = () => new Promise((done) => setImmediate(done));

function createHarness(environment = 'development') {
	const logs = [];
	const document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
	const window = new EventTarget();
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
		modelUrls: [],
		loads: 0,
		downloads: 0,
		resets: 0,
		frames: 0,
		workerFrames: 0,
		terminations: 0,
		failNextDownload: false,
		failInference: false,
		blockInitialization: false
	};
	const timers = new Map();
	let nextTimer = 0;
	const contexts = [];
	class Engine {
		constructor(options) {
			stats.engineOptions = options;
		}
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
		async dispose() {}
	}
	class FakePort {
		closed = false;
		onmessage = null;
		postMessage(data) {
			if (data.type === 'process_frame') stats.workerFrames++;
			if (!this.closed)
				queueMicrotask(() => {
					if (!this.peer.closed) this.peer.onmessage?.({ data });
				});
		}
		close() {
			this.closed = true;
		}
	}
	class FakeMessageChannel {
		constructor() {
			this.port1 = new FakePort();
			this.port2 = new FakePort();
			this.port1.peer = this.port2;
			this.port2.peer = this.port1;
		}
	}
	class InferenceWorker {
		constructor() {
			this.terminated = false;
			this.onmessage = null;
			this.onerror = null;
			this.scope = {
				onmessage: null,
				postMessage: (data) => {
					if (!this.terminated) queueMicrotask(() => this.onmessage?.({ data }));
				}
			};
			vm.runInNewContext(
				workerSource,
				Object.assign(this.scope, {
					exports: {},
					require: (name) => {
						if (name === 'onnxruntime-web') return { env: { wasm: {} } };
						if (name === './mezon-onnx-engine') return { MezonNSEngine: Engine };
						throw new Error(`Unexpected worker import: ${name}`);
					},
					Float32Array,
					Uint8Array,
					Promise,
					Error,
					Number
				})
			);
		}
		postMessage(message) {
			if (message.type === 'init') this.port = message.port;
			if (!this.terminated) queueMicrotask(() => this.scope.onmessage?.({ data: message }));
		}
		terminate() {
			if (this.terminated) return;
			this.terminated = true;
			stats.terminations++;
			this.port?.close();
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
			this.resumeCalls = (this.resumeCalls || 0) + 1;
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
		fetch: async (url) => {
			stats.modelUrls.push(url);
			stats.downloads++;
			if (stats.failNextDownload) {
				stats.failNextDownload = false;
				throw new Error('network failed');
			}
			return { ok: true, arrayBuffer: async () => new ArrayBuffer(16) };
		},
		document,
		window: Object.assign(window, { AudioContext: Context }),
		AudioContext: Context,
		AudioWorkletNode: WorkletNode,
		Worker: InferenceWorker,
		MessageChannel: FakeMessageChannel,
		MediaStream: class {
			constructor(tracks) {
				this.tracks = tracks;
			}
		},
		process: { env: { NODE_ENV: environment } },
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
		document,
		window,
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

test('preload selects the versioned asym babble checkpoint in development and production', async () => {
	for (const environment of ['development', 'production']) {
		const harness = createHarness(environment);
		await harness.Pipeline.preload();
		const url = new URL(harness.stats.modelUrls[0], 'https://client.example');
		const prefix = environment === 'production' ? '/chat' : '';
		assert.equal(url.pathname, `${prefix}/assets/mezon-ns/mezon_ns_asym_babble.onnx`);
		assert.equal(url.searchParams.get('v'), '457ca7c-v3');
	}
});

test('readiness keeps capture alive and transmission blocked until explicitly released', async () => {
	const harness = createHarness();
	const { pipeline, input, context } = await readyPipeline(harness);
	try {
		assert.equal(harness.stats.engineOptions.modelInputTargetDbfs, -20);
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

test('foreground resumes interrupted audio without replacing the track or resetting inference', async () => {
	const harness = createHarness();
	const { pipeline, context } = await readyPipeline(harness);
	try {
		pipeline.setOutputEnabled(true);
		const track = pipeline.track;
		const calls = context.resumeCalls;
		harness.document.dispatchEvent(new Event('visibilitychange'));
		assert.equal(context.resumeCalls, calls); // Healthy audio is untouched.
		harness.document.visibilityState = 'hidden';
		context.state = 'interrupted';
		harness.document.dispatchEvent(new Event('visibilitychange'));
		assert.equal(context.resumeCalls, calls);
		harness.document.visibilityState = 'visible';
		harness.document.dispatchEvent(new Event('visibilitychange'));
		await context.startup;
		await context.pump(8);
		assert.equal(context.state, 'running');
		assert.equal(pipeline.track, track);
		assert.equal(pipeline.track.enabled, true);
		assert.equal(harness.stats.loads, 1);
		assert.equal(harness.stats.resets, 1);
		assert.ok(context.lastOutput.every((sample) => Math.abs(sample - 0.01) < 1e-7));
	} finally {
		pipeline.dispose();
	}
});

test('pageshow preserves user mute and disabled denoising across recovery', async () => {
	const harness = createHarness();
	const { pipeline, input, context } = await readyPipeline(harness);
	try {
		await pipeline.setDenoisingEnabled(false);
		input.enabled = false;
		pipeline.setOutputEnabled(false);
		context.state = 'suspended';
		harness.window.dispatchEvent(new Event('pageshow'));
		await context.startup;
		assert.equal(context.state, 'running');
		assert.equal(input.enabled, false);
		assert.equal(pipeline.track.enabled, false);
		assert.equal(pipeline.isDenoisingReady, false);
		input.enabled = true;
		pipeline.setOutputEnabled(true);
		await context.pump(8);
		assert.ok(context.lastOutput.every((sample) => Math.abs(sample - 0.4) < 1e-7));
	} finally {
		pipeline.dispose();
	}
});

test('filtered audio keeps flowing when the main worklet message handler is stalled', async () => {
	const harness = createHarness();
	const { pipeline, context } = await readyPipeline(harness);
	try {
		pipeline.setOutputEnabled(true);
		await context.pump(5);
		context.node.port.onmessage = null; // UI-thread message handling is unavailable.
		const frames = harness.stats.workerFrames;
		await context.pump(30);
		assert.ok(harness.stats.workerFrames > frames);
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
const outgoingCallback = roomCallback('useCallback', 'A Mezon-NS capture');
const audioEnabledCallback = roomCallback('useCallback', 'inputTrack.enabled = enabled');
const microphoneOptionsCallback = roomCallback('useCallback', 'const processing =');
const preferredCaptureCallback = roomCallback('useCallback', 'const constraint =');
const syncMicrophoneSelectionCallback = roomCallback('useCallback', 'const preferred = preferredMicrophoneIdRef.current');
const changeInputDeviceCallback = roomCallback('useCallback', "kind: 'audioinput' | 'videoinput'");
const modeCallback = roomCallback('useLayoutEffect', '++mezonNsGenerationRef.current');
const microphoneSyncCallback = roomCallback('useEffect', 'desiredMediaRef.current = { microphoneEnabled, cameraEnabled }');
const cameraSyncCallback = roomCallback('useEffect', 'const video = getCameraConstraints(cameraQualityTierRef.current)');

function roomSandbox(harness, input, pipeline = null) {
	withClone(input);
	const actions = [];
	const tracks = [input];
	const captureModes = new WeakMap();
	captureModes.set(input, pipeline ? 'mezon-ns' : 'native');
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
		microphoneCaptureModeRef: { current: captureModes },
		preferredMicrophoneIdRef: { current: 'default' },
		mezonNsUnavailable: false,
		mezonNsUnavailableRef: { current: false },
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
		getMezonNsAudioCaptureOptions: () => ({ noiseSuppression: { exact: false } }),
		getNativeMicrophoneCaptureOptions: () => ({ noiseSuppression: true }),
		getNoiseSuppressionAudioCaptureOptions: () => ({}),
		microphoneDeviceConstraint: (deviceId) => ({ deviceId: deviceId === 'default' ? { ideal: 'default' } : { exact: deviceId } }),
		openPreferredMicrophone: (audio, video) => sandbox.navigator.mediaDevices.getUserMedia({ audio, video }),
		syncSelectedMicrophone: (track) => {
			sandbox.selectedMicrophone = track.getSettings().deviceId;
		},
		setMezonNsUnavailable: (value) => {
			sandbox.mezonNsUnavailable = value;
		},
		setProcessedAudioTrack: (track) => {
			sandbox.processedAudioTrack = track;
		},
		setLocalAudioTrack: (track) => {
			sandbox.localAudioTrack = track;
		},
		setSelectedMicrophone: (deviceId) => {
			sandbox.selectedMicrophone = deviceId;
		},
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

test('initial media preparation owns capture while controls wait, then reuses the prepared mic', async () => {
	for (const mutedDuringPreparation of [false, true]) {
		const harness = createHarness();
		const input = roomTrack(true);
		const { sandbox, sender } = roomSandbox(harness, input);
		const preparedStream = sandbox.localStreamRef.current;
		sandbox.localStreamRef.current = null;
		sandbox.localMediaPreparedRef = { current: false };
		sandbox.microphoneEnabled = true;
		sandbox.cameraEnabled = true;
		sandbox.desiredMediaRef = { current: {} };
		sandbox.joinedRef = { current: false };
		sandbox.noiseSuppressionEnabledRef.current = false;
		let microphoneRequests = 0;
		sandbox.acquireMicrophoneTrack = async () => {
			microphoneRequests++;
			return input;
		};
		const syncMicrophone = vm.runInNewContext(microphoneSyncCallback, sandbox);
		const syncCamera = vm.runInNewContext(cameraSyncCallback, sandbox);
		syncMicrophone();
		syncCamera();
		await flush();
		assert.equal(microphoneRequests, 0);
		if (mutedDuringPreparation) {
			sandbox.microphoneEnabled = false;
			syncMicrophone();
		}
		sandbox.localStreamRef.current = preparedStream;
		sandbox.localMediaPreparedRef.current = true;
		syncMicrophone();
		await flush();
		assert.equal(microphoneRequests, 0);
		assert.equal(sender.track, mutedDuringPreparation ? null : input);
		assert.equal(input.enabled, !mutedDuringPreparation);
	}
});

test('both capture modes request the preferred microphone and Default keeps the system alias', () => {
	const harness = createHarness();
	const { sandbox } = roomSandbox(harness, roomTrack(true));
	sandbox.noiseSuppressionEnabledRef.current = false;
	const getOptions = vm.runInNewContext(microphoneOptionsCallback, sandbox);
	assert.equal(getOptions().deviceId.ideal, 'default');
	assert.equal(getOptions().noiseSuppression, true);
	sandbox.preferredMicrophoneIdRef.current = 'preferred-mic';
	assert.equal(getOptions().deviceId.exact, 'preferred-mic');
	sandbox.noiseSuppressionEnabledRef.current = true;
	assert.equal(getOptions().noiseSuppression.exact, false);
	assert.equal(getOptions().deviceId.exact, 'preferred-mic');
});

test('the mic menu keeps Default selected when its active physical device is reported', () => {
	const harness = createHarness();
	const { sandbox } = roomSandbox(harness, roomTrack(true));
	const syncSelection = vm.runInNewContext(syncMicrophoneSelectionCallback, sandbox);
	syncSelection({ getSettings: () => ({ deviceId: 'external-mic' }) });
	assert.equal(sandbox.selectedMicrophone, 'default');
	sandbox.preferredMicrophoneIdRef.current = 'external-mic';
	syncSelection({ getSettings: () => ({ deviceId: 'external-mic' }) });
	assert.equal(sandbox.selectedMicrophone, 'external-mic');
});

test('a disconnected preferred microphone falls back to the system Default', async () => {
	const harness = createHarness();
	const { sandbox } = roomSandbox(harness, roomTrack(true));
	sandbox.preferredMicrophoneIdRef.current = 'disconnected-mic';
	const attempts = [];
	const missingDevice = new DOMException('Device unavailable', 'OverconstrainedError');
	Object.defineProperty(missingDevice, 'constraint', { value: 'deviceId' });
	sandbox.navigator.mediaDevices.getUserMedia = async ({ audio }) => {
		attempts.push(audio.deviceId);
		if (attempts.length === 1) throw missingDevice;
		return { getAudioTracks: () => [] };
	};
	const openPreferred = vm.runInNewContext(preferredCaptureCallback, sandbox);
	await openPreferred({ deviceId: { exact: 'disconnected-mic' } }, false);
	assert.equal(attempts[0].exact, 'disconnected-mic');
	assert.equal(attempts[1].ideal, 'default');
});

test('selecting Default in the mic menu saves the alias instead of the physical device ID', async () => {
	const harness = createHarness();
	const input = roomTrack(true);
	const next = roomTrack(true);
	const { sandbox, sender } = roomSandbox(harness, input);
	const saved = [];
	sandbox.noiseSuppressionEnabledRef.current = false;
	sandbox.microphoneEnabled = true;
	sandbox.getMicrophoneCaptureOptions = () => ({ deviceId: { exact: 'old-mic' } });
	sandbox.PREFERRED_MICROPHONE_STORAGE_KEY = 'mezon.voice.inputDeviceId';
	sandbox.localStorage = { setItem: (key, value) => saved.push([key, value]) };
	sandbox.setError = (error) => {
		throw new Error(error);
	};
	sandbox.navigator.mediaDevices.getUserMedia = async ({ audio }) => {
		assert.equal(audio.deviceId.ideal, 'default');
		return { getAudioTracks: () => [next] };
	};
	const changeInputDevice = vm.runInNewContext(changeInputDeviceCallback, sandbox);
	await changeInputDevice('audioinput', 'default');
	assert.equal(sandbox.preferredMicrophoneIdRef.current, 'default');
	assert.equal(sandbox.selectedMicrophone, 'default');
	assert.equal(sender.track, next);
	assert.equal(input.readyState, 'ended');
	assert.equal(saved[0][1], 'default');
});

function roomTrack(noiseSuppression, enabled = true) {
	return withClone({
		enabled,
		readyState: 'live',
		getSettings: () => ({ noiseSuppression, autoGainControl: true }),
		stop() {
			this.readyState = 'ended';
		}
	});
}

test('Off publishes the native WebRTC track without loading Mezon-NS', async () => {
	const harness = createHarness();
	const input = roomTrack(true);
	const { sandbox, sender } = roomSandbox(harness, input);
	sandbox.noiseSuppressionEnabled = false;
	sandbox.noiseSuppressionEnabledRef.current = false;
	assert.equal(sandbox.getOutgoingAudioTrack(input), input);
	vm.runInNewContext(modeCallback, sandbox)();
	await flush();
	assert.equal(sender.track, input);
	assert.equal(sandbox.mezonNsPipelineRef.current, null);
	assert.equal(harness.stats.downloads, 0);
	assert.equal(harness.stats.loads, 0);
});

test('On blocks native audio until a fresh Mezon-NS capture and model are ready', async () => {
	const harness = createHarness();
	const input = roomTrack(true);
	const raw = roomTrack(false);
	const { sandbox, sender, actions } = roomSandbox(harness, input);
	sandbox.navigator.mediaDevices.getUserMedia = async () => ({ getAudioTracks: () => [raw] });
	const cleanup = vm.runInNewContext(modeCallback, sandbox)();
	try {
		assert.equal(sandbox.getOutgoingAudioTrack(input), null);
		for (let i = 0; i < 35; i++) await flush();
		const pipeline = sandbox.mezonNsPipelineRef.current;
		assert.ok(pipeline);
		assert.equal(pipeline.inputTrack, raw);
		assert.equal(sender.track, pipeline.track);
		assert.equal(input.readyState, 'ended');
		assert.equal(sandbox.localAudioTrack, raw);
		assert.ok(actions.some((action) => action.type === 'ready' && action.payload === true));
		assert.equal(harness.stats.loads, 1);
	} finally {
		cleanup();
		sandbox.mezonNsPipelineRef.current?.dispose();
	}
});

test('On preserves a microphone muted while Mezon-NS is preparing', async () => {
	const harness = createHarness();
	const input = roomTrack(true);
	const raw = roomTrack(false);
	const { sandbox, sender } = roomSandbox(harness, input);
	sandbox.navigator.mediaDevices.getUserMedia = async () => ({ getAudioTracks: () => [raw] });
	const cleanup = vm.runInNewContext(modeCallback, sandbox)();
	input.enabled = false;
	try {
		for (let i = 0; i < 35; i++) await flush();
		assert.equal(raw.enabled, false);
		assert.equal(sender.track, null);
		assert.equal(sandbox.mezonNsPipelineRef.current.track.enabled, false);
	} finally {
		cleanup();
		sandbox.mezonNsPipelineRef.current?.dispose();
	}
});

test('Off disposes Mezon-NS and restores a fresh native WebRTC capture', async () => {
	const harness = createHarness();
	const input = roomTrack(false);
	const pipeline = await harness.Pipeline.create(input, () => {}, true);
	const native = roomTrack(true);
	const { sandbox, sender, actions } = roomSandbox(harness, input, pipeline);
	sandbox.noiseSuppressionEnabled = false;
	sandbox.noiseSuppressionEnabledRef.current = false;
	sandbox.navigator.mediaDevices.getUserMedia = async () => ({ getAudioTracks: () => [native] });
	const cleanup = vm.runInNewContext(modeCallback, sandbox)();
	try {
		assert.equal(sandbox.getOutgoingAudioTrack(input), null);
		for (let i = 0; i < 12; i++) await flush();
		assert.equal(pipeline.track.stopped, true);
		assert.equal(sandbox.mezonNsPipelineRef.current, null);
		assert.equal(sender.track, native);
		assert.equal(sandbox.localAudioTrack, native);
		assert.equal(input.readyState, 'ended');
		assert.ok(actions.some((action) => action.type === 'ready' && action.payload === false));
	} finally {
		cleanup();
	}
});

test('turning Off during Mezon-NS capture restores native audio and discards the late raw track', async () => {
	const harness = createHarness();
	const input = roomTrack(true);
	const raw = roomTrack(false);
	const { sandbox, sender } = roomSandbox(harness, input);
	let finishCapture;
	sandbox.navigator.mediaDevices.getUserMedia = () =>
		new Promise((resolve) => {
			finishCapture = () => resolve({ getAudioTracks: () => [raw] });
		});
	const cancelOn = vm.runInNewContext(modeCallback, sandbox)();
	await flush();
	assert.equal(sender.track, null);
	cancelOn();
	sandbox.noiseSuppressionEnabled = false;
	sandbox.noiseSuppressionEnabledRef.current = false;
	vm.runInNewContext(modeCallback, sandbox)();
	await flush();
	assert.equal(sender.track, input);
	finishCapture();
	await flush();
	assert.equal(raw.readyState, 'ended');
	assert.equal(harness.stats.downloads, 0);
});

test('model initialization timeout creates no output and cleans up a session that finishes late', async () => {
	const harness = createHarness();
	harness.stats.blockInitialization = true;
	const creating = harness.Pipeline.create(withClone({ enabled: true }), () => {});
	const rejected = assert.rejects(creating, /initialization timed out/);
	await flush();
	harness.timeout();
	await rejected;
	assert.equal(harness.contexts[0].state, 'closed');
	assert.equal(harness.stats.terminations, 1);
	harness.stats.releaseInitialization();
	await flush();
	assert.equal(harness.stats.terminations, 1);
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
		assert.ok(harness.stats.workerFrames > 0);
		assert.ok(!messages.includes('process_frame'));
		assert.ok(!messages.includes('meter'));
		assert.deepEqual(harness.stats.logs, []);
	} finally {
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
