import { ENotificationActive, ETypeSearch } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectCurrentChannel, useAppSelector } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { IconCDN } from '../../../constants/icon_cdn';
import useStatusMuteChannel from '../../../hooks/useStatusMuteChannel';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { IconCDNItem } from './IconItem';
import { style } from './styles';

const HomeDefaultHeader = React.memo(
	({ navigation, openBottomSheet, onOpenDrawer }: { navigation: any; openBottomSheet: () => void; onOpenDrawer: () => void }) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const currentChannel = useSelector(selectCurrentChannel);
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
				return <IconCDNItem iconUrl={IconCDN.threadLockIcon} width={size.s_20} height={size.s_20} />;
			}

			if (!!currentChannel?.channel_label && !!Number(currentChannel?.parrent_id)) {
				return <IconCDNItem iconUrl={IconCDN.threadIcon} width={size.s_20} height={size.s_20} />;
			}

			if (
				currentChannel?.channel_private === ChannelStatusEnum.isPrivate &&
				currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				!isAgeRestrictedChannel
			) {
				return <IconCDNItem iconUrl={IconCDN.channelText} width={size.s_20} height={size.s_20} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
				return <IconCDNItem iconUrl={IconCDN.channelStream} width={size.s_20} height={size.s_20} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_APP) {
				return <IconCDNItem iconUrl={IconCDN.channelApp} width={size.s_20} height={size.s_20} />;
			}

			if (currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel) {
				return <IconCDNItem iconUrl={IconCDN.channelTextWarning} width={size.s_20} height={size.s_20} />;
			}

			return <IconCDNItem iconUrl={IconCDN.channelText} width={size.s_20} height={size.s_20} />;
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
								<IconCDNItem iconUrl={IconCDN.backArrowLarge} width={size.s_20} height={size.s_20} />
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
						<IconCDNItem iconUrl={IconCDN.inbox} width={size.s_20} height={size.s_20} />
					</TouchableOpacity>
				)}
				{!!currentChannel?.channel_label && !!Number(currentChannel?.parrent_id) ? (
					<TouchableOpacity style={styles.iconBell} onPress={() => openBottomSheet()}>
						{statusMute === ENotificationActive.OFF ? (
							<IconCDNItem iconUrl={IconCDN.bellSlashIcon} width={size.s_20} height={size.s_20} />
						) : (
							<IconCDNItem iconUrl={IconCDN.bellIcon} width={size.s_20} height={size.s_20} />
						)}
					</TouchableOpacity>
				) : currentChannel ? (
					<TouchableOpacity style={styles.iconBell} onPress={() => navigateToSearchPage()}>
						<IconCDNItem iconUrl={IconCDN.magnifyingIcon} width={size.s_20} height={size.s_20} />
					</TouchableOpacity>
				) : (
					<View />
				)}
			</View>
		);
	}
);

export default HomeDefaultHeader;
