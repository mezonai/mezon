import { useCallback, useRef } from 'react';

function preventDefault(e: Event) {
	if (!isTouchEvent(e)) return;

	if (e.touches.length < 2 && e.preventDefault) {
		e.preventDefault();
	}
}

export function isTouchEvent(e: Event): e is TouchEvent {
	return e && 'touches' in e;
}

interface PressHandlers<T> {
	onStart: (e: React.MouseEvent<T> | React.TouchEvent<T>) => void;
	onFinish?: (e: React.MouseEvent<T> | React.TouchEvent<T>) => void;
}

interface Options {
	delay?: number;
	shouldPreventDefault?: boolean;
}

export interface ILongPressType {
	onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
	onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
	onMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
	onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
	onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
}

export function useLongPress<T>({ onStart, onFinish }: PressHandlers<T>, { delay = 300, shouldPreventDefault = true }: Options = {}) {
	const timeout = useRef<NodeJS.Timeout>();
	const target = useRef<EventTarget>();

	const start = useCallback(
		(e: React.MouseEvent<T> | React.TouchEvent<T>) => {
			e.persist();
			const clonedEvent = { ...e };

			if (shouldPreventDefault && e.target) {
				e.target.addEventListener('touchend', preventDefault, { passive: false });
				target.current = e.target;
			}

			timeout.current = setTimeout(() => {
				onStart(clonedEvent);
			}, delay);
		},
		[onStart, delay, shouldPreventDefault]
	);

	const clear = useCallback(
		(e: React.MouseEvent<T> | React.TouchEvent<T>, shouldTriggerClick = true) => {
			if (timeout.current) {
				clearTimeout(timeout.current);
				shouldTriggerClick && onFinish?.(e);
			}

			if (shouldPreventDefault && target.current) {
				target.current.removeEventListener('touchend', preventDefault);
			}
		},
		[shouldPreventDefault, onFinish]
	);

	return {
		onMouseDown: (e: React.MouseEvent<T>) => start(e),
		onTouchStart: (e: React.TouchEvent<T>) => start(e),
		onMouseUp: (e: React.MouseEvent<T>) => clear(e),
		onMouseLeave: (e: React.MouseEvent<T>) => clear(e),
		onTouchEnd: (e: React.TouchEvent<T>) => clear(e)
	};
}
