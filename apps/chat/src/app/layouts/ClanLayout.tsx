import { ChannelList, ClanHeader } from '@mezon/components';
import { useApp, useGifsStickersEmoji } from '@mezon/core';
import {
	appActions,
	onboardingActions,
	selectAllAccount,
	selectCloseMenu,
	selectCurrentChannelId,
	selectCurrentChannelType,
	selectCurrentClanBanner,
	selectCurrentClanId,
	selectCurrentClanIsOnboarding,
	selectCurrentClanName,
	selectIsShowChatStream,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectStatusMenu,
	selectVoiceFullScreen,
	threadsActions,
	topicsActions,
	useAppDispatch
} from '@mezon/store';
import { SubPanelName, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelType } from 'mezon-js';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import ChatStream from '../pages/chatStream';
import Setting from '../pages/setting';
import ThreadsMain from '../pages/thread';
import TopicDiscussionMain from '../pages/topicDiscussion';

const ClanEffects: React.FC<{
	chatStreamRef: React.RefObject<HTMLDivElement>;
	isShowChatStream: boolean;
	isShowCreateThread: boolean;
	isShowCreateTopic: boolean;
	userId?: string;
	username?: string;
}> = ({ chatStreamRef, isShowChatStream, isShowCreateThread, isShowCreateTopic }) => {
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

	return null;
};

const ClanLayout = () => {
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanName = useSelector(selectCurrentClanName);
	const currentClanBanner = useSelector(selectCurrentClanBanner);
	const currentClanIsOnboarding = useSelector(selectCurrentClanIsOnboarding);
	const userProfile = useSelector(selectAllAccount);
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowChatStream = useSelector(selectIsShowChatStream);
	const location = useLocation();
	const currentURL = isElectron() ? location.hash : location.pathname;
	const memberPath = `/chat/clans/${currentClanId}/member-safety`;
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannelId as string));
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const chatStreamRef = useRef<HTMLDivElement | null>(null);
	const dispatch = useAppDispatch();
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

	useEffect(() => {
		if (!currentClanId) return;
		dispatch(onboardingActions.fetchOnboarding({ clan_id: currentClanId }));
		if (currentClanIsOnboarding) {
			dispatch(onboardingActions.fetchProcessingOnboarding({ clan_id: currentClanId }));
		}
	}, [currentClanIsOnboarding, currentClanId, dispatch]);

	return (
		<>
			<div
				className={`select-none h-dvh flex-col flex max-w-[272px] bg-theme-direct-message border-left-theme-primary relative overflow-hidden min-w-widthMenuMobile sbm:min-w-[272px]  ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : ''} ${closeMenu ? (statusMenu ? 'flex' : 'hidden') : ''}`}
			>
				<ClanHeader name={currentClanName} type="CHANNEL" bannerImage={currentClanBanner} />
				<ChannelList />
			</div>
			<div
				className={`flex flex-1 shrink min-w-0 gap-2 bg-theme-chat h-heightWithoutTopBar mt-[50px] ${isVoiceFullScreen ? 'z-20' : ''} ${currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL ? 'bg-theme-secondary' : ''}`}
			>
				<div
					className={`flex flex-col flex-1 shrink ${isShowChatStream && currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL ? 'max-sm:hidden' : ''} min-w-0 bg-transparent h-heightWithoutTopBar overflow-visible }`}
				>
					{(currentChannelType !== ChannelType.CHANNEL_TYPE_STREAMING || memberPath === currentURL) && <Outlet />}
				</div>

				{isShowChatStream && currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL && (
					<div ref={chatStreamRef} className="flex flex-col flex-1 max-w-[480px] min-w-60 rounded-l-lg">
						<ChatStream />
					</div>
				)}
			</div>
			{isShowCreateThread && !isShowCreateTopic && (
				<div onMouseDown={onMouseDownThreadBox} className="w-[510px] rounded-l-lg">
					<ThreadsMain />
				</div>
			)}

			{isShowCreateTopic && !isShowCreateThread && (
				<div onMouseDown={onMouseDownTopicBox} className="w-[510px] rounded-l-lg">
					<TopicDiscussionMain />
				</div>
			)}

			{/* update later */}
			<Setting isDM={false} />

			<ClanEffects
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
