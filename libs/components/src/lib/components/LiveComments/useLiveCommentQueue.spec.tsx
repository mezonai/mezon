import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import { createElement } from 'react';
import { LIVE_COMMENT_TTL_MS, MAX_LIVE_COMMENTS, useLiveCommentQueue } from './useLiveCommentQueue';

type Act = {
	(callback: () => Promise<unknown>): Promise<void>;
	(callback: () => void): void;
};
type TestRenderer = { unmount: () => void };

const { act, create } = jest.requireActual<{ act: Act; create: (element: ReactElement) => TestRenderer }>('react-test-renderer');

let latestQueue: ReturnType<typeof useLiveCommentQueue>;
let renderer: TestRenderer | undefined;

function QueueHarness() {
	latestQueue = useLiveCommentQueue();
	return null;
}

const makeComment = (index: number, overrides: Partial<{ id: string; content: string }> = {}) => ({
	id: overrides.id,
	senderId: `user-${index}`,
	name: `User ${index}`,
	avatar: '',
	content: overrides.content ?? `Comment ${index}`
});

beforeEach(() => {
	jest.useFakeTimers();
	act(() => {
		renderer = create(createElement(QueueHarness));
	});
});

afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	jest.useRealTimers();
});

describe('useLiveCommentQueue', () => {
	it('caps visible comments at 4 keeping the newest at the bottom', () => {
		act(() => {
			for (let i = 1; i <= 5; i += 1) {
				latestQueue.add(makeComment(i, { id: `c-${i}` }));
			}
		});

		expect(latestQueue.comments).toHaveLength(MAX_LIVE_COMMENTS);
		expect(latestQueue.comments.map((item) => item.id)).toEqual(['c-2', 'c-3', 'c-4', 'c-5']);
	});

	it('expires each comment 8 s after arrival independently', () => {
		act(() => {
			latestQueue.add(makeComment(1, { id: 'c-1' }));
		});
		act(() => {
			jest.advanceTimersByTime(3000);
		});
		act(() => {
			latestQueue.add(makeComment(2, { id: 'c-2' }));
		});

		act(() => {
			jest.advanceTimersByTime(LIVE_COMMENT_TTL_MS - 3001);
		});
		expect(latestQueue.comments.map((item) => item.id)).toEqual(['c-2', 'c-1'].reverse());

		act(() => {
			jest.advanceTimersByTime(1);
		});
		expect(latestQueue.comments.map((item) => item.id)).toEqual(['c-2']);

		act(() => {
			jest.advanceTimersByTime(2999);
		});
		expect(latestQueue.comments.map((item) => item.id)).toEqual(['c-2']);

		act(() => {
			jest.advanceTimersByTime(1);
		});
		expect(latestQueue.comments).toEqual([]);
	});

	it('tracks hidden and hasUnseen state across hide, add, show, toggle, and reset', () => {
		expect(latestQueue.hidden).toBe(false);
		expect(latestQueue.hasUnseen).toBe(false);

		act(() => {
			latestQueue.add(makeComment(1, { id: 'c-1' }));
		});
		expect(latestQueue.hasUnseen).toBe(false);

		act(() => {
			latestQueue.hide();
		});
		expect(latestQueue.hidden).toBe(true);
		expect(latestQueue.hasUnseen).toBe(false);

		act(() => {
			latestQueue.add(makeComment(2, { id: 'c-2' }));
		});
		expect(latestQueue.hasUnseen).toBe(true);

		act(() => {
			latestQueue.show();
		});
		expect(latestQueue.hidden).toBe(false);
		expect(latestQueue.hasUnseen).toBe(false);

		act(() => {
			latestQueue.toggle();
		});
		expect(latestQueue.hidden).toBe(true);

		act(() => {
			latestQueue.add(makeComment(3, { id: 'c-3' }));
		});
		expect(latestQueue.hasUnseen).toBe(true);

		act(() => {
			latestQueue.toggle();
		});
		expect(latestQueue.hidden).toBe(false);
		expect(latestQueue.hasUnseen).toBe(false);

		act(() => {
			latestQueue.hide();
			latestQueue.add(makeComment(4, { id: 'c-4' }));
		});
		expect(latestQueue.hasUnseen).toBe(true);

		act(() => {
			latestQueue.reset();
		});
		expect(latestQueue.comments).toEqual([]);
		expect(latestQueue.hidden).toBe(false);
		expect(latestQueue.hasUnseen).toBe(false);
		expect(jest.getTimerCount()).toBe(0);
	});

	it('clears hasUnseen when all queued comments expire', () => {
		act(() => {
			latestQueue.hide();
			latestQueue.add(makeComment(1, { id: 'c-1' }));
		});
		expect(latestQueue.hasUnseen).toBe(true);

		act(() => {
			jest.advanceTimersByTime(3000);
		});
		act(() => {
			latestQueue.add(makeComment(2, { id: 'c-2' }));
		});
		expect(latestQueue.hasUnseen).toBe(true);

		act(() => {
			jest.advanceTimersByTime(LIVE_COMMENT_TTL_MS - 3000);
		});
		expect(latestQueue.comments).toHaveLength(1);
		expect(latestQueue.hasUnseen).toBe(true);

		act(() => {
			jest.advanceTimersByTime(3000);
		});
		expect(latestQueue.comments).toEqual([]);
		expect(latestQueue.hasUnseen).toBe(false);
	});

	it('does not set hasUnseen for own comments added while hidden', () => {
		act(() => {
			latestQueue.hide();
			latestQueue.add(makeComment(1, { id: 'own-1' }), { own: true });
		});
		expect(latestQueue.comments).toHaveLength(1);
		expect(latestQueue.hasUnseen).toBe(false);

		act(() => {
			latestQueue.add(makeComment(2, { id: 'other-1' }));
		});
		expect(latestQueue.hasUnseen).toBe(true);

		act(() => {
			jest.advanceTimersByTime(LIVE_COMMENT_TTL_MS);
		});
		expect(latestQueue.comments).toEqual([]);
		expect(latestQueue.hasUnseen).toBe(false);

		act(() => {
			latestQueue.add(makeComment(3, { id: 'own-2' }), { own: true });
		});
		expect(latestQueue.comments).toHaveLength(1);
		expect(latestQueue.hasUnseen).toBe(false);
	});

	it('clears all pending timers on unmount', () => {
		act(() => {
			latestQueue.add(makeComment(1, { id: 'c-1' }));
			latestQueue.add(makeComment(2, { id: 'c-2' }));
		});
		expect(jest.getTimerCount()).toBe(2);

		act(() => renderer?.unmount());
		renderer = undefined;
		expect(jest.getTimerCount()).toBe(0);
	});
});
