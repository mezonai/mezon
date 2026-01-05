import {
	selectAllThreadUnreadBehind,
	selectCategoryExpandStateByCategoryId,
	selectChannelMetaById,
	selectChannelMetaEntities,
	selectCurrentChannelId,
	useAppSelector
} from '@mezon/store';
import type { IChannel } from '@mezon/utils';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import ThreadLink from './ThreadLink';

export type ListThreadChannelRef = {
	scrollIntoThread: (threadId: string, options?: ScrollIntoViewOptions) => void;
};

type ThreadLinkWrapperProps = {
	thread: IChannel;
	notLastThread: boolean;
	isActive: boolean;
};

export const ThreadLinkWrapper: React.FC<ThreadLinkWrapperProps> = ({ thread, notLastThread, isActive }) => {
	const currentChannelId = useAppSelector(selectCurrentChannelId);
	const threadMeta = useAppSelector((state) => selectChannelMetaById(state, thread?.id));
	const isCategoryExpanded = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, thread.categoryId as string));
	const allThreadBehind = useAppSelector((state) => selectAllThreadUnreadBehind(state, thread?.clanId, thread?.parent_id, thread?.id));
	const channelMetadata = useSelector(selectChannelMetaEntities);

	const isShowThread = (thread: IChannel) => {
		return (
			(threadMeta?.isMute !== true && threadMeta?.lastSeenTimestamp < threadMeta?.lastSentTimestamp) ||
			(thread?.count_mess_unread ?? 0) > 0 ||
			thread.id === currentChannelId
		);
	};

	const hasUnreadThreadBehind = useMemo(() => {
		if (isCategoryExpanded) {
			return notLastThread;
		}

		return !!allThreadBehind?.some((channel) => {
			const threadMetaEntities = channelMetadata[channel.id];
			return (
				channel.id === currentChannelId ||
				(threadMetaEntities?.isMute !== true && threadMetaEntities?.lastSeenTimestamp < threadMetaEntities?.lastSentTimestamp) ||
				((channel as IChannel)?.count_mess_unread ?? 0) > 0
			);
		});
	}, [allThreadBehind, channelMetadata, isCategoryExpanded, currentChannelId]);

	const shouldShow = (thread?.active === 1 && isCategoryExpanded) || isShowThread(thread);
	if (!shouldShow) {
		return null;
	}

	return <ThreadLink isActive={isActive} thread={thread} hasLine={hasUnreadThreadBehind} currentChannelId={currentChannelId as string} />;
};
