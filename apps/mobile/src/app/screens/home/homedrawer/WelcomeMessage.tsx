import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
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
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MezonAvatar } from '../../../componentUI';
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
		return isDMGroup
			? currenChannel?.channel_avatar?.map((avatar) => {
					return {
						avatarUrl: avatar,
						username: username?.shift() || 'Anonymous'
					};
				})
			: [];
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

	return (
		<View style={[styles.wrapperWelcomeMessage, isDMGroup && styles.wrapperCenter]}>
			{isDM ? (
				isDMGroup ? (
					<MezonAvatar height={size.s_50} width={size.s_50} avatarUrl={''} username={''} stacks={stackUsers} />
				) : (
					<MezonAvatar height={size.s_100} width={size.s_100} avatarUrl={currenChannel?.channel_avatar?.[0]} username={userName} />
				)
			) : (
				<View style={styles.iconWelcomeMessage}>
					{isChannel ? (
						currenChannel?.channel_private === ChannelStatusEnum.isPrivate ? (
							<Icons.TextLockIcon width={size.s_50} height={size.s_50} color={themeValue.textStrong} />
						) : (
							<Icons.TextIcon width={size.s_50} height={size.s_50} color={themeValue.textStrong} />
						)
					) : (
						<Icons.ThreadIcon width={size.s_50} height={size.s_50} color={themeValue.textStrong} />
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
							{checkAddFriend === EStateFriend.FRIEND ? (
								<TouchableOpacity style={styles.deleteFriendButton} onPress={handleRemoveFriend}>
									<Text style={styles.buttonText}>{t('userAction.removeFriend')}</Text>
								</TouchableOpacity>
							) : checkAddFriend === EStateFriend.OTHER_PENDING ? (
								<View style={[styles.addFriendButton, { opacity: 0.6 }]}>
									<Text style={styles.buttonText}>{t('sendAddFriendSuccess')}</Text>
								</View>
							) : checkAddFriend === EStateFriend.MY_PENDING ? (
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
							)}
							<Pressable style={styles.blockButton}>
								<Text style={styles.buttonText}>{t('pendingContent.block')}</Text>
							</Pressable>
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
