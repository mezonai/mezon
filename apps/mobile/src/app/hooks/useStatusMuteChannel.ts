import { ENotificationActive, ENotificationChannelId } from '@mezon/mobile-components';
import {
	selectCurrentChannel,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectDmGroupCurrentId,
	selectNotifiSettingsEntitiesById,
	useAppSelector
} from '@mezon/store-mobile';
import { NotificationType } from 'mezon-js';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const useStatusMuteChannel = () => {
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const [statusMute, setStatusMute] = useState<ENotificationActive>(ENotificationActive.ON);
	const defaultNotificationCategory = useAppSelector((state) => selectDefaultNotificationCategory(state, currentChannel?.categoryId as string));
	const getNotificationChannelSelected = useAppSelector((state) =>
		selectNotifiSettingsEntitiesById(state, currentDmId || currentChannel?.id || '')
	);

	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	useEffect(() => {
		if (
			getNotificationChannelSelected?.active === ENotificationActive.ON &&
			getNotificationChannelSelected?.notificationSettingType === NotificationType.NOTHING_MESSAGE
		) {
			setStatusMute(ENotificationActive.OFF);
		} else if (
			getNotificationChannelSelected?.id !== ENotificationChannelId.Default &&
			getNotificationChannelSelected?.active !== ENotificationActive.ON
		) {
			setStatusMute(ENotificationActive.OFF);
		} else if (getNotificationChannelSelected?.id === ENotificationChannelId.Default) {
			if (defaultNotificationCategory?.notificationSettingType === NotificationType.NOTHING_MESSAGE) {
				setStatusMute(ENotificationActive.OFF);
			} else if (defaultNotificationClan?.notificationSettingType === NotificationType.NOTHING_MESSAGE) {
				setStatusMute(ENotificationActive.OFF);
			} else {
				setStatusMute(ENotificationActive.ON);
			}
		} else {
			setStatusMute(ENotificationActive.ON);
		}
	}, [getNotificationChannelSelected, defaultNotificationCategory, defaultNotificationClan]);
	return {
		statusMute
	};
};

export default useStatusMuteChannel;
