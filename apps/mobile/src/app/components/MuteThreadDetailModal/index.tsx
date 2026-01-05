import { ActionEmitEvent, ENotificationActive, ENotificationChannelId } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { DirectEntity } from '@mezon/store-mobile';
import {
	notificationSettingActions,
	selectCurrentClanId,
	selectNotifiSettingsEntitiesById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import { EMuteState, FOR_15_MINUTES_SEC, FOR_1_HOUR_SEC, FOR_24_HOURS_SEC, FOR_3_HOURS_SEC, FOR_8_HOURS_SEC } from '@mezon/utils';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ChannelType } from 'mezon-js';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import type { IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import MezonMenu from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
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

	const navigation = useNavigation<any>();
	const [timeMuted, setTimeMuted] = useState('');
	const [isChannel, setIsChannel] = useState<boolean>();
	const { currentChannel, isCurrentChannel } = route?.params || {};
	const isDMThread = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel]);

	useEffect(() => {
		setIsChannel(!!currentChannel?.channelLabel && !Number(currentChannel?.parentId));
	}, [currentChannel]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerShown: true,
			headerTitle: () => (
				<View>
					<Text style={styles.headerTitle}>
						{isDMThread
							? t('notifySettingThreadModal.muteThisConversation')
							: isChannel
								? t('notifySettingThreadModal.headerTitleMuteChannel')
								: t('notifySettingThreadModal.headerTitleMuteThread')}
					</Text>
					<Text numberOfLines={1} style={styles.headerSubtitle}>
						{isDMThread
							? currentChannel?.channelLabel
							: isChannel
								? `#${currentChannel?.channelLabel}`
								: `"${currentChannel?.channelLabel}"`}
					</Text>
				</View>
			),
			headerLeft: () => (
				<TouchableOpacity style={styles.headerLeftBtn} onPress={() => navigation.goBack()}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
				</TouchableOpacity>
			)
		});
	}, [currentChannel?.channelLabel, isChannel, isDMThread, navigation, styles.headerLeftBtn, t, themeValue.text, themeValue.textStrong]);

	const getNotificationChannelSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, currentChannel?.channelId || ''));
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();

	const openBottomSheet = () => {
		const data = {
			heightFitContent: true,
			children: <NotificationSetting channel={currentChannel} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	useEffect(() => {
		let idTimeOut;
		if (getNotificationChannelSelected?.active === ENotificationActive.ON) {
			setTimeMuted('');
		} else if (getNotificationChannelSelected?.active !== ENotificationActive.ON) {
			if (getNotificationChannelSelected?.timeMute) {
				const timeMute = new Date(getNotificationChannelSelected.timeMute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const timeDifference = timeMute.getTime() - currentTime.getTime();
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setTimeMuted(formattedDate);
					idTimeOut = setTimeout(() => {
						handleUnmuteChannel();
						clearTimeout(idTimeOut);
					}, timeDifference);
				}
			}
		}
	}, [getNotificationChannelSelected, dispatch, currentChannel?.channelId, currentClanId]);

	const handleUnmuteChannel = async () => {
		try {
			const body = {
				channelId: currentChannel?.channelId || '',
				clanId: currentClanId || '',
				active: EMuteState.UN_MUTE,
				muteTime: 0
			};
			const response = await dispatch(notificationSettingActions.setMuteChannel(body));
			if (response?.meta?.requestStatus === 'rejected') {
				throw new Error(response?.meta?.requestStatus);
			} else {
				navigateToThreadDetail();
			}
		} catch (error) {
			console.error('Error setting unmute channel:', error);
			Toast.show({
				type: 'error',
				text1: t('notifySettingThreadModal.unMuteError')
			});
		}
	};

	const navigateToThreadDetail = () => {
		navigation.goBack();
	};

	const handleScheduleMute = async (duration: number) => {
		try {
			const body = {
				channelId: currentChannel?.channelId || '',
				clanId: isDMThread ? '' : currentClanId || '',
				muteTime: duration !== Infinity ? duration : 0,
				active: EMuteState.MUTED
			};
			const response = await dispatch(notificationSettingActions.setMuteChannel(body));
			if (response?.meta?.requestStatus === 'rejected') {
				throw new Error(response?.meta?.requestStatus);
			} else {
				navigateToThreadDetail();
			}
		} catch (error) {
			console.error('Error setting mute channel:', error);
			Toast.show({
				type: 'error',
				text1: t('notifySettingThreadModal.muteError')
			});
		}
	};

	return (
		<View style={styles.wrapper}>
			{getNotificationChannelSelected?.active === ENotificationActive.ON ||
			getNotificationChannelSelected?.id === ENotificationChannelId.Default ? (
				<MezonMenu menu={menu} />
			) : (
				<View style={styles.optionsBox}>
					<TouchableOpacity onPress={handleUnmuteChannel} style={styles.wrapperUnmuteBox}>
						<MezonIconCDN icon={IconCDN.bellSlashIcon} width={20} height={20} customStyle={{ marginRight: 20 }} color={themeValue.text} />
						<Text
							style={styles.option}
						>{`${t('bottomSheet.unMute')} ${isDMThread ? currentChannel?.channelLabel : isChannel ? `#${currentChannel?.channelLabel}` : `"${currentChannel?.channelLabel}"`} `}</Text>
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
						<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} width={20} height={20} color={themeValue.text} />
					</TouchableOpacity>
					<Text style={styles.InfoTitle}>{t('notifySettingThreadModal.description')}</Text>
				</View>
			) : null}
		</View>
	);
};

export default MuteThreadDetailModal;
