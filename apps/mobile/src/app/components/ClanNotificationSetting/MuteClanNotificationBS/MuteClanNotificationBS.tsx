import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ENotificationActive, ICategoryChannelOption } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import { NotiChannelCategorySettingEntity, notificationSettingActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import { FOR_15_MINUTES, FOR_1_HOUR, FOR_24_HOURS, FOR_3_HOURS, FOR_8_HOURS } from '@mezon/utils';
import { format } from 'date-fns';
import { ApiNotificationUserChannel } from 'mezon-js/api.gen';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { IMezonMenuSectionProps, MezonMenu } from '../../../componentUI';
import MezonBottomSheet from '../../../componentUI/MezonBottomSheet';
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
	const bottomSheetDetail = useRef<BottomSheetModal>(null);
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
			bottomSheetDetail.current?.present();
		}
	};

	const onDismissBS = () => {
		bottomSheetDetail.current?.dismiss();
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
		<Block>
			<Block style={styles.optionsBox}>
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
			</Block>
			<Text style={styles.subTitle}>{description}</Text>
			{timeMuted ? (
				<Text style={styles.textUntil}>
					{t('bottomSheet.muteUntil')}
					<Text style={styles.duration}> {timeMuted}</Text>
				</Text>
			) : null}
			<MezonBottomSheet snapPoints={['55%']} ref={bottomSheetDetail}>
				<Block paddingHorizontal={size.s_20}>
					<Text style={styles.headerBS}>{t('clanNotificationBS.title', { ns: 'clanNotificationsSetting' })}</Text>
					<MezonMenu menu={menu} />
				</Block>
			</MezonBottomSheet>
		</Block>
	);
};
