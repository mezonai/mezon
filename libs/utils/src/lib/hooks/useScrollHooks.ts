import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { requestMeasure } from '../fasterdom';
import type { BooleanToVoidFunction } from '../types';
import type { Signal } from '../utils';
import { debounce } from '../utils';
import { useHistoryPagination, type HistoryPaginationState } from './useHistoryPagination';
import { useIntersectionObserver, useOnIntersect } from './useIntersectionObserver';
import useLastCallback from './useLastCallback';
import { useSyncEffect } from './useSyncEffect';

export enum LoadMoreDirection {
	Backwards,
	Forwards,
	Around
}

export const MESSAGE_LIST_SENSITIVE_AREA = 1500;

const FAB_THRESHOLD = 200;
const NOTCH_THRESHOLD = 1;
const SCROLL_TOOLS_DEBOUNCE = 100;
const TOOLS_FREEZE_TIMEOUT = 350;

export function useScrollHooks(
	type: string,
	containerRef: RefObject<HTMLDivElement>,
	messageIds: string[],
	_getContainerHeight: Signal<number | undefined>,
	isViewportNewest: boolean,
	_isUnread: boolean,
	onScrollDownToggle: BooleanToVoidFunction,
	onNotchToggle: BooleanToVoidFunction,
	isReady: RefObject<boolean>,
	loadViewportMessages: ({ direction }: { direction: LoadMoreDirection }) => void | Promise<unknown>,
	historyState: HistoryPaginationState
) {
	const backwardsTriggerRef = useRef<HTMLDivElement>(null);
	const forwardsTriggerRef = useRef<HTMLDivElement>(null);
	const fabTriggerRef = useRef<HTMLDivElement>(null);

	const toggleScrollToolsImmediate = useLastCallback((scrollDown: boolean, notch: boolean) => {
		onScrollDownToggle(scrollDown);
		onNotchToggle(notch);
	});

	const toggleScrollToolsDebounced = useMemo(
		() => debounce(toggleScrollToolsImmediate, SCROLL_TOOLS_DEBOUNCE, true, false),
		[toggleScrollToolsImmediate]
	);

	const toggleScrollTools = useLastCallback(() => {
		if (!isReady.current) return;

		if (!messageIds?.length) {
			toggleScrollToolsImmediate(false, false);
			return;
		}

		if (!isViewportNewest) {
			toggleScrollToolsDebounced(true, true);
			return;
		}

		const container = containerRef.current;
		const fabTrigger = fabTriggerRef.current;
		if (!container || !fabTrigger) return;

		const { offsetHeight, scrollHeight, scrollTop } = container;

		const fabOffsetTop = fabTrigger.offsetTop;
		const scrollBottom = Math.round(fabOffsetTop - scrollTop - offsetHeight);
		const isNearBottom = scrollBottom <= FAB_THRESHOLD;
		const isAtBottom = scrollBottom <= NOTCH_THRESHOLD;

		if (scrollHeight === 0) return;

		toggleScrollToolsDebounced(!isNearBottom, !isAtBottom);
	});

	const withHistoryTriggers = !!messageIds?.length;
	useHistoryPagination(
		containerRef,
		backwardsTriggerRef,
		forwardsTriggerRef,
		messageIds,
		type === 'thread' && withHistoryTriggers,
		historyState,
		MESSAGE_LIST_SENSITIVE_AREA,
		(direction) => loadViewportMessages({ direction: direction === 'top' ? LoadMoreDirection.Backwards : LoadMoreDirection.Forwards })
	);

	const {
		observe: observeIntersectionForFab,
		freeze: freezeForFab,
		unfreeze: unfreezeForFab
	} = useIntersectionObserver(
		{
			rootRef: containerRef,
			margin: FAB_THRESHOLD * 2,
			throttleScheduler: requestMeasure as any
		},
		toggleScrollTools
	);

	useOnIntersect(fabTriggerRef, observeIntersectionForFab);

	const {
		observe: observeIntersectionForNotch,
		freeze: freezeForNotch,
		unfreeze: unfreezeForNotch
	} = useIntersectionObserver(
		{
			rootRef: containerRef,
			margin: NOTCH_THRESHOLD,
			throttleScheduler: requestMeasure as any
		},
		toggleScrollTools
	);

	useOnIntersect(fabTriggerRef, observeIntersectionForNotch);

	useEffect(() => {
		if (isReady.current) {
			toggleScrollTools();
		}
	}, [isReady, toggleScrollTools]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		container.addEventListener('scrollend', toggleScrollTools);

		return () => {
			container.removeEventListener('scrollend', toggleScrollTools);
		};
	}, [containerRef, toggleScrollTools]);

	const freezeShortly = useLastCallback(() => {
		freezeForFab();
		freezeForNotch();

		setTimeout(() => {
			unfreezeForNotch();
			unfreezeForFab();
		}, TOOLS_FREEZE_TIMEOUT);
	});

	useSyncEffect(freezeShortly, [freezeShortly, messageIds]);

	return {
		withHistoryTriggers,
		backwardsTriggerRef,
		forwardsTriggerRef,
		fabTriggerRef
	};
}
