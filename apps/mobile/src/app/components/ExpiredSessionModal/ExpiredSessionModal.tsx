import { ActionEmitEvent } from '@mezon/mobile-components';
import { selectHasInternetMobile } from '@mezon/store-mobile';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter } from 'react-native';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../componentUI/MezonConfirm';
import { logoutGlobal } from '../../utils/helpers';

const ExpiredSessionModal = () => {
	const hasInternet = useSelector(selectHasInternetMobile);
	const { t } = useTranslation(['common']);

	useEffect(() => {
		const listener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED, () => {
			if (!hasInternet) return;
			const data = {
				children: (
					<MezonConfirm
						onConfirm={logoutGlobal}
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
	}, [hasInternet, t]);
	return null;
};

export default ExpiredSessionModal;
