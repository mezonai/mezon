import {
	channelMetaActions,
	ChannelsEntity,
	channelUsersActions,
	reactionActions,
	selectAllChannelMembers,
	selectClanView,
	selectCurrentChannel,
	selectDirectById,
	selectDmGroupCurrentId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { EmojiStorage, transformPayloadWriteSocket } from '@mezon/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../auth/hooks/useAuth';
export type UseMessageReactionOption = {
	currentChannelId?: string | null | undefined;
};
interface ChatReactionProps {
	isMobile?: boolean;
}

export function useChatReaction({ isMobile = false }: ChatReactionProps = {}) {
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const isClanView = useSelector(selectClanView);

	const directId = useSelector(selectDmGroupCurrentId);
	const direct = useAppSelector((state) => selectDirectById(state, directId));
	const channel = useSelector(selectCurrentChannel);

	const currentActive = useMemo(() => {
		let clanIdActive = '';
		let modeActive = 0;
		let channelIdActive = '';

		if (!isClanView && direct?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			clanIdActive = '0';
			modeActive = ChannelStreamMode.STREAM_MODE_GROUP;
			channelIdActive = directId || '';
		} else if (!isClanView && direct?.type === ChannelType.CHANNEL_TYPE_DM) {
			clanIdActive = '0';
			modeActive = ChannelStreamMode.STREAM_MODE_DM;
			channelIdActive = directId || '';
		} else if (isClanView && channel?.type === ChannelType.CHANNEL_TYPE_TEXT) {
			clanIdActive = channel?.clan_id || '';
			modeActive = ChannelStreamMode.STREAM_MODE_CHANNEL;
			channelIdActive = channel?.id || '';
		} else if (isClanView && channel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
			clanIdActive = channel?.clan_id || '';
			modeActive = ChannelStreamMode.STREAM_MODE_THREAD;
			channelIdActive = channel?.id || '';
		}

		return {
			clanIdActive,
			modeActive,
			channelIdActive
		};
	}, [isClanView, direct?.type, directId, channel?.type, channel?.clan_id, channel?.id]);

	const membersOfChild = useAppSelector((state) => (channel?.id ? selectAllChannelMembers(state, channel?.id as string) : null));
	const membersOfParent = useAppSelector((state) => (channel?.parrent_id ? selectAllChannelMembers(state, channel?.parrent_id as string) : null));
	const updateChannelUsers = async (currentChannel: ChannelsEntity | null, userIds: string[], clanId: string) => {
		const timestamp = Date.now() / 1000;

		const body = {
			channelId: currentChannel?.channel_id as string,
			channelType: currentChannel?.type,
			userIds: userIds,
			clanId: clanId
		};

		await dispatch(channelUsersActions.addChannelUsers(body));
		dispatch(
			channelMetaActions.updateBulkChannelMetadata([
				{
					id: currentChannel?.channel_id ?? '',
					lastSeenTimestamp: timestamp,
					lastSentTimestamp: timestamp,
					lastSeenPinMessage: '',
					clanId: currentChannel?.clan_id ?? ''
				}
			])
		);
	};
	const addMemberToThread = useCallback(
		async (userId: string) => {
			if (channel?.parrent_id === '0' || channel?.parrent_id === '') return;
			const existingUserIdOfParrent = membersOfParent?.some((member) => member.id === userId);
			const existingUserIdOfChild = membersOfChild?.some((member) => member.id === userId);
			if (existingUserIdOfParrent && !existingUserIdOfChild) {
				await updateChannelUsers(channel, [userId], channel?.clan_id as string);
			}
		},
		[channel, membersOfParent, membersOfChild]
	);
	const reactionMessageDispatch = useCallback(
		async (
			id: string,
			messageId: string,
			emoji_id: string,
			emoji: string,
			count: number,
			message_sender_id: string,
			action_delete: boolean,
			is_public: boolean
		) => {
			if (isMobile) {
				const emojiLastest: EmojiStorage = {
					emojiId: emoji_id ?? '',
					emoji: emoji ?? '',
					messageId: messageId ?? '',
					senderId: message_sender_id ?? '',
					action: action_delete ?? false
				};
				saveRecentEmojiMobile(emojiLastest);
			}
			addMemberToThread(userId || '');
			const payload = transformPayloadWriteSocket({
				clanId: currentActive.clanIdActive,
				isPublicChannel: is_public,
				isClanView: isClanView as boolean
			});

			return dispatch(
				reactionActions.writeMessageReaction({
					id,
					clanId: currentActive.clanIdActive,
					channelId: currentActive.channelIdActive,
					mode: currentActive.modeActive,
					messageId,
					emoji_id,
					emoji,
					count,
					messageSenderId: message_sender_id,
					actionDelete: action_delete,
					isPublic: payload.is_public
				})
			).unwrap();
		},
		[dispatch, isMobile, isClanView, userId]
	);

	return useMemo(
		() => ({
			reactionMessageDispatch
		}),
		[reactionMessageDispatch]
	);
}

function saveRecentEmojiMobile(emojiLastest: EmojiStorage) {
	AsyncStorage.getItem('recentEmojis').then((storedEmojis) => {
		const emojisRecentParse = storedEmojis ? JSON.parse(storedEmojis) : [];

		const duplicateIndex = emojisRecentParse.findIndex((item: any) => {
			return item.emoji === emojiLastest.emoji && item.senderId === emojiLastest.senderId;
		});

		if (emojiLastest.action === true) {
			if (duplicateIndex !== -1) {
				emojisRecentParse.splice(duplicateIndex, 1);
			}
		} else {
			if (duplicateIndex === -1) {
				emojisRecentParse.push(emojiLastest);
			}
		}
		AsyncStorage.setItem('recentEmojis', JSON.stringify(emojisRecentParse));
	});
}
