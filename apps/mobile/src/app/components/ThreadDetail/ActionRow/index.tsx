import { useNavigation } from '@react-navigation/native';
import React, { useContext } from 'react';

import { usePermissionChecker } from '@mezon/core';
import { ENotificationActive, ETypeSearch } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { notificationSettingActions, selectCurrentUserId, useAppDispatch } from '@mezon/store-mobile';
import { EOverriddenPermission, EPermission } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { Icons } from '../../../componentUI/MobileIcons';
import { IconCDN } from '../../../constants/icon_cdn';
import useStatusMuteChannel from '../../../hooks/useStatusMuteChannel';
import type { AppStackScreenProps } from '../../../navigation/ScreenTypes';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { threadDetailContext } from '../MenuThreadDetail';
import { style } from './style';
enum EActionRow {
	Search,
	Threads,
	Mute,
	Settings
}

export const ActionRow = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['common']);
	const currentChannel = useContext(threadDetailContext);
	const currentUserId = useSelector(selectCurrentUserId);
	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const [isCanManageThread, isCanManageChannel] = usePermissionChecker(
		[EOverriddenPermission.manageThread, EPermission.manageChannel],
		currentChannel?.channel_id ?? ''
	);
	const { statusMute } = useStatusMuteChannel();
	const dispatch = useAppDispatch();
	const isChannelDm = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel]);

	const isChatWithMyself = useMemo(() => {
		if (Number(currentChannel?.type) !== ChannelType.CHANNEL_TYPE_DM) return false;
		return currentChannel?.user_ids?.[0] === currentUserId;
	}, [currentChannel?.type, currentChannel?.user_ids, currentUserId]);

	const isChannel = useMemo(() => {
		return !!currentChannel?.channel_label && currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL;
	}, [currentChannel]);

	useEffect(() => {
		dispatch(notificationSettingActions.getNotificationSetting({ channelId: currentChannel?.channel_id }));
	}, []);

	const actionList = useMemo(
		() => [
			{
				title: t('search'),
				action: () => {
					if (isChannelDm) {
						navigation.push(APP_SCREEN.MENU_CHANNEL.STACK, {
							screen: APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_DM,
							params: {
								currentChannel
							}
						});
					} else {
						navigation.push(APP_SCREEN.MENU_CHANNEL.STACK, {
							screen: APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL,
							params: {
								typeSearch: ETypeSearch.SearchChannel,
								currentChannel,
								nameChannel: currentChannel?.channel_label
							}
						});
					}
				},
				icon: <Icons.SearchIcon color={themeValue.text} width={22} height={22} />,
				isShow: true,
				type: EActionRow.Search
			},
			{
				title: t('thread'),
				action: () => {
					navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD });
				},
				icon: <Icons.ThreadIcon color={themeValue.text} width={22} height={22} />,
				isShow: isChannel,
				type: EActionRow.Threads
			},
			{
				title: t('muteNotification'),
				action: () => {
					navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, {
						screen: APP_SCREEN.MENU_THREAD.MUTE_THREAD_DETAIL_CHANNEL,
						params: { currentChannel, isCurrentChannel: true }
					});
				},
				isShow: !isChatWithMyself,
				type: EActionRow.Mute
			},
			{
				title: t('settings'),
				action: () => {
					navigation.push(APP_SCREEN.MENU_CHANNEL.STACK, {
						screen: APP_SCREEN.MENU_CHANNEL.SETTINGS,
						params: {
							channelId: currentChannel?.channel_id
						}
					});
				},
				icon: <MezonIconCDN icon={IconCDN.settingIcon} width={22} height={22} color={themeValue.text} />,
				isShow: (isChannel && isCanManageChannel) || (isCanManageThread && !isChannel),
				type: EActionRow.Settings
			}
		],
		[isChannelDm, isChannel, isChatWithMyself, isCanManageChannel, isCanManageThread, currentChannel, themeValue.text, navigation, t]
	);

	const filteredActionList = useMemo(() => {
		if (currentChannel?.clan_id === '0') {
			return actionList.filter((item) => [t('muteNotification'), t('search')].includes(item.title));
		}
		return actionList;
	}, [actionList, currentChannel?.clan_id, t]);
	return (
		<View style={styles.container}>
			{filteredActionList.map((action, index) =>
				action?.isShow ? (
					<Pressable key={index.toString()} onPress={action.action}>
						<View style={styles.iconBtn}>
							<View style={styles.iconWrapper}>
								{[EActionRow.Mute].includes(action.type) ? (
									statusMute === ENotificationActive.ON ? (
										<MezonIconCDN icon={IconCDN.bellIcon} width={22} height={22} color={themeValue.text} />
									) : (
										<MezonIconCDN icon={IconCDN.bellSlashIcon} width={22} height={22} color={themeValue.text} />
									)
								) : (
									action.icon
								)}
							</View>
							<Text style={styles.optionText}>
								{[EActionRow.Mute].includes(action.type)
									? statusMute === ENotificationActive.ON
										? t('muteNotification')
										: t('unmuteNotification')
									: action.title}
							</Text>
						</View>
					</Pressable>
				) : null
			)}
		</View>
	);
});
