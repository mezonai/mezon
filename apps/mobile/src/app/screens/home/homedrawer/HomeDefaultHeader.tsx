import { useChatSending } from '@mezon/core';
import { ActionEmitEvent, ENotificationActive, ETypeSearch, IOption } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { accountActions, selectAnonymousMode, selectChannelById, selectCurrentChannel, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { ChannelStatusEnum, TypeMessage, sleep } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import useStatusMuteChannel from '../../../hooks/useStatusMuteChannel';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { ConfirmBuzzMessageModal } from './components/ConfirmBuzzMessage';
import { OptionChannelHeader } from './components/HeaderOptions';
import HeaderTooltip from './components/HeaderTooltip';
import { style } from './styles';

const HomeDefaultHeader = React.memo(
	({ navigation, openBottomSheet, onOpenDrawer }: { navigation: any; openBottomSheet: () => void; onOpenDrawer: () => void }) => {
		const isTabletLandscape = useTabletLandscape();
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const { t } = useTranslation('message');
		const currentChannel = useSelector(selectCurrentChannel);
		const parent = useAppSelector((state) => selectChannelById(state, currentChannel?.parent_id || ''));
		const anonymousMode = useSelector(selectAnonymousMode);
		const dispatch = useAppDispatch();
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL;
		const { sendMessage } = useChatSending({ mode, channelOrDirect: currentChannel });

		const headerOptions: IOption[] = [
			{
				title: 'anonymous',
				content: anonymousMode ? t('turnOffAnonymous') : t('turnOnAnonymous'),
				value: OptionChannelHeader.Anonymous,
				icon: <MezonIconCDN icon={IconCDN.anonymous} color={themeValue.text} height={size.s_18} width={size.s_18} />
			},
			{
				title: 'buzz',
				content: 'Buzz',
				value: OptionChannelHeader.Buzz,
				icon: <MezonIconCDN icon={IconCDN.buzz} color={themeValue.text} height={size.s_18} width={size.s_18} />
			}
		];

		const onPressOption = (option: IOption) => {
			if (option?.value === OptionChannelHeader.Anonymous) {
				handleToggleAnnonymous();
			} else if (option?.value === OptionChannelHeader.Buzz) {
				handleActionBuzzMessage();
			}
		};

		const handleActionBuzzMessage = async () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			await sleep(500);
			const data = {
				children: <ConfirmBuzzMessageModal onSubmit={handleBuzzMessage} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		};

		const handleBuzzMessage = (text: string) => {
			sendMessage({ t: text || 'Buzz!!' }, [], [], [], undefined, undefined, undefined, TypeMessage.MessageBuzz);
		};

		const handleToggleAnnonymous = () => {
			dispatch(accountActions.setAnonymousMode());
		};

		const parentChannelLabel = parent?.channel_label || '';
		const navigateMenuThreadDetail = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false
			});
			navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET });
		};

		const navigateToSearchPage = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false
			});
			navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
				screen: APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL,
				params: {
					typeSearch: ETypeSearch.SearchChannel,
					currentChannel,
					nameChannel: currentChannel?.channel_label,
					isClearSearch: true
				}
			});
		};

		const isAgeRestrictedChannel = currentChannel?.age_restricted === 1;

		const navigateToNotifications = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false
			});
			navigation.navigate(APP_SCREEN.NOTIFICATION.STACK, {
				screen: APP_SCREEN.NOTIFICATION.HOME
			});
		};

		const renderChannelIcon = () => {
			if (currentChannel?.channel_private === ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
				return <MezonIconCDN icon={IconCDN.threadLockIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />;
			}

			if (!!currentChannel?.channel_label && currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
				return <MezonIconCDN icon={IconCDN.threadIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />;
			}

			if (
				currentChannel?.channel_private === ChannelStatusEnum.isPrivate &&
				currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				!isAgeRestrictedChannel
			) {
				return <MezonIconCDN icon={IconCDN.channelTextLock} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
				return <MezonIconCDN icon={IconCDN.channelStream} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_APP) {
				return <MezonIconCDN icon={IconCDN.channelApp} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />;
			}

			if (currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel) {
				return <MezonIconCDN icon={IconCDN.channelTextWarning} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />;
			}

			return <MezonIconCDN icon={IconCDN.channelText} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />;
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
								<MezonIconCDN icon={IconCDN.backArrowLarge} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
							</TouchableOpacity>
						)}
						{!!currentChannel?.channel_label && (
							<View style={[styles.channelContainer, isTabletLandscape && { paddingBottom: size.s_8, paddingLeft: size.s_8 }]}>
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
						<MezonIconCDN icon={IconCDN.inbox} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
					</TouchableOpacity>
				)}
				{!!currentChannel?.channel_label && !!Number(currentChannel?.parent_id) ? (
					<TouchableOpacity style={styles.iconBell} onPress={() => openBottomSheet()}>
						<NotificationBell color={themeValue.textStrong} />
					</TouchableOpacity>
				) : currentChannel ? (
					<TouchableOpacity style={styles.iconBell} onPress={() => navigateToSearchPage()}>
						<MezonIconCDN icon={IconCDN.magnifyingIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
					</TouchableOpacity>
				) : (
					<View />
				)}
				<View style={{ position: 'relative', zIndex: 0 }}>
					<HeaderTooltip onPressOption={onPressOption} options={headerOptions} />
				</View>
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
		<MezonIconCDN icon={IconCDN.bellSlashIcon} {...iconProps} />
	) : (
		<MezonIconCDN icon={IconCDN.bellIcon} {...iconProps} />
	);
};

export default HomeDefaultHeader;
