import { selectCurrentChannel, selectCurrentClan, selectIsShowChatStream, selectIsShowCreateThread, selectIsShowCreateTopic } from '@mezon/store';
import isElectron from 'is-electron';
import { ChannelType } from 'mezon-js';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import ChatStream from '../pages/chatStream';
import ThreadsMain from '../pages/thread';
import TopicDiscussionMain from '../pages/topicDiscussion';

const SideLayout = () => {
	const currentChannel = useSelector(selectCurrentChannel);
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannel?.id as string));
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const chatStreamRef = useRef<HTMLDivElement | null>(null);
	const currentURL = isElectron() ? location.hash : location.pathname;
	const isShowChatStream = useSelector(selectIsShowChatStream);
	const currentClan = useSelector(selectCurrentClan);
	const memberPath = `/chat/clans/${currentClan?.clan_id}/member-safety`;

	return (
		<div className="max-w-[510px] dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">
			{isShowCreateThread && !isShowCreateTopic && <ThreadsMain />}

			{isShowCreateTopic && !isShowCreateThread && <TopicDiscussionMain />}

			{isShowChatStream && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL && (
				<div ref={chatStreamRef} className="flex flex-col flex-1">
					<ChatStream currentChannel={currentChannel} />
				</div>
			)}
		</div>
	);
};

export default SideLayout;
