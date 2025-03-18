import {
	DmCalling,
	FirstJoinPopup,
	ForwardMessageModal,
	MessageContextMenuProvider,
	MessageModalImage,
	ModalCall,
	ModalCreateClan,
	ModalUnknowChannel,
	MultiStepModalE2ee,
	NavLinkComponent,
	SearchModal,
	SidebarClanItem,
	SidebarLogoItem
} from '@mezon/components';
import { useAppParams, useAuth, useMenu, useReference } from '@mezon/core';
import {
	DMCallActions,
	accountActions,
	audioCallActions,
	channelsActions,
	e2eeActions,
	fetchDirectMessage,
	getIsShowPopupForward,
	listChannelsByUserActions,
	onboardingActions,
	selectAllChannelMemberIds,
	selectAllClans,
	selectAllRoleIds,
	selectAppChannelsListShowOnPopUp,
	selectAudioBusyTone,
	selectAudioDialTone,
	selectAudioEndTone,
	selectAudioRingTone,
	selectChatStreamWidth,
	selectClanNumber,
	selectClanView,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentStartDmCall,
	selectCurrentStreamInfo,
	selectDirectsUnreadlist,
	selectGroupCallId,
	selectHasKeyE2ee,
	selectIsInCall,
	selectIsShowChatStream,
	selectIsShowPopupQuickMess,
	selectJoinedCall,
	selectOnboardingMode,
	selectOpenModalAttachment,
	selectOpenModalE2ee,
	selectSignalingDataByUserId,
	selectStatusMenu,
	selectTheme,
	selectToastErrors,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';

import { useWebRTCStream } from '@mezon/components';
import { Icons } from '@mezon/ui';
import { IClan, PLATFORM_ENV, Platform, TIME_OF_SHOWING_FIRST_POPUP, isLinuxDesktop, isMacDesktop, isWindowsDesktop } from '@mezon/utils';
import { ChannelType, WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { ChannelApps } from '../channel/ChannelApp';
import ChannelStream from '../channel/ChannelStream';
import DraggableModal from '../channel/DraggableModal/DraggableModal';
import { MainContent } from './MainContent';
import PopupQuickMess from './PopupQuickMess';
import DirectUnread from './directUnreads';

function MyApp() {
	const dispatch = useAppDispatch();
	const elementHTML = document.documentElement;
	const currentClanId = useSelector(selectCurrentClanId);
	const [openCreateClanModal, closeCreateClanModal] = useModal(() => <ModalCreateClan open={true} onClose={closeCreateClanModal} />);
	const [openSearchModal, closeSearchModal] = useModal(() => <SearchModal onClose={closeSearchModal} open={true} />);
	const openModalAttachment = useSelector(selectOpenModalAttachment);
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);

	const { userProfile } = useAuth();
	const calculateJoinedTime = new Date().getTime() - new Date(userProfile?.user?.create_time ?? '').getTime();
	const isNewGuy = calculateJoinedTime <= TIME_OF_SHOWING_FIRST_POPUP;
	const numberOfCLanJoined = useSelector(selectClanNumber);
	const [isShowFirstJoinPopup, setIsShowFirstJoinPopup] = useState(isNewGuy && numberOfCLanJoined === 0);

	const { currentURL, directId } = useAppParams();
	const memberPath = `/chat/clans/${currentClanId}/member-safety`;
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userProfile?.user?.id || ''));
	const dataCall = useMemo(() => {
		return signalingData?.[signalingData?.length - 1]?.signalingData;
	}, [signalingData]);

	const isInCall = useSelector(selectIsInCall);
	const isPlayDialTone = useSelector(selectAudioDialTone);
	const isPlayRingTone = useSelector(selectAudioRingTone);
	const isPlayEndTone = useSelector(selectAudioEndTone);
	const isPlayBusyTone = useSelector(selectAudioBusyTone);
	const groupCallId = useSelector(selectGroupCallId);
	const isJoinedCall = useSelector(selectJoinedCall);
	const dialTone = useRef(new Audio('assets/audio/dialtone.mp3'));
	const ringTone = useRef(new Audio('assets/audio/ringing.mp3'));
	const endTone = useRef(new Audio('assets/audio/endcall.mp3'));
	const busyTone = useRef(new Audio('assets/audio/busytone.mp3'));

	const isDmCallInfo = useSelector(selectCurrentStartDmCall);
	const dmCallingRef = useRef<{ triggerCall: (isVideoCall?: boolean, isAnswer?: boolean) => void }>(null);

	useEffect(() => {
		if (isDmCallInfo?.groupId) {
			dmCallingRef.current?.triggerCall(isDmCallInfo?.isVideo);
		}
	}, [isDmCallInfo?.groupId, isDmCallInfo?.isVideo]);

	useEffect(() => {
		if (dataCall?.channel_id) {
			dispatch(audioCallActions.setGroupCallId(dataCall?.channel_id));
		}
	}, [dataCall?.channel_id, dispatch]);

	const triggerCall = (isVideoCall = false) => {
		dmCallingRef.current?.triggerCall(isDmCallInfo?.isVideo, true);
	};

	const playAudio = (audioRef: React.RefObject<HTMLAudioElement>) => {
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
			audioRef.current.play().catch((error) => console.error('Audio playback error:', error));
			audioRef.current.loop = true;
		}
	};

	const stopAudio = (audioRef: React.RefObject<HTMLAudioElement>) => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
	};

	useEffect(() => {
		if (!signalingData?.[signalingData?.length - 1] && !isInCall) {
			dispatch(audioCallActions.setIsDialTone(false));
			return;
		}
		switch (signalingData?.[signalingData?.length - 1]?.signalingData.data_type) {
			case WebrtcSignalingType.WEBRTC_SDP_OFFER:
				if (!isPlayDialTone && !isInCall && !isJoinedCall) {
					dispatch(audioCallActions.setIsRingTone(true));
					dispatch(audioCallActions.setIsBusyTone(false));
					dispatch(audioCallActions.setIsEndTone(false));
				} else {
					dispatch(audioCallActions.setIsDialTone(false));
				}

				break;
			case WebrtcSignalingType.WEBRTC_SDP_ANSWER:
				break;
			case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE:
				dispatch(audioCallActions.setIsRingTone(false));
				dispatch(audioCallActions.setIsDialTone(false));
				break;
			// 	CANCEL CALL
			case 4:
				dispatch(DMCallActions.removeAll());
				dispatch(audioCallActions.setIsRingTone(false));
				dispatch(audioCallActions.setIsDialTone(false));
				break;
			default:
				break;
		}
	}, [dispatch, isInCall, isPlayDialTone, signalingData]);

	useEffect(() => {
		if (isPlayDialTone) {
			playAudio(dialTone);
		} else {
			stopAudio(dialTone);
		}
	}, [isPlayDialTone]);

	useEffect(() => {
		if (isPlayRingTone) {
			playAudio(ringTone);
		} else {
			stopAudio(ringTone);
		}
	}, [isPlayRingTone]);

	useEffect(() => {
		if (isPlayEndTone) {
			endTone.current.play().catch((error) => console.error('Audio playback error:', error));
		} else {
			endTone.current.pause();
		}
	}, [isPlayEndTone]);

	useEffect(() => {
		if (isPlayBusyTone) {
			busyTone.current.play().catch((error) => console.error('Audio playback error:', error));
		} else {
			busyTone.current.pause();
		}
	}, [isPlayBusyTone]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			const prefixKey = PLATFORM_ENV === Platform.MACOS ? 'metaKey' : 'ctrlKey';
			if (event[prefixKey] && (event.key === 'k' || event.key === 'K')) {
				event.preventDefault();
				dispatch(fetchDirectMessage({}));
				dispatch(listChannelsByUserActions.fetchListChannelsByUser({}));
				openSearchModal();
			}
			if (event[prefixKey] && event.shiftKey && event.key === 'Enter' && !directId) {
				dispatch(accountActions.setAnonymousMode());
			}
		},
		[openSearchModal, currentURL]
	);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	const openPopupForward = useSelector(getIsShowPopupForward);

	const appearanceTheme = useSelector(selectTheme);
	useEffect(() => {
		switch (appearanceTheme) {
			case 'dark':
				elementHTML.classList.add('dark');
				break;
			case 'light':
				elementHTML.classList.remove('dark');
				break;
			default:
				break;
		}
	}, [appearanceTheme]);

	const { setOpenOptionMessageState } = useReference();

	const handleClick = useCallback(() => {
		setOpenOptionMessageState(false);
	}, []);

	const currentChannel = useSelector(selectCurrentChannel);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const isShowChatStream = useSelector(selectIsShowChatStream);
	const chatStreamWidth = useSelector(selectChatStreamWidth);
	const openModalE2ee = useSelector(selectOpenModalE2ee);
	const hasKeyE2ee = useSelector(selectHasKeyE2ee);

	useEffect(() => {
		if (currentChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
			const urlVoice = `https://meet.google.com/${currentChannel.meeting_code}`;
			window.open(urlVoice, '_blank', 'noreferrer');
		}
	}, []);

	const isShowPopupQuickMess = useSelector(selectIsShowPopupQuickMess);

	const streamStyle = isShowChatStream
		? { width: `calc(100vw - ${chatStreamWidth}px - 352px)`, right: `${chatStreamWidth + 8}px` }
		: { width: closeMenu ? undefined : `calc(100vw - 344px)`, right: '0' };

	const previewMode = useSelector(selectOnboardingMode);

	const { streamVideoRef, handleChannelClick, disconnect, isStream } = useWebRTCStream();

	const handleClose = () => {
		dispatch(e2eeActions.setOpenModalE2ee(false));
	};

	const parentRef = useRef<HTMLDivElement>(null);

	return (
		<div ref={parentRef}>
			<MemoizedDraggableModals parentRef={parentRef} />
			<MemoizedErrorModals />

			<div
				className={`flex h-dvh min-[480px]:pl-[72px] ${closeMenu ? (statusMenu ? 'pl-[72px]' : '') : ''} overflow-hidden text-gray-100 relative dark:bg-bgPrimary bg-bgLightModeSecond`}
				onClick={handleClick}
			>
				{previewMode && <PreviewOnboardingMode />}
				{openPopupForward && <ForwardMessageModal openModal={openPopupForward} />}
				<SidebarMenu openCreateClanModal={openCreateClanModal} />
				<MainContent />
				<div
					className={`fixed ${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'} bottom-0 ${closeMenu ? (statusMenu ? 'hidden' : 'w-full') : isShowChatStream ? 'max-sm:hidden' : 'w-full'} ${currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && currentClanId !== '0' && memberPath !== currentURL ? 'flex flex-1 justify-center items-center' : 'hidden pointer-events-none'}`}
					style={streamStyle}
				>
					<ChannelStream
						key={currentStreamInfo?.streamId}
						currentChannel={currentChannel}
						currentStreamInfo={currentStreamInfo}
						handleChannelClick={handleChannelClick}
						streamVideoRef={streamVideoRef}
						disconnect={disconnect}
						isStream={isStream}
					/>
				</div>

				{isPlayRingTone &&
					!!dataCall &&
					!isInCall &&
					directId !== dataCall?.channel_id &&
					dataCall?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER && (
						<ModalCall dataCall={dataCall} userId={userProfile?.user?.id || ''} triggerCall={triggerCall} />
					)}

				<DmCalling ref={dmCallingRef} dmGroupId={groupCallId} directId={directId || ''} />
				{openModalE2ee && !hasKeyE2ee && <MultiStepModalE2ee onClose={handleClose} />}
				{openModalAttachment && <MessageModalImageWrapper />}
				{isShowFirstJoinPopup && <FirstJoinPopup openCreateClanModal={openCreateClanModal} onclose={() => setIsShowFirstJoinPopup(false)} />}
				{isShowPopupQuickMess && <PopupQuickMess />}
			</div>
		</div>
	);
}

