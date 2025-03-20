import { useLayoutEffect, useRef } from 'react';

export const useLayoutEffectWithPrevDeps = <const T extends readonly any[]>(
	cb: (args: T | readonly []) => void,
	dependencies: T,
	debugKey?: string
) => {
	const prevDepsRef = useRef<T>();

	return useLayoutEffect(() => {
		const prevDeps = prevDepsRef.current;
		prevDepsRef.current = dependencies;

		return cb(prevDeps || []);
	}, dependencies);
};
