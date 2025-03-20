import type { RefObject } from 'react';

import { IS_ANDROID, useAppLayout, useIntersectionObserver } from '@mezon/utils';

const INTERSECTION_THROTTLE_FOR_MEDIA = IS_ANDROID ? 1000 : 350;

export function useMessageObservers(
	type: any,
	containerRef: RefObject<HTMLDivElement>,
	memoFirstUnreadIdRef?: { current: number | undefined } | null,
	onIntersectPinnedMessage?: any,
	chatId?: string
) {
	const { isMobile } = useAppLayout();
	const INTERSECTION_MARGIN_FOR_LOADING = isMobile ? 300 : 500;

	const { observe: observeIntersectionForLoading } = useIntersectionObserver({
		rootRef: containerRef,
		throttleMs: INTERSECTION_THROTTLE_FOR_MEDIA,
		margin: INTERSECTION_MARGIN_FOR_LOADING
	});

	return {
		observeIntersectionForLoading
	};
}
