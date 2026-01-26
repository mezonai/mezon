import { useDirect } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import {
	EStateFriend,
	messagesActions,
	selectAllAccount,
	selectAllChannelsByUser,
	selectAllDirectMessages,
	selectAllFriends,
	selectBlockedUsers,
	toastActions,
	useAppDispatch
} from '@mezon/store';
import { SHARE_CONTACT_KEY, TypeMessage } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

type ShareItemType = 'friend' | 'dm' | 'group' | 'channel' | 'thread';

export type ShareItem = {
	id: string;
	name: string;
	avatarUser: string;
	displayName: string;
	type: ShareItemType;
	channelId?: string;
	clanId?: string;
	clanName?: string;
	isPublic?: boolean;
};

type UseShareContactProps = {
	contactUser: ChannelMembersEntity;
	t: (key: string) => string;
};

const createShareContent = (userId: string, username: string, displayName: string, avatar: string) => ({
	t: '',
	embed: [
		{
			fields: [
				{ name: 'key', value: SHARE_CONTACT_KEY, inline: true },
				{ name: 'user_id', value: userId, inline: true },
				{ name: 'username', value: username, inline: true },
				{ name: 'display_name', value: displayName, inline: true },
				{ name: 'avatar', value: avatar, inline: true }
			]
		}
	]
});

const getStreamModeFromType = (type: ShareItemType): number => {
	const modeMap: Record<ShareItemType, number> = {
		friend: ChannelStreamMode.STREAM_MODE_DM,
		dm: ChannelStreamMode.STREAM_MODE_DM,
		group: ChannelStreamMode.STREAM_MODE_GROUP,
		channel: ChannelStreamMode.STREAM_MODE_CHANNEL,
		thread: ChannelStreamMode.STREAM_MODE_THREAD
	};
	return modeMap[type];
};

