import { TopicHeader } from '@mezon/components';
import { useEscapeKey, useGifsStickersEmoji } from '@mezon/core';
import { selectCurrentChannel, selectCurrentChannelId, threadsActions, topicsActions, useAppDispatch } from '@mezon/store';
import { SubPanelName } from '@mezon/utils';
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
			dispatch(topicsActions.setIsShowCreateTopic(isShowCreateTopic));
		},
		[currentChannelId, dispatch]
	);

	useEscapeKey(() => {
		setIsShowCreateTopic(false);
		dispatch(topicsActions.setCurrentTopicId(''));
	});

	const { setSubPanelActive } = useGifsStickersEmoji();

	const onMouseDownTopicBox = () => {
		setSubPanelActive(SubPanelName.NONE);
		dispatch(topicsActions.setFocusTopicBox(true));
		dispatch(threadsActions.setFocusThreadBox(false));
	};

	return (
		<div className="flex flex-col h-full " onMouseDown={onMouseDownTopicBox}>
			<TopicHeader topicCurrentChannel={currentChannel} />
			<div className="flex flex-col h-full border-l dark:border-borderDivider border-bgLightTertiary">
				<TopicDiscussionBox />
			</div>
		</div>
	);
};

export default TopicDiscussionMain;
