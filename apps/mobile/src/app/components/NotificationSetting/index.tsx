import { IOptionsNotification, notifyLabels } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	notifiReactMessageActions,
	notificationSettingActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectNotifiReactMessage,
	selectNotifiSettingsEntitiesById,
	useAppDispatch
} from '@mezon/store-mobile';
import { ChannelThreads, ENotificationTypes } from '@mezon/utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import MezonRadioButton from '../../componentUI/MezonRadioButton';
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
	const [isChecked, setIsChecked] = useState<boolean>(false);
	const currentClanId = useSelector(selectCurrentClanId);
	const notifyReactMessage = useSelector(selectNotifiReactMessage);
	const getNotificationChannelSelected = useSelector(selectNotifiSettingsEntitiesById(currentChannelId));
	const defaultNotificationCategory = useSelector(selectDefaultNotificationCategory);
	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	const [defaultNotifyName, setDefaultNotifyName] = useState('');
	useEffect(() => {
		setIsChecked(notifyReactMessage?.id !== '0');
		setRadioBox(radioBox.map((item) => item && { ...item, isChecked: getNotificationChannelSelected?.notification_setting_type === item.value }));
	}, [notifyReactMessage, getNotificationChannelSelected]);

	useEffect(() => {
		if (defaultNotificationCategory?.notification_setting_type) {
			setDefaultNotifyName(notifyLabels[defaultNotificationCategory?.notification_setting_type]);
		} else if (defaultNotificationClan?.notification_setting_type) {
			setDefaultNotifyName(notifyLabels[defaultNotificationClan?.notification_setting_type]);
		}
	}, [getNotificationChannelSelected, defaultNotificationCategory, defaultNotificationClan]);

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
			} else {
				dispatch(
					notificationSettingActions.deleteNotiChannelSetting({
						channel_id: channel?.channel_id || currentChannelId || '',
						clan_id: currentClanId || ''
					})
				);
			}
		}
	};
	const handleCheckboxPress = () => {
		setIsChecked(!isChecked);
		if (!isChecked) {
			dispatch(notifiReactMessageActions.setNotifiReactMessage({ channel_id: channel?.channel_id || currentChannelId || '' }));
		} else {
			dispatch(notifiReactMessageActions.deleteNotifiReactMessage({ channel_id: channel?.channel_id || currentChannelId || '' }));
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.headerTitle}>{t('bottomSheet.title')}</Text>
			<View style={styles.optionsSetting}>
				<TouchableOpacity onPress={handleCheckboxPress} style={styles.option}>
					<Text style={styles.labelOption}>{t('bottomSheet.labelOptions.reactionMessage')}</Text>
					<MezonRadioButton checked={isChecked} />
				</TouchableOpacity>
				{radioBox?.map((item) => (
					<FilterCheckbox item={item} key={`${item.id}`} defaultNotifyName={defaultNotifyName} onCheckboxPress={handleRadioBoxPress} />
				))}
			</View>
		</View>
	);
}
