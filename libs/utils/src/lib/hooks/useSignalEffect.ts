import { useRef } from 'react';
import { NoneToVoidFunction } from '../types/base';
import { cleanupEffect, isSignal } from '../utils';
import { useUnmountCleanup } from './useUnmountCleanup';
export function useSignalEffect(effect: NoneToVoidFunction, dependencies: readonly any[]) {
	const isFirstRun = useRef(true);
	if (isFirstRun.current) {
		isFirstRun.current = false;

		dependencies?.forEach((dependency) => {
			if (isSignal(dependency)) {
				dependency.subscribe(effect);
			}
		});
	}

	useUnmountCleanup(() => {
		cleanupEffect(effect);
	});
}
