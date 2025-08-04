import { ENotificationActive, ENotificationChannelId, EOptionOverridesType, optionNotification } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	defaultNotificationCategoryActions,
	notificationSettingActions,
	selectCurrentClanId,
	selectNotifiSettingsEntitiesById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonOption from '../../../componentUI/MezonOption';
import { MuteClanNotificationBS } from '../MuteClanNotificationBS';
import { style } from './NotificationSettingDetail.styles';

const NotificationSettingDetail = memo(({ route }: { route: any }) => {
	const { notifyChannelCategorySetting } = route.params || {};
	const currentChannelId = notifyChannelCategorySetting?.id;
	const currentClanId = useSelector(selectCurrentClanId);
	const { t } = useTranslation(['clanNotificationsSetting']);
	const [selectedOption, setSelectedOption] = useState(notifyChannelCategorySetting?.notification_setting_type);
	const { themeValue } = useTheme();
	const dispatch = useAppDispatch();
	const styles = style(themeValue);
	const title = useMemo(() => {
		return notifyChannelCategorySetting?.channel_category_title || notifyChannelCategorySetting?.title;
	}, [notifyChannelCategorySetting]);

	useEffect(() => {
		dispatch(notificationSettingActions.getNotificationSetting({ channelId: notifyChannelCategorySetting?.id || '' }));
	}, []);
	const getNotificationChannelSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, currentChannelId || ''));
	const isUnmute = useMemo(() => {
		return (
			getNotificationChannelSelected?.active === ENotificationActive.ON || getNotificationChannelSelected?.id === ENotificationChannelId.Default
		);
	}, [getNotificationChannelSelected]);

	const optionsNotificationSetting = useMemo(() => {
		return optionNotification(t)?.map((option) => ({ ...option, disabled: !isUnmute }));
	}, [isUnmute, t]);

	const handleNotificationChange = useCallback(
		(value) => {
			setSelectedOption(value);
			if (title === 'category') {
				dispatch(
					defaultNotificationCategoryActions.setDefaultNotificationCategory({
						category_id: currentChannelId,
						notification_type: value,
						clan_id: currentClanId || ''
					})
				);
			}
			if (title === 'channel') {
				dispatch(
					notificationSettingActions.setNotificationSetting({
						channel_id: currentChannelId,
						notification_type: value,
						clan_id: currentClanId || ''
					})
				);
			}
		},
		[title, currentChannelId, currentClanId, dispatch]
	);

	const handleRemoveOverride = useCallback(() => {
		setSelectedOption(0);
		if (title === 'category') {
			dispatch(
				defaultNotificationCategoryActions.deleteDefaultNotificationCategory({
					category_id: currentChannelId,
					clan_id: currentClanId
				})
			);
		}
		if (title === 'channel') {
			dispatch(notificationSettingActions.deleteNotiChannelSetting({ channel_id: currentChannelId, clan_id: currentClanId || '' }));
		}
	}, [title, currentChannelId, currentClanId, dispatch]);

	return (
		<View style={{ backgroundColor: themeValue.primary, flex: 1, padding: size.s_10 }}>
			{notifyChannelCategorySetting?.type !== EOptionOverridesType.Category && (
				<View>
					<MuteClanNotificationBS
						isUnmute={isUnmute}
						notificationChannelSelected={getNotificationChannelSelected}
						currentChannel={notifyChannelCategorySetting}
						description={t('clanNotificationSettingDetail.muteChannelSubText')}
					/>
				</View>
			)}
			<MezonOption
				onChange={handleNotificationChange}
				value={selectedOption}
				title={'Clan Notifications Setting'}
				data={optionsNotificationSetting}
			/>
			{!!selectedOption && (
				<TouchableOpacity onPress={handleRemoveOverride} style={styles.resetOverridesBtn}>
					<Text style={styles.textBtn}>{t('resetOverrides')}</Text>
				</TouchableOpacity>
			)}
		</View>
	);
});

export default NotificationSettingDetail;
