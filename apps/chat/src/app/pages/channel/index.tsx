/* eslint-disable react-hooks/exhaustive-deps */
import { AgeRestricted, Canvas, FileUploadByDnD, MemberList, SearchMessageChannelRender } from '@mezon/components';
import { useAppNavigation, useAuth, useDragAndDrop, usePermissionChecker, useSearchMessages, useSeenMessagePool } from '@mezon/core';
import type { ChannelsEntity } from '@mezon/store';
import {
	ETypeMission,
	channelAppActions,
	channelsActions,
	getStore,
	gifsStickerEmojiActions,
	handleParticipantVoiceState,
	onboardingActions,
	selectAppChannelById,
	selectChannelAppChannelId,
	selectChannelAppClanId,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClan,
	selectIsSearchMessage,
	selectIsShowCanvas,
	selectIsShowCreateThread,
	selectIsShowMemberList,
	selectLastMessageByChannelId,
	selectMissionDone,
	selectMissionSum,
	selectOnboardingByClan,
	selectOnboardingMode,
	selectProcessingByClan,
	selectSearchMessagesLoadingStatus,
	selectStatusMenu,
	selectToCheckAppIsOpening,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ApiChannelAppResponseExtend } from '@mezon/utils';
import {
	DONE_ONBOARDING_STATUS,
	EOverriddenPermission,
	ParticipantMeetState,
	SubPanelName,
	isBackgroundModeActive,
	isLinuxDesktop,
	isWindowsDesktop,
	titleMission,
	useBackgroundMode
} from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import type { ApiOnboardingItem } from 'mezon-js/api.gen';
import type { DragEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

	useEffect(() => {
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [channelId, currentChannel, dispatch, isFocus]);
	const { markAsReadSeen } = useSeenMessagePool();
	const handleReadMessage = useCallback(() => {
		if (!lastMessage) {
			return;
		}
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL || currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING
				? ChannelStreamMode.STREAM_MODE_CHANNEL
				: ChannelStreamMode.STREAM_MODE_THREAD;
		markAsReadSeen(lastMessage, mode, currentChannel?.count_mess_unread || 0);
	}, [lastMessage, currentChannel, markAsReadSeen]);

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
	}, [currentChannel?.id]);

	useEffect(() => {
		if (lastMessage && isFocus) {
			handleReadMessage();
		}
	}, [lastMessage, handleReadMessage, isFocus]);

	useBackgroundMode(undefined, handleReadMessage, isFocus);
}

const ChannelSeenListener = memo(({ channelId }: { channelId: string }) => {
	useChannelSeen(channelId);
	return null;
});

type ChannelMainContentTextProps = {
	channelId: string;
	canSendMessage: boolean;
};

