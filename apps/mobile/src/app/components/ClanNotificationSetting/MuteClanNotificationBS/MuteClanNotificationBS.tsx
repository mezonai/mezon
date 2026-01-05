import type { ICategoryChannelOption } from '@mezon/mobile-components';
import { ActionEmitEvent, ENotificationActive } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { NotiChannelCategorySettingEntity } from '@mezon/store-mobile';
import { notificationSettingActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import { EMuteState, FOR_15_MINUTES_SEC, FOR_1_HOUR_SEC, FOR_24_HOURS_SEC, FOR_3_HOURS_SEC, FOR_8_HOURS_SEC } from '@mezon/utils';
import { format } from 'date-fns';
import type { ApiNotificationUserChannel } from 'mezon-js/types';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import type { IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import MezonMenu from '../../../componentUI/MezonMenu';
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
								handleScheduleMute(FOR_15_MINUTES_SEC);
							}
						},
						{
							title: t('notifySettingThreadModal.muteDuration.forOneHour'),
							onPress: () => {
								handleScheduleMute(FOR_1_HOUR_SEC);
							}
						},
						{
							title: t('notifySettingThreadModal.muteDuration.forThreeHours'),
							onPress: () => {
								handleScheduleMute(FOR_3_HOURS_SEC);
							}
						},
						{
							title: t('notifySettingThreadModal.muteDuration.forEightHours'),
							onPress: () => {
								handleScheduleMute(FOR_8_HOURS_SEC);
							}
						},
						{
							title: t('notifySettingThreadModal.muteDuration.forTwentyFourHours'),
							onPress: () => {
								handleScheduleMute(FOR_24_HOURS_SEC);
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

	const handleMuteOrUnmute = async () => {
		if (!isUnmute) {
			try {
				const body = {
					channelId: currentChannel?.id || '',
					clanId: currentClanId || '',
					mute_time: 0,
					active: EMuteState.UN_MUTE
				};
				const response = await dispatch(notificationSettingActions.setMuteChannel(body));
				if (response?.meta?.requestStatus === 'rejected') {
					throw new Error(response?.meta?.requestStatus);
				}
			} catch (error) {
				console.error('Error setting unmute channel:', error);
				Toast.show({
					type: 'error',
					text1: t('notifySettingThreadModal.unMuteError')
				});
			}
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

	const handleScheduleMute = async (duration: number) => {
		try {
			const body = {
				channelId: currentChannel?.id || '',
				clanId: currentClanId || '',
				mute_time: duration !== Infinity ? duration : 0,
				active: EMuteState.MUTED
			};
			const response = await dispatch(notificationSettingActions.setMuteChannel(body));
			if (response?.meta?.requestStatus === 'rejected') {
				throw new Error(response?.meta?.requestStatus);
			} else {
				onDismissBS();
			}
		} catch (error) {
			console.error('Error setting mute channel:', error);
			Toast.show({
				type: 'error',
				text1: t('notifySettingThreadModal.muteError')
			});
		}
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
							channelId: currentChannel?.id || '',
							clanId: currentClanId || '',
							mute_time: 0,
							active: EMuteState.UN_MUTE
						};
						dispatch(notificationSettingActions.setMuteChannel(body));
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
