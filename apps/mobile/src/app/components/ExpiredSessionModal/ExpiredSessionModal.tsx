import {
	ActionEmitEvent,
	remove,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES
} from '@mezon/mobile-components';
import {
	accountActions,
	appActions,
	authActions,
	channelsActions,
	clansActions,
	messagesActions,
	selectAllAccount,
	selectHasInternetMobile
} from '@mezon/store';
import { getStoreAsync } from '@mezon/store-mobile';
import React, { useCallback, useEffect } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../componentUI/MezonConfirm';

const ExpiredSessionModal = () => {
	const userProfile = useSelector(selectAllAccount);
	const hasInternet = useSelector(selectHasInternetMobile);

	const logout = useCallback(async () => {
		const store = await getStoreAsync();
		store.dispatch(channelsActions.removeAll());
		store.dispatch(messagesActions.removeAll());
		store.dispatch(clansActions.setCurrentClanId(''));
		store.dispatch(clansActions.removeAll());
		store.dispatch(clansActions.collapseAllGroups());
		store.dispatch(clansActions.clearClanGroups());
		store.dispatch(clansActions.refreshStatus());
		store.dispatch(accountActions.setPasswordSetted(false));

		await remove(STORAGE_DATA_CLAN_CHANNEL_CACHE);
		await remove(STORAGE_CHANNEL_CURRENT_CACHE);
		await remove(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES);
		await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
		store.dispatch(appActions.setIsShowWelcomeMobile(false));
		store.dispatch(authActions.logOut({ device_id: userProfile?.user?.username, platform: Platform.OS }));
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}, [userProfile?.user?.username]);

	useEffect(() => {
		const listener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED, () => {
			if (!hasInternet) return;
			const data = {
				children: (
					<MezonConfirm
						onConfirm={logout}
						title={'Session Expired or Network Error'}
						confirmText={'Login Again'}
						content={'Your session has expired. Please log in again to continue.'}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		});

		return () => {
			listener.remove();
		};
	}, [hasInternet, logout]);
	return null;
};

export default ExpiredSessionModal;
