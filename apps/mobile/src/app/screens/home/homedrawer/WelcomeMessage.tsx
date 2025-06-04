import { useFriends } from '@mezon/core';
import { CheckIcon, CloseIcon } from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import {
	EStateFriend,
	friendsActions,
	getStoreAsync,
	selectChannelById2,
	selectDmGroupCurrent,
	selectFriendStatus,
	selectMemberClanByUserId2,
	useAppSelector
} from '@mezon/store-mobile';
import { ChannelStatusEnum, IChannel } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface IWelcomeMessage {
	channelId: string;
	uri?: string;
}

const useCurrentChannel = (channelId: string) => {
	const channel = useAppSelector((state) => selectChannelById2(state, channelId));
	const dmGroup = useAppSelector(selectDmGroupCurrent(channelId));
	return channel || dmGroup;
};

const WelcomeMessage = React.memo(({ channelId, uri }: IWelcomeMessage) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['userProfile']);
	const currenChannel = useCurrentChannel(channelId) as IChannel;
	const [isCountBadge, setIsCountBadge] = useState(false);
	const [remainingCount, setRemainingCount] = useState(null);
	const { blockFriend, unBlockFriend } = useFriends();

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

	const stackUsers = useMemo(() => {
		const username = currenChannel?.category_name?.split(',');
		if (!isDMGroup) return [];

		const allUsers =
			currenChannel?.channel_avatar?.map((avatar) => {
				return {
					avatarUrl: avatar,
					username: username?.shift() || 'Anonymous'
				};
			}) || [];

		if (allUsers.length > 3) {
			const remainingCount = allUsers.length - 2;
			const visibleUsers = allUsers.slice(0, 3);

			setIsCountBadge(true);
			setRemainingCount(remainingCount);
			return visibleUsers;
		}

		setIsCountBadge(false);
		setRemainingCount(null);
		return allUsers;
	}, [currenChannel?.category_name, currenChannel?.channel_avatar, isDMGroup]);

	const creatorUser = useAppSelector((state) => selectMemberClanByUserId2(state, currenChannel?.creator_id));
	const checkAddFriend = useAppSelector(selectFriendStatus(currenChannel?.user_id?.[0]));

	const handleAddFriend = async () => {
		if (currenChannel?.user_id?.[0]) {
			const store = await getStoreAsync();
			store.dispatch(
				friendsActions.sendRequestAddFriend({
					usernames: [],
					ids: [currenChannel?.user_id?.[0]]
				})
			);
		}
	};

	const handleAcceptFriend = async () => {
		const store = await getStoreAsync();
		const body = {
			usernames: [userName],
			ids: [currenChannel?.user_id?.[0]]
		};
		store.dispatch(friendsActions.sendRequestAddFriend(body));
	};

	const handleRemoveFriend = async () => {
		const store = await getStoreAsync();
		const body = {
			usernames: [userName],
			ids: [currenChannel?.user_id?.[0]]
		};
		store.dispatch(friendsActions.sendRequestDeleteFriend(body));
	};

	const handleBlockFriend = async () => {
		try {
			const targetId = currenChannel?.user_id?.[0];
			const targetUsername = userName;

			const userData = {
				avatar_url: currenChannel?.channel_avatar?.[0] || '',
				display_name: currenChannel?.channel_label || '',
				username: userName || ''
			};

			const isBlocked = await blockFriend(targetUsername, targetId, userData);

			if (isBlocked) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('notification.blockUser.success'),
						leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />
					}
				});
			} else {
				Toast.show({
					type: 'error',
					props: {
						text2: t('notification.blockUser.error'),
						leadingIcon: <CloseIcon color={Colors.red} width={20} height={20} />
					}
				});
			}
		} catch (error) {
			console.error('Error blocking friend:', error);
		}
	};

	const handleUnblockFriend = async () => {
		try {
			const targetId = currenChannel?.user_id?.[0];
			const targetUsername = userName;

			unBlockFriend(targetUsername, targetId);

			Toast.show({
				type: 'success',
				props: {
					text2: t('notification.unblockUser.success'),
					leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />
				}
			});
		} catch (error) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('notification.unblockUser.error'),
					leadingIcon: <CloseIcon color={Colors.green} width={20} height={20} />
				}
			});
		}
	};

	return (
		<View style={[styles.wrapperWelcomeMessage, isDMGroup && styles.wrapperCenter]}>
			{isDM ? (
				isDMGroup ? (
					<MezonAvatar
						height={size.s_50}
						width={size.s_50}
						avatarUrl={''}
						username={''}
						stacks={stackUsers}
						isCountBadge={isCountBadge}
						countBadge={remainingCount}
					/>
				) : currenChannel?.channel_avatar && currenChannel.channel_avatar[0] ? (
					<MezonAvatar height={size.s_100} width={size.s_100} avatarUrl={currenChannel.channel_avatar[0]} username={userName} />
				) : (
					<View style={styles.wrapperTextAvatar}>
						<Text style={[styles.textAvatar]}>{currenChannel?.channel_label?.charAt?.(0)}</Text>
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
							{'This is the very beginning of your legendary conversation with ' + userName}
						</Text>
					)}

					{/* TODO: Mutual server */}
					{!isDMGroup && (
						<View style={styles.friendActions}>
							{checkAddFriend === EStateFriend.BLOCK ? (
								<TouchableOpacity style={styles.blockButton} onPress={handleUnblockFriend}>
									<Text style={styles.buttonText}>{t('pendingContent.unblock')}</Text>
								</TouchableOpacity>
							) : checkAddFriend === EStateFriend.FRIEND ? (
								<View style={{ flexDirection: 'row', gap: size.s_10 }}>
									<TouchableOpacity style={styles.deleteFriendButton} onPress={handleRemoveFriend}>
										<Text style={styles.buttonText}>{t('userAction.removeFriend')}</Text>
									</TouchableOpacity>
									<TouchableOpacity style={styles.blockButton} onPress={handleBlockFriend}>
										<Text style={styles.buttonText}>{t('pendingContent.block')}</Text>
									</TouchableOpacity>
								</View>
							) : checkAddFriend === EStateFriend.OTHER_PENDING ? (
								<View style={{ flexDirection: 'row', gap: size.s_10 }}>
									<View style={[styles.addFriendButton, { opacity: 0.6 }]}>
										<Text style={styles.buttonText}>{t('sendAddFriendSuccess')}</Text>
									</View>
									<TouchableOpacity style={styles.blockButton} onPress={handleBlockFriend}>
										<Text style={styles.buttonText}>{t('pendingContent.block')}</Text>
									</TouchableOpacity>
								</View>
							) : checkAddFriend === EStateFriend.MY_PENDING ? (
								<View style={{ flexDirection: 'row', gap: size.s_10 }}>
									<TouchableOpacity style={styles.addFriendButton} onPress={handleAcceptFriend}>
										<Text style={styles.buttonText}>{t('accept')}</Text>
									</TouchableOpacity>
									<TouchableOpacity style={styles.blockButton} onPress={handleRemoveFriend}>
										<Text style={styles.buttonText}>{t('ignore')}</Text>
									</TouchableOpacity>
									<TouchableOpacity style={styles.blockButton} onPress={handleBlockFriend}>
										<Text style={styles.buttonText}>{t('pendingContent.block')}</Text>
									</TouchableOpacity>
								</View>
							) : (
								<View style={{ flexDirection: 'row', gap: size.s_10 }}>
									<TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend}>
										<Text style={styles.buttonText}>{t('userAction.addFriend')}</Text>
									</TouchableOpacity>
									<TouchableOpacity style={styles.blockButton} onPress={handleBlockFriend}>
										<Text style={styles.buttonText}>{t('pendingContent.block')}</Text>
									</TouchableOpacity>
								</View>
							)}
						</View>
					)}
				</View>
			) : isChannel ? (
				<View>
					<Text style={styles.titleWelcomeMessage}>{'Welcome to #' + currenChannel?.channel_label}</Text>
					<Text style={styles.subTitleWelcomeMessage}>{'This is the start of the #' + currenChannel?.channel_label}</Text>
				</View>
			) : (
				<View>
					<Text style={styles.titleWelcomeMessage}>{currenChannel?.channel_label}</Text>
					<View style={{ flexDirection: 'row' }}>
						<Text style={styles.subTitleWelcomeMessage}>{'Started by '}</Text>
						<Text style={styles.subTitleWelcomeMessageWithHighlight}>{creatorUser?.user?.username || 'Anonymous'}</Text>
					</View>
				</View>
			)}
		</View>
	);
});

export default WelcomeMessage;
