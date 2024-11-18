/* eslint-disable react-hooks/exhaustive-deps */
import { Canvas, FileUploadByDnD, MemberList, SearchMessageChannelRender, TooManyUpload } from '@mezon/components';
import {
	useAppNavigation,
	useAuth,
	useDragAndDrop,
	usePermissionChecker,
	useSearchMessages,
	useSeenMessagePool,
	useWindowFocusState
} from '@mezon/core';
import {
	ChannelsEntity,
	channelMetaActions,
	channelsActions,
	clansActions,
	gifsStickerEmojiActions,
	listChannelsByUserActions,
	selectAnyUnreadChannels,
	selectAppChannelById,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClanId,
	selectFetchChannelStatus,
	selectIsSearchMessage,
	selectIsShowCanvas,
	selectIsShowCreateThread,
	selectIsShowMemberList,
	selectIsUnreadChannelById,
	selectLastMessageByChannelId,
	selectListMission,
	selectMissionDone,
	selectOnboardingMode,
	selectStatusMenu,
	selectTheme,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons, Loading } from '@mezon/ui';
import { EOverriddenPermission, SubPanelName, TIME_OFFSET, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChannelMedia } from './ChannelMedia';
import { ChannelMessageBox } from './ChannelMessageBox';
import { ChannelTyping } from './ChannelTyping';

function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId)) || {};
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const statusFetchChannel = useSelector(selectFetchChannelStatus);
	const resetBadgeCount = !useSelector(selectAnyUnreadChannels);
	const { isFocusDesktop, isTabVisible } = useWindowFocusState();

	useEffect(() => {
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [channelId, currentChannel, dispatch, isFocusDesktop, isTabVisible]);
	const { userId } = useAuth();
	const { markAsReadSeen } = useSeenMessagePool();
	const isUnreadChannel = useSelector((state) => selectIsUnreadChannelById(state, channelId));
	useEffect(() => {
		if (!lastMessage) {
			return;
		}
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_THREAD;
		if (isUnreadChannel || lastMessage?.sender_id === userId) {
			markAsReadSeen(lastMessage, mode);
		}
	}, [lastMessage, channelId]);
	useEffect(() => {
		if (currentChannel.type === ChannelType.CHANNEL_TYPE_THREAD) {
			const channelWithActive = { ...currentChannel, active: 1 };
			dispatch(channelsActions.upsertOne(channelWithActive as ChannelsEntity));
		}
		if (!statusFetchChannel) return;
		const numberNotification = currentChannel?.count_mess_unread ? currentChannel?.count_mess_unread : 0;
		if (numberNotification && numberNotification > 0) {
			dispatch(channelsActions.updateChannelBadgeCount({ channelId: channelId, count: 0, isReset: true }));
			dispatch(clansActions.updateClanBadgeCount({ clanId: currentChannel?.clan_id ?? '', count: numberNotification * -1 }));
			dispatch(listChannelsByUserActions.resetBadgeCount({ channelId: channelId }));
		}
		const timestamp = Date.now() / 1000;
		dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId, timestamp: timestamp + TIME_OFFSET }));
		if (!numberNotification && resetBadgeCount) {
			dispatch(clansActions.updateClanBadgeCount({ clanId: currentChannel?.clan_id ?? '', count: 0, isReset: true }));
		}
	}, [currentChannel?.id, statusFetchChannel, isFocusDesktop, isTabVisible]);
}

function ChannelSeenListener({ channelId }: { channelId: string }) {
	useChannelSeen(channelId);
	return null;
}

const ChannelMainContentText = ({ channelId }: ChannelMainContentProps) => {
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};

	const isShowMemberList = useSelector(selectIsShowMemberList);
	const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], channelId);
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_THREAD;

	const [canSendMessageDelayed, setCanSendMessageDelayed] = useState(true);
	const onboardingMode = useSelector(selectOnboardingMode);

	const timerRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}

		timerRef.current = setTimeout(() => {
			setCanSendMessageDelayed(canSendMessage);
		}, 500);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [canSendMessage]);

	if (!canSendMessageDelayed) {
		return (
			<div
				style={{ height: 44 }}
				className="opacity-80 dark:bg-[#34363C] bg-[#F5F6F7] ml-4 mb-4 py-2 pl-2 w-widthInputViewChannelPermission dark:text-[#4E504F] text-[#D5C8C6] rounded one-line"
			>
				You do not have permission to send messages in this channel.
			</div>
		);
	}

	return (
		<div className={`flex-shrink flex flex-col dark:bg-bgPrimary bg-bgLightPrimary h-auto relative ${isShowMemberList ? 'w-full' : 'w-full'}`}>
			{onboardingMode && <OnboardingGuide />}
			{currentChannel ? (
				<ChannelMessageBox clanId={currentChannel?.clan_id} channel={currentChannel} mode={mode} />
			) : (
				<ChannelMessageBox.Skeleton />
			)}
			{currentChannel && (
				<ChannelTyping channelId={currentChannel?.id} mode={mode} isPublic={currentChannel ? !currentChannel?.channel_private : false} />
			)}
		</div>
	);
};

type ChannelMainContentProps = {
	channelId: string;
};

