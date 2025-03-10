import { useCallback, useState } from 'react';

export const useOnScreen = ({ root = null as HTMLElement | null, rootMargin = '0px', threshold = 0 } = {}) => {
	const [observer, setObserver] = useState<IntersectionObserver | null>(null);
	const [isIntersecting, setIntersecting] = useState(false);

	const measureRef = useCallback(
		(node: HTMLElement | null) => {
			if (node) {
				const observer = new IntersectionObserver(
					([entry]) => {
						setIntersecting(entry.isIntersecting);
					},
					{ root, rootMargin, threshold }
				);

				observer.observe(node);
				setObserver(observer);
			}
		},
		[root, rootMargin, threshold]
	);

	return { measureRef, isIntersecting, observer };
};
