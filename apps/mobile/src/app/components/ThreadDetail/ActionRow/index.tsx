import { useNavigation } from '@react-navigation/native';
import React, { useContext } from 'react';

import { usePermissionChecker } from '@mezon/core';
import { ENotificationActive, ETypeSearch, Icons } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { EOverriddenPermission, EPermission } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import useStatusMuteChannel from '../../../hooks/useStatusMuteChannel';
import { APP_SCREEN, AppStackScreenProps } from '../../../navigation/ScreenTypes';
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
	const currentChannel = useContext(threadDetailContext);
	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const [isChannel, setIsChannel] = useState<boolean>();
	const [isCanManageThread, isCanManageChannel] = usePermissionChecker(
		[EOverriddenPermission.manageThread, EPermission.manageChannel],
		currentChannel?.channel_id ?? ''
	);
	const { statusMute } = useStatusMuteChannel();
	const isChannelDm = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel]);

	useEffect(() => {
		setIsChannel(!!currentChannel?.channel_label && !Number(currentChannel?.parent_id));
	}, [currentChannel]);
	const actionList = [
		{
			title: 'Search',
			action: () => {
				if (isChannelDm) {
					navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
						screen: APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_DM,
						params: {
							currentChannel
						}
					});
				} else {
					navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
						screen: APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL,
						params: {
							typeSearch: ETypeSearch.SearchChannel,
							currentChannel
						}
					});
				}
			},
			icon: <Icons.MagnifyingIcon width={22} height={22} color={themeValue.text} />,
			isShow: true,
			type: EActionRow.Search
		},
		{
			title: 'Threads',
			action: () => {
				navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD });
			},
			icon: <Icons.ThreadIcon width={22} height={22} color={themeValue.text} />,
			isShow: isChannel,
			type: EActionRow.Threads
		},
		{
			title: 'Mute',
			action: () => {
				navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, {
					screen: APP_SCREEN.MENU_THREAD.MUTE_THREAD_DETAIL_CHANNEL,
					params: { currentChannel, isCurrentChannel: true }
				});
			},
			isShow: true,
			type: EActionRow.Mute
		},
		{
			title: 'Settings',
			action: () => {
				navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
					screen: APP_SCREEN.MENU_CHANNEL.SETTINGS,
					params: {
						channelId: currentChannel?.channel_id
					}
				});
			},
			icon: <Icons.SettingsIcon width={22} height={22} color={themeValue.text} />,
			isShow: isCanManageThread || isCanManageChannel,
			type: EActionRow.Settings
		}
	];

	const filteredActionList = useMemo(() => {
		if (currentChannel?.clan_id === '0') {
			return actionList.filter((item) => ['Mute', 'Search'].includes(item.title));
		}
		return actionList;
	}, [currentChannel, isChannel]);
	return (
		<View style={styles.container}>
			{filteredActionList.map((action, index) =>
				action?.isShow ? (
					<Pressable key={index.toString()} onPress={action.action}>
						<View style={styles.iconBtn}>
							<View style={styles.iconWrapper}>
								{[EActionRow.Mute].includes(action.type) ? (
									statusMute === ENotificationActive.ON ? (
										<Icons.BellIcon width={22} height={22} color={themeValue.text} />
									) : (
										<Icons.BellSlashIcon width={22} height={22} color={themeValue.text} />
									)
								) : (
									action.icon
								)}
							</View>
							<Text style={styles.optionText}>{action.title}</Text>
						</View>
					</Pressable>
				) : null
			)}
		</View>
	);
});
