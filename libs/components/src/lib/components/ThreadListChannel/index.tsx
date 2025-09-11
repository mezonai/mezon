import { useMenu } from '@mezon/core';
import {
	appActions,
	referencesActions,
	selectAllThreadUnreadBehind,
	selectCategoryExpandStateByCategoryId,
	selectChannelMetaById,
	selectChannelMetaEntities,
	selectCloseMenu,
	selectCurrentChannelId,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { IChannel } from '@mezon/utils';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import ThreadLink from './ThreadLink';

type ThreadListChannelProps = {
	threads: IChannel[];
	isCollapsed: boolean;
};

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
	const isCategoryExpanded = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, thread.category_id as string));
	const allThreadBehind = useAppSelector((state) => selectAllThreadUnreadBehind(state, thread?.clan_id, thread?.parent_id, thread?.id));
	const channelMetadata = useSelector(selectChannelMetaEntities);

	const closeMenu = useAppSelector(selectCloseMenu);
	const dispatch = useAppDispatch();
	const { setStatusMenu } = useMenu();

	const handleClickLink = (thread: IChannel) => {
		dispatch(referencesActions.setOpenEditMessageState(false));
		if (currentChannelId === thread.parent_id) {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: thread.parent_id as string, isShowCreateThread: false }));
		}
		if (closeMenu) {
			setStatusMenu(false);
		}
		dispatch(threadsActions.setOpenThreadMessageState(false));
		dispatch(threadsActions.setValueThread(null));
		dispatch(appActions.setIsShowCanvas(false));
	};

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

	return <ThreadLink isActive={isActive} thread={thread} hasLine={hasUnreadThreadBehind} handleClick={handleClickLink} />;
};
