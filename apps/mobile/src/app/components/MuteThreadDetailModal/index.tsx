import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ActionEmitEvent, AngleRight, ENotificationActive, ENotificationChannelId, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { DirectEntity, notificationSettingActions, selectCurrentClanId, selectNotifiSettingsEntitiesById, useAppDispatch } from '@mezon/store-mobile';
import { FOR_15_MINUTES, FOR_1_HOUR, FOR_24_HOURS, FOR_3_HOURS, FOR_8_HOURS, IChannel } from '@mezon/utils';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ChannelType } from 'mezon-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import MezonMenu, { IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import NotificationSetting from '../NotificationSetting';
import { style } from './MuteThreadDetailModal.styles';

type RootStackParamList = {
	MuteThreadDetail: {
		currentChannel: IChannel | DirectEntity;
		isCurrentChannel: boolean;
	};
};

type MuteThreadDetailRouteProp = RouteProp<RootStackParamList, 'MuteThreadDetail'>;

type MuteThreadDetailModalProps = {
	route: MuteThreadDetailRouteProp;
};

const MuteThreadDetailModal = ({ route }: MuteThreadDetailModalProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['notificationSetting']);
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

	const navigation = useNavigation<any>();
	const [timeMuted, setTimeMuted] = useState('');
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const [isChannel, setIsChannel] = useState<boolean>();
	const { currentChannel, isCurrentChannel } = route?.params || {};
	const isDMThread = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel]);

	useEffect(() => {
		setIsChannel(!!currentChannel?.channel_label && !Number(currentChannel?.parent_id));
	}, [currentChannel]);

	navigation.setOptions({
		headerShown: true,
		headerTitle: () => (
			<View>
				<Text style={{ color: themeValue.textStrong, fontSize: size.label, fontWeight: '700' }}>
					{isDMThread
						? t('notifySettingThreadModal.muteThisConversation')
						: isChannel
							? t('notifySettingThreadModal.headerTitleMuteChannel')
							: t('notifySettingThreadModal.headerTitleMuteThread')}
				</Text>
				<Text numberOfLines={1} style={{ color: themeValue.text, fontSize: size.medium, fontWeight: '400', width: '100%' }}>
					{isDMThread
						? currentChannel?.channel_label
						: isChannel
							? `#${currentChannel?.channel_label}`
							: `"${currentChannel?.channel_label}"`}
				</Text>
			</View>
		)
	});
	const getNotificationChannelSelected = useSelector(selectNotifiSettingsEntitiesById(currentChannel?.channel_id));
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();

	const openBottomSheet = () => {
		const data = {
			heightFitContent: true,
			children: <NotificationSetting />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	useEffect(() => {
		let idTimeOut;
		if (getNotificationChannelSelected?.active === ENotificationActive.ON) {
			setTimeMuted('');
		} else if (getNotificationChannelSelected?.active !== ENotificationActive.ON) {
			if (getNotificationChannelSelected?.time_mute) {
				const timeMute = new Date(getNotificationChannelSelected.time_mute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const timeDifference = timeMute.getTime() - currentTime.getTime();
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setTimeMuted(formattedDate);
					idTimeOut = setTimeout(() => {
						const body = {
							channel_id: currentChannel?.channel_id || '',
							notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
							clan_id: currentClanId || '',
							active: ENotificationActive.ON
						};
						dispatch(notificationSettingActions.setMuteNotificationSetting(body));
						clearTimeout(idTimeOut);
					}, timeDifference);
				}
			}
		}
	}, [getNotificationChannelSelected, dispatch, currentChannel?.channel_id, currentClanId]);

	const muteOrUnMuteChannel = (active: ENotificationActive) => {
		const body = {
			channel_id: currentChannel?.channel_id || '',
			notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
			clan_id: currentClanId || '',
			active
		};
		dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		navigateToThreadDetail();
	};

	const navigateToThreadDetail = () => {
		navigation.goBack();
	};

	const handleScheduleMute = (duration: number) => {
		if (duration !== Infinity) {
			const now = new Date();
			const unmuteTime = new Date(now.getTime() + duration);
			const unmuteTimeISO = unmuteTime.toISOString();

			const body = {
				channel_id: currentChannel?.channel_id || '',
				notification_type: isDMThread ? 0 : getNotificationChannelSelected?.notification_setting_type || 0,
				clan_id: isDMThread ? '' : currentClanId || '',
				time_mute: unmuteTimeISO,
				...(isCurrentChannel && { is_current_channel: false })
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			const body = {
				channel_id: currentChannel?.channel_id || '',
				notification_type: isDMThread ? 0 : getNotificationChannelSelected?.notification_setting_type || 0,
				clan_id: isDMThread ? '' : currentClanId || '',
				active: ENotificationActive.OFF,
				...(isCurrentChannel && { is_current_channel: false })
			};
			dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		}
		navigateToThreadDetail();
	};

	return (
		<View style={styles.wrapper}>
			{getNotificationChannelSelected?.active === ENotificationActive.ON ||
			getNotificationChannelSelected?.id === ENotificationChannelId.Default ? (
				<MezonMenu menu={menu} />
			) : (
				<View style={styles.optionsBox}>
					<TouchableOpacity
						onPress={() => {
							muteOrUnMuteChannel(ENotificationActive.ON);
						}}
						style={styles.wrapperUnmuteBox}
					>
						<Icons.BellSlashIcon width={20} height={20} style={{ marginRight: 20 }} color={themeValue.text} />
						<Text
							style={styles.option}
						>{`${t('bottomSheet.unMute')} ${isDMThread ? currentChannel?.channel_label : isChannel ? `#${currentChannel?.channel_label}` : `"${currentChannel?.channel_label}"`} `}</Text>
					</TouchableOpacity>
				</View>
			)}
			{timeMuted ? (
				<Text style={styles.textUntil}>
					{t('bottomSheet.muteUntil')}
					<Text style={styles.duration}> {timeMuted}</Text>
				</Text>
			) : null}
			{!isDMThread ? (
				<View>
					<TouchableOpacity onPress={() => openBottomSheet()} style={styles.wrapperItemNotification}>
						<Text style={styles.option}>{t('bottomSheet.title')}</Text>
						<AngleRight width={20} height={20} color={themeValue.text} />
					</TouchableOpacity>
					<Text style={styles.InfoTitle}>{t('notifySettingThreadModal.description')}</Text>
				</View>
			) : null}
		</View>
	);
};

export default MuteThreadDetailModal;
