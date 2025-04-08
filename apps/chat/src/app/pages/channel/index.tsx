/* eslint-disable react-hooks/exhaustive-deps */
import { AgeRestricted, Canvas, FileUploadByDnD, MemberList, SearchMessageChannelRender } from '@mezon/components';
import { useAppNavigation, useAuth, useDragAndDrop, usePermissionChecker, useSearchMessages, useSeenMessagePool } from '@mezon/core';
import {
	ChannelsEntity,
	ETypeMission,
	RootState,
	channelAppActions,
	channelMetaActions,
	channelsActions,
	clansActions,
	directMetaActions,
	getStore,
	gifsStickerEmojiActions,
	handleParticipantVoiceState,
	listChannelRenderAction,
	listChannelsByUserActions,
	onboardingActions,
	selectAppChannelById,
	selectChannelAppChannelId,
	selectChannelAppClanId,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClan,
	selectFetchChannelStatus,
	selectIsSearchMessage,
	selectIsShowCanvas,
	selectIsShowCreateThread,
	selectIsShowMemberList,
	selectLastMessageByChannelId,
	selectListChannelRenderByClanId,
	selectMissionDone,
	selectMissionSum,
	selectOnboardingByClan,
	selectOnboardingMode,
	selectPreviousChannels,
	selectProcessingByClan,
	selectStatusMenu,
	selectTheme,
	selectTopicByChannelId,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	ApiChannelAppResponseExtend,
	DONE_ONBOARDING_STATUS,
	EOverriddenPermission,
	IChannel,
	ParticipantMeetState,
	SubPanelName,
	TIME_OFFSET,
	isBackgroundModeActive,
	isLinuxDesktop,
	isWindowsDesktop,
	titleMission,
	useBackgroundMode
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { ApiOnboardingItem } from 'mezon-js/api.gen';
import { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { ChannelMedia } from './ChannelMedia';
import { ChannelMessageBox } from './ChannelMessageBox';
import { ChannelTyping } from './ChannelTyping';

function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId)) || {};
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const isFocus = !isBackgroundModeActive();

	const previousChannels = useSelector(selectPreviousChannels);
	useEffect(() => {
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [channelId, currentChannel, dispatch, isFocus]);
	const { markAsReadSeen } = useSeenMessagePool();
	const handleReadMessage = () => {
		if (!lastMessage) {
			return;
		}
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL || currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING
				? ChannelStreamMode.STREAM_MODE_CHANNEL
				: ChannelStreamMode.STREAM_MODE_THREAD;
		const store = getStore();
		const state = store.getState() as RootState;
		const badgeCountClan = state.clans.entities[currentChannel.clan_id as string]?.badge_count || 0;
		markAsReadSeen(lastMessage, mode, badgeCountClan);
	};
	useEffect(() => {
		if (previousChannels.at(1) && lastMessage) {
			const timestamp = Date.now() / 1000;
			dispatch(
				listChannelRenderAction.removeBadgeFromChannel({
					clanId: previousChannels.at(1)?.clanId as string,
					channelId: previousChannels.at(1)?.channelId as string
				})
			);
			handleReadMessage();

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

	const listChannelRender = useAppSelector((state) => selectListChannelRenderByClanId(state, currentChannel.clan_id as string));
	const numberNotification = useMemo(() => {
		const channel = listChannelRender?.find((channel) => channel.id === currentChannel.id);
		return (channel as IChannel)?.count_mess_unread || 0;
	}, [listChannelRender, currentChannel.id]);

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
		if (numberNotification && numberNotification > 0) {
			dispatch(clansActions.updateClanBadgeCount({ clanId: currentChannel?.clan_id ?? '', count: numberNotification * -1 }));
			dispatch(listChannelRenderAction.removeBadgeFromChannel({ clanId: currentChannel.clan_id as string, channelId: currentChannel.id }));
			dispatch(listChannelsByUserActions.resetBadgeCount({ channelId: channelId }));
		}
	}, [currentChannel?.id]);

	useEffect(() => {
		if (lastMessage && isFocus) {
			handleReadMessage();
		}
	}, [lastMessage]);
}

const WindowFocus = () => {
	const dispatch = useAppDispatch();
	const statusFetchChannel = useSelector(selectFetchChannelStatus);
	const currentChannel = useAppSelector(selectCurrentChannel);
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, currentChannel?.channel_id as string));
	const isFocus = !isBackgroundModeActive();
	const listChannelRender = useAppSelector((state) => selectListChannelRenderByClanId(state, currentChannel?.clan_id as string));
	const numberNotification = useMemo(() => {
		const channel = listChannelRender?.find((channel) => channel.id === currentChannel?.id);
		return (channel as IChannel)?.count_mess_unread || 0;
	}, [listChannelRender, currentChannel?.id]);

	const { markAsReadSeen } = useSeenMessagePool();

	const handleReadMessage = () => {
		if (!lastMessage) {
			return;
		}
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL || currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING
				? ChannelStreamMode.STREAM_MODE_CHANNEL
				: ChannelStreamMode.STREAM_MODE_THREAD;
		const store = getStore();
		const state = store.getState() as RootState;
		const badgeCountClan = state.clans.entities[currentChannel?.clan_id as string]?.badge_count || 0;
		markAsReadSeen(lastMessage, mode, badgeCountClan);
	};
	const readMessage = useCallback(() => {
		if (!statusFetchChannel) return;
		const timestamp = Date.now() / 1000;
		dispatch(
			channelMetaActions.setChannelLastSeenTimestamp({ channelId: currentChannel?.channel_id as string, timestamp: timestamp + TIME_OFFSET })
		);
		dispatch(
			listChannelRenderAction.removeBadgeFromChannel({
				clanId: currentChannel?.clan_id as string,
				channelId: currentChannel?.channel_id as string
			})
		);
		dispatch(clansActions.updateClanBadgeCount({ clanId: currentChannel?.clan_id ?? '', count: numberNotification * -1 }));
		dispatch(
			listChannelsByUserActions.updateChannelBadgeCount({ channelId: currentChannel?.channel_id as string, count: numberNotification * -1 })
		);
		handleReadMessage();
	}, [numberNotification, lastMessage]);
	useBackgroundMode(undefined, readMessage, isFocus);
	return null;
};

