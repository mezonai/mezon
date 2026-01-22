import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import { directActions, DMCallActions, EStateFriend, selectDirectsOpenlist, selectFriendStatus, useAppDispatch } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonClanAvatar from '../../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { checkNotificationPermissionAndNavigate } from '../../../../../utils/notificationPermissionHelper';
import { DirectMessageCallMain } from '../../../../messages/DirectMessageCall';
import UserProfile from '../UserProfile';
import { style } from './styles';

export interface IContactData {
	user_id: string;
	username: string;
	display_name: string;
	avatar: string;
}

interface ICallPayload {
	receiverId: string;
	receiverAvatar: string;
	receiverName: string;
	directMessageId: string;
}

interface IContactMessageCardProps {
	data: IContactData;
	onLongPress?: () => void;
	showUserProfileGroup?: boolean;
}

export const ContactMessageCard = memo(({ data, onLongPress, showUserProfileGroup = false }: IContactMessageCardProps) => {
	const { themeValue, themeBasic } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = style(themeValue, isTabletLandscape);
	const { t } = useTranslation(['common', 'friends']);
	const navigation = useNavigation<any>();
	const dispatch = useAppDispatch();
	const listDM = useSelector(selectDirectsOpenlist);
	const friendStatus = useSelector(selectFriendStatus(data?.user_id));

	const handleOpenProfile = useCallback(() => {
		const dataEmitter = {
			snapPoints: ['50%', '80%'],
			hiddenHeaderIndicator: true,
			children: (
				<UserProfile
					showAction={false}
					showRole={false}
					userId={data?.user_id}
					user={data}
					messageAvatar={data?.avatar}
					checkAnonymous={false}
					currentChannel={{ type: showUserProfileGroup ? ChannelType.CHANNEL_TYPE_GROUP : ChannelType.CHANNEL_TYPE_DM } as ChannelsEntity}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, {
			isDismiss: false,
			data: dataEmitter
		});
	}, [data, showUserProfileGroup]);

	const createDirectMessage = useCallback(async () => {
		const response = await dispatch(
			directActions.createNewDirectMessage({
				body: {
					type: ChannelType.CHANNEL_TYPE_DM,
					channel_private: 1,
					user_ids: [data?.user_id],
					clan_id: '0'
				},
				username: data?.username,
				avatar: data?.avatar,
				display_names: data?.display_name
			})
		);
		return (response?.payload as any)?.channel_id;
	}, [data, dispatch]);

	const handleSendMessage = useCallback(async () => {
		const directMessage = listDM?.find?.((dm) => {
			return dm?.type === ChannelType.CHANNEL_TYPE_DM && dm?.user_ids?.[0] === data?.user_id;
		});

		const directMessageId = directMessage?.channel_id || directMessage?.id;
		if (directMessageId) {
			if (isTabletLandscape) {
				dispatch(directActions.setDmGroupCurrentId(directMessageId || ''));
				navigation.navigate(APP_SCREEN.MESSAGES.HOME);
			} else {
				navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId });
			}
			return;
		}

		const channelIdRes = await createDirectMessage();
		if (channelIdRes) {
			await checkNotificationPermissionAndNavigate(() => {
				if (isTabletLandscape) {
					dispatch(directActions.setDmGroupCurrentId(channelIdRes || ''));
					navigation.navigate(APP_SCREEN.MESSAGES.HOME);
				} else {
					navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: channelIdRes });
				}
			});
		} else {
			Toast.show({
				type: 'error',
				text2: t('friends:toast.somethingWentWrong')
			});
		}
	}, [data?.user_id, dispatch, isTabletLandscape, listDM, navigation, t, createDirectMessage]);

	const navigateToCallModal = useCallback(async (params: ICallPayload) => {
		const dataEmitter = {
			children: <DirectMessageCallMain route={{ params }} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data: dataEmitter });
	}, []);

	const handleCallUser = useCallback(async () => {
		if (friendStatus === EStateFriend.BLOCK) {
			Toast.show({
				type: 'error',
				text1: t('noPermissionToCallBlocked')
			});
			return;
		}

		const payload = {
			receiverId: data?.user_id,
			receiverAvatar: data?.avatar,
			receiverName: data?.display_name
		};
		const directMessage = listDM?.find?.((dm) => {
			return dm?.type === ChannelType.CHANNEL_TYPE_DM && dm?.user_ids?.[0] === data?.user_id;
		});
		const directMessageId = directMessage?.channel_id || directMessage?.id;
		if (directMessageId) {
			const params: ICallPayload = {
				...payload,
				directMessageId
			};
			navigateToCallModal(params);
			return;
		}

		const channelIdRes = await createDirectMessage();
		if (channelIdRes) {
			dispatch(DMCallActions.removeAll());
			const params: ICallPayload = {
				...payload,
				directMessageId: channelIdRes
			};
			navigateToCallModal(params);
		}
	}, [friendStatus, data?.user_id, data?.avatar, data?.display_name, listDM, createDirectMessage, t, navigateToCallModal, dispatch]);

	const handleLongPress = useCallback(() => {
		onLongPress && onLongPress();
	}, [onLongPress]);

	return (
		<TouchableOpacity activeOpacity={0.8} onPress={handleOpenProfile} onLongPress={handleLongPress} style={styles.container}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[
					themeValue.primary,
					(themeValue?.primaryGradiant ?? themeBasic === ThemeModeBase.LIGHT) ? themeValue.tertiary : themeValue.secondaryLight
				]}
				style={[StyleSheet.absoluteFillObject]}
			/>

			<View style={styles.avatarWrapper}>
				<View style={styles.avatarContainer}>
					<MezonClanAvatar image={data?.avatar} alt={data?.username} />
				</View>
				<View style={styles.displayNameWrapper}>
					<Text style={styles.displayName} numberOfLines={2}>
						{data?.display_name}
					</Text>
					<Text style={styles.username} numberOfLines={1}>
						{`@${data?.username}`}
					</Text>
				</View>
			</View>

			<View style={styles.actionContainer}>
				<TouchableOpacity style={styles.actionButton} onPress={handleCallUser} activeOpacity={0.8}>
					<MezonIconCDN icon={IconCDN.phoneCallIcon} width={size.s_18} height={size.s_18} color={themeValue.textStrong} />
					<Text style={styles.actionText}>{t('call.title')}</Text>
				</TouchableOpacity>

				<View style={styles.divider} />

				<TouchableOpacity style={styles.actionButton} onPress={handleSendMessage} activeOpacity={0.8}>
					<MezonIconCDN icon={IconCDN.chatIcon} width={size.s_18} height={size.s_18} color={baseColor.blurple} />
					<Text style={[styles.actionText, styles.messageButtonText]}>{t('sendMessage')}</Text>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
});