export const useShareContact = ({ contactUser, t }: UseShareContactProps) => {
	const dispatch = useAppDispatch();
	const currentUser = useSelector(selectAllAccount);
	const { createDirectMessageWithUser } = useDirect();

	const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
	const [isSending, setIsSending] = useState(false);

	const allFriends = useSelector(selectAllFriends);
	const blockedUsers = useSelector(selectBlockedUsers);
	const allDirectMessages = useSelector(selectAllDirectMessages);
	const allChannels = useSelector(selectAllChannelsByUser);

	const blockedUserIds = useMemo(() => new Set(blockedUsers.map((b) => b?.user?.id)), [blockedUsers]);

	const shareItemsList: ShareItem[] = useMemo(() => {
		const contactUserId = contactUser?.user?.id;
		const currentUserId = currentUser?.user?.id;

		const friendItems = allFriends
			.filter((f) => f.state === EStateFriend.FRIEND && f?.user?.id !== contactUserId && !blockedUserIds.has(f?.user?.id))
			.map((f) => ({
				id: f?.user?.id ?? '',
				name: f?.user?.username ?? '',
				avatarUser: f?.user?.avatar_url ?? '',
				displayName: f?.user?.display_name ?? f?.user?.username ?? '',
				type: 'friend' as const
			}));

		const dmGroupItems = allDirectMessages
			.filter((dm) => {
				if (dm.active !== 1) return false;
				if (dm.type === ChannelType.CHANNEL_TYPE_DM) {
					return !dm.user_ids?.includes(contactUserId as string) && dm.user_ids?.includes(currentUserId as string);
				}
				return true;
			})
			.map((dm) => ({
				id: dm.id,
				name: dm.channel_label || dm.usernames?.join(', ') || '',
				avatarUser: dm.channel_avatar || dm.avatars?.[0] || '',
				displayName: dm.channel_label || dm.display_names?.join(', ') || '',
				type: (dm.type === ChannelType.CHANNEL_TYPE_GROUP ? 'group' : 'dm') as ShareItemType,
				channelId: dm.id
			}));

		const channelItems = allChannels
			.filter((ch) => ch.type === ChannelType.CHANNEL_TYPE_CHANNEL || ch.type === ChannelType.CHANNEL_TYPE_THREAD)
			.map((ch) => ({
				id: ch.id,
				name: ch.channel_label || '',
				avatarUser: '',
				displayName: ch.channel_label || '',
				type: (ch.type === ChannelType.CHANNEL_TYPE_THREAD ? 'thread' : 'channel') as ShareItemType,
				channelId: ch.channel_id || ch.id,
				clanId: ch.clan_id || '',
				clanName: ch.clan_name || '',
				isPublic: !ch.channel_private
			}));

		return [...friendItems, ...dmGroupItems, ...channelItems];
	}, [allFriends, allDirectMessages, allChannels, contactUser, currentUser, blockedUserIds]);

	const handleToggleItem = (itemId: string) => {
		setSelectedItemIds((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
	};

	const getChannelForItem = async (item: ShareItem) => {
		if (item.type === 'friend') {
			const friend = allFriends.find((f) => f?.user?.id === item.id);
			if (!friend?.user?.id) return null;

			const response = await createDirectMessageWithUser(
				friend.user.id,
				friend.user.display_name || friend.user.username,
				friend.user.username,
				friend.user.avatar_url
			);
			return response?.channel_id;
		}
		return item.channelId;
	};

	const shareToSingleItem = async (item: ShareItem, shareContent: any) => {
		const channelId = await getChannelForItem(item);
		if (!channelId) throw new Error('Channel ID not found');

		await dispatch(
			messagesActions.sendMessage({
				clanId: item.clanId || '0',
				channelId,
				content: shareContent,
				mentions: [],
				attachments: [],
				references: [],
				anonymous: false,
				mentionEveryone: false,
				mode: getStreamModeFromType(item.type),
				senderId: currentUser?.user?.id ?? '',
				isPublic: item.isPublic ?? false,
				avatar: currentUser?.user?.avatar_url ?? '',
				username: currentUser?.user?.username ?? '',
				code: TypeMessage.ShareContact
			})
		).unwrap();
	};

	const showToast = (successCount: number, totalCount: number) => {
		const failedCount = totalCount - successCount;

		if (successCount === 0) {
			dispatch(toastActions.addToast({ message: t('contactSharedError'), type: 'error' }));
			return false;
		}

		if (failedCount === 0) {
			dispatch(toastActions.addToast({ message: t('contactSharedSuccess'), type: 'success' }));
		} else {
			dispatch(toastActions.addToast({ message: `Shared to ${successCount} of ${totalCount} recipients`, type: 'warning' }));
		}
		return true;
	};

	const handleShareContact = async () => {
		if (!contactUser || !selectedItemIds.length || !currentUser?.user?.id) return;

		const userId = (contactUser?.user?.id || contactUser?.id)?.toString() || '';
		const username = contactUser?.user?.username || '';

		if (!userId || !username) {
			dispatch(toastActions.addToast({ message: t('contactSharedError'), type: 'error' }));
			return false;
		}

		const displayName = contactUser?.clan_nick || contactUser?.user?.display_name || contactUser?.user?.username || '';
		const avatar = contactUser?.clan_avatar || contactUser?.user?.avatar_url || '';
		const shareContent = createShareContent(userId, username, displayName, avatar);

		setIsSending(true);

		try {
			const results = await Promise.allSettled(
				selectedItemIds.map(async (itemId) => {
					const item = shareItemsList.find((i) => i.id === itemId);
					if (!item) throw new Error('Item not found');
					return shareToSingleItem(item, shareContent);
				})
			);

			const successCount = results.filter((r) => r.status === 'fulfilled').length;
			return showToast(successCount, selectedItemIds.length);
		} catch (error) {
			console.error('Share contact error:', error);
			dispatch(toastActions.addToast({ message: t('contactSharedError'), type: 'error' }));
			return false;
		} finally {
			setIsSending(false);
		}
	};

	return {
		selectedItemIds,
		isSending,
		shareItemsList,
		handleToggleItem,
		handleShareContact,
		setSelectedItemIds
	};
};
