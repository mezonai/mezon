import { useEscapeKey } from '@mezon/core';
import { appActions, selectCurrentChannelLabel, selectIsShowCreateTopic, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import ChannelMain from '../channel';
import TopicDiscussionMain from '../topicDiscussion';

type ChatStreamProps = {
	topicChannelId?: string;
};

const ChatHeader = () => {
	const dispatch = useAppDispatch();
	const currentChannelLabel = useSelector(selectCurrentChannelLabel);

	const handleCloseModal = () => {
		dispatch(appActions.setIsShowChatStream(false));
		dispatch(appActions.setIsShowChatVoice(false));
	};

	return (
		<div className="flex flex-row items-center justify-between px-4 h-[58px] min-h-[50px] bg-theme-primary">
			<div className="flex flex-row items-center gap-2">
				<Icons.Chat defaultSize="w-5 h-5 text-theme-primary" />
				<span className="text-base font-semibold text-theme-primary">
					{currentChannelLabel && currentChannelLabel.length > 30 ? `${currentChannelLabel.substring(0, 30)}...` : currentChannelLabel}
				</span>
			</div>
			<button onClick={handleCloseModal} className="text-theme-primary text-theme-primary-hover transition-colors">
				<Icons.Close defaultSize="w-5 h-5" />
			</button>
		</div>
	);
};

const ChatStream = ({ topicChannelId }: ChatStreamProps) => {
	const dispatch = useAppDispatch();
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	useEscapeKey(() => dispatch(appActions.setIsShowChatStream(false)));

	return (
		<div className="flex flex-col h-full max-h-full overflow-hidden">
			{isShowCreateTopic ? (
				<TopicDiscussionMain />
			) : (
				<>
					<ChatHeader />
					<div className="flex-1 overflow-hidden min-h-0">
						<ChannelMain topicChannelId={topicChannelId} />
					</div>
				</>
			)}
		</div>
	);
};

export default memo(ChatStream);
