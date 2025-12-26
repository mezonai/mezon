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
	selectBanMeInChannel,
	selectChannelAppChannelId,
	selectChannelAppClanId,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentClanIsOnboarding,
	selectIsSearchMessage,
	selectIsShowCanvas,
	selectIsShowCreateThread,
	selectIsShowMemberList,
	selectLastMessageViewportByChannelId,
	selectLastSeenMessageId,
	selectLastSentMessageStateByChannelId,
	selectMissionDone,
	selectMissionSum,
	selectOnboardingByClan,
	selectOnboardingMode,
	selectProcessingByClan,
	selectSearchMessagesLoadingStatus,
	selectStatusMenu,
	selectToCheckAppIsOpening,
	useAppDispatch,
	useAppSelector,
	usersClanActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	DONE_ONBOARDING_STATUS,
	EOverriddenPermission,
	FOR_10_MINUTES_SEC,
	FOR_1_HOUR_SEC,
	FOR_24_HOURS_SEC,
	ONE_MILISECONDS,
	ONE_MINUTE_MS,
	ParticipantMeetState,
	SubPanelName,
	generateE2eId,
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
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { ChannelMedia } from './ChannelMedia';
import { ChannelMessageBox } from './ChannelMessageBox';
import { ChannelTyping } from './ChannelTyping';

