import type { IOptionsNotification } from '@mezon/mobile-components';
import { getNotifyLabels } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	notificationSettingActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectNotifiSettingsEntitiesById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import type { ChannelThreads } from '@mezon/utils';
import { ENotificationTypes, sleep } from '@mezon/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import FilterCheckbox from './FilterCheckbox/FilterCheckbox';
import { style } from './NotificationSetting.styles';

export default function NotificationSetting({ channel }: { channel?: ChannelThreads }) {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['notificationSetting']);
	const styles = style(themeValue);
	const optionNotifySetting = [
		{
			id: 0,
			label: t('bottomSheet.labelOptions.categoryDefault'),
			isChecked: false,
			value: ENotificationTypes.DEFAULT
		},
		{
			id: 1,
			label: t('bottomSheet.labelOptions.allMessage'),
			isChecked: false,
			value: ENotificationTypes.ALL_MESSAGE
		},
		{
			id: 2,
			label: t('bottomSheet.labelOptions.mentionMessage'),
			isChecked: false,
			value: ENotificationTypes.MENTION_MESSAGE
		},
		{
			id: 3,
			label: t('bottomSheet.labelOptions.notThingMessage'),
			isChecked: false,
			value: ENotificationTypes.NOTHING_MESSAGE
		}
	];
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const [radioBox, setRadioBox] = useState<IOptionsNotification[]>(optionNotifySetting);
	const currentClanId = useSelector(selectCurrentClanId);
	const getNotificationChannelSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, channel?.id || currentChannelId || ''));
	const defaultNotificationCategory = useAppSelector((state) => selectDefaultNotificationCategory(state, channel?.categoryId as string));
	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	const [defaultNotifyName, setDefaultNotifyName] = useState('');

	useEffect(() => {
		if (!getNotificationChannelSelected?.notification_setting_type) {
			setRadioBox((prev) => prev.map((item) => (item.id === 0 ? { ...item, isChecked: true } : item)));
			return;
		}
		setRadioBox((prev) =>
			prev.map((item) => ({
				...item,
				isChecked: getNotificationChannelSelected?.notification_setting_type === item.value
			}))
		);
	}, [getNotificationChannelSelected]);

	useEffect(() => {
		if (defaultNotificationCategory?.notification_setting_type) {
			setDefaultNotifyName(getNotifyLabels(t)[defaultNotificationCategory?.notification_setting_type]);
		} else if (defaultNotificationClan?.notification_setting_type) {
			setDefaultNotifyName(getNotifyLabels(t)[defaultNotificationClan?.notification_setting_type]);
		}
	}, [getNotificationChannelSelected, defaultNotificationCategory, defaultNotificationClan, t]);

	const handleRadioBoxPress = useCallback(
		async (checked: boolean, id: number) => {
			const notifyOptionSelected = radioBox.map((item) => ({ ...item, isChecked: item.id === id }));
			setRadioBox(notifyOptionSelected);
			if (notifyOptionSelected?.length) {
				const notifyOptionSettingSelected = notifyOptionSelected.find((option) => option.isChecked);
				try {
					dispatch(appActions.setLoadingMainMobile(true));
					if (
						[ENotificationTypes.ALL_MESSAGE, ENotificationTypes.MENTION_MESSAGE, ENotificationTypes.NOTHING_MESSAGE].includes(
							notifyOptionSettingSelected?.value
						)
					) {
						const body = {
							channelId: channel?.channelId || currentChannelId || '',
							notification_type: notifyOptionSettingSelected?.value || 0,
							clanId: channel?.clanId || currentClanId || ''
						};
						const res = await dispatch(notificationSettingActions.setNotificationSetting(body));
						if (res?.meta?.requestStatus === 'rejected') {
							throw res?.meta?.requestStatus;
						}
					} else {
						const res = await dispatch(
							notificationSettingActions.deleteNotiChannelSetting({
								channelId: channel?.channelId || currentChannelId || '',
								clanId: channel?.clanId || currentClanId || ''
							})
						);
						if (res?.meta?.requestStatus === 'rejected') {
							throw res?.meta?.requestStatus;
						}
					}
				} catch (error) {
					Toast.show({ type: 'error', text1: t('toast.error', { error }) });
					await sleep(100);
					setRadioBox(radioBox);
				} finally {
					dispatch(appActions.setLoadingMainMobile(false));
				}
			}
		},
		[channel?.channelId, channel?.clanId, currentChannelId, currentClanId, dispatch, radioBox, t]
	);

	return (
		<View style={styles.container}>
			<Text style={styles.headerTitle}>{t('bottomSheet.title')}</Text>
			<View style={styles.optionsSetting}>
				{radioBox?.map((item) => (
					<FilterCheckbox item={item} key={`${item.id}`} defaultNotifyName={defaultNotifyName} onCheckboxPress={handleRadioBoxPress} />
				))}
			</View>
		</View>
	);
}
