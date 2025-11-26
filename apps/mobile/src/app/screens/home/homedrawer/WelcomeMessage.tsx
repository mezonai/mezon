import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useFriends } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	EStateFriend,
	friendsActions,
	getStore,
	getStoreAsync,
	selectAllAccount,
	selectChannelById,
	selectDmGroupCurrent,
	selectFriendById,
	selectMemberClanByUserId,
	useAppSelector
} from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import { ChannelStatusEnum, createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import ImageNative from '../../../components/ImageNative';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface IWelcomeMessage {
	channelId: string;
	uri?: string;
}

const useCurrentChannel = (channelId: string) => {
	const channel = useAppSelector((state) => selectChannelById(state, channelId));
	const dmGroup = useAppSelector(selectDmGroupCurrent(channelId));
	return dmGroup || channel;
};

const WelcomeMessage = React.memo(({ channelId }: IWelcomeMessage) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['userProfile', 'dmMessage', 'chatWelcome']);
	const currenChannel = useCurrentChannel(channelId) as IChannel;
	const userProfile = useSelector(selectAllAccount);
	const currentUserId = userProfile?.user?.id;
	const targetUserId = currenChannel?.user_ids?.[0];
	const infoFriend = useAppSelector((state) => selectFriendById(state, targetUserId || ''));

	const { blockFriend, unBlockFriend } = useFriends();
	const isMySelf = useMemo(() => {
		return targetUserId === currentUserId;
	}, [targetUserId, currentUserId]);
	const isBlockedByUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.source_id === targetUserId && infoFriend?.user?.id === currentUserId;
	}, [infoFriend, targetUserId, currentUserId]);
	const didIBlockUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.source_id === currentUserId && infoFriend?.user?.id === targetUserId;
	}, [infoFriend, targetUserId, currentUserId]);

	const userName: string = useMemo(() => {
		return typeof currenChannel?.usernames === 'string' ? currenChannel?.usernames : currenChannel?.usernames?.[0] || '';
	}, [currenChannel?.usernames]);

	const displayName: string = useMemo(() => {
		return typeof currenChannel?.display_names === 'string' ? currenChannel?.display_names : currenChannel?.display_names?.[0] || '';
	}, [currenChannel?.display_names]);

	const isChannel = useMemo(() => {
		return currenChannel?.parent_id === '0';
	}, [currenChannel?.parent_id]);

	const isPrivate = useMemo(() => currenChannel?.channel_private === ChannelStatusEnum.isPrivate, [currenChannel?.channel_private]);

	const iconRender = useMemo(() => {
		return isChannel ? (isPrivate ? IconCDN.channelTextLock : IconCDN.channelText) : isPrivate ? IconCDN.threadLockIcon : IconCDN.threadIcon;
	}, [isChannel, isPrivate]);

	const priorityName = useMemo(() => {
		return displayName || userName || '';
	}, [displayName, userName]);

	const isDM = useMemo(() => {
		return currenChannel?.clan_id === '0';
	}, [currenChannel?.clan_id]);

	const isDMGroup = useMemo(() => {
		return Number(currenChannel?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [currenChannel?.type]);

	const creatorPriorityName = useMemo(() => {
		const store = getStore();
		const creatorUser = selectMemberClanByUserId(store.getState(), currenChannel?.creator_id || '');
		return creatorUser?.clan_nick || creatorUser?.user?.display_name || creatorUser?.user?.username || '';
	}, [currenChannel?.creator_id]);

	const groupDMAvatar = useMemo(() => {
		const isAvatar = currenChannel?.channel_avatar && !currenChannel?.channel_avatar?.includes('avatar-group.png');
		if (!isAvatar) return '';
		return currenChannel?.channel_avatar;
	}, [currenChannel?.channel_avatar]);

	const handleAddFriend = async () => {
		if (targetUserId) {
			const store = await getStoreAsync();
			store.dispatch(
				friendsActions.sendRequestAddFriend({
					usernames: [],
					ids: [targetUserId]
				})
			);
		}
	};

	const handleAcceptFriend = async () => {
		const store = await getStoreAsync();
		const body = {
			usernames: [],
			ids: [targetUserId],
			isAcceptingRequest: true
		};
		store.dispatch(friendsActions.sendRequestAddFriend(body));
	};

	const handleRemoveFriend = async () => {
		const store = await getStoreAsync();
		const body = {
			usernames: [userName],
			ids: [targetUserId]
		};
		store.dispatch(friendsActions.sendRequestDeleteFriend(body));
	};

	const handleBlockFriend = async () => {
		try {
			const isBlocked = await blockFriend(userName, targetUserId);
			if (isBlocked) {
				Toast.show({
					type: 'success',
					text1: t('notification.blockUser.success', { ns: 'dmMessage' }),
				});
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('notification.blockUser.error', { ns: 'dmMessage' })
			});
		}
	};

	const handleUnblockFriend = async () => {
		try {
			const isUnblocked = await unBlockFriend(userName, targetUserId);
			if (isUnblocked) {
				Toast.show({
					type: 'success',
					text1: t('notification.unblockUser.success', { ns: 'dmMessage' }),
				});
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('notification.unblockUser.error', { ns: 'dmMessage' })
			});
		}
	};

	return (
		<View style={[styles.wrapperWelcomeMessage, isDMGroup && styles.wrapperCenter]}>
			{isDM ? (
				isDMGroup && !groupDMAvatar ? (
					<View style={styles.groupAvatar}>
						<MezonIconCDN icon={IconCDN.groupIcon} width={size.s_30} height={size.s_30} />
					</View>
				) : isDMGroup && groupDMAvatar ? (
					<View style={styles.groupAvatar}>
						<ImageNative url={createImgproxyUrl(groupDMAvatar ?? '')} style={styles.imageFull} resizeMode={'cover'} />
					</View>
				) : currenChannel?.avatars?.[0] ? (
					<MezonAvatar height={size.s_100} width={size.s_100} avatarUrl={currenChannel.avatars[0]} username={userName} />
				) : (
					<View style={styles.wrapperTextAvatar}>
						<Text style={[styles.textAvatar]}>
							{(currenChannel?.channel_label || displayName || userName)?.charAt?.(0)?.toUpperCase()}
						</Text>
					</View>
				)
			) : (
				<View style={styles.iconWelcomeMessage}>
					<MezonIconCDN icon={iconRender} width={size.s_50} height={size.s_50} color={themeValue.textStrong} />
				</View>
			)}

			{isDM ? (
				<View>
					<Text style={[styles.titleWelcomeMessage, isDMGroup && styles.textAlignCenter]}>{currenChannel?.channel_label}</Text>
					{!isDMGroup && <Text style={styles.subTitleUsername}>{userName}</Text>}
					{isDMGroup ? (
						<Text style={styles.subTitleWelcomeMessageCenter}>
							{t('chatWelcome:welcome.welcomeToGroup', { groupName: currenChannel?.channel_label || '' })}
						</Text>
					) : (
						<Text style={styles.subTitleWelcomeMessage}>{t('chatWelcome:welcome.beginningOfDM', { userName: priorityName })}</Text>
					)}

					{!isDMGroup && !isBlockedByUser && !isMySelf && (
						<View style={styles.friendActions}>
							{infoFriend?.state !== EStateFriend.BLOCK &&
								(infoFriend?.state === EStateFriend.FRIEND ? (
									<TouchableOpacity style={styles.deleteFriendButton} onPress={handleRemoveFriend}>
										<Text style={styles.buttonText}>{t('userAction.removeFriend')}</Text>
									</TouchableOpacity>
								) : infoFriend?.state === EStateFriend.OTHER_PENDING ? (
									<View style={[styles.addFriendButton, styles.addFriendButtonOpacity]}>
										<Text style={styles.buttonText}>{t('sendAddFriendSuccess')}</Text>
									</View>
								) : infoFriend?.state === EStateFriend.MY_PENDING ? (
									<View style={styles.friendActions}>
										<TouchableOpacity style={styles.addFriendButton} onPress={handleAcceptFriend}>
											<Text style={styles.buttonText}>{t('accept')}</Text>
										</TouchableOpacity>
										<TouchableOpacity style={styles.blockButton} onPress={handleRemoveFriend}>
											<Text style={styles.buttonText}>{t('ignore')}</Text>
										</TouchableOpacity>
									</View>
								) : (
									<TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend}>
										<Text style={styles.buttonText}>{t('userAction.addFriend')}</Text>
									</TouchableOpacity>
								))}

							{(infoFriend?.state === EStateFriend.FRIEND || didIBlockUser) && (
								<TouchableOpacity style={styles.deleteFriendButton} onPress={didIBlockUser ? handleUnblockFriend : handleBlockFriend}>
									<Text style={styles.buttonText}>{didIBlockUser ? t('pendingContent.unblock') : t('pendingContent.block')}</Text>
								</TouchableOpacity>
							)}
						</View>
					)}
				</View>
			) : isChannel ? (
				<View>
					<Text style={styles.titleWelcomeMessage}>
						{t('chatWelcome:welcome.welcomeToChannel', { channelName: currenChannel?.channel_label || '' })}
					</Text>
					<Text style={styles.subTitleWelcomeMessage}>
						{t('chatWelcome:welcome.startOfChannel', {
							channelName: currenChannel?.channel_label || '',
							channelType: currenChannel?.channel_private ? t('chatWelcome:welcome.private') : ''
						})}
					</Text>
				</View>
			) : (
				<View>
					<Text style={styles.titleWelcomeMessage}>{currenChannel?.channel_label || ''}</Text>
					<View style={styles.flexRow}>
						<Text style={styles.subTitleWelcomeMessage}>{t('chatWelcome:welcome.startOfThread', { username: '' })}</Text>
						<Text style={styles.subTitleWelcomeMessageWithHighlight}>{creatorPriorityName}</Text>
					</View>
				</View>
			)}
		</View>
	);
});

export default WelcomeMessage;
