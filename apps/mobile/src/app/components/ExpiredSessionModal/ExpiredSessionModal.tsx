import {
	ActionEmitEvent,
	remove,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES
} from '@mezon/mobile-components';
import {
	appActions,
	authActions,
	channelsActions,
	clansActions,
	directActions,
	getStoreAsync,
	listChannelsByUserActions,
	messagesActions,
	notificationActions,
	selectAllAccount,
	selectHasInternetMobile
} from '@mezon/store-mobile';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../componentUI/MezonConfirm';

const ExpiredSessionModal = () => {
	const userProfile = useSelector(selectAllAccount);
	const hasInternet = useSelector(selectHasInternetMobile);
	const { t } = useTranslation(['common']);

	const logout = useCallback(async () => {
		const store = await getStoreAsync();
		store.dispatch(directActions.removeAll());
		store.dispatch(notificationActions.removeAll());
		store.dispatch(channelsActions.removeAll());
		store.dispatch(messagesActions.removeAll());
		store.dispatch(listChannelsByUserActions.removeAll());
		store.dispatch(clansActions.setCurrentClanId(''));
		store.dispatch(clansActions.removeAll());
		store.dispatch(clansActions.collapseAllGroups());
		store.dispatch(clansActions.clearClanGroups());
		store.dispatch(clansActions.refreshStatus());
		await remove(STORAGE_DATA_CLAN_CHANNEL_CACHE);
		await remove(STORAGE_CHANNEL_CURRENT_CACHE);
		await remove(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES);
		await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
		store.dispatch(appActions.setIsShowWelcomeMobile(false));
		store.dispatch(authActions.logOut({ device_id: userProfile.user.username, platform: Platform.OS }));
		store.dispatch(appActions.setLoadingMainMobile(false));
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}, [userProfile?.user?.username]);

	useEffect(() => {
		const listener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED, () => {
			if (!hasInternet) return;
			const data = {
				children: (
					<MezonConfirm
						onConfirm={logout}
						title={t('sessionExpired.title')}
						confirmText={t('sessionExpired.confirm')}
						content={t('sessionExpired.content')}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		});

		return () => {
			listener.remove();
		};
	}, [hasInternet, logout, t]);
	return null;
};

export default ExpiredSessionModal;
