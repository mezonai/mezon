import { useRef } from 'react';
import { flushSync } from 'react-dom';

type ListenerName = 'onResize' | 'onStable';
type ListenerCallBack = () => void;

const createHeightObserver = (listeners: Map<ListenerName, ListenerCallBack>) => {
	const expectedSize = new Map<ResizeObserverEntry, DOMRectReadOnly>();
	const stableTimeoutId: NodeJS.Timeout | null = null;
	const observer = new ResizeObserver(async (entries) => {
		const onResize = () =>
			new Promise<boolean>((resolve) => {
				const handler = listeners.get('onResize');
				if (handler) {
					flushSync(() => {
						handler();
					});
					resolve(true);
				} else {
					resolve(false);
				}
			});
		stableTimeoutId && clearTimeout(stableTimeoutId);
		for (const entry of entries) {
			const previousHeight = expectedSize.get(entry)?.height;
			expectedSize.set(entry, entry.contentRect);
			if (previousHeight === entry.contentRect.height) {
				return;
			}
			await onResize();
		}

		const onStable = listeners.get('onStable');
		if (onStable) {
			onStable();
		}
	});

	return observer;
};

export const useHeightObserverRef = () => {
	const ref = useRef<{
		observer: ResizeObserver;
		listeners: Map<ListenerName, ListenerCallBack>;
		setListener: (listenerName: ListenerName, listener: ListenerCallBack) => void;
	} | null>(null);

	// avoid re-creating object on each render
	if (ref.current === null) {
		const listeners = new Map<ListenerName, ListenerCallBack>();
		const observer = createHeightObserver(listeners);
		ref.current = {
			observer,
			listeners,
			setListener(listenerName: ListenerName, listener: ListenerCallBack) {
				ref.current?.listeners.set(listenerName, listener);
			}
		};
	}
	return ref;
};
