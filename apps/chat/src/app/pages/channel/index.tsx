/* eslint-disable react-hooks/exhaustive-deps */
import { AgeRestricted, Canvas, FileUploadByDnD, MemberList, SearchMessageChannelRender, TooManyUpload } from '@mezon/components';
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
	ETypeMission,
	channelMetaActions,
	channelsActions,
	clansActions,
	directMetaActions,
	gifsStickerEmojiActions,
	giveCoffeeActions,
	listChannelsByUserActions,
	onboardingActions,
	selectAllChannelMembers,
	selectAnyUnreadChannels,
	selectAppChannelById,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClan,
	selectFetchChannelStatus,
	selectIsSearchMessage,
	selectIsShowCanvas,
	selectIsShowCreateThread,
	selectIsShowMemberList,
	selectIsUnreadChannelById,
	selectLastMessageByChannelId,
	selectMissionDone,
	selectMissionSum,
	selectOnboardingByClan,
	selectOnboardingMode,
	selectPreviousChannels,
	selectProcessingByClan,
	selectStatusMenu,
	selectTheme,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons, Loading } from '@mezon/ui';
import {
	DONE_ONBOARDING_STATUS,
	EOverriddenPermission,
	SubPanelName,
	TIME_OFFSET,
	isLinuxDesktop,
	isWindowsDesktop,
	titleMission
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { ApiOnboardingItem, ApiTokenSentEvent } from 'mezon-js/api.gen';
import { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
	const previousChannels = useSelector(selectPreviousChannels);
	useEffect(() => {
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [channelId, currentChannel, dispatch, isFocusDesktop, isTabVisible]);
	const { markAsReadSeen } = useSeenMessagePool();
	const isUnreadChannel = useSelector((state) => selectIsUnreadChannelById(state, channelId));
	useEffect(() => {
		if (!lastMessage) {
			return;
		}
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT || currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING
				? ChannelStreamMode.STREAM_MODE_CHANNEL
				: ChannelStreamMode.STREAM_MODE_THREAD;
		markAsReadSeen(lastMessage, mode);
	}, [lastMessage, channelId, isUnreadChannel]);
	useEffect(() => {
		if (previousChannels.at(1)) {
			const timestamp = Date.now() / 1000;
			dispatch(
				channelsActions.updateChannelBadgeCount({
					clanId: previousChannels.at(1)?.clanId as string,
					channelId: previousChannels.at(1)?.channelId as string,
					count: 0,
					isReset: true
				})
			);
			dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: previousChannels.at(1)?.channelId as string, timestamp }));
		}
	}, [previousChannels]);
	useEffect(() => {
		if (currentChannel.type === ChannelType.CHANNEL_TYPE_THREAD) {
			const channelWithActive = { ...currentChannel, active: 1 };
			dispatch(
				channelsActions.upsertOne({
					clanId: currentChannel?.clan_id || '',
					channel: channelWithActive as ChannelsEntity
				})
			);
		}
		if (!statusFetchChannel) return;
		const numberNotification = currentChannel?.count_mess_unread ? currentChannel?.count_mess_unread : 0;
		if (numberNotification && numberNotification > 0) {
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

type ChannelMainContentTextProps = {
	channelId: string;
	canSendMessage: boolean;
};

const ChannelMainContentText = ({ channelId, canSendMessage }: ChannelMainContentTextProps) => {
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};

	const isShowMemberList = useSelector(selectIsShowMemberList);
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT || currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING
			? ChannelStreamMode.STREAM_MODE_CHANNEL
			: ChannelStreamMode.STREAM_MODE_THREAD;

	const [canSendMessageDelayed, setCanSendMessageDelayed] = useState(true);
	const currentClan = useSelector(selectCurrentClan);
	const missionDone = useSelector(selectMissionDone);
	const missionSum = useSelector(selectMissionSum);
	const onboardingClan = useAppSelector((state) => selectOnboardingByClan(state, currentChannel.clan_id as string));
	const currentMission = useMemo(() => {
		return onboardingClan.mission[missionDone];
	}, [missionDone, channelId]);

	const selectUserProcessing = useSelector(selectProcessingByClan(currentClan?.clan_id as string));

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

	const previewMode = useSelector(selectOnboardingMode);
	const showPreviewMode = useMemo(() => {
		if (previewMode) {
			return true;
		}
		return selectUserProcessing?.onboarding_step !== DONE_ONBOARDING_STATUS && currentClan?.is_onboarding;
	}, [selectUserProcessing?.onboarding_step, currentClan?.is_onboarding, previewMode]);

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
			{showPreviewMode && <OnboardingGuide currentMission={currentMission} missionSum={missionSum} missionDone={missionDone} />}
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
	const [isShowAgeRestricted, setIsShowAgeRestricted] = useState(false);
	const userChannels = useAppSelector((state) => selectAllChannelMembers(state, channelId));
	const miniAppRef = useRef<HTMLIFrameElement>(null);
	const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], channelId);
	const currentUser = useAuth();

	const closeAgeRestricted = () => {
		setIsShowAgeRestricted(false);
	};
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannel?.id));
	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: currentChannel?.id, isShowCreateThread }));
			if (isShowCreateThread) {
				dispatch(topicsActions.setIsShowCreateTopic({ channelId: currentChannel?.id as string, isShowCreateTopic: false }));
			}
		},
		[currentChannel?.id, dispatch]
	);
	const appChannel = useSelector(selectAppChannelById(channelId));
	const appearanceTheme = useSelector(selectTheme);

	const miniAppDataHash = useMemo(() => {
		return `userChannels=${JSON.stringify(userChannels)}`;
	}, [userChannels]);

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
			const compareHost = (url1: string, url2: string) => {
				try {
					const parsedURL1 = new URL(url1);
					const parsedURL2 = new URL(url2);
					return parsedURL1.hostname === parsedURL2.hostname;
				} catch (error) {
					return false;
				}
			};
			const handleMessage = async (event: MessageEvent) => {
				if (appChannel?.url && compareHost(event.origin, appChannel?.url ?? '')) {
					const eventData = safeJSONParse(event.data ?? '{}');
					// eslint-disable-next-line no-console
					console.log('[MEZON] < ', eventData);

					if (eventData?.eventType === 'PING') {
						// send event to mini app
						miniAppRef.current?.contentWindow?.postMessage(
							JSON.stringify({ eventType: 'PONG', eventData: { message: 'PONG' } }),
							appChannel.url ?? ''
						);

						miniAppRef.current?.contentWindow?.postMessage(
							JSON.stringify({ eventType: 'CURRENT_USER_INFO', eventData: currentUser?.userProfile }),
							appChannel.url ?? ''
						);
					}

					if (eventData?.eventType === 'SEND_TOKEN') {
						const { amount, note, receiver_id, extra_attribute } = (eventData.eventData || {}) as any;
						const tokenEvent: ApiTokenSentEvent = {
							sender_id: currentUser.userId as string,
							sender_name: currentUser?.userProfile?.user?.username as string,
							receiver_id,
							amount,
							note,
							extra_attribute
						};
						try {
							const response = await dispatch(giveCoffeeActions.sendToken(tokenEvent)).unwrap();
							miniAppRef.current?.contentWindow?.postMessage(
								JSON.stringify({ eventType: 'SEND_TOKEN_RESPONSE', eventData: response }),
								appChannel.url ?? ''
							);
						} catch (err) {
							console.error(err);
							miniAppRef.current?.contentWindow?.postMessage(
								JSON.stringify({ eventType: 'SEND_TOKEN_RESPONSE', eventData: err }),
								appChannel.url ?? ''
							);
						}
					}
				}
			};
			window.addEventListener('message', handleMessage);
			return () => window.removeEventListener('message', handleMessage);
		}
	}, [appChannel?.url]);

	useEffect(() => {
		const savedChannelIds = safeJSONParse(localStorage.getItem('agerestrictedchannelIds') || '[]');
		if (!savedChannelIds.includes(currentChannel.channel_id) && currentChannel.age_restricted === 1) {
			setIsShowAgeRestricted(true);
		} else {
			setIsShowAgeRestricted(false);
		}
	}, [currentChannel]);

	return currentChannel?.type === ChannelType.CHANNEL_TYPE_APP ? (
		appChannel?.url ? (
			<iframe ref={miniAppRef} title={appChannel?.url} src={appChannel?.url + `#${miniAppDataHash}`} className={'w-full h-full'}></iframe>
		) : (
			<div className={'w-full h-full flex items-center justify-center'}>
				<Loading />
			</div>
		)
	) : (
		<>
			{!isShowCanvas && !isShowAgeRestricted && draggingState && <FileUploadByDnD currentId={currentChannel?.channel_id ?? ''} />}
			{isOverUploading && <TooManyUpload togglePopup={() => setOverUploadingState(false)} />}
			<div
				className="flex flex-col flex-1 shrink min-w-0 bg-transparent h-[100%] overflow-hidden z-10"
				id="mainChat"
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				onDragEnter={canSendMessage ? handleDragEnter : () => {}}
			>
				<div
					className={`flex flex-row ${closeMenu ? `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBarMobile' : 'h-heightWithoutTopBarMobile'}` : `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'}`}`}
				>
					{!isShowCanvas && !isShowAgeRestricted && (
						<div
							className={`flex flex-col flex-1 min-w-60 ${isShowMemberList ? 'w-widthMessageViewChat' : isShowCreateThread ? 'w-widthMessageViewChatThread' : isSearchMessage ? 'w-widthSearchMessage' : 'w-widthThumnailAttachment'} h-full ${closeMenu && !statusMenu && isShowMemberList && currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING && 'hidden'} z-10`}
						>
							<div
								className={`relative dark:bg-bgPrimary max-w-widthMessageViewChat bg-bgLightPrimary ${closeMenu ? `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarMessageViewChatMobile' : 'h-heightMessageViewChatMobile'}` : `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarMessageViewChat' : 'h-heightMessageViewChat'}`}`}
								ref={messagesContainerRef}
							>
								<ChannelMedia currentChannel={currentChannel} />
							</div>
							<ChannelMainContentText canSendMessage={canSendMessage} channelId={currentChannel?.channel_id as string} />
						</div>
					)}
					{isShowCanvas && !isShowAgeRestricted && currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING && (
						<div
							className={`flex flex-1 justify-center overflow-y-scroll overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}
						>
							<Canvas />
						</div>
					)}

					{!isShowCanvas && isShowAgeRestricted && currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING && (
						<div
							className={`flex flex-1 justify-center overflow-y-scroll overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}
						>
							<AgeRestricted closeAgeRestricted={closeAgeRestricted} />
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

interface IChannelMainProps {
	topicChannelId?: string;
}

export default function ChannelMain({ topicChannelId }: IChannelMainProps) {
	const currentChannel = useSelector(selectCurrentChannel);

	let chlId = currentChannel?.id || '';
	if (topicChannelId) {
		chlId = topicChannelId;
	}

	if (!currentChannel) {
		return null;
	}

	return (
		<>
			<ChannelMainContent channelId={chlId} />
			<ChannelSeenListener channelId={chlId} />
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

const OnboardingGuide = ({
	currentMission,
	missionDone,
	missionSum
}: {
	currentMission: ApiOnboardingItem;
	missionDone: number;
	missionSum: number;
}) => {
	const { navigate, toChannelPage } = useAppNavigation();
	const dispatch = useAppDispatch();

	const handleDoNextMission = useCallback(() => {
		if (currentMission) {
			switch (currentMission.task_type) {
				case ETypeMission.SEND_MESSAGE: {
					const link = toChannelPage(currentMission.channel_id as string, currentMission.clan_id as string);
					navigate(link);
					break;
				}
				case ETypeMission.VISIT: {
					const linkChannel = toChannelPage(currentMission.channel_id as string, currentMission.clan_id as string);
					navigate(linkChannel);
					dispatch(onboardingActions.doneMission({ clan_id: currentMission.clan_id as string }));
					doneAllMission();
					break;
				}
				case ETypeMission.DOSOMETHING: {
					dispatch(onboardingActions.doneMission({ clan_id: currentMission.clan_id as string }));
					doneAllMission();
					break;
				}
				default:
					break;
			}
		}
	}, [currentMission?.id, missionDone]);

	const channelMission = useSelector((state) => selectChannelById(state, currentMission?.channel_id as string));
	const doneAllMission = useCallback(() => {
		if (missionDone + 1 === missionSum) {
			dispatch(onboardingActions.doneOnboarding({ clan_id: currentMission?.clan_id as string }));
		}
	}, [missionDone]);
	return (
		<>
			{missionDone < missionSum && currentMission ? (
				<div
					className="relative rounded-t-md w-[calc(100%_-_32px)] h-14 left-4 bg-bgTertiary top-2 flex pt-2 px-4 pb-4 items-center gap-3"
					onClick={handleDoNextMission}
				>
					<Icons.Hashtag />
					<div className=" flex flex-col">
						<div className="text-base font-semibold">{currentMission.title} </div>
						<div className="text-[10px] font-normal text-channelTextLabel">
							{' '}
							{titleMission[currentMission.task_type ? currentMission.task_type - 1 : 0]}{' '}
							<strong className="text-channelActiveColor">#{channelMission.channel_label}</strong>{' '}
						</div>
					</div>
				</div>
			) : null}
		</>
	);
};