function ChannelSeenListener({ channelId }: { channelId: string }) {
	useChannelSeen(channelId);
	return <WindowFocus />;
}

type ChannelMainContentTextProps = {
	channelId: string;
	canSendMessage: boolean;
};

const ChannelMainContentText = ({ channelId, canSendMessage }: ChannelMainContentTextProps) => {
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};
	const store = getStore();
	const dispatch = useDispatch();
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_APP
			? ChannelStreamMode.STREAM_MODE_CHANNEL
			: ChannelStreamMode.STREAM_MODE_THREAD;

	const [canSendMessageDelayed, setCanSendMessageDelayed] = useState(true);
	const isAppChannel = currentChannel?.type === ChannelType.CHANNEL_TYPE_APP;

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

	const handleLaunchApp = () => {
		if (isAppChannel) {
			const appChannel = selectAppChannelById(store.getState(), channelId);
			dispatch(
				channelsActions.setAppChannelsListShowOnPopUp({
					clanId: appChannel?.clan_id as string,
					channelId: appChannel?.channel_id as string,
					appChannel: appChannel as ApiChannelAppResponseExtend
				})
			);
		}
	};

	return (
		<div className={`flex-shrink flex flex-col dark:bg-bgPrimary bg-bgLightPrimary h-auto relative ${isShowMemberList ? 'w-full' : 'w-full'}`}>
			{showPreviewMode && <OnboardingGuide currentMission={currentMission} missionSum={missionSum} missionDone={missionDone} />}
			{currentChannel && <ChannelMessageBox clanId={currentChannel?.clan_id} channel={currentChannel} mode={mode} />}
			{isAppChannel && (
				<div className="flex gap-2 px-3 pt-2 dark:text-channelTextLabel text-colorTextLightMode">
					<div
						onClick={handleLaunchApp}
						className="w-[calc(50%_-_4px)] flex gap-1 items-center justify-center dark:bg-bgSecondary bg-bgLightSecondary dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton py-2 px-2 rounded-md cursor-pointer font-medium dark:hover:text-white hover:text-black"
					>
						<Icons.Joystick className="w-6" />
						<div>Launch App</div>
					</div>
					<div className="w-[calc(50%_-_4px)] flex gap-1 items-center justify-center dark:bg-bgSecondary bg-bgLightSecondary dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton py-2 px-2 rounded-md cursor-pointer font-medium dark:hover:text-white hover:text-black">
						<Icons.AppHelpIcon className="w-6" />
						<div>Help</div>
					</div>
				</div>
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
	const { draggingState, setDraggingState } = useDragAndDrop();
	const isSearchMessage = useAppSelector((state) => selectIsSearchMessage(state, channelId));
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const isShowCanvas = useSelector(selectIsShowCanvas);
	const [isShowAgeRestricted, setIsShowAgeRestricted] = useState(false);

	const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], channelId);
	const { userProfile } = useAuth();
	const currentChannelAppClanId = useSelector(selectChannelAppClanId);
	const currentChannelAppId = useSelector(selectChannelAppChannelId);
	const closeAgeRestricted = () => {
		setIsShowAgeRestricted(false);
	};
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannel?.id));
	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: currentChannel?.id, isShowCreateThread }));
			dispatch(topicsActions.setIsShowCreateTopic(false));
		},
		[currentChannel?.id, dispatch]
	);

	const appChannel = useAppSelector((state) => selectAppChannelById(state, channelId as string));

	const appearanceTheme = useSelector(selectTheme);

	const [openUploadFileModal, closeUploadFileModal] = useModal(() => {
		return <FileUploadByDnD currentId={currentChannel?.channel_id ?? ''} />;
	}, [currentChannel]);

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
		if (!isShowCanvas && !isShowAgeRestricted && draggingState && !isChannelMezonVoice) {
			openUploadFileModal();
		}

		if (!draggingState) {
			closeUploadFileModal();
		}
	}, [draggingState]);

	useEffect(() => {
		if (currentChannelAppId && currentChannelAppClanId) {
			dispatch(channelAppActions.setJoinChannelAppData({ dataUpdate: undefined }));
			dispatch(
				handleParticipantVoiceState({
					clan_id: currentChannelAppClanId,
					channel_id: currentChannelAppId,
					display_name: userProfile?.user?.display_name ?? '',
					state: ParticipantMeetState.LEAVE
				})
			);
		}
		dispatch(channelAppActions.setRoomId({ channelId: channelId, roomId: null }));

		if (isChannelApp) {
			dispatch(channelAppActions.setChannelId(channelId));
			dispatch(channelAppActions.setClanId(currentChannel?.clan_id || null));
		} else {
			dispatch(channelAppActions.setChannelId(null));
			dispatch(channelAppActions.setClanId(null));
		}
	}, [appChannel]);

	useEffect(() => {
		const savedChannelIds = safeJSONParse(localStorage.getItem('agerestrictedchannelIds') || '[]');
		if (!savedChannelIds.includes(currentChannel.channel_id) && currentChannel.age_restricted === 1) {
			setIsShowAgeRestricted(true);
		} else {
			setIsShowAgeRestricted(false);
		}
	}, [currentChannel]);

	const isChannelMezonVoice = currentChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
	const isChannelApp = currentChannel?.type === ChannelType.CHANNEL_TYPE_APP;
	const isChannelStream = currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING;

	return (
		<div className={`w-full ${isChannelMezonVoice ? 'hidden' : ''}`}>
			<div
				className="flex flex-col flex-1 shrink min-w-0 bg-transparent h-[100%] z-10"
				id="mainChat"
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				onDragEnter={canSendMessage ? handleDragEnter : () => {}}
			>
				<div
					className={`flex flex-row ${closeMenu ? `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBarMobile' : 'h-heightWithoutTopBarMobile'}` : `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'}`}`}
				>
					{!isShowCanvas && !isShowAgeRestricted && !isChannelMezonVoice && (
						<div
							className={`flex flex-col flex-1 min-w-60 ${isWindowsDesktop || isLinuxDesktop ? 'max-h-titleBarMessageViewChatDM' : 'max-h-messageViewChatDM'} ${isShowMemberList ? 'w-widthMessageViewChat' : isShowCreateThread ? 'w-widthMessageViewChatThread' : isSearchMessage ? 'w-widthSearchMessage' : 'w-widthThumnailAttachment'} h-full ${closeMenu && !statusMenu && isShowMemberList && !isChannelStream && 'hidden'} z-10`}
						>
							<div
								className={`relative overflow-y-auto  ${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarMessageViewChatDM' : 'h-heightMessageViewChatDM'} flex-shrink`}
							>
								<ChannelMedia currentChannel={currentChannel} />
							</div>
							<ChannelMainContentText canSendMessage={canSendMessage} channelId={currentChannel?.channel_id as string} />
						</div>
					)}
					{isShowCanvas && !isShowAgeRestricted && !isChannelMezonVoice && !isChannelStream && (
						<div
							className={`flex flex-1 justify-center overflow-y-scroll overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}
						>
							<Canvas />
						</div>
					)}

					{!isShowCanvas && isShowAgeRestricted && !isChannelMezonVoice && !isChannelStream && (
						<div
							className={`flex flex-1 justify-center overflow-y-scroll overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}
						>
							<AgeRestricted closeAgeRestricted={closeAgeRestricted} />
						</div>
					)}
					{isShowMemberList && !isChannelMezonVoice && !isChannelStream && (
						<div
							onContextMenu={(event) => event.preventDefault()}
							className={` dark:bg-bgSecondary bg-bgLightSecondary text-[#84ADFF] relative overflow-y-scroll hide-scrollbar ${currentChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ? 'hidden' : 'flex'} ${closeMenu && !statusMenu && isShowMemberList ? 'w-full' : 'w-widthMemberList'}`}
							id="memberList"
						>
							<MemberList />
						</div>
					)}

					{isSearchMessage && !isChannelMezonVoice && !isChannelStream && <SearchMessageChannel />}
				</div>
			</div>
		</div>
	);
};

interface IChannelMainProps {
	topicChannelId?: string;
}

export default function ChannelMain({ topicChannelId }: IChannelMainProps) {
	const currentChannel = useSelector(selectCurrentChannel);
	const isOpenTopic = useSelector(selectTopicByChannelId(currentChannel?.channel_id ?? ''));
	const dispatch = useAppDispatch();
	useEffect(() => {
		if (isOpenTopic && isOpenTopic !== '0' && currentChannel) {
			dispatch(topicsActions.setIsShowCreateTopic(true));
			dispatch(
				threadsActions.setIsShowCreateThread({
					channelId: currentChannel.channel_id || '',
					isShowCreateThread: false
				})
			);
			dispatch(topicsActions.setCurrentTopicId(isOpenTopic));
			dispatch(topicsActions.setChannelTopic({ channelId: currentChannel.channel_id || '', topicId: '0' }));
		}
	}, [isOpenTopic]);
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
			isDm={false}
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
		// eslint-disable-next-line react/jsx-no-useless-fragment
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
