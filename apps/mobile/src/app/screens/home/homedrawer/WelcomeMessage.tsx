import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { size, useTheme } from '@mezon/mobile-ui';
import {
	EStateFriend,
	friendsActions,
	getStoreAsync,
	selectChannelById2,
	selectDmGroupCurrent,
	selectFriendById,
	selectMemberClanByUserId2,
	useAppSelector
} from '@mezon/store-mobile';
import { ChannelStatusEnum, IChannel } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation(['userProfile', 'dmMessage']);
	const currenChannel = useCurrentChannel(channelId) as IChannel;
	const targetUserId = currenChannel?.user_id?.[0];
	const [isCountBadge, setIsCountBadge] = useState(false);
	const [remainingCount, setRemainingCount] = useState(null);
	const infoFriend = useAppSelector((state) => selectFriendById(state, targetUserId || ''));

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

	const handleAddFriend = async () => {
		if (targetUserId) {
			const store = await getStoreAsync();
			store.dispatch(
				friendsActions.sendRequestAddFriend({
					usernames: [userName],
					ids: [targetUserId]
				})
			);
		}
	};

	const handleAcceptFriend = async () => {
		const store = await getStoreAsync();
		const body = {
			usernames: [userName],
			ids: [targetUserId]
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

							{/* {(infoFriend?.state === EStateFriend.FRIEND || didIBlockUser) && (
								<TouchableOpacity style={styles.deleteFriendButton} onPress={didIBlockUser ? handleUnblockFriend : handleBlockFriend}>
									<Text style={styles.buttonText}>{didIBlockUser ? t('pendingContent.unblock') : t('pendingContent.block')}</Text>
								</TouchableOpacity>
							)} */}
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
