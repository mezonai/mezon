import type { ChannelsEntity, RootState, WriteMessageReactionArgs } from '@mezon/store';
import {
	channelMetaActions,
	channelUsersActions,
	getActiveMode,
	getStore,
	reactionActions,
	selectAllAccount,
	selectAllChannelMembers,
	selectAllEmojiRecent,
	selectCurrentChannel,
	selectLastEmojiRecent,
	useAppDispatch
} from '@mezon/store';
import { transformPayloadWriteSocket } from '@mezon/utils';
import type { ApiClanEmoji } from 'mezon-js/types';
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
	emojiId: string;
	emoji: string;
	count: number;
	messageSenderId: string;
	action_delete: boolean;
	isPublic: boolean;
	clanId: string;
	channelId: string;
	isFocusTopicBox?: boolean;
	channelIdOnMessage?: string;
}

export function useChatReaction({ isMobile = false, isClanViewMobile = undefined }: ChatReactionProps = {}) {
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);

	const userId = useMemo(() => {
		return userProfile?.user?.id as string;
	}, [userProfile?.user?.id]);

	const userName = useMemo(() => {
		return userProfile?.user?.displayName || userProfile?.user?.username;
	}, [userProfile?.user?.displayName, userProfile?.user?.username]);

	const updateChannelUsers = useCallback(async (currentChannel: ChannelsEntity | null, userIds: string[], clanId: string) => {
		const timestamp = Date.now() / 1000;

		const body = {
			channelId: currentChannel?.channelId as string,
			channelType: currentChannel?.type,
			userIds,
			clanId
		};

		await dispatch(channelUsersActions.addChannelUsers(body));
		dispatch(
			channelMetaActions.updateBulkChannelMetadata([
				{
					id: currentChannel?.channelId ?? '',
					lastSeenTimestamp: timestamp,
					lastSentTimestamp: timestamp,
					clanId: currentChannel?.clanId ?? '',
					isMute: false,
					senderId: currentChannel?.lastSentMessage?.senderId ?? ''
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
			await updateChannelUsers(channel, [userId], channel?.clanId as string);
		}
	}, []);

	const emojiRecentId = useCallback(async (emojiId: string) => {
		const store = getStore();
		const allEmojiRecent = selectAllEmojiRecent(store.getState());
		const lastEmojiRecent = selectLastEmojiRecent(store.getState() as unknown as RootState);
		if (lastEmojiRecent.emojiId === emojiId) {
			return '';
		}
		const foundEmoji = allEmojiRecent.find((emoji) => emoji.id === emojiId) as ApiClanEmoji & { emojiRecentsId?: string };
		if (foundEmoji) {
			return foundEmoji?.emojiRecentsId || '';
		}
		return '0';
	}, []);

	const reactionMessageDispatch = useCallback(
		async ({
			id,
			messageId,
			emojiId,
			emoji,
			count,
			messageSenderId,
			action_delete,
			isPublic,
			clanId,
			channelId,
			isFocusTopicBox,
			channelIdOnMessage
		}: ReactionMessageDispatchParams) => {
			const mode = getActiveMode(channelId);
			const checkIsClanView = clanId && clanId !== '0';
			const isClanView = isClanViewMobile !== undefined ? isClanViewMobile : checkIsClanView;

			isClanView && addMemberToThread(userId || '');
			const payload = transformPayloadWriteSocket({
				clanId,
				isPublicChannel: isPublic,
				isClanView: isClanView as boolean
			});
			const emojiRecentId = await emojiRecentId(emojiId);

			const payloadDispatchReaction: WriteMessageReactionArgs = {
				id,
				clanId,
				channelId,
				mode,
				messageId,
				emojiId,
				emoji,
				count,
				messageSenderId: messageSenderId,
				actionDelete: action_delete,
				isPublic: payload.isPublic,
				userId: userId as string,
				topicId: isFocusTopicBox ? channelIdOnMessage : '',
				emojiRecentId,
				senderName: userName
			};
			return dispatch(reactionActions.writeMessageReaction(payloadDispatchReaction)).unwrap();
		},
		[userId, userName, emojiRecentId, addMemberToThread]
	);

	return useMemo(
		() => ({
			reactionMessageDispatch
		}),
		[reactionMessageDispatch]
	);
}
