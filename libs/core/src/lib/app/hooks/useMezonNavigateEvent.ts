import { getStore, handleTopicNotification, selectDirectMessageEntities, selectMessageIsLoading, useAppDispatch } from '@mezon/store';
import { useCallback, useEffect } from 'react';
import { useCustomNavigate } from '../../chat/hooks/useCustomNavigate';

const DM_LOAD_TIMEOUT_MS = 2500;
const MESSAGES_LOAD_TIMEOUT_MS = 5000;

interface TopicNotificationMessage {
	channel_id?: string;
	extras?: {
		topicId?: string;
		messageId?: string;
		message_id?: string;
		link?: string;
		[key: string]: string | undefined;
	};
}

const waitForMessagesLoaded = (): Promise<void> => {
	const store = getStore();

	if (!selectMessageIsLoading(store.getState())) {
		return new Promise((resolve) => requestAnimationFrame(() => resolve()));
	}

	return new Promise((resolve) => {
		let unsubscribe: (() => void) | null = null;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const cleanup = () => {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};

		const handleResolve = () => {
			cleanup();
			requestAnimationFrame(() => resolve());
		};

		unsubscribe = store.subscribe(() => {
			const isLoading = selectMessageIsLoading(store.getState());
			if (!isLoading) {
				handleResolve();
			}
		});

		timeoutId = setTimeout(handleResolve, MESSAGES_LOAD_TIMEOUT_MS);
	});
};

export const useMezonNavigateEvent = () => {
	const navigate = useCustomNavigate();
	const dispatch = useAppDispatch();

	const handleNavigation = useCallback(
		async (url: string, msg?: TopicNotificationMessage) => {
			const dmUrlPattern = /^\/chat\/direct\/message\/([^/]+)\/(\d+)$/;
			const dmMatch = url.match(dmUrlPattern);

			if (dmMatch) {
				const [, dmId] = dmMatch;

				const checkDMExists = () => {
					const store = getStore();
					const directMessages = selectDirectMessageEntities(store.getState());
					return directMessages[dmId];
				};

				let dmExists = checkDMExists();

				if (!dmExists) {
					await new Promise((resolve) => setTimeout(resolve, DM_LOAD_TIMEOUT_MS));
					dmExists = checkDMExists();
					if (!dmExists) {
						return false;
					}
				}
			}

			navigate(url);

			if (msg) {
				await waitForMessagesLoaded();
				dispatch(handleTopicNotification({ msg }));
			}

			return true;
		},
		[navigate, dispatch]
	);

	const handleMezonNavigateEvent = useCallback(
		async (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent?.detail && customEvent.detail.url) {
				await handleNavigation(customEvent.detail.url, customEvent.detail?.msg);
			}
		},
		[handleNavigation]
	);

	useEffect(() => {
		window.addEventListener('mezon:navigate', handleMezonNavigateEvent);

		return () => {
			window.removeEventListener('mezon:navigate', handleMezonNavigateEvent);
		};
	}, [handleMezonNavigateEvent]);

	return {
		handleNavigation
	};
};
