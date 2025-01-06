import { useEffect, useMemo, useRef, type RefObject } from 'react';

import { BooleanToVoidFunction, debounce, requestMeasure, Signal } from '@mezon/utils';
import { useDebouncedSignal } from './useAsyncResolvers';
import { useIntersectionObserver, useOnIntersect } from './useIntersectionObserver';
import useLastCallback from './useLastCallback';
import { useSignalEffect } from './useSignalEffect';
import { useSyncEffect } from './useSyncEffect';

export enum LoadMoreDirection {
	Backwards,
	Forwards,
	Around
}

export const MESSAGE_LIST_SENSITIVE_AREA = 750;

const FAB_THRESHOLD = 50;
const NOTCH_THRESHOLD = 1; // Notch has zero height so we at least need a 1px margin to intersect
const CONTAINER_HEIGHT_DEBOUNCE = 200;
const TOOLS_FREEZE_TIMEOUT = 350; // Approximate message sending animation duration

export function useScrollHooks(
	type: string,
	containerRef: RefObject<HTMLDivElement>,
	messageIds: string[],
	getContainerHeight: Signal<number | undefined>,
	isViewportNewest: boolean,
	isUnread: boolean,
	onScrollDownToggle: BooleanToVoidFunction,
	onNotchToggle: BooleanToVoidFunction,
	isReady: boolean,
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
		if (!isReady) return;

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
		const fabOffsetTop = fabTrigger.offsetTop;
		const scrollBottom = Math.round(fabOffsetTop - scrollTop - offsetHeight);
		const isNearBottom = scrollBottom <= FAB_THRESHOLD;
		const isAtBottom = scrollBottom <= NOTCH_THRESHOLD;

		if (scrollHeight === 0) return;

		onScrollDownToggle(isUnread ? !isAtBottom : !isNearBottom);
		onNotchToggle(!isAtBottom);
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
			throttleScheduler: requestMeasure
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
			throttleScheduler: requestMeasure
		},
		toggleScrollTools
	);

	useOnIntersect(fabTriggerRef, observeIntersectionForNotch);

	useEffect(() => {
		if (isReady) {
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

	// Workaround for FAB and notch flickering with tall incoming message
	useSyncEffect(freezeShortly, [freezeShortly, messageIds]);

	// Workaround for notch flickering when opening Composer Embedded Message
	const getContainerHeightDebounced = useDebouncedSignal(getContainerHeight, CONTAINER_HEIGHT_DEBOUNCE);
	useSignalEffect(freezeShortly, [freezeShortly, getContainerHeightDebounced]);

	return {
		withHistoryTriggers,
		backwardsTriggerRef,
		forwardsTriggerRef,
		fabTriggerRef
	};
}
