import { IOptionsNotification, notifyLabels } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	notifiReactMessageActions,
	notificationSettingActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectNotifiReactMessageByChannelId,
	selectNotifiSettingsEntitiesById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { ChannelThreads, ENotificationTypes } from '@mezon/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import FilterCheckbox from './FilterCheckbox/FilterCheckbox';
import { style } from './NotificationSetting.styles';

const REACT_MESSAGE = 4;

export default function NotificationSetting({ channel }: { channel?: ChannelThreads }) {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['notificationSetting']);
	const styles = style(themeValue);
	const optionNotifySetting = useMemo(
		() => [
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
		],
		[t]
	);

	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const [radioBox, setRadioBox] = useState<IOptionsNotification[]>(optionNotifySetting);
	const currentClanId = useSelector(selectCurrentClanId);
	const notifyReactMessage = useAppSelector((state) => selectNotifiReactMessageByChannelId(state, channel?.channel_id || currentChannelId || ''));
	const getNotificationChannelSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, channel?.id || currentChannelId || ''));
	const defaultNotificationCategory = useAppSelector((state) => selectDefaultNotificationCategory(state, channel?.category_id as string));
	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	const [defaultNotifyName, setDefaultNotifyName] = useState('');
	const isNotifyReactMessage = notifyReactMessage?.id !== '0';

	const checkBox = {
		id: 4,
		label: t('bottomSheet.labelOptions.reactionMessage'),
		isChecked: isNotifyReactMessage || false,
		value: REACT_MESSAGE
	};

	useEffect(() => {
		if (!getNotificationChannelSelected?.notification_setting_type) {
			setRadioBox((prev) => prev.map((item) => (item.id === 0 ? { ...item, isChecked: true } : item)));
			return;
		}
		setRadioBox(radioBox.map((item) => item && { ...item, isChecked: getNotificationChannelSelected?.notification_setting_type === item.value }));
	}, [notifyReactMessage, getNotificationChannelSelected]);

	useEffect(() => {
		if (defaultNotificationCategory?.notification_setting_type) {
			setDefaultNotifyName(notifyLabels[defaultNotificationCategory?.notification_setting_type]);
		} else if (defaultNotificationClan?.notification_setting_type) {
			setDefaultNotifyName(notifyLabels[defaultNotificationClan?.notification_setting_type]);
		}
	}, [getNotificationChannelSelected, defaultNotificationCategory, defaultNotificationClan]);

	useEffect(() => {
		if (!channel?.channel_id && !currentChannelId) return;
		dispatch(notifiReactMessageActions.getNotifiReactMessage({ channelId: channel?.channel_id || currentChannelId }));
	}, [currentChannelId, channel?.channel_id, dispatch]);

	const handleRadioBoxPress = (checked: boolean, id: number) => {
		const notifyOptionSelected = radioBox.map((item) => item && { ...item, isChecked: item.id === id });
		setRadioBox(notifyOptionSelected);
		if (notifyOptionSelected?.length) {
			const notifyOptionSettingSelected = notifyOptionSelected.find((option) => option.isChecked);
			if (
				[ENotificationTypes.ALL_MESSAGE, ENotificationTypes.MENTION_MESSAGE, ENotificationTypes.NOTHING_MESSAGE].includes(
					notifyOptionSettingSelected?.value
				)
			) {
				const body = {
					channel_id: channel?.channel_id || currentChannelId || '',
					notification_type: notifyOptionSettingSelected?.value || 0,
					clan_id: currentClanId || ''
				};
				dispatch(notificationSettingActions.setNotificationSetting(body));
			} else { dispatch(
					notificationSettingActions.deleteNotiChannelSetting({
						channel_id: channel?.channel_id || currentChannelId || '',
						clan_id: currentClanId || ''
					})
				);
			}
		}
	};
	const handleCheckboxPress = async (check: boolean) => {
		if (!channel?.channel_id && !currentChannelId) {
			return;
		}
		try {
			if (check) {
				await dispatch(
					notifiReactMessageActions.setNotifiReactMessage({ channel_id: channel?.channel_id || currentChannelId || '' })
				).unwrap();
			} else {
				await dispatch(
					notifiReactMessageActions.deleteNotifiReactMessage({ channel_id: channel?.channel_id || currentChannelId || '' })
				).unwrap();
			}
		} catch (error) {
			console.error('Toggle failed:', error);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.headerTitle}>{t('bottomSheet.title')}</Text>
			<View style={styles.optionsSetting}>
				{radioBox?.map((item) => (
					<FilterCheckbox item={item} key={`${item.id}`} defaultNotifyName={defaultNotifyName} onCheckboxPress={handleRadioBoxPress} />
				))}
			</View>
			<View style={styles.optionsSetting}>
				<FilterCheckbox type="checkbox" item={checkBox} onCheckboxPress={(isChecked) => handleCheckboxPress(isChecked)} />
			</View>
		</View>
	);
}
