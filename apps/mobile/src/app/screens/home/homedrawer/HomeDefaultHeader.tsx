import { useChatSending } from '@mezon/core';
import type { IOption } from '@mezon/mobile-components';
import { ActionEmitEvent, ENotificationActive, ETypeSearch, load, save, STORAGE_USERS_QUICK_REACTION } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	accountActions,
	selectAnonymousMode,
	selectChannelById,
	selectCurrentChannel,
	selectCurrentClanPreventAnonymous,
	selectCurrentUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { ChannelStatusEnum, TypeMessage } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { Icons } from '../../../componentUI/MobileIcons';
import { IconCDN } from '../../../constants/icon_cdn';
import useStatusMuteChannel from '../../../hooks/useStatusMuteChannel';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { ConfirmBuzzMessageModal } from './components/ConfirmBuzzMessage';
import { OptionChannelHeader } from './components/HeaderOptions';
import HeaderTooltip from './components/HeaderTooltip';
import { ContainerMessageActionModal } from './components/MessageItemBS/ContainerMessageActionModal';
import { style } from './styles';

const HomeDefaultHeader = React.memo(
	({
		navigation,
		openBottomSheet,
		onOpenDrawer,
		isBanned = false
	}: {
		navigation: any;
		openBottomSheet: () => void;
		onOpenDrawer: () => void;
		isBanned?: boolean;
	}) => {
		const isTabletLandscape = useTabletLandscape();
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const { t } = useTranslation(['message', 'common']);
		const currentChannel = useSelector(selectCurrentChannel);
		const parent = useAppSelector((state) => selectChannelById(state, currentChannel?.parent_id || ''));
		const anonymousMode = useSelector((state) => selectAnonymousMode(state, currentChannel?.clan_id));
		const currentClanPreventAnonymous = useAppSelector(selectCurrentClanPreventAnonymous);
		const currentUserId = useAppSelector(selectCurrentUserId);
		const dispatch = useAppDispatch();
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL;
		const { sendMessage } = useChatSending({ mode, channelOrDirect: currentChannel });
		const [hasQuickReaction, setHasQuickReaction] = useState<boolean>(false);

		const channelId = useMemo(() => {
			return currentChannel?.channel_id || currentChannel?.id || '';
		}, [currentChannel?.channel_id, currentChannel?.id]);

		useEffect(() => {
			if (!currentUserId || !channelId) {
				setHasQuickReaction(false);
				return;
			}
			const data = load(STORAGE_USERS_QUICK_REACTION) || {};
			setHasQuickReaction(!!data?.[currentUserId]?.[channelId]);
		}, [currentUserId, channelId]);

		const handleRemoveQuickReaction = useCallback(() => {
			if (!currentUserId || !channelId) return;

			try {
				const currentData = load(STORAGE_USERS_QUICK_REACTION) || {};

				if (currentData?.[currentUserId]?.[channelId]) {
					delete currentData[currentUserId][channelId];
					save(STORAGE_USERS_QUICK_REACTION, currentData);
					setHasQuickReaction(false);
				}
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			} catch (error) {
				console.error('Error removing quick reaction:', error);
			}
		}, [channelId, currentUserId, t]);

		const headerOptions = useMemo(
			() =>
				[
					{
						title: 'quickReaction',
						content: t('common:quickReaction.title'),
						value: OptionChannelHeader.QuickReaction,
						icon: <Icons.EmojiIcon color={themeValue.text} width={size.s_18} height={size.s_18} />
					},
					{
						title: 'removeQuickReaction',
						content: t('common:quickReaction.removeTitle'),
						value: OptionChannelHeader.RemoveQuickReaction,
						icon: <MezonIconCDN icon={IconCDN.circleXIcon} color={themeValue.text} height={size.s_18} width={size.s_18} />
					},
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
						icon: <Icons.BuzzIcon color={themeValue.text} width={size.s_18} height={size.s_18} />
					}
				].filter((item) => {
					if (item.value === OptionChannelHeader.Buzz && isBanned) return false;
					if (item.value === OptionChannelHeader.Anonymous && currentClanPreventAnonymous) return false;
					if (item.value === OptionChannelHeader.QuickReaction && currentChannel?.parent_id !== '0' && currentChannel?.parent_id !== '')
						return false;
					if (
						item.value === OptionChannelHeader.RemoveQuickReaction &&
						((currentChannel?.parent_id !== '0' && currentChannel?.parent_id !== '') || !hasQuickReaction)
					)
						return false;
					return true;
				}),
			[anonymousMode, t, themeValue, isBanned, currentClanPreventAnonymous, currentChannel?.parent_id, hasQuickReaction]
		);

		const onPressOption = (option: IOption) => {
			if (option?.value === OptionChannelHeader.Anonymous) {
				handleToggleAnnonymous();
			} else if (option?.value === OptionChannelHeader.RemoveQuickReaction) {
				handleRemoveQuickReaction();
			} else if (option?.value === OptionChannelHeader.Buzz) {
				handleActionBuzzMessage();
			} else {
				handleOpenQuickReactionModal();
			}
		};

		const handleActionBuzzMessage = async () => {
			const data = {
				children: <ConfirmBuzzMessageModal onSubmit={handleBuzzMessage} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		};

		const handleBuzzMessage = (text: string) => {
			sendMessage({ t: text || 'Buzz!!' }, [], [], [], undefined, undefined, undefined, TypeMessage.MessageBuzz);
		};

		const handleEmojiSelected = useCallback(
			(emojiId: string, shortname: string) => {
				if (!currentUserId || !channelId) return;

				try {
					const currentData = load(STORAGE_USERS_QUICK_REACTION) || {};

					if (!currentData[currentUserId]) {
						currentData[currentUserId] = {};
					}

					currentData[currentUserId][channelId] = { emojiId, shortname };
					save(STORAGE_USERS_QUICK_REACTION, currentData);
					setHasQuickReaction(true);
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				} catch (error) {
					console.error('Error setting quick reaction:', error);
				}
			},
			[currentUserId, channelId]
		);

		const handleOpenQuickReactionModal = async () => {
			const data = {
				snapPoints: ['90%'],
				children: (
					<ContainerMessageActionModal
						message={undefined}
						mode={mode}
						isOnlyEmojiPicker
						channelId={channelId}
						onEmojiSelected={handleEmojiSelected}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		};

		const handleToggleAnnonymous = () => {
			dispatch(accountActions.setAnonymousMode(currentChannel?.clan_id));
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

		const navigateToChannelHighlight = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false
			});
			navigation.navigate(APP_SCREEN.MEDIA_HIGHLIGHTS_TIMELINE, {
				channelName: currentChannel?.channel_label,
				channelId,
				clanId: currentChannel?.clan_id
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
				return <Icons.ClansLockIcon color={themeValue.textStrong} width={size.s_20} height={size.s_20} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
				return <Icons.VideoCallIcon color={themeValue.textStrong} width={size.s_20} height={size.s_20} />;
			}

			if (currentChannel?.channel_private !== ChannelStatusEnum.isPrivate && currentChannel?.type === ChannelType.CHANNEL_TYPE_APP) {
				return <MezonIconCDN icon={IconCDN.channelApp} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />;
			}

			if (currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel) {
				return <MezonIconCDN icon={IconCDN.channelTextWarning} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />;
			}

			return <Icons.ClansOpenIcon color={themeValue.textStrong} width={size.s_20} height={size.s_20} />;
		};

		return (
			<View style={styles.homeDefaultHeader}>
				<TouchableOpacity style={styles.headerTouchable} onPress={navigateMenuThreadDetail}>
					<View style={styles.headerRowContainer}>
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
						<Icons.NoitificationIcon color={themeValue.textStrong} width={size.s_20} height={size.s_20} />
					</TouchableOpacity>
				) : currentChannel ? (
					<TouchableOpacity style={styles.iconBell} onPress={() => navigateToSearchPage()}>
						<Icons.SearchIcon color={themeValue.textStrong} width={size.s_20} height={size.s_20} />
					</TouchableOpacity>
				) : (
					<View />
				)}
				<TouchableOpacity style={styles.iconBell} onPress={() => navigateToChannelHighlight()}>
					<MezonIconCDN icon={IconCDN.clockIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
				</TouchableOpacity>
				<View style={styles.headerTooltipContainer}>
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
