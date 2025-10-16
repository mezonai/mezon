import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useFriends } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	EStateFriend,
	friendsActions,
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
	const { t } = useTranslation(['userProfile', 'dmMessage']);
	const currenChannel = useCurrentChannel(channelId) as IChannel;
	const userProfile = useSelector(selectAllAccount);
	const currentUserId = userProfile?.user?.id;
	const targetUserId = currenChannel?.user_ids?.[0];
	const infoFriend = useAppSelector((state) => selectFriendById(state, targetUserId || ''));

	const { blockFriend, unBlockFriend } = useFriends();
	const isBlockedByUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.source_id === targetUserId && infoFriend?.user?.id === currentUserId;
	}, [infoFriend, targetUserId, currentUserId]);
	const didIBlockUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.source_id === currentUserId && infoFriend?.user?.id === targetUserId;
	}, [infoFriend, targetUserId, currentUserId]);

	const userName: string = useMemo(() => {
		return typeof currenChannel?.usernames === 'string' ? currenChannel?.usernames : currenChannel?.usernames?.[0] || '';
	}, [currenChannel?.usernames]);

	const isChannel = useMemo(() => {
		return currenChannel?.parent_id === '0';
	}, [currenChannel?.parent_id]);

	const isDM = useMemo(() => {
		return currenChannel?.clan_id === '0';
	}, [currenChannel?.clan_id]);

	const isDMGroup = useMemo(() => {
		return Number(currenChannel?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [currenChannel?.type]);

	const creatorUser = useAppSelector((state) => selectMemberClanByUserId(state, currenChannel?.creator_id));

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
			usernames: [userName],
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
					props: {
						text2: t('notification.blockUser.success', { ns: 'dmMessage' }),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
					}
				});
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				props: {
					text2: t('notification.blockUser.error', { ns: 'dmMessage' }),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
			});
		}
	};

	const handleUnblockFriend = async () => {
		try {
			const isUnblocked = await unBlockFriend(userName, targetUserId);
			if (isUnblocked) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('notification.unblockUser.success', { ns: 'dmMessage' }),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
					}
				});
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				props: {
					text2: t('notification.unblockUser.error', { ns: 'dmMessage' }),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
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
						<ImageNative url={createImgproxyUrl(groupDMAvatar ?? '')} style={{ width: '100%', height: '100%' }} resizeMode={'cover'} />
					</View>
				) : currenChannel?.avatars?.[0] ? (
					<MezonAvatar height={size.s_100} width={size.s_100} avatarUrl={currenChannel.avatars[0]} username={userName} />
				) : (
					<View style={styles.wrapperTextAvatar}>
						<Text style={[styles.textAvatar]}>{currenChannel?.channel_label?.charAt?.(0)?.toUpperCase()}</Text>
					</View>
				)
			) : (
				<View style={styles.iconWelcomeMessage}>
					{isChannel ? (
						currenChannel?.channel_private === ChannelStatusEnum.isPrivate ? (
							<MezonIconCDN icon={IconCDN.channelTextLock} width={size.s_50} height={size.s_50} color={themeValue.textStrong} />
						) : (
							<MezonIconCDN icon={IconCDN.channelText} width={size.s_50} height={size.s_50} color={themeValue.textStrong} />
						)
					) : (
						<MezonIconCDN icon={IconCDN.threadIcon} width={size.s_50} height={size.s_50} color={themeValue.textStrong} />
					)}
				</View>
			)}

			{isDM ? (
				<View>
					<Text style={[styles.titleWelcomeMessage, isDMGroup && { textAlign: 'center' }]}>{currenChannel?.channel_label}</Text>
					{!isDMGroup && <Text style={styles.subTitleUsername}>{userName}</Text>}
					{isDMGroup ? (
						<Text style={styles.subTitleWelcomeMessageCenter}>{"Welcome to your new group! Invite friends whenever you're ready"}</Text>
					) : (
						<Text style={styles.subTitleWelcomeMessage}>
							{`This is the very beginning of your legendary conversation with ${userName}`}
						</Text>
					)}

					{!isDMGroup && !isBlockedByUser && (
						<View style={styles.friendActions}>
							{infoFriend?.state !== EStateFriend.BLOCK &&
								(infoFriend?.state === EStateFriend.FRIEND ? (
									<TouchableOpacity style={styles.deleteFriendButton} onPress={handleRemoveFriend}>
										<Text style={styles.buttonText}>{t('userAction.removeFriend')}</Text>
									</TouchableOpacity>
								) : infoFriend?.state === EStateFriend.OTHER_PENDING ? (
									<View style={[styles.addFriendButton, { opacity: 0.6 }]}>
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
					<Text style={styles.titleWelcomeMessage}>{`Welcome to #${currenChannel?.channel_label}`}</Text>
					<Text style={styles.subTitleWelcomeMessage}>{`This is the start of the #${currenChannel?.channel_label}`}</Text>
				</View>
			) : (
				<View>
					<Text style={styles.titleWelcomeMessage}>{currenChannel?.channel_label}</Text>
					<View style={{ flexDirection: 'row' }}>
						<Text style={styles.subTitleWelcomeMessage}>{'Started by '}</Text>
						<Text style={styles.subTitleWelcomeMessageWithHighlight}>{creatorUser?.user?.username || ''}</Text>
					</View>
				</View>
			)}
		</View>
	);
});

export default WelcomeMessage;