const ChannelMainContentText = ({ channelId, canSendMessage }: ChannelMainContentTextProps) => {
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};
	const dispatch = useDispatch();
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_APP ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
			? ChannelStreamMode.STREAM_MODE_CHANNEL
			: ChannelStreamMode.STREAM_MODE_THREAD;

	const [canSendMessageDelayed, setCanSendMessageDelayed] = useState(true);
	const isAppChannel = currentChannel?.type === ChannelType.CHANNEL_TYPE_APP;

	const currentClan = useSelector(selectCurrentClan);
	const missionDone = useSelector((state) => selectMissionDone(state, currentClan?.id as string));
	const missionSum = useSelector((state) => selectMissionSum(state, currentClan?.id as string));
	const onboardingClan = useAppSelector((state) => selectOnboardingByClan(state, currentChannel.clan_id as string));
	const appIsOpen = useAppSelector((state) => selectToCheckAppIsOpening(state, channelId));
	const appButtonLabel = appIsOpen ? 'Reset App' : 'Launch App';

	const currentMission = useMemo(() => {
		return onboardingClan.mission[missionDone || 0];
	}, [missionDone, channelId, onboardingClan.mission]);
	const selectUserProcessing = useSelector((state) => selectProcessingByClan(state, currentClan?.clan_id as string));

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
				className="opacity-80 bg-theme-input text-theme-primary ml-4 mb-4 py-2 pl-2 w-widthInputViewChannelPermission rounded one-line"
			>
				You do not have permission to send messages in this channel.
			</div>
		);
	}

	const handleLaunchApp = () => {
		if (isAppChannel) {
			const store = getStore();
			const appChannel = selectAppChannelById(store.getState(), channelId);
			if (appIsOpen) {
				const appSize = store.getState().channelApp.size;
				const windowWidth = window.innerWidth;
				const windowHeight = window.innerHeight;
				const centerX = Math.max(0, (windowWidth - appSize.width) / 2);
				const centerY = Math.max(0, (windowHeight - appSize.height) / 2);
				dispatch(channelAppActions.setPosition({ x: centerX, y: centerY }));
			}
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
		<div className={`flex-shrink flex flex-col bg-theme-chat h-auto relative ${isShowMemberList ? 'w-full' : ''}`}>
			{showPreviewMode && <OnboardingGuide currentMission={currentMission} missionSum={missionSum} missionDone={missionDone} />}
			{currentChannel && <ChannelMessageBox clanId={currentChannel?.clan_id} channel={currentChannel} mode={mode} />}
			{isAppChannel && (
				<div className="flex gap-2 px-3 pt-2 text-theme-primary">
					<div
						onClick={handleLaunchApp}
						className="w-[calc(50%_-_4px)] border-theme-primary flex gap-1 items-center justify-center bg-item-theme py-2 px-2 rounded-md cursor-pointer font-medium text-theme-primary-hover"
					>
						<Icons.Joystick className="w-6" />
						<div>{appButtonLabel}</div>
					</div>
					<div className="w-[calc(50%_-_4px)] border-theme-primary flex gap-1 items-center justify-center bg-item-theme py-2 px-2 rounded-md cursor-pointer font-medium text-theme-primary-hover">
						<Icons.AppHelpIcon className="w-6" />
						<div>Help</div>
					</div>
				</div>
			)}
			{currentChannel && currentChannel?.type !== ChannelType.CHANNEL_TYPE_MEZON_VOICE ? (
				<ChannelTyping channelId={currentChannel?.id} mode={mode} isPublic={currentChannel ? !currentChannel?.channel_private : false} />
			) : (
				<div className="h-4"></div>
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

	const appChannel = useAppSelector((state) => selectAppChannelById(state, channelId as string));

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
		if (!isShowCanvas && !isShowAgeRestricted && draggingState) {
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
					state: ParticipantMeetState.LEAVE,
					room_name: currentChannelAppId
				})
			);
		}
		dispatch(channelAppActions.setRoomId({ channelId, roomId: null }));

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
		<div className={`w-full `}>
			<div
				className="flex flex-col flex-1 shrink min-w-0 bg-transparent h-[100%] z-10"
				id="mainChat"
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				onDragEnter={canSendMessage ? handleDragEnter : () => {}}
			>
				<div
					className={`flex flex-row ${closeMenu ? `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBarMobile' : 'h-heightWithoutTopBarMobile'}` : `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'}`}`}
				>
					{!isShowCanvas && !isShowAgeRestricted && (
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
							className={`flex flex-1 justify-center thread-scroll overflow-x-hidden scroll-big ${isElectron() ? 'h-[calc(100%_-_23px)]' : ''}`}
						>
							<Canvas />
						</div>
					)}

					{!isShowCanvas && isShowAgeRestricted && !isChannelMezonVoice && !isChannelStream && (
						<div className={`flex flex-1 justify-center overflow-x-hidden`}>
							<AgeRestricted closeAgeRestricted={closeAgeRestricted} />
						</div>
					)}
					{isShowMemberList && !isChannelMezonVoice && !isChannelStream && (
						<div
							onContextMenu={(event) => event.preventDefault()}
							className={`border-l border-solid border-color-primary text-theme-primary relative overflow-y-scroll hide-scrollbar ${currentChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ? 'hidden' : 'flex'} ${closeMenu && !statusMenu && isShowMemberList ? 'w-full' : 'w-widthMemberList'}`}
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
	const isLoading = useAppSelector(selectSearchMessagesLoadingStatus) === 'loading';

	return (
		<SearchMessageChannelRender
			searchMessages={searchMessages}
			currentPage={currentPage}
			totalResult={totalResult}
			channelId={currentChannel?.id || ''}
			isDm={false}
			isLoading={isLoading}
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
			{(missionDone || 0) < missionSum && currentMission ? (
				<div
					className="relative rounded-t-md w-[calc(100%_-_32px)] h-14 left-4 bu bg-theme-contexify top-2 flex pt-2 px-4 pb-4 items-center gap-3"
					onClick={handleDoNextMission}
				>
					<Icons.Hashtag className="text-theme-primary" />
					<div className=" flex flex-col">
						<div className="text-base font-semibold text-theme-primary">{currentMission.title} </div>
						<div className="text-[10px] font-normal text-theme-primary">
							{' '}
							{titleMission[currentMission.task_type ? currentMission.task_type - 1 : 0]}{' '}
							<strong className="text-theme-primary">#{channelMission?.channel_label}</strong>{' '}
						</div>
					</div>
				</div>
			) : null}
		</>
	);
};
