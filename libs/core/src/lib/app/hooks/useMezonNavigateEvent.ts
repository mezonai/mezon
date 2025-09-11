import { getStore, handleTopicNotification, selectDirectMessageEntities, useAppDispatch } from '@mezon/store';
import { useCallback, useEffect } from 'react';
import { useCustomNavigate } from '../../chat/hooks/useCustomNavigate';

export const useMezonNavigateEvent = () => {
	const navigate = useCustomNavigate();
	const dispatch = useAppDispatch();

	const handleNavigation = useCallback(
		async (url: string, msg?: unknown) => {
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
					await new Promise((resolve) => setTimeout(resolve, 2500));
					dmExists = checkDMExists();
					if (!dmExists) {
						return false;
					}
				}

				navigate(url.replace(dmId, '123'));
			}

			if (msg) {
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
