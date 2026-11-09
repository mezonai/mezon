import { describe, expect, it } from '@jest/globals';
import { ICON_MOTION_KEY, applyIconMotion, getIconMotion, setIconMotion } from './iconMotion';

const makeStore = (initial?: string) => {
	const map = new Map<string, string>();
	if (initial !== undefined) map.set(ICON_MOTION_KEY, initial);
	return { map, getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
};
const makeRoot = () => {
	const classes = new Set<string>();
	return {
		classes,
		root: { classList: { toggle: (c: string, force?: boolean) => (force ? classes.add(c) : classes.delete(c)) } } as unknown as Element
	};
};

describe('iconMotion', () => {
	it('motion is on when nothing is stored', () => {
		expect(getIconMotion(makeStore())).toBe(true);
	});

	it("'false' turns motion off and adds mz-motion-off", () => {
		const { classes, root } = makeRoot();
		expect(getIconMotion(makeStore('false'))).toBe(false);
		applyIconMotion(false, root);
		expect(classes.has('mz-motion-off')).toBe(true);
	});

	it('setIconMotion writes the key and toggles the class both ways', () => {
		const store = makeStore();
		const { classes, root } = makeRoot();
		setIconMotion(false, store, root);
		expect(store.map.get(ICON_MOTION_KEY)).toBe('false');
		expect(classes.has('mz-motion-off')).toBe(true);
		setIconMotion(true, store, root);
		expect(store.map.get(ICON_MOTION_KEY)).toBe('true');
		expect(classes.has('mz-motion-off')).toBe(false);
	});

	it('applyIconMotion follows the stored value', () => {
		const { classes, root } = makeRoot();
		(globalThis as { localStorage?: unknown }).localStorage = makeStore('false');
		applyIconMotion(undefined, root);
		expect(classes.has('mz-motion-off')).toBe(true);
	});
});