export default MyApp;

type ShowModal = () => void;

const SidebarMenu = memo(
	({ openCreateClanModal }: { openCreateClanModal: ShowModal }) => {
		const dispatch = useAppDispatch();
		const clans = useSelector(selectAllClans);
		clans.sort((a, b) => {
			const nameA = a.clan_name ?? '';
			const nameB = b.clan_name ?? '';

			if (nameA < nameB) {
				return -1;
			}
			if (nameA > nameB) {
				return 1;
			}
			return 0;
		});
		const listUnreadDM = useSelector(selectDirectsUnreadlist);
		const [listDmRender, setListDmRender] = useState(listUnreadDM);
		const countUnreadRender = useRef(listDmRender.map((channel) => channel.id));
		const isClanView = useSelector(selectClanView);
		const currentClanId = useSelector(selectCurrentClanId);
		const closeMenu = useSelector(selectCloseMenu);
		const statusMenu = useSelector(selectStatusMenu);

		const { setCloseMenu, setStatusMenu } = useMenu();

		useEffect(() => {
			const handleSizeWidth = () => {
				if (window.innerWidth < 480) {
					setCloseMenu(true);
				} else {
					setCloseMenu(false);
				}
			};

			handleSizeWidth();

			if (closeMenu) {
				setStatusMenu(false);
			}

			const handleResize = () => {
				handleSizeWidth();
			};

			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
			};
		}, []);

		const handleMenu = (event: MouseEvent) => {
			const elementClick = event.target as HTMLDivElement;
			const wrapElement = document.querySelector('#menu');
			if (!closeMenu) {
				return;
			}
			if (elementClick.classList.contains('clan')) {
				if (elementClick.classList.contains('choose')) {
					setStatusMenu(false);
					elementClick.classList.remove('choose');
				} else {
					setStatusMenu(true);
					const elementOld = wrapElement?.querySelector('.choose');
					if (elementOld) {
						elementOld.classList.remove('choose');
					}
					elementClick.classList.add('choose');
				}
			}
		};

		const timerRef = useRef<NodeJS.Timeout | null>(null);
		const idsSelectedChannel = safeJSONParse(localStorage.getItem('remember_channel') || '{}');
		useEffect(() => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			if (listUnreadDM.length > countUnreadRender.current.length) {
				setListDmRender(listUnreadDM);
				countUnreadRender.current = listUnreadDM.map((channel) => channel.id);
			} else {
				countUnreadRender.current = listUnreadDM.map((channel) => channel.id);
				timerRef.current = setTimeout(() => {
					setListDmRender(listUnreadDM);
				}, 1000);
			}
		}, [listUnreadDM]);
		return (
			<div
				className={`contain-strict h-dvh fixed z-10 left-0 top-0 w-[72px] dark:bg-bgSecondary500 bg-bgLightTertiary duration-100 ${isWindowsDesktop || isLinuxDesktop ? 'mt-[21px]' : ''} ${isMacDesktop ? 'pt-[18px]' : ''} ${closeMenu ? (statusMenu ? '' : 'max-sm:hidden') : ''}`}
				onClick={() => handleMenu}
				id="menu"
			>
				<div
					className={`top-0 left-0 right-0 flex flex-col items-center py-4 px-3 overflow-y-auto hide-scrollbar ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : 'h-dvh'} `}
				>
					<div className="flex flex-col ">
						<SidebarLogoItem />
						{!!listDmRender?.length &&
							listDmRender.map((dmGroupChatUnread) => (
								<DirectUnread key={dmGroupChatUnread.id} directMessage={dmGroupChatUnread} checkMoveOut={countUnreadRender.current} />
							))}
					</div>
					<div className="border-t-2 my-2 dark:border-t-borderDividerLight border-t-buttonLightTertiary"></div>
					<div className="flex flex-col gap-3 ">
						{clans.map((clan: IClan) => {
							return (
								<SidebarClanItem
									key={clan.id}
									linkClan={`/chat/clans/${clan.id}${idsSelectedChannel[clan.id] ? `/channels/${idsSelectedChannel[clan.id]}` : ''}`}
									option={clan}
									active={isClanView && currentClanId === clan.clan_id}
								/>
							);
						})}
					</div>
					<div className="mt-3">
						<NavLinkComponent>
							<div
								className="w-full h-full flex items-center justify-between text-contentSecondary rounded-md cursor-pointer hover:bg-bgLightModeButton group"
								onClick={openCreateClanModal}
							>
								<div className="dark:bg-bgPrimary bg-[#E1E1E1] flex justify-center items-center rounded-full cursor-pointer dark:group-hover:bg-slate-800 group-hover:bg-bgLightModeButton  transition-all duration-200 size-12">
									<p className="text-2xl font-bold text-[#155EEF]">+</p>
								</div>
							</div>
						</NavLinkComponent>
					</div>
				</div>
			</div>
		);
	},
	() => true
);

