import React from 'react';
import { act, create } from 'react-test-renderer';
import { useHistoryPagination, type HistoryPaginationState } from './useHistoryPagination';

let notify: (entries: unknown[]) => void;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let now: number;
const disconnect = jest.fn();
const originalObserver = globalThis.IntersectionObserver;
const originalRaf = globalThis.requestAnimationFrame;
const originalCancelRaf = globalThis.cancelAnimationFrame;

beforeEach(() => {
	now = 10000;
	jest.spyOn(Date, 'now').mockImplementation(() => now);
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
	jest.restoreAllMocks();
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
		getBoundingClientRect: jest.fn(() => ({ top: 0, bottom: 600 })),
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
		measure: container.getBoundingClientRect,
		burst: (count: number) => {
			act(() => {
				for (let i = 0; i < count; i++) {
					listeners.get('wheel')?.({ deltaY: -100 });
					listeners.get('scroll')?.({});
				}
			});
		},
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
	now += 1000;
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

it('keeps only one callback active even before Redux loading starts', async () => {
	const h = setup();
	let finish!: () => void;
	h.load.mockReturnValueOnce(
		new Promise<void>((resolve) => {
			finish = resolve;
		})
	);
	h.intersect();
	const measurements = h.measure.mock.calls.length;
	for (let i = 0; i < 120; i++) h.wheel(-100);
	expect(h.load).toHaveBeenCalledTimes(1);
	expect(h.measure).toHaveBeenCalledTimes(measurements);
	await act(async () => {
		finish();
	});
	h.update({}, ['1', '100']);
	expect(h.load).toHaveBeenCalledTimes(2);
	h.unmount();
});

it('coalesces a wheel/scroll event storm into one frame and one geometry read', () => {
	const h = setup();
	h.burst(1000);
	expect(frames.size).toBe(1);
	expect(nextFrame).toBe(1);
	flush();
	expect(h.measure).toHaveBeenCalledTimes(1);
	expect(h.load).toHaveBeenCalledTimes(1);
	h.unmount();
});

it('does not measure the DOM again for an already attempted cursor', () => {
	const h = setup();
	h.intersect();
	const measurements = h.measure.mock.calls.length;
	for (let i = 0; i < 100; i++) {
		h.update({ isLoading: true });
		h.update({ isLoading: false });
	}
	expect(h.measure).toHaveBeenCalledTimes(measurements);
	expect(h.load).toHaveBeenCalledTimes(1);
	h.unmount();
});

it('cancels a pending frame on unmount', () => {
	const h = setup();
	h.burst(100);
	h.unmount();
	flush();
	expect(h.load).not.toHaveBeenCalled();
	expect(h.measure).not.toHaveBeenCalled();
});

it('limits retries of a fast failing or unchanged page during continuous wheel input', () => {
	const h = setup();
	h.intersect();
	for (let i = 0; i < 59; i++) {
		now += 16;
		h.wheel(-100);
	}
	expect(h.load).toHaveBeenCalledTimes(1);
	now += 1000;
	h.wheel(-100);
	expect(h.load).toHaveBeenCalledTimes(2);
	h.unmount();
});

it('does not let an old scope completion unlock the new scope request', async () => {
	const h = setup();
	let finishOld!: () => void;
	let finishNew!: () => void;
	h.load.mockReturnValueOnce(
		new Promise<void>((resolve) => {
			finishOld = resolve;
		})
	);
	h.intersect();
	h.update({ scopeId: 'topic' });
	h.load.mockReturnValueOnce(
		new Promise<void>((resolve) => {
			finishNew = resolve;
		})
	);
	h.intersect();
	await act(async () => {
		finishOld();
	});
	now += 1000;
	h.wheel(-100);
	expect(h.load).toHaveBeenCalledTimes(2);
	h.unmount();
	await act(async () => {
		finishNew();
	});
	flush();
	expect(h.load).toHaveBeenCalledTimes(2);
});

it('does not bypass the retry limit by alternating unchanged edges', () => {
	const h = setup();
	h.move(0, 650);
	h.intersect(['top']);
	h.wheel(100);
	for (let i = 0; i < 20; i++) h.wheel(i % 2 ? 100 : -100);
	expect(h.load.mock.calls).toEqual([['top'], ['bottom']]);
	h.unmount();
});
