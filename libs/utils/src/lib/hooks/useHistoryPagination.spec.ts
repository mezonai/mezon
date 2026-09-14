import React from 'react';
import { act, create } from 'react-test-renderer';
import { useHistoryPagination, type HistoryPaginationState } from './useHistoryPagination';

let notify: (entries: unknown[]) => void;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const disconnect = jest.fn();
const originalObserver = globalThis.IntersectionObserver;
const originalRaf = globalThis.requestAnimationFrame;
const originalCancelRaf = globalThis.cancelAnimationFrame;

beforeEach(() => {
	frames = new Map();
	nextFrame = 0;
	globalThis.requestAnimationFrame = (callback) => {
		frames.set(++nextFrame, callback);
		return nextFrame;
	};
	globalThis.cancelAnimationFrame = (id) => {
		frames.delete(id);
	};
	globalThis.IntersectionObserver = jest.fn((callback) => {
		notify = callback;
		return { observe: jest.fn(), disconnect };
	}) as unknown as typeof IntersectionObserver;
});
afterEach(() => {
	globalThis.IntersectionObserver = originalObserver;
	globalThis.requestAnimationFrame = originalRaf;
	globalThis.cancelAnimationFrame = originalCancelRaf;
});

function flush() {
	act(() => {
		const callbacks = [...frames.values()];
		frames.clear();
		callbacks.forEach((callback) => callback(0));
	});
}

function setup() {
	const load = jest.fn();
	const listeners = new Map<string, (event: unknown) => void>();
	let topY = 0;
	let bottomY = 3000;
	const container = {
		getBoundingClientRect: () => ({ top: 0, bottom: 600 }),
		addEventListener: (type: string, cb: (e: unknown) => void) => listeners.set(type, cb),
		removeEventListener: (type: string) => listeners.delete(type)
	};
	const top = { getBoundingClientRect: () => ({ top: topY, bottom: topY }) };
	const bottom = { getBoundingClientRect: () => ({ top: bottomY, bottom: bottomY }) };
	const refs = [container, top, bottom].map((current) => ({ current })) as unknown as React.RefObject<HTMLDivElement>[];
	let ids = ['50', '100'];
	let state: HistoryPaginationState = { scopeId: 'channel', isLoading: false, isJumping: false, hasMoreTop: true, hasMoreBottom: true };
	function Harness() {
		useHistoryPagination(refs[0], refs[1], refs[2], ids, true, state, 1500, load);
		return null;
	}
	let renderer: ReturnType<typeof create>;
	act(() => {
		renderer = create(React.createElement(Harness));
	});
	return {
		load,
		intersect: (directions: string[] = ['top']) => {
			act(() =>
				notify(
					directions.map((direction) => ({
						isIntersecting: true,
						target: direction === 'top' ? top : bottom,
						boundingClientRect: (direction === 'top' ? top : bottom).getBoundingClientRect()
					}))
				)
			);
			flush();
		},
		update: (changes: Partial<HistoryPaginationState> = {}, newIds = ids) => {
			state = { ...state, ...changes };
			ids = newIds;
			act(() => renderer.update(React.createElement(Harness)));
			flush();
		},
		wheel: (deltaY: number) => {
			act(() => {
				listeners.get('wheel')?.({ deltaY });
				listeners.get('scroll')?.({});
			});
			flush();
		},
		move: (newTop: number, newBottom: number) => {
			topY = newTop;
			bottomY = newBottom;
		},
		unmount: () => act(() => renderer.unmount())
	};
}

it('loads another older page without requiring an intersection exit and re-entry', () => {
	const h = setup();
	h.intersect();
	h.update({ isLoading: true });
	h.update({ isLoading: false }, ['1', '100']);
	expect(h.load.mock.calls).toEqual([['top'], ['top']]);
	h.unmount();
});

it('waits for a busy request or jump to finish instead of losing the edge event', () => {
	const h = setup();
	h.update({ isLoading: true, isJumping: true });
	h.intersect();
	h.update({ isLoading: false });
	expect(h.load).not.toHaveBeenCalled();
	h.update({ isJumping: false });
	expect(h.load).toHaveBeenCalledTimes(1);
	h.unmount();
});

it('does not loop on an error or a page that did not advance the cursor', () => {
	const h = setup();
	h.intersect();
	h.update({ isLoading: true });
	h.update({ isLoading: false });
	h.intersect();
	expect(h.load).toHaveBeenCalledTimes(1);
	h.wheel(-100);
	expect(h.load).toHaveBeenCalledTimes(2);
	h.unmount();
});

it('stops once the active edge moves outside the prefetch margin or history ends', () => {
	const h = setup();
	h.intersect();
	h.move(-1800, 3000);
	h.update({}, ['1', '100']);
	expect(h.load).toHaveBeenCalledTimes(1);
	h.move(0, 3000);
	h.update({ hasMoreTop: false });
	h.wheel(-100);
	expect(h.load).toHaveBeenCalledTimes(1);
	h.unmount();
});

it('loads forwards while keeping only one direction active for short pages', () => {
	const h = setup();
	h.move(-1000, 650);
	h.intersect(['top', 'bottom']);
	expect(h.load.mock.calls).toEqual([['bottom']]);
	h.update({ isLoading: true });
	h.update({ isLoading: false }, ['50', '150']);
	expect(h.load.mock.calls).toEqual([['bottom'], ['bottom']]);
	h.unmount();
});

it('resets attempts across scopes and cancels queued work on unmount', () => {
	const h = setup();
	h.intersect();
	h.update({ scopeId: 'topic' });
	h.intersect();
	expect(h.load).toHaveBeenCalledTimes(2);
	h.unmount();
	flush();
	expect(h.load).toHaveBeenCalledTimes(2);
});

it('keeps the wheel direction when the scroll event arrives in the same frame', () => {
	const h = setup();
	h.move(0, 650);
	h.intersect(['top']);
	h.wheel(100);
	expect(h.load.mock.calls).toEqual([['top'], ['bottom']]);
	h.unmount();
});