const ChannelMainContent = ({ channelId }: ChannelMainContentProps) => {
	const dispatch = useAppDispatch();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId)) || {};
	const { draggingState, setDraggingState, isOverUploading, setOverUploadingState } = useDragAndDrop();
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const isSearchMessage = useAppSelector((state) => selectIsSearchMessage(state, channelId));
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const isShowCanvas = useSelector(selectIsShowCanvas);
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannel?.id));
	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: currentChannel?.id, isShowCreateThread }));
		},
		[currentChannel?.id, dispatch]
	);
	const appChannel = useSelector(selectAppChannelById(channelId));
	const appearanceTheme = useSelector(selectTheme);

	const handleDragEnter = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (isShowCanvas) return;
		if (e.dataTransfer?.types.includes('Files')) {
			setDraggingState(true);
		}
	};

	useEffect(() => {
		if (isShowMemberList) {
			setIsShowCreateThread(false);
		}
	}, [isShowMemberList, setIsShowCreateThread]);

	useEffect(() => {
		if (appChannel?.url) {
			const handleMessage = (event: MessageEvent) => {
				if (event.origin === appChannel?.url) {
					// implement logic here
				}
			};
			window.addEventListener('message', handleMessage);
			return () => window.removeEventListener('message', handleMessage);
		}
	}, [appChannel?.url]);

	return currentChannel?.type === ChannelType.CHANNEL_TYPE_APP ? (
		appChannel?.url ? (
			<iframe title={appChannel?.url} src={appChannel?.url} className={'w-full h-full'}></iframe>
		) : (
			<div className={'w-full h-full flex items-center justify-center'}>
				<Loading />
			</div>
		)
	) : (
		<>
			{!isShowCanvas && draggingState && <FileUploadByDnD currentId={currentChannel?.channel_id ?? ''} />}
			{isOverUploading && <TooManyUpload togglePopup={() => setOverUploadingState(false)} />}
			<div
				className="flex flex-col flex-1 shrink min-w-0 bg-transparent h-[100%] overflow-hidden z-10"
				id="mainChat"
				onDragEnter={handleDragEnter}
			>
				<div
					className={`flex flex-row ${closeMenu ? `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBarMobile' : 'h-heightWithoutTopBarMobile'}` : `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'}`}`}
				>
					{!isShowCanvas && (
						<div
							className={`flex flex-col flex-1 min-w-60 ${isShowMemberList ? 'w-widthMessageViewChat' : isShowCreateThread ? 'w-widthMessageViewChatThread' : isSearchMessage ? 'w-widthSearchMessage' : 'w-widthThumnailAttachment'} h-full ${closeMenu && !statusMenu && isShowMemberList && currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING && 'hidden'} z-10`}
						>
							<div
								className={`relative dark:bg-bgPrimary max-w-widthMessageViewChat bg-bgLightPrimary ${closeMenu ? `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarMessageViewChatMobile' : 'h-heightMessageViewChatMobile'}` : `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarMessageViewChat' : 'h-heightMessageViewChat'}`}`}
								ref={messagesContainerRef}
							>
								<ChannelMedia currentChannel={currentChannel} key={currentChannel?.channel_id} />
							</div>
							<ChannelMainContentText channelId={currentChannel?.channel_id as string} />
						</div>
					)}
					{isShowCanvas && currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING && (
						<div
							className={`flex flex-1 justify-center overflow-y-scroll overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}
						>
							<Canvas />
						</div>
					)}
					{isShowMemberList && currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING && (
						<div
							onContextMenu={(event) => event.preventDefault()}
							className={` dark:bg-bgSecondary bg-bgLightSecondary text-[#84ADFF] relative overflow-y-scroll hide-scrollbar ${currentChannel?.type === ChannelType.CHANNEL_TYPE_VOICE ? 'hidden' : 'flex'} ${closeMenu && !statusMenu && isShowMemberList ? 'w-full' : 'w-widthMemberList'}`}
							id="memberList"
						>
							<div className="w-1 h-full dark:bg-bgPrimary bg-bgLightPrimary"></div>
							<MemberList />
						</div>
					)}

					{isSearchMessage && currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING && <SearchMessageChannel />}
				</div>
			</div>
		</>
	);
};

export default function ChannelMain() {
	const currentChannel = useSelector(selectCurrentChannel);

	if (!currentChannel) {
		return null;
	}

	return (
		<>
			<ChannelMainContent channelId={currentChannel?.id} />
			<ChannelSeenListener channelId={currentChannel?.id || ''} />
		</>
	);
}

const SearchMessageChannel = () => {
	const { totalResult, currentPage, searchMessages } = useSearchMessages();
	const currentChannel = useSelector(selectCurrentChannel);

	return (
		<SearchMessageChannelRender
			searchMessages={searchMessages}
			currentPage={currentPage}
			totalResult={totalResult}
			channelId={currentChannel?.id || ''}
		/>
	);
};

const OnboardingGuide = () => {
	const missionDone = useSelector(selectMissionDone);
	const listMission = useSelector(selectListMission);
	const currentClanId = useSelector(selectCurrentClanId);
	const { navigate, toGuidePage } = useAppNavigation();
	const handleDoNextMission = () => {
		const link = toGuidePage(currentClanId as string);
		navigate(link);
	};
	return (
		<>
			{missionDone < listMission.length ? (
				<div
					className="relative rounded-t-md w-[calc(100%_-_32px)] h-14 left-4 bg-bgTertiary top-2 flex pt-2 px-4 pb-4 items-center gap-3"
					onClick={handleDoNextMission}
				>
					<Icons.Hashtag />
					<div className=" flex flex-col">
						<div className="text-base font-semibold">{listMission[missionDone].title} </div>
						<div className="text-[10px] font-normal text-channelTextLabel"> {listMission[missionDone].description} </div>
					</div>
				</div>
			) : null}
		</>
	);
};
