// getIsHeavyAnimating

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AnyToVoidFunction } from '../types';
import { createCallbackManager, getIsHeavyAnimating } from '../utils';
import useLastCallback from './useLastCallback';

export const startCallbacks = createCallbackManager();
export const endCallbacks = createCallbackManager();

getIsHeavyAnimating.subscribe(() => {
	if (getIsHeavyAnimating()) {
		startCallbacks.runCallbacks();
	} else {
		endCallbacks.runCallbacks();
	}
});

export default function useHeavyAnimation(onStart?: AnyToVoidFunction, onEnd?: AnyToVoidFunction, isDisabled = false) {
	const lastOnStart = useLastCallback(onStart);
	const lastOnEnd = useLastCallback(onEnd);

	useEffect(() => {
		if (isDisabled) {
			return undefined;
		}

		if (getIsHeavyAnimating()) {
			lastOnStart();
		}

		startCallbacks.addCallback(lastOnStart);
		endCallbacks.addCallback(lastOnEnd);

		return () => {
			endCallbacks.removeCallback(lastOnEnd);
			startCallbacks.removeCallback(lastOnStart);
		};
	}, [isDisabled, lastOnEnd, lastOnStart]);
}

// TODO → `onFullyIdle`?
export function useThrottleForHeavyAnimation<T extends AnyToVoidFunction>(afterHeavyAnimation: T, deps: unknown[]) {
	const fnMemo = useCallback(afterHeavyAnimation, deps);

	const isScheduledRef = useRef(false);

	return useMemo(() => {
		return (...args: Parameters<T>) => {
			if (!isScheduledRef.current) {
				if (!getIsHeavyAnimating()) {
					fnMemo(...args);
					return;
				}

				isScheduledRef.current = true;

				const removeCallback = endCallbacks.addCallback(() => {
					fnMemo(...args);
					removeCallback();
					isScheduledRef.current = false;
				});
			}
		};
	}, [fnMemo]);
}
