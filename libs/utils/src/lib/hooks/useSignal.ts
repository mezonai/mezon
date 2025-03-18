import { useRef } from 'react';
import { createSignal, Signal } from '../utils';

export function useSignal<T>(initial?: T): readonly [Signal<T>, (value: T) => void] {
	const signalRef = useRef<ReturnType<typeof createSignal<T>>>();
	signalRef.current ??= createSignal<T>(initial);
	return signalRef.current;
}
