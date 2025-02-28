import { useApp, useGifsStickersEmoji } from '@mezon/core';
import {
	ChannelsEntity,
	ClansEntity,
	appActions,
	selectAllAccount,
	selectCurrentChannel,
	selectCurrentClan,
	selectIsShowChatStream,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectVoiceFullScreen,
	threadsActions,
	topicsActions,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { SubPanelName } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelType } from 'mezon-js';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import ChatStream from '../pages/chatStream';
import Setting from '../pages/setting';
import ThreadsMain from '../pages/thread';
import TopicDiscussionMain from '../pages/topicDiscussion';

const ClanEffects: React.FC<{
	chatStreamRef: React.RefObject<HTMLDivElement>;
	currentChannel: ChannelsEntity | null;
	currentClan: ClansEntity | null;
	isShowChatStream: boolean;
	isShowCreateThread: boolean;
	isShowCreateTopic: boolean;
	userId?: string;
	username?: string;
}> = ({ currentClan, currentChannel, chatStreamRef, isShowChatStream, isShowCreateThread, isShowCreateTopic, userId, username }) => {
	// move code thanh.levan

	const dispatch = useAppDispatch();
	const { setIsShowMemberList } = useApp();

	useEffect(() => {
		const updateChatStreamWidth = () => {
			if (chatStreamRef.current && isShowChatStream) {
				dispatch(appActions.setChatStreamWidth(chatStreamRef.current.offsetWidth));
			}
		};

		updateChatStreamWidth();
		window.addEventListener('resize', updateChatStreamWidth);

		return () => {
			window.removeEventListener('resize', updateChatStreamWidth);
		};
	}, [isShowChatStream]);

	useEffect(() => {
		if (isShowCreateThread || isShowCreateTopic) {
			setIsShowMemberList(false);
		}
	}, [isShowCreateThread, isShowCreateTopic]);

	const checkTypeChannel = currentChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE;
	useEffect(() => {
		if (checkTypeChannel) {
			dispatch(voiceActions.setStatusCall(checkTypeChannel));
		}
	}, [currentChannel?.type]);

	return null;
};

const ClanLayout = () => {
	const currentClan = useSelector(selectCurrentClan);
	const userProfile = useSelector(selectAllAccount);
	const isShowChatStream = useSelector(selectIsShowChatStream);
	const location = useLocation();
	const currentURL = isElectron() ? location.hash : location.pathname;
	const memberPath = `/chat/clans/${currentClan?.clan_id}/member-safety`;
	const currentChannel = useSelector(selectCurrentChannel);
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannel?.id as string));
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const chatStreamRef = useRef<HTMLDivElement | null>(null);
	const dispatch = useDispatch();
	const { setSubPanelActive } = useGifsStickersEmoji();
	const onMouseDownTopicBox = () => {
		setSubPanelActive(SubPanelName.NONE);
		dispatch(topicsActions.setFocusTopicBox(true));
		dispatch(threadsActions.setFocusThreadBox(false));
	};
	const onMouseDownThreadBox = () => {
		setSubPanelActive(SubPanelName.NONE);
		dispatch(topicsActions.setFocusTopicBox(false));
		dispatch(threadsActions.setFocusThreadBox(true));
	};
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);

	return (
		<>
			<div
				className={`flex flex-1 shrink min-w-0 gap-2 ${isVoiceFullScreen ? 'z-20' : ''} ${currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL ? 'dark:bg-bgTertiary bg-bgLightTertiary' : ''}`}
			>
				<div
					className={`flex flex-col flex-1 shrink ${isShowChatStream && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL ? 'max-sm:hidden' : ''} min-w-0 bg-transparent h-[100%] overflow-visible ${currentChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ? 'group' : ''}`}
				>
					{/* <ChannelTopbar channel={currentChannel} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} /> */}
					{(currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING || memberPath === currentURL) && <Outlet />}
				</div>

				{isShowChatStream && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL && (
					<div ref={chatStreamRef} className="flex flex-col flex-1 max-w-[480px] min-w-60 dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">
						<ChatStream currentChannel={currentChannel} />
					</div>
				)}
			</div>
			{isShowCreateThread && !isShowCreateTopic && (
				<div onMouseDown={onMouseDownThreadBox} className="w-[510px] dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">
					<ThreadsMain />
				</div>
			)}

			{isShowCreateTopic && !isShowCreateThread && (
				<div onMouseDown={onMouseDownTopicBox} className="w-[510px] dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">
					<TopicDiscussionMain />
				</div>
			)}
			<Setting isDM={false} />

			<ClanEffects
				currentChannel={currentChannel}
				currentClan={currentClan}
				chatStreamRef={chatStreamRef}
				isShowChatStream={isShowChatStream}
				isShowCreateThread={isShowCreateThread}
				isShowCreateTopic={isShowCreateTopic}
				userId={userProfile?.user?.id || ''}
				username={userProfile?.user?.username || ''}
			/>
		</>
	);
};

export default ClanLayout;
