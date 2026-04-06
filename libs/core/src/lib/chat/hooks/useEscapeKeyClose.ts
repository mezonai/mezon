import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

export const useEscapeKeyClose = (ref: RefObject<HTMLElement> | undefined, onClose: () => void) => {
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		const element = ref?.current;
		if (!element) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' || event.key === 'Esc') {
				if (document.activeElement === element || element.contains(document.activeElement)) {
					event.stopPropagation();
					onCloseRef.current();
				}
			}
		};

		if (document.activeElement !== element && !element.contains(document.activeElement)) {
			element.focus();
		}

		element.addEventListener('keydown', handleKeyDown);
		return () => {
			element.removeEventListener('keydown', handleKeyDown);
		};
	}, [ref]);
};
