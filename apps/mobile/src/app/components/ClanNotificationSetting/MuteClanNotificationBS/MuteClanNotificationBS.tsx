import { ActionEmitEvent, ENotificationActive, ICategoryChannelOption } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { NotiChannelCategorySettingEntity, notificationSettingActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import { FOR_15_MINUTES, FOR_1_HOUR, FOR_24_HOURS, FOR_3_HOURS, FOR_8_HOURS } from '@mezon/utils';
import { format } from 'date-fns';
import { ApiNotificationUserChannel } from 'mezon-js/api.gen';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonMenu, { IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import { style } from './MuteClanNotificationBS.styles';

type MuteClanNotificationBSProps = {
	description?: string;
	currentChannel?: NotiChannelCategorySettingEntity | ICategoryChannelOption;
	isUnmute?: boolean;
	notificationChannelSelected?: ApiNotificationUserChannel;
};

export const MuteClanNotificationBS = ({ currentChannel, description = '', notificationChannelSelected, isUnmute }: MuteClanNotificationBSProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['notificationSetting', 'clanNotificationsSetting']);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const [timeMuted, setTimeMuted] = useState('');

	const menu = useMemo(
		() =>
			[
				{
					items: [
						{
							title: t('notifySettingThreadModal.muteDuration.forFifteenMinutes'),
							onPress: () => {
								handleScheduleMute(FOR_15_MINUTES);
							}
						},
						{
							title: t('notifySettingThreadModal.muteDuration.forOneHour'),
							onPress: () => {
								handleScheduleMute(FOR_1_HOUR);
							}
						},
						{
							title: t('notifySettingThreadModal.muteDuration.forThreeHours'),
							onPress: () => {
								handleScheduleMute(FOR_3_HOURS);
							}
						},
						{
							title: t('notifySettingThreadModal.muteDuration.forEightHours'),
							onPress: () => {
								handleScheduleMute(FOR_8_HOURS);
							}
						},
						{
							title: t('notifySettingThreadModal.muteDuration.forTwentyFourHours'),
							onPress: () => {
								handleScheduleMute(FOR_24_HOURS);
							}
						},
						{
							title: t('notifySettingThreadModal.muteDuration.untilTurnItBackOn'),
							onPress: () => {
								handleScheduleMute(Infinity);
							}
						}
					]
				}
			] as IMezonMenuSectionProps[],
		[]
	);

	const handleMuteOrUnmute = () => {
		if (!isUnmute) {
			const body = {
				channel_id: currentChannel?.id || '',
				notification_type: notificationChannelSelected?.notification_setting_type || 0,
				clan_id: currentClanId || '',
				active: ENotificationActive.ON
			};
			dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		} else {
			const data = {
				snapPoints: ['55%'],
				children: (
					<View style={styles.bottomSheetContent}>
						<Text style={styles.headerBS}>{t('clanNotificationBS.title', { ns: 'clanNotificationsSetting' })}</Text>
						<MezonMenu menu={menu} />
					</View>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		}
	};

	const onDismissBS = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const handleScheduleMute = (duration: number) => {
		if (duration !== Infinity) {
			const now = new Date();
			const unmuteTime = new Date(now.getTime() + duration);
			const unmuteTimeISO = unmuteTime.toISOString();

			const body = {
				channel_id: currentChannel?.id || '',
				notification_type: notificationChannelSelected?.notification_setting_type || 0,
				clan_id: currentClanId || '',
				time_mute: unmuteTimeISO
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			const body = {
				channel_id: currentChannel?.id || '',
				notification_type: notificationChannelSelected?.notification_setting_type || 0,
				clan_id: currentClanId || '',
				active: ENotificationActive.OFF
			};
			dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		}
		onDismissBS();
	};

	useEffect(() => {
		let idTimeOut;
		if (notificationChannelSelected?.active === ENotificationActive.ON) {
			setTimeMuted('');
		} else if (notificationChannelSelected?.active !== ENotificationActive.ON) {
			if (notificationChannelSelected?.time_mute) {
				const timeMute = new Date(notificationChannelSelected.time_mute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const timeDifference = timeMute.getTime() - currentTime.getTime();
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setTimeMuted(formattedDate);
					idTimeOut = setTimeout(() => {
						const body = {
							channel_id: currentChannel?.id || '',
							notification_type: notificationChannelSelected?.notification_setting_type || 0,
							clan_id: currentClanId || '',
							active: ENotificationActive.ON
						};
						dispatch(notificationSettingActions.setMuteNotificationSetting(body));
						clearTimeout(idTimeOut);
					}, timeDifference);
				}
			}
		}
	}, [notificationChannelSelected, dispatch, currentChannel?.id, currentClanId]);

	return (
		<View>
			<View style={styles.optionsBox}>
				<TouchableOpacity onPress={handleMuteOrUnmute} style={styles.wrapperUnmuteBox}>
					<Text style={styles.option}>
						{`${isUnmute ? t('bottomSheet.mute') : t('bottomSheet.unMute')} #${
							(currentChannel as NotiChannelCategorySettingEntity)?.channel_category_label ||
							(currentChannel as NotiChannelCategorySettingEntity)?.channel_category_label ||
							(currentChannel as ICategoryChannelOption)?.label ||
							''
						}`}
					</Text>
				</TouchableOpacity>
			</View>
			<Text style={styles.subTitle}>{description}</Text>
			{timeMuted ? (
				<Text style={styles.textUntil}>
					{t('bottomSheet.muteUntil')}
					<Text style={styles.duration}> {timeMuted}</Text>
				</Text>
			) : null}
		</View>
	);
};
