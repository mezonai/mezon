import {
	channelMetaActions,
	ChannelsEntity,
	channelUsersActions,
	getActiveMode,
	getStore,
	reactionActions,
	RootState,
	selectAllAccount,
	selectAllChannelMembers,
	selectAllEmojiRecent,
	selectCurrentChannel,
	selectLastEmojiRecent,
	useAppDispatch,
	WriteMessageReactionArgs
} from '@mezon/store';
import { transformPayloadWriteSocket } from '@mezon/utils';
import { ApiClanEmoji } from 'mezon-js/api.gen';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
export type UseMessageReactionOption = {
	currentChannelId?: string | null | undefined;
};
interface ChatReactionProps {
	isMobile?: boolean;
	isClanViewMobile?: boolean;
}

// check and fix it

interface ReactionMessageDispatchParams {
	id: string;
	messageId: string;
	emoji_id: string;
	emoji: string;
	count: number;
	message_sender_id: string;
	action_delete: boolean;
	is_public: boolean;
	clanId: string;
	channelId: string;
	isFocusTopicBox?: boolean;
	channelIdOnMessage?: string;
	sender_name?: string;
}

export function useChatReaction({ isMobile = false, isClanViewMobile = undefined }: ChatReactionProps = {}) {
	const dispatch = useAppDispatch();
	const userId = useSelector(selectAllAccount)?.user?.id as string;

	const updateChannelUsers = useCallback(async (currentChannel: ChannelsEntity | null, userIds: string[], clanId: string) => {
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
					clanId: currentChannel?.clan_id ?? '',
					isMute: false,
					senderId: currentChannel?.last_sent_message?.sender_id ?? ''
				}
			])
		);
	}, []);

	const addMemberToThread = useCallback(async (userId: string) => {
		const store = getStore();
		const channel = selectCurrentChannel(store.getState());
		const membersOfChild = selectAllChannelMembers(store.getState(), channel?.id as string);
		const membersOfParent = selectAllChannelMembers(store.getState(), channel?.parent_id as string);

		if (channel?.parent_id === '0' || channel?.parent_id === '') return;
		const existingUserIdOfParent = membersOfParent?.some((member) => member.id === userId);
		const existingUserIdOfChild = membersOfChild?.some((member) => member.id === userId);
		if (existingUserIdOfParent && !existingUserIdOfChild) {
			await updateChannelUsers(channel, [userId], channel?.clan_id as string);
		}
	}, []);

	const emojiRecentId = useCallback(async (emoji_id: string) => {
		const store = getStore();
		const allEmojiRecent = selectAllEmojiRecent(store.getState());
		const lastEmojiRecent = selectLastEmojiRecent(store.getState() as unknown as RootState);
		if (lastEmojiRecent.emoji_id === emoji_id) {
			return '';
		}
		const foundEmoji = allEmojiRecent.find((emoji) => emoji.id === emoji_id) as ApiClanEmoji & { emoji_recents_id?: string };
		if (foundEmoji) {
			return foundEmoji?.emoji_recents_id || '';
		}
		return '0';
	}, []);

	const reactionMessageDispatch = useCallback(
		async ({
			id,
			messageId,
			emoji_id,
			emoji,
			count,
			message_sender_id,
			action_delete,
			is_public,
			clanId,
			channelId,
			isFocusTopicBox,
			channelIdOnMessage,
			sender_name
		}: ReactionMessageDispatchParams) => {
			const mode = getActiveMode(channelId);
			const checkIsClanView = clanId && clanId !== '0';
			const isClanView = isClanViewMobile !== undefined ? isClanViewMobile : checkIsClanView;

			isClanView && addMemberToThread(userId || '');
			const payload = transformPayloadWriteSocket({
				clanId: clanId,
				isPublicChannel: is_public,
				isClanView: isClanView as boolean
			});
			const emoji_recent_id = await emojiRecentId(emoji_id);

			const payloadDispatchReaction: WriteMessageReactionArgs = {
				id,
				clanId,
				channelId,
				mode,
				messageId,
				emoji_id,
				emoji,
				count,
				messageSenderId: message_sender_id,
				actionDelete: action_delete,
				isPublic: payload.is_public,
				userId: userId as string,
				topic_id: isFocusTopicBox ? channelIdOnMessage : '',
				emoji_recent_id: emoji_recent_id,
				sender_name
			};
			return dispatch(reactionActions.writeMessageReaction(payloadDispatchReaction)).unwrap();
		},
		[userId, emojiRecentId, addMemberToThread]
	);

	return useMemo(
		() => ({
			reactionMessageDispatch
		}),
		[reactionMessageDispatch]
	);
}
