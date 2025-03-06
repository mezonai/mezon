import { ENotificationActive, ETypeSearch } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectCurrentChannel, useAppSelector } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MezonIconCDN } from '../../../componentUI';
import { IconCDN } from '../../../constants/icon_cdn';
import useStatusMuteChannel from '../../../hooks/useStatusMuteChannel';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

const HomeDefaultHeader = React.memo(
	({ navigation, openBottomSheet, onOpenDrawer }: { navigation: any; openBottomSheet: () => void; onOpenDrawer: () => void }) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const currentChannel = useSelector(selectCurrentChannel);
		const parent = useAppSelector((state) => selectChannelById(state, currentChannel?.parent_id || ''));

		const parentChannelLabel = parent?.channel_label || '';
		const navigateMenuThreadDetail = () => {
			navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET });
		};
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

		const isAgeRestrictedChannel = currentChannel?.age_restricted === 1;

		const navigateToNotifications = () => {
			navigation.navigate(APP_SCREEN.NOTIFICATION.STACK, {
				screen: APP_SCREEN.NOTIFICATION.HOME
			});
		};

		const renderChannelIcon = () => {
			if (currentChannel?.channel_private === ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
				return <MezonIconCDN icon={IconCDN.threadLockIcon} height={size.s_20} width={size.s_20} />;
			}

			if (!!currentChannel?.channel_label && currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
				return <MezonIconCDN icon={IconCDN.threadIcon} height={size.s_20} width={size.s_20} />;
			}

			if (
				currentChannel?.channel_private === ChannelStatusEnum.isPrivate &&
				currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				!isAgeRestrictedChannel
			) {
				return <MezonIconCDN icon={IconCDN.channelTextLock} height={size.s_20} width={size.s_20} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
				return <MezonIconCDN icon={IconCDN.channelStream} height={size.s_20} width={size.s_20} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_APP) {
				return <MezonIconCDN icon={IconCDN.channelApp} height={size.s_20} width={size.s_20} />;
			}

			if (currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel) {
				return <MezonIconCDN icon={IconCDN.channelTextWarning} height={size.s_20} width={size.s_20} />;
			}

			return <MezonIconCDN icon={IconCDN.channelText} height={size.s_20} width={size.s_20} />;
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
								<MezonIconCDN icon={IconCDN.backArrowLarge} height={size.s_20} width={size.s_20} />
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
						<MezonIconCDN icon={IconCDN.inbox} height={size.s_20} width={size.s_20} />
					</TouchableOpacity>
				)}
				{!!currentChannel?.channel_label && !!Number(currentChannel?.parent_id) ? (
					<TouchableOpacity style={styles.iconBell} onPress={() => openBottomSheet()}>
						<NotificationBell color={themeValue.textStrong} />
					</TouchableOpacity>
				) : currentChannel ? (
					<TouchableOpacity style={styles.iconBell} onPress={() => navigateToSearchPage()}>
						<MezonIconCDN icon={IconCDN.magnifyingIcon} height={size.s_20} width={size.s_20} />
					</TouchableOpacity>
				) : (
					<View />
				)}
			</View>
		);
	}
);

interface NotificationBellProps {
	color: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ color }) => {
	const iconProps = {
		width: size.s_20,
		height: size.s_20,
		color
	};

	const { statusMute } = useStatusMuteChannel();

	return statusMute === ENotificationActive.OFF ? (
		<MezonIconCDN icon={IconCDN.bellSlashIcon} height={size.s_20} width={size.s_20} />
	) : (
		<MezonIconCDN icon={IconCDN.bellIcon} height={size.s_20} width={size.s_20} />
	);
};

export default HomeDefaultHeader;
