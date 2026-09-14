import { useEffect, useRef, type RefObject } from 'react';
import useLastCallback from './useLastCallback';

type Direction = 'top' | 'bottom';
const RETRY_INTERVAL_MS = 1000;

export interface HistoryPaginationState {
	scopeId: string;
	isLoading: boolean;
	isJumping: boolean;
	hasMoreTop: boolean;
	hasMoreBottom: boolean;
}

/** Recheck the active edge after a page, even when it never leaves the observer margin. */
export function useHistoryPagination(
	containerRef: RefObject<HTMLDivElement>,
	topRef: RefObject<HTMLDivElement>,
	bottomRef: RefObject<HTMLDivElement>,
	messageIds: string[],
	enabled: boolean,
	state: HistoryPaginationState,
	margin: number,
	loadPage: (direction: Direction) => void | Promise<unknown>
) {
	const directionRef = useRef<Direction>();
	const attemptedRef = useRef<Partial<Record<Direction, { key: string; at: number }>>>({});
	const frameRef = useRef<number>();
	const retryRef = useRef(false);
	const requestRef = useRef<object>();
	const firstId = messageIds?.[0];
	const lastId = messageIds?.[messageIds.length - 1];

	const checkEdge = useLastCallback((direction: Direction, retry = false) => {
		const container = containerRef.current;
		const target = direction === 'top' ? topRef.current : bottomRef.current;
		if (!enabled || !container || !target) return;
		directionRef.current = direction;
		if (requestRef.current || state.isLoading || state.isJumping) return;
		if (direction === 'top' ? !state.hasMoreTop : !state.hasMoreBottom) return;
		const key = `${state.scopeId}:${direction}:${direction === 'top' ? firstId : lastId}`;
		// Avoid even a layout read until the cursor advances or the user retries.
		const attempted = attemptedRef.current[direction];
		if (attempted?.key === key && (!retry || Date.now() - attempted.at < RETRY_INTERVAL_MS)) return;
		const root = container.getBoundingClientRect();
		const edge = target.getBoundingClientRect();
		if (edge.bottom < root.top - margin || edge.top > root.bottom + margin) return;

		attemptedRef.current[direction] = { key, at: Date.now() };
		const request = {};
		requestRef.current = request;
		const finish = () => {
			if (requestRef.current !== request) return;
			requestRef.current = undefined;
			// Data can commit before the callback settles; recheck the latest cursor.
			if (directionRef.current) scheduleCheck(directionRef.current);
		};
		try {
			const result = loadPage(direction);
			if (result) {
				void result.then(finish, finish);
			} else {
				requestRef.current = undefined;
			}
		} catch (error) {
			finish();
			throw error;
		}
	});

	const scheduleCheck = useLastCallback((direction: Direction, retry = false) => {
		retryRef.current = retry || (directionRef.current === direction && retryRef.current);
		directionRef.current = direction;
		if (frameRef.current !== undefined) return;
		frameRef.current = requestAnimationFrame(() => {
			frameRef.current = undefined;
			const shouldRetry = retryRef.current;
			retryRef.current = false;
			if (directionRef.current) checkEdge(directionRef.current, shouldRetry);
		});
	});

	useEffect(() => {
		directionRef.current = undefined;
		attemptedRef.current = {};
		const container = containerRef.current;
		const top = topRef.current;
		const bottom = bottomRef.current;
		if (!enabled || !container || !top || !bottom) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.filter((entry) => entry.isIntersecting);
				if (!visible.length) return;
				const root = container.getBoundingClientRect();
				// Both edges can be inside the prefetch margin of a short page.
				// Start with the closer edge, never request both pages concurrently.
				visible.sort((a, b) => {
					const distance = (entry: IntersectionObserverEntry) =>
						Math.abs(entry.target === top ? entry.boundingClientRect.top - root.top : root.bottom - entry.boundingClientRect.bottom);
					return distance(a) - distance(b);
				});
				scheduleCheck(visible[0].target === top ? 'top' : 'bottom');
			},
			{ root: container, rootMargin: `${margin}px` }
		);
		observer.observe(top);
		observer.observe(bottom);

		const onWheel = (event: WheelEvent) => {
			if (event.deltaY) scheduleCheck(event.deltaY < 0 ? 'top' : 'bottom', true);
		};
		const onScroll = () => {
			if (directionRef.current) scheduleCheck(directionRef.current);
		};
		container.addEventListener('wheel', onWheel, { passive: true });
		container.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			observer.disconnect();
			container.removeEventListener('wheel', onWheel);
			container.removeEventListener('scroll', onScroll);
			if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
			frameRef.current = undefined;
			requestRef.current = undefined;
			directionRef.current = undefined;
			retryRef.current = false;
		};
	}, [containerRef, topRef, bottomRef, enabled, state.scopeId, margin, scheduleCheck]);

	useEffect(() => {
		if (directionRef.current) scheduleCheck(directionRef.current);
	}, [firstId, lastId, state.isLoading, state.isJumping, state.hasMoreTop, state.hasMoreBottom, scheduleCheck]);
}
