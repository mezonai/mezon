import { ActionEmitEvent, ENotificationActive, ENotificationChannelId } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	defaultNotificationCategoryActions,
	selectCurrentClanId,
	selectDefaultNotificationCategory,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import type { ICategoryChannel } from '@mezon/utils';
import { FOR_15_MINUTES, FOR_1_HOUR, FOR_24_HOURS, FOR_3_HOURS, FOR_8_HOURS } from '@mezon/utils';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import type { IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import MezonMenu from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
import CategoryNotificationSetting from '../CategoryNotificationSetting';
import { style } from './styles';

type RootStackParamList = {
	MuteThreadDetail: {
		currentCategory: ICategoryChannel;
	};
};

type MuteThreadDetailRouteProp = RouteProp<RootStackParamList, 'MuteThreadDetail'>;

type MuteThreadDetailModalProps = {
	route: MuteThreadDetailRouteProp;
};

const MuteCategoryDetailModal = ({ route }: MuteThreadDetailModalProps) => {
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
	const { currentCategory } = route?.params || {};

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerShown: true,
			headerTitle: () => (
				<View>
					<Text style={styles.headerTitle}>{t('notifySettingThreadModal.muteThisConversation')}</Text>
					<Text numberOfLines={1} style={styles.headerSubtitle}>
						{currentCategory.category_name}
					</Text>
				</View>
			)
		});
	}, [currentCategory.category_name, navigation, t, themeValue.text, themeValue.textStrong]);

	const defaultCategoryNotificationSetting = useAppSelector((state) =>
		selectDefaultNotificationCategory(state, currentCategory?.category_id as string)
	);

	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();

	const openBottomSheet = () => {
		const data = {
			heightFitContent: true,
			children: <CategoryNotificationSetting category={currentCategory} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	useEffect(() => {
		let idTimeOut;
		if (defaultCategoryNotificationSetting?.active === ENotificationActive.ON) {
			setTimeMuted('');
		} else if (defaultCategoryNotificationSetting?.active !== ENotificationActive.ON) {
			if (defaultCategoryNotificationSetting?.time_mute) {
				const timeMute = new Date(defaultCategoryNotificationSetting.time_mute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const timeDifference = timeMute.getTime() - currentTime.getTime();
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setTimeMuted(formattedDate);
					idTimeOut = setTimeout(() => {
						const body = {
							channel_id: currentCategory?.id || '',
							notification_type: defaultCategoryNotificationSetting?.notification_setting_type || 0,
							clan_id: currentClanId || '',
							active: ENotificationActive.ON
						};
						dispatch(defaultNotificationCategoryActions.setMuteCategory(body));
						clearTimeout(idTimeOut);
					}, timeDifference);
				}
			}
		}
	}, [defaultCategoryNotificationSetting, dispatch, currentCategory?.id, currentClanId]);

	const muteOrUnMuteChannel = (active: ENotificationActive) => {
		const body = {
			category_id: currentCategory?.id,
			notification_type: defaultCategoryNotificationSetting?.notification_setting_type,
			clan_id: currentClanId || '',
			active
		};
		dispatch(defaultNotificationCategoryActions.setMuteCategory(body));
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
				category_id: currentCategory?.id,
				notification_type: defaultCategoryNotificationSetting?.notification_setting_type,
				clan_id: currentClanId || '',
				time_mute: unmuteTimeISO
			};
			dispatch(defaultNotificationCategoryActions.setDefaultNotificationCategory(body));
		} else {
			const body = {
				category_id: currentCategory?.id,
				notification_type: defaultCategoryNotificationSetting?.notification_setting_type,
				clan_id: currentClanId || '',
				active: ENotificationActive.OFF
			};
			dispatch(defaultNotificationCategoryActions.setMuteCategory(body));
		}
		navigateToThreadDetail();
	};

	return (
		<View style={styles.wrapper}>
			{defaultCategoryNotificationSetting?.active === ENotificationActive.ON ||
			defaultCategoryNotificationSetting?.id === ENotificationChannelId.Default ? (
				<MezonMenu menu={menu} />
			) : (
				<View style={styles.optionsBox}>
					<TouchableOpacity
						onPress={() => {
							muteOrUnMuteChannel(ENotificationActive.ON);
						}}
						style={styles.wrapperUnmuteBox}
					>
						<MezonIconCDN icon={IconCDN.bellSlashIcon} width={20} height={20} customStyle={{ marginRight: 20 }} color={themeValue.text} />
						<Text style={styles.option}>{t('bottomSheet.unMute')}</Text>
					</TouchableOpacity>
				</View>
			)}
			{timeMuted ? (
				<Text style={styles.textUntil}>
					{t('bottomSheet.muteCategoryUntil')}
					<Text style={styles.duration}> {timeMuted}</Text>
				</Text>
			) : null}
			<View>
				<TouchableOpacity onPress={() => openBottomSheet()} style={styles.wrapperItemNotification}>
					<Text style={styles.option}>{t('bottomSheet.title')}</Text>
					<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} width={20} height={20} color={themeValue.text} />
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default MuteCategoryDetailModal;