function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId)) || {};
	const lastMessageViewport = useAppSelector((state) => selectLastMessageViewportByChannelId(state, channelId));
	const lastMessageChannel = useAppSelector((state) => selectLastSentMessageStateByChannelId(state, channelId));
	const lastSeenMessageId = useAppSelector((state) => selectLastSeenMessageId(state, channelId));
	const { markAsReadSeen } = useSeenMessagePool();

	const isMounted = useRef(false);
	const isWindowFocused = !isBackgroundModeActive();

	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL || currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING
			? ChannelStreamMode.STREAM_MODE_CHANNEL
			: ChannelStreamMode.STREAM_MODE_THREAD;

	const markMessageAsRead = useCallback(() => {
		if (!lastMessageViewport || !lastMessageChannel || lastMessageViewport?.isSending) return;
		if (lastSeenMessageId && lastMessageViewport?.id) {
			try {
				const distance = Math.round(Number((BigInt(lastMessageViewport.id) >> BigInt(22)) - (BigInt(lastSeenMessageId) >> BigInt(22))));
				if (distance >= 0) {
					markAsReadSeen(lastMessageViewport, mode, currentChannel?.count_mess_unread || 0);
					return;
				}
			} catch (error) {
				//
			}
		}

		const isLastMessage = lastMessageViewport.id === lastMessageChannel.id;
		if (isLastMessage) {
			markAsReadSeen(lastMessageViewport, mode, currentChannel?.count_mess_unread || 0);
		}
	}, [lastMessageViewport, lastMessageChannel, lastSeenMessageId, markAsReadSeen, currentChannel, mode]);

	const updateChannelSeenState = useCallback(
		(_channelId: string) => {
			if (currentChannel.type === ChannelType.CHANNEL_TYPE_THREAD) {
				const channelWithActive = { ...currentChannel, active: 1 };
				dispatch(
					channelsActions.upsertOne({
						clanId: currentChannel?.clan_id || '',
						channel: channelWithActive as ChannelsEntity
					})
				);
			}
		},
		[dispatch, currentChannel]
	);

	useEffect(() => {
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [dispatch, channelId]);

	useEffect(() => {
		if (lastMessageViewport && isWindowFocused) {
			markMessageAsRead();
		}
	}, [lastMessageViewport, isWindowFocused, markMessageAsRead, channelId]);

	useEffect(() => {
		if (isMounted.current || !lastMessageViewport) return;
		isMounted.current = true;
		updateChannelSeenState(channelId);
	}, [channelId, lastMessageViewport, updateChannelSeenState]);

	useBackgroundMode(undefined, markMessageAsRead);
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
	const { t } = useTranslation('common');
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const { userId, userProfile } = useAuth();
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_APP ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
			? ChannelStreamMode.STREAM_MODE_CHANNEL
			: ChannelStreamMode.STREAM_MODE_THREAD;

	const [canSendMessageDelayed, setCanSendMessageDelayed] = useState<boolean | null>(false);
	const isAppChannel = currentChannel?.type === ChannelType.CHANNEL_TYPE_APP;

	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanIsOnboarding = useSelector(selectCurrentClanIsOnboarding);
	const missionDone = useSelector((state) => selectMissionDone(state, currentClanId as string));
	const missionSum = useSelector((state) => selectMissionSum(state, currentClanId as string));
	const onboardingClan = useAppSelector((state) => selectOnboardingByClan(state, currentChannel.clan_id as string));
	const appIsOpen = useAppSelector((state) => selectToCheckAppIsOpening(state, channelId));
	const appButtonLabel = appIsOpen ? t('resetApp') : t('launchApp');

	const currentMission = useMemo(() => {
		return onboardingClan.mission[missionDone || 0];
	}, [missionDone, channelId, onboardingClan.mission]);
	const selectUserProcessing = useSelector((state) => selectProcessingByClan(state, currentClanId as string));
	const isBanned = useAppSelector((state) => selectBanMeInChannel(state, currentChannel.id));

	const timerRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}

		timerRef.current = setTimeout(() => {
			if (canSendMessage && isBanned) {
				setCanSendMessageDelayed(null);
				return;
			}
			if (canSendMessage !== canSendMessageDelayed) {
				setCanSendMessageDelayed(canSendMessage);
			}
		}, 500);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [canSendMessage, isBanned]);
	const dispatch = useAppDispatch();

	const previewMode = useSelector(selectOnboardingMode);
	const showPreviewMode = useMemo(() => {
		if (previewMode?.open && previewMode.clanId === currentClanId) {
			return true;
		}
		return selectUserProcessing?.onboarding_step !== DONE_ONBOARDING_STATUS && currentClanIsOnboarding;
	}, [selectUserProcessing?.onboarding_step, currentClanIsOnboarding, previewMode, currentClanId]);

	if (canSendMessageDelayed === false) {
		return (
			<div
				className="h-11 opacity-80 bg-theme-input text-theme-primary ml-4 mb-4 py-2 pl-2 w-widthInputViewChannelPermission rounded one-line"
				data-e2e={generateE2eId('chat.message_box.input.no_permission')}
			>
				{t('noPermissionToSendMessage')}
			</div>
		);
	} else if (canSendMessageDelayed === null && isBanned) {
		return (
			<BanCountDown
				userId={userId || ''}
				clanId={currentClanId || ''}
				channelId={currentChannel.id}
				banTime={isBanned.ban_time ? isBanned.ban_time - Date.now() : Infinity}
			/>
		);
	}

	const handleLaunchApp = async () => {
		if (isAppChannel) {
			const store = getStore();
			const appChannel = selectAppChannelById(store.getState(), channelId);
			if (appChannel.app_id && appChannel.app_url) {
				const hashData = await dispatch(
					channelAppActions.generateAppUserHash({
						appId: appChannel.app_id
					})
				).unwrap();
				if (hashData.web_app_data) {
					const encodedHash = encodeURIComponent(hashData.web_app_data);
					const urlWithHash = `${appChannel.app_url}?data=${encodedHash}`;
					if (isElectron()) {
						window.electron.launchAppWindow(urlWithHash);
						return;
					}
					window.open(urlWithHash, currentChannel?.channel_label, 'width=900,height=700');
				}
			}
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
						<div>{t('help')}</div>
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
							className={`border-l border-solid border-color-primary text-theme-primary relative overflow-y-scroll hide-scrollbar flex} ${closeMenu && !statusMenu && isShowMemberList ? 'w-full' : 'w-widthMemberList'}`}
							id="memberList"
							data-e2e={generateE2eId('clan_page.secondary_side_bar')}
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
	const currentChannelId = useSelector(selectCurrentChannelId);
	const chlId = topicChannelId || currentChannelId;

	if (!chlId) {
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
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isLoading = useAppSelector(selectSearchMessagesLoadingStatus) === 'loading';

	return (
		<SearchMessageChannelRender
			searchMessages={searchMessages}
			currentPage={currentPage}
			totalResult={totalResult}
			channelId={currentChannelId || ''}
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

export const BanCountDown = ({ banTime, clanId, channelId, userId }: { banTime: number; clanId: string; channelId: string; userId: string }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation('common');
	const [time, setTime] = useState<number | null>(null);
	const countdown = useMemo(() => {
		if (banTime > FOR_24_HOURS_SEC) {
			return t('timeFormat.timeAgo.days', { count: Math.round(banTime / FOR_24_HOURS_SEC) });
		}
		if (banTime < FOR_10_MINUTES_SEC * 6) {
			return t('timeFormat.timeAgo.minutes', { count: Math.round(banTime / 60) });
		}
		if (banTime > FOR_1_HOUR_SEC) {
			return t('timeFormat.timeAgo.hours', { count: Math.round(banTime / FOR_1_HOUR_SEC) });
		}
		return null;
	}, [banTime, t]);

	useEffect(() => {
		if (banTime < 0) {
			dispatch(
				usersClanActions.removeBannedUser({
					clanId,
					channelId,
					userIds: [userId]
				})
			);
			return;
		}
		if (banTime < FOR_10_MINUTES_SEC) {
			const timer = setTimeout(
				() => {
					setTime(banTime < 60 ? banTime : 60);
				},
				banTime * ONE_MILISECONDS - ONE_MINUTE_MS
			);
			return () => clearTimeout(timer);
		}
	}, []);

	useEffect(() => {
		if (time === null) return;
		if (time <= 0) {
			dispatch(
				usersClanActions.removeBannedUser({
					clanId,
					channelId,
					userIds: [userId]
				})
			);
			return;
		}

		const timer = setTimeout(() => {
			setTime(time - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [time]);

	return (
		<div
			className="flex h-12 gap-3 items-center opacity-80 bg-theme-contexify text-theme-primary-active ml-4 mb-4 p-2 w-widthInputViewChannelPermission rounded"
			data-e2e={generateE2eId('mention.banned')}
		>
			<svg width="28" height="28" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
				<path
					fill="#e03c47"
					d="M33.77 15.39H22.23A3.69 3.69 0 0 1 19 13.56c0-.09-.09-.18-.13-.27v5.11l5 3.39a1 1 0 0 1-1.11 1.66l-5.9-4v-8.7a1 1 0 0 1 1.91-.41 4 4 0 0 1 .23-.45L20.74 7A11.2 11.2 0 0 0 18 6.6a11.39 11.39 0 0 0-2.69 22.47L15 30.63A13 13 0 0 1 18 5a12.8 12.8 0 0 1 3.57.51l1.53-2.66A16 16 0 1 0 34 18a16 16 0 0 0-.23-2.61"
				/>
				<path fill="#e03c47" d="M26.85 1.14 21.13 11a1.28 1.28 0 0 0 1.1 2h11.45a1.28 1.28 0 0 0 1.1-2l-5.72-9.86a1.28 1.28 0 0 0-2.21 0" />
			</svg>
			<div className="flex flex-col gap-1 flex-1">
				<span className="leading-[14px] font-semibold text-sm">{t('timeout')}</span>
				<span className="leading-3 text-xs">{t('timeoutDesc')}</span>
			</div>

			<span data-e2e={generateE2eId('mention.banned.time')}>{time ? `${time}s` : banTime !== Infinity && countdown}</span>
		</div>
	);
};
