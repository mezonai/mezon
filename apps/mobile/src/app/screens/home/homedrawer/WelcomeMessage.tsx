import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useFriends } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	EStateFriend,
	friendsActions,
	getStore,
	getStoreAsync,
	MessagesEntity,
	selectAllAccount,
	selectChannelById,
	selectDmGroupCurrent,
	selectFriendById,
	selectMemberClanByUserId,
	selectMessagesByChannel,
	useAppSelector
} from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import { ChannelStatusEnum, createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import ImageNative from '../../../components/ImageNative';
import WaveButton from '../../../components/WaveWelcome';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface IWelcomeMessageProps {
	channelId: string;
	message?: MessagesEntity;
}

const useCurrentChannel = (channelId: string) => {
	const channel = useAppSelector((state) => selectChannelById(state, channelId));
	const dmGroup = useAppSelector(selectDmGroupCurrent(channelId));
	return dmGroup || channel;
};

const WelcomeMessage = React.memo(({ channelId, message }: IWelcomeMessageProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['userProfile', 'dmMessage', 'chatWelcome']);
	const currenChannel = useCurrentChannel(channelId) as IChannel;
	const userProfile = useSelector(selectAllAccount);
	const currentUserId = userProfile?.user?.id;
	const targetUserId = currenChannel?.userIds?.[0];
	const infoFriend = useAppSelector((state) => selectFriendById(state, targetUserId || ''));
	const selectMessagesByChannelMemoized = useAppSelector((state) => selectMessagesByChannel(state, channelId));
	const messageCount = useMemo(() => selectMessagesByChannelMemoized?.ids?.length, [selectMessagesByChannelMemoized?.ids?.length]);
	const { blockFriend, unBlockFriend } = useFriends();
	const isMySelf = useMemo(() => {
		return targetUserId === currentUserId;
	}, [targetUserId, currentUserId]);
	const isBlockedByUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.sourceId === targetUserId && infoFriend?.user?.id === currentUserId;
	}, [infoFriend, targetUserId, currentUserId]);
	const didIBlockUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.sourceId === currentUserId && infoFriend?.user?.id === targetUserId;
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

	const isMediaChannel = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_STREAMING, ChannelType.CHANNEL_TYPE_MEZON_VOICE, ChannelType.CHANNEL_TYPE_APP].includes(
			Number(currenChannel?.type)
		);
	}, [currenChannel?.type]);

	const iconRender = useMemo(() => {
		return isChannel
			? isPrivate && !isMediaChannel
				? IconCDN.channelTextLock
				: IconCDN.channelText
			: isPrivate
				? IconCDN.threadLockIcon
				: IconCDN.threadIcon;
	}, [isChannel, isPrivate, isMediaChannel]);

	const priorityName = useMemo(() => {
		return displayName || userName || '';
	}, [displayName, userName]);

	const isDM = useMemo(() => {
		return currenChannel?.clanId === '0';
	}, [currenChannel?.clanId]);

	const isDMGroup = useMemo(() => {
		return Number(currenChannel?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [currenChannel?.type]);

	const creatorPriorityName = useMemo(() => {
		const store = getStore();
		const creatorUser = selectMemberClanByUserId(store.getState(), currenChannel?.creatorId || '');
		return creatorUser?.clanNick || creatorUser?.user?.displayName || creatorUser?.user?.username || '';
	}, [currenChannel?.creatorId]);

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
					text1: t('notification.blockUser.success', { ns: 'dmMessage' })
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
					text1: t('notification.unblockUser.success', { ns: 'dmMessage' })
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
							{(currenChannel?.channelLabel || displayName || userName)?.charAt?.(0)?.toUpperCase()}
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
					<Text style={[styles.titleWelcomeMessage, isDMGroup && styles.textAlignCenter]}>{currenChannel?.channelLabel}</Text>
					{!isDMGroup && <Text style={styles.subTitleUsername}>{userName}</Text>}
					{isDMGroup ? (
						<Text style={styles.subTitleWelcomeMessageCenter}>
							{t('chatWelcome:welcome.welcomeToGroup', { groupName: currenChannel?.channelLabel || '' })}
						</Text>
					) : (
						<Text style={styles.subTitleWelcomeMessage}>{t('chatWelcome:welcome.beginningOfDM', { userName: priorityName })}</Text>
					)}

					{!isDMGroup && !isBlockedByUser && !isMySelf && (
						<>
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
									<TouchableOpacity
										style={styles.deleteFriendButton}
										onPress={didIBlockUser ? handleUnblockFriend : handleBlockFriend}
									>
										<Text style={styles.buttonText}>
											{didIBlockUser ? t('pendingContent.unblock') : t('pendingContent.block')}
										</Text>
									</TouchableOpacity>
								)}
							</View>
							{messageCount === 1 && infoFriend?.state !== EStateFriend.BLOCK && (
								<View style={styles.waveButtonContainer}>
									<WaveButton message={message} />
								</View>
							)}
						</>
					)}
				</View>
			) : isChannel ? (
				<View>
					<Text style={styles.titleWelcomeMessage}>
						{t('chatWelcome:welcome.welcomeToChannel', { channelName: currenChannel?.channelLabel || '' })}
					</Text>
					<Text style={styles.subTitleWelcomeMessage}>
						{t('chatWelcome:welcome.startOfChannel', {
							channelName: currenChannel?.channelLabel || '',
							channelType: currenChannel?.channel_private && !isMediaChannel ? t('chatWelcome:welcome.private') : ''
						})}
					</Text>
				</View>
			) : (
				<View>
					<Text style={styles.titleWelcomeMessage}>{currenChannel?.channelLabel || ''}</Text>
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
