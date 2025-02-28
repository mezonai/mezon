import { useMenu } from '@mezon/core';
import {
	appActions,
	referencesActions,
	selectCategoryExpandStateByCategoryId,
	selectChannelMetaById,
	selectCloseMenu,
	selectCurrentChannelId,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { IChannel } from '@mezon/utils';
import React from 'react';
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
	isFirstThread: boolean;
	isActive: boolean;
};

export const ThreadLinkWrapper: React.FC<ThreadLinkWrapperProps> = ({ thread, isFirstThread, isActive }) => {
	const currentChannelId = useAppSelector(selectCurrentChannelId);
	const threadMeta = useAppSelector((state) => selectChannelMetaById(state, thread?.id));
	const isCategoryExpanded = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, thread.category_id as string));
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

	const shouldShow = (thread?.active === 1 && isCategoryExpanded) || isShowThread(thread);
	if (!shouldShow) {
		return null;
	}

	return <ThreadLink isActive={isActive} thread={thread} isFirstThread={isFirstThread} handleClick={handleClickLink} />;
};
