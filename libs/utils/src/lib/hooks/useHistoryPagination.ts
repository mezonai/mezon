import { useEffect, useRef, type RefObject } from 'react';
import useLastCallback from './useLastCallback';

type Direction = 'top' | 'bottom';

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
	loadPage: (direction: Direction) => void
) {
	const directionRef = useRef<Direction>();
	const attemptedRef = useRef<string>();
	const frameRef = useRef<number>();
	const retryRef = useRef(false);
	const firstId = messageIds?.[0];
	const lastId = messageIds?.[messageIds.length - 1];

	const checkEdge = useLastCallback((direction: Direction, retry = false) => {
		const container = containerRef.current;
		const target = direction === 'top' ? topRef.current : bottomRef.current;
		if (!enabled || !container || !target) return;
		directionRef.current = direction;
		if (state.isLoading || state.isJumping) return;
		if (direction === 'top' ? !state.hasMoreTop : !state.hasMoreBottom) return;
		const root = container.getBoundingClientRect();
		const edge = target.getBoundingClientRect();
		if (edge.bottom < root.top - margin || edge.top > root.bottom + margin) return;

		const key = `${state.scopeId}:${direction}:${direction === 'top' ? firstId : lastId}`;
		// An error or an empty page must not start an automatic retry loop.
		if (!retry && attemptedRef.current === key) return;
		attemptedRef.current = key;
		loadPage(direction);
	});

	const scheduleCheck = useLastCallback((direction: Direction, retry = false) => {
		retryRef.current = retry || (directionRef.current === direction && retryRef.current);
		directionRef.current = direction;
		if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
		frameRef.current = requestAnimationFrame(() => {
			frameRef.current = undefined;
			const shouldRetry = retryRef.current;
			retryRef.current = false;
			checkEdge(direction, shouldRetry);
		});
	});

	useEffect(() => {
		directionRef.current = undefined;
		attemptedRef.current = undefined;
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
		};
	}, [containerRef, topRef, bottomRef, enabled, state.scopeId, margin, scheduleCheck]);

	useEffect(() => {
		if (directionRef.current) scheduleCheck(directionRef.current);
	}, [firstId, lastId, state.isLoading, state.isJumping, state.hasMoreTop, state.hasMoreBottom, scheduleCheck]);
}
