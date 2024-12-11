import { TopicHeader } from '@mezon/components';
import { useEscapeKey } from '@mezon/core';
import { selectCurrentChannel, selectCurrentChannelId, topicsActions, useAppDispatch } from '@mezon/store';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import TopicDiscussionBox from './TopicDiscussionBox';

const TopicDiscussionMain = () => {
	const dispatch = useAppDispatch();
	// Todo topic
	const currentChannel = useSelector(selectCurrentChannel);
	const currentChannelId = useSelector(selectCurrentChannelId);

	const setIsShowCreateTopic = useCallback(
		(isShowCreateTopic: boolean) => {
			dispatch(topicsActions.setIsShowCreateTopic({ channelId: currentChannelId as string, isShowCreateTopic }));
		},
		[currentChannelId, dispatch]
	);

	useEscapeKey(() => {
		setIsShowCreateTopic(false);
		dispatch(topicsActions.setCurrentTopicId(''));
	});

	return (
		<div className="flex flex-col h-full">
			<TopicHeader topicCurrentChannel={currentChannel} />
			<TopicDiscussionBox />
		</div>
	);
};

export default TopicDiscussionMain;
