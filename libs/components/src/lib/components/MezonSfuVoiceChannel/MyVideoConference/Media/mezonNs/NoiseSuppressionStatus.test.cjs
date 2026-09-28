const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../../../NoiseSuppressionStatus.tsx'), 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
}).outputText;

// Execute the actual component effects with a virtual clock; no wall-clock sleeps.
function createHarness(initialState = { enabled: false, ready: false }) {
	let state = initialState;
	let now = 0;
	let nextTimer = 0;
	let cursor = 0;
	let needsRender = false;
	let tree;
	const slots = [];
	const effects = [];
	const timers = new Map();
	const hooks = {
		useState(initial) {
			const index = cursor++;
			if (!slots[index]) slots[index] = { value: initial };
			return [
				slots[index].value,
				(value) => {
					if (slots[index].value !== value) {
						slots[index].value = value;
						needsRender = true;
					}
				}
			];
		},
		useRef(initial) {
			const index = cursor++;
			if (!slots[index]) slots[index] = { current: initial };
			return slots[index];
		},
		useEffect(callback, deps) {
			const index = cursor++;
			if (!slots[index] || deps.some((dep, i) => dep !== slots[index].deps[i])) {
				const cleanup = slots[index]?.cleanup;
				slots[index] = { deps };
				effects.push(() => {
					cleanup?.();
					slots[index].cleanup = callback();
				});
			}
		}
	};
	const sandbox = {
		exports: {},
		setTimeout(callback, delay) {
			const id = ++nextTimer;
			timers.set(id, { callback, at: now + delay });
			return id;
		},
		clearTimeout: (id) => timers.delete(id),
		require(name) {
			if (name === 'react/jsx-runtime') return require(name);
			if (name === 'react') return hooks;
			if (name === '@mezon/store')
				return {
					selectNoiseSuppressionEnabled: (state) => state.enabled,
					selectNoiseSuppressionReady: (state) => state.ready
				};
			if (name === 'react-redux') return { useSelector: (selector) => selector(state) };
			if (name === 'react-i18next') return { useTranslation: () => ({ t: (_key, options) => options.defaultValue }) };
			throw new Error(`Unexpected import: ${name}`);
		}
	};
	vm.runInNewContext(source, sandbox);
	function render() {
		do {
			needsRender = false;
			cursor = 0;
			tree = sandbox.exports.NoiseSuppressionStatus({ fallback: 'Custom status' });
			while (effects.length) effects.shift()();
		} while (needsRender);
		return renderToStaticMarkup(tree);
	}
	return {
		render,
		update(next) {
			state = next;
			return render();
		},
		advance(ms) {
			const end = now + ms;
			while (true) {
				const due = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
				if (!due) break;
				now = due[1].at;
				timers.delete(due[0]);
				due[1].callback();
				render();
			}
			now = end;
			return render();
		},
		unmount() {
			for (const slot of slots) slot?.cleanup?.();
		},
		pendingTimers: () => timers.size
	};
}

test('compact profile feedback has a fixed height and announces applying', () => {
	const harness = createHarness({ enabled: true, ready: false });
	const html = harness.render();
	assert.match(html, /h-\[14px\]/);
	assert.match(html, /Applying noise filter/);
	assert.match(html, /aria-busy="true"/);
	assert.match(html, /animate-spin/);
	assert.doesNotMatch(html, /bg-yellow-500/);
});

test('success stays visible for 1200 ms, fades for 300 ms, then restores custom status', () => {
	const harness = createHarness({ enabled: true, ready: false });
	harness.render();
	const html = harness.update({ enabled: true, ready: true });
	assert.match(html, /Noise filter applied/);
	assert.match(html, /aria-busy="false"/);
	assert.doesNotMatch(html, /animate-spin/);
	assert.doesNotMatch(harness.advance(1199), /aria-hidden="true" title="Noise filter applied"/);
	assert.match(harness.advance(1), /aria-hidden="true" title="Noise filter applied"/);
	assert.match(harness.advance(299), /Noise filter applied/);
	const idle = harness.advance(1);
	assert.doesNotMatch(idle, /role="status"/);
	assert.match(idle, /Custom status/);
	assert.equal(harness.pendingTimers(), 0);
});

test('new requests and cancellation clear stale success timers', () => {
	const harness = createHarness({ enabled: true, ready: false });
	harness.render();
	harness.update({ enabled: true, ready: true });
	harness.advance(500);
	const applying = harness.update({ enabled: true, ready: false });
	assert.match(applying, /Applying noise filter/);
	assert.equal(harness.pendingTimers(), 0);
	assert.match(harness.advance(2000), /Applying noise filter/);
	assert.doesNotMatch(harness.update({ enabled: false, ready: false }), /role="status"/);
	assert.equal(harness.pendingTimers(), 0);
});

test('mounting an already configured call shows no unsolicited success; fast apply still shows success', () => {
	const harness = createHarness({ enabled: true, ready: true });
	assert.doesNotMatch(harness.render(), /role="status"/);
	harness.update({ enabled: false, ready: false });
	assert.match(harness.update({ enabled: true, ready: true }), /Noise filter applied/);
	harness.unmount();
	assert.equal(harness.pendingTimers(), 0);
});