const PreviewOnboardingMode = () => {
	const dispatch = useDispatch();
	const handleClosePreview = () => {
		dispatch(onboardingActions.closeOnboardingPreviewMode());
	};
	return (
		<div className="fixed z-50 top-0 left-0 w-screen  bg-black flex px-4 py-2 h-12 items-center justify-center ">
			<div className="absolute cursor-pointer hover:bg-slate-950 left-6 px-2 flex gap-1 border-2 py-1 items-center justify-center  border-white rounded bg-transparent">
				<Icons.LeftArrowIcon className="fill-white text-white" />
				<p className="text-white text-xs font-medium" onClick={handleClosePreview}>
					Close preview mode
				</p>
			</div>
			<div className="text-base text-white font-semibold">You are viewing the clan as a new member. You have no roles.</div>
		</div>
	);
};

const MessageModalImageWrapper = () => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const allUserIdsInChannel = useAppSelector((state) => selectAllChannelMemberIds(state, currentChannelId));
	const allRolesInClan = useSelector(selectAllRoleIds);

	return (
		<MessageContextMenuProvider allRolesInClan={allRolesInClan} allUserIdsInChannel={allUserIdsInChannel}>
			<MessageModalImage />
		</MessageContextMenuProvider>
	);
};

interface MemoizedDraggableModalsProps {
	parentRef: React.RefObject<HTMLDivElement>;
}

