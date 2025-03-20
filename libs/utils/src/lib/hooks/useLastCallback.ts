import { useCallback } from 'react';
import { AnyFunction } from '../types';
import { useStateRef } from './useStateRef';
export default function useLastCallback<T extends AnyFunction>(callback?: T) {
	const ref = useStateRef(callback);
	return useCallback((...args: Parameters<T>) => ref.current?.(...args), []) as T;
}
