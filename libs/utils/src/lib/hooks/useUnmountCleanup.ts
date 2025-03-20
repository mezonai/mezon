import { useEffect } from 'react';
import { NoneToVoidFunction } from '../types';

export function useUnmountCleanup(cleanup: NoneToVoidFunction) {
	useEffect(() => {
		return () => {
			cleanup();
		};
	}, []);
}