const MemoizedDraggableModals: React.FC<MemoizedDraggableModalsProps> = React.memo(({ parentRef }) => {
	const appsList = useSelector(selectAppChannelsListShowOnPopUp);
	const dispatch = useAppDispatch();
	const [focusedModalId, setFocusedModalId] = useState<string | null>(null);

	const handleOnCloseCallback = useCallback(
		(clanId: string, channelId: string) => {
			dispatch(
				channelsActions.removeAppChannelsListShowOnPopUp({
					clanId,
					channelId
				})
			);
		},
		[dispatch]
	);

	return (
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<>
			{appsList.length > 0 &&
				appsList.map((app) => {
					const isFocused = focusedModalId === app.app_id;

					return (
						<DraggableModal
							key={app.app_id}
							headerTitle={app.url}
							parentRef={parentRef}
							isFocused={isFocused}
							onClose={() => handleOnCloseCallback(app.clan_id as string, app.channel_id as string)}
							onFocus={() => setFocusedModalId(app.app_id as string)}
						>
							<ChannelApps appChannel={app} onFocus={() => setFocusedModalId(app.app_id as string)} />
						</DraggableModal>
					);
				})}
		</>
	);
});

const MemoizedErrorModals: React.FC = React.memo(() => {
	const toastError = useSelector(selectToastErrors);

	return (
		<>
			{toastError.map((error) => (
				<ModalUnknowChannel key={error.id} isError={true} errMessage={error.message} idErr={error.id} />
			))}
		</>
	);
});
