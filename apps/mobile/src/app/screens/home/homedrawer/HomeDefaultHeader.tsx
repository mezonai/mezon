import { ENotificationActive, ETypeSearch, Icons } from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, selectChannelById, useAppSelector } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import useStatusMuteChannel from '../../../hooks/useStatusMuteChannel';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

const HomeDefaultHeader = React.memo(
	({
		navigation,
		currentChannel,
		openBottomSheet,
		onOpenDrawer
	}: {
		navigation: any;
		currentChannel: ChannelsEntity;
		openBottomSheet: () => void;
		onOpenDrawer: () => void;
	}) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const parent = useAppSelector((state) => selectChannelById(state, currentChannel?.parrent_id || ''));

		const parentChannelLabel = useMemo(() => parent?.channel_label || '', [parent?.channel_label]);
		const navigateMenuThreadDetail = () => {
			navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET });
		};
		const { statusMute } = useStatusMuteChannel();
		const isTabletLandscape = useTabletLandscape();

		const navigateToSearchPage = () => {
			navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
				screen: APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL,
				params: {
					typeSearch: ETypeSearch.SearchChannel,
					currentChannel
				}
			});
		};

		const isAgeRestrictedChannel = useMemo(() => {
			return currentChannel?.age_restricted === 1;
		}, [currentChannel?.age_restricted]);

		const navigateToNotifications = () => {
			navigation.navigate(APP_SCREEN.NOTIFICATION.STACK, {
				screen: APP_SCREEN.NOTIFICATION.HOME
			});
		};

		const renderChannelIcon = () => {
			if (currentChannel?.channel_private === ChannelStatusEnum.isPrivate && !!Number(currentChannel?.parrent_id)) {
				return <Icons.ThreadLockIcon width={size.s_20} height={size.s_20} color={themeValue.textStrong} />;
			}

			if (!!currentChannel?.channel_label && !!Number(currentChannel?.parrent_id)) {
				return <Icons.ThreadIcon width={size.s_20} height={size.s_20} color={themeValue.textStrong} />;
			}

			if (
				currentChannel?.channel_private === ChannelStatusEnum.isPrivate &&
				currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				!isAgeRestrictedChannel
			) {
				return <Icons.TextLockIcon width={size.s_20} height={size.s_20} color={themeValue.textStrong} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
				return <Icons.StreamIcon width={size.s_20} height={size.s_20} color={themeValue.textStrong} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_APP) {
				return <Icons.AppChannelIcon width={size.s_20} height={size.s_20} color={themeValue.textStrong} />;
			}

			if (currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel) {
				return <Icons.HashtagWarning width={size.s_20} height={size.s_20} color={themeValue.textStrong} />;
			}

			return <Icons.TextIcon width={size.s_20} height={size.s_20} color={themeValue.textStrong} />;
		};

		return (
			<View style={styles.homeDefaultHeader}>
				<TouchableOpacity style={{ flex: 1 }} onPress={navigateMenuThreadDetail}>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						{!isTabletLandscape && (
							<TouchableOpacity
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
								activeOpacity={0.8}
								style={styles.iconBar}
								onPress={onOpenDrawer}
							>
								<Icons.ArrowLargeLeftIcon width={size.s_20} height={size.s_20} color={themeValue.textStrong} />
							</TouchableOpacity>
						)}
						{!!currentChannel?.channel_label && (
							<View style={styles.channelContainer}>
								{renderChannelIcon()}
								<View>
									<View style={styles.threadHeaderBox}>
										<Text style={styles.threadHeaderLabel} numberOfLines={1}>
											{currentChannel?.channel_label}
										</Text>
									</View>
									{!!parentChannelLabel && (
										<Text style={styles.channelHeaderLabel} numberOfLines={1}>
											{parentChannelLabel}
										</Text>
									)}
								</View>
							</View>
						)}
					</View>
				</TouchableOpacity>
				{isTabletLandscape && (
					<TouchableOpacity style={styles.iconBell} onPress={navigateToNotifications}>
						<Icons.Inbox width={size.s_20} height={size.s_20} color={themeValue.textStrong} />
					</TouchableOpacity>
				)}
				{!!currentChannel?.channel_label && !!Number(currentChannel?.parrent_id) ? (
					<TouchableOpacity style={styles.iconBell} onPress={() => openBottomSheet()}>
						{statusMute === ENotificationActive.OFF ? (
							<Icons.BellSlashIcon width={size.s_20} height={size.s_20} color={themeValue.textStrong} />
						) : (
							<Icons.BellIcon width={size.s_20} height={size.s_20} color={themeValue.textStrong} />
						)}
					</TouchableOpacity>
				) : currentChannel ? (
					<TouchableOpacity style={styles.iconBell} onPress={() => navigateToSearchPage()}>
						<Icons.MagnifyingIcon width={size.s_20} height={size.s_20} color={Colors.textGray} />
					</TouchableOpacity>
				) : (
					<View />
				)}
			</View>
		);
	}
);

export default HomeDefaultHeader;
