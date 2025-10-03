import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { requestMeasure } from '../fasterdom';
import type { BooleanToVoidFunction } from '../types';
import type { Signal } from '../utils';
import { debounce } from '../utils';
import { useIntersectionObserver, useOnIntersect } from './useIntersectionObserver';
import useLastCallback from './useLastCallback';
import { useSyncEffect } from './useSyncEffect';

export enum LoadMoreDirection {
	Backwards,
	Forwards,
	Around
}

export const MESSAGE_LIST_SENSITIVE_AREA = 1500;

const FAB_THRESHOLD = 600;
const NOTCH_THRESHOLD = 600;
const CONTAINER_HEIGHT_DEBOUNCE = 200;
const TOOLS_FREEZE_TIMEOUT = 350;

export function useScrollHooks(
	type: string,
	containerRef: RefObject<HTMLDivElement>,
	messageIds: string[],
	getContainerHeight: Signal<number | undefined>,
	isViewportNewest: boolean,
	isUnread: boolean,
	onScrollDownToggle: BooleanToVoidFunction,
	onNotchToggle: BooleanToVoidFunction,
	isReady: RefObject<boolean>,
	loadViewportMessages: ({ direction }: { direction: LoadMoreDirection }) => void
) {
	const [loadMoreBackwards, loadMoreForwards] = useMemo(
		() =>
			type === 'thread'
				? [
						debounce(() => loadViewportMessages({ direction: LoadMoreDirection.Backwards }), 300),
						debounce(() => loadViewportMessages({ direction: LoadMoreDirection.Forwards }), 300)
					]
				: [],
		[loadViewportMessages, messageIds]
	);

	const backwardsTriggerRef = useRef<HTMLDivElement>(null);
	const forwardsTriggerRef = useRef<HTMLDivElement>(null);
	const fabTriggerRef = useRef<HTMLDivElement>(null);

	const toggleScrollTools = useLastCallback(() => {
		if (!isReady.current) return;

		if (!messageIds?.length) {
			onScrollDownToggle(false);
			onNotchToggle(false);
			return;
		}

		if (!isViewportNewest) {
			onScrollDownToggle(true);
			onNotchToggle(true);
			return;
		}

		const container = containerRef.current;
		const fabTrigger = fabTriggerRef.current;
		if (!container || !fabTrigger) return;

		const { offsetHeight, scrollHeight, scrollTop } = container;

		if (scrollTop === 0) return;

		const fabOffsetTop = fabTrigger.offsetTop;
		const scrollBottom = Math.round(fabOffsetTop - scrollTop - offsetHeight);
		const isNearBottom = scrollBottom <= FAB_THRESHOLD;

		if (scrollHeight === 0) return;

		onScrollDownToggle(!isNearBottom);
		onNotchToggle(!isNearBottom);
	});

	const { observe: observeIntersectionForHistory } = useIntersectionObserver(
		{
			rootRef: containerRef,
			margin: MESSAGE_LIST_SENSITIVE_AREA
		},
		(entries) => {
			if (!loadMoreForwards || !loadMoreBackwards) {
				return;
			}

			entries.forEach(({ isIntersecting, target }) => {
				if (!isIntersecting) return;

				if (target.className === 'backwards-trigger') {
					loadMoreBackwards();
				}

				if (target.className === 'forwards-trigger') {
					loadMoreForwards();
				}
			});
		}
	);

	const withHistoryTriggers = messageIds && messageIds.length > 1;

	useOnIntersect(backwardsTriggerRef, withHistoryTriggers ? observeIntersectionForHistory : undefined);
	useOnIntersect(forwardsTriggerRef, withHistoryTriggers ? observeIntersectionForHistory : undefined);

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
