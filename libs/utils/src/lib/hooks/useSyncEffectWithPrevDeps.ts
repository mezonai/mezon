import { useRef } from 'react';
import { useSyncEffect } from './useSyncEffect';

const useLayoutEffectWithPrevDeps = <const T extends readonly any[]>(cb: (args: T | readonly []) => void, dependencies: T) => {
	const prevDepsRef = useRef<T>();

	return useSyncEffect(() => {
		const prevDeps = prevDepsRef.current;
		prevDepsRef.current = dependencies;

		return cb(prevDeps || []);
	}, dependencies);
};

export default useLayoutEffectWithPrevDeps;
