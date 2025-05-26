import {
	DmCallManager,
	FirstJoinPopup,
	FooterProfile,
	ForwardMessageModal,
	GroupCallManager,
	MessageContextMenuProvider,
	MessageModalImage,
	ModalCreateClan,
	ModalUnknowChannel,
	MultiStepModalE2ee,
	NavLinkComponent,
	SearchModal,
	SidebarClanItem,
	SidebarLogoItem,
	Topbar,
	useWebRTCStream
} from '@mezon/components';
import { useAppParams, useAuth, useClanDragAndDrop, useMenu, useReference } from '@mezon/core';
import {
	accountActions,
	e2eeActions,
	fetchDirectMessage,
	getIsShowPopupForward,
	onboardingActions,
	selectAllAppChannelsListShowOnPopUp,
	selectChatStreamWidth,
	selectClanNumber,
	selectClanView,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentStreamInfo,
	selectDirectsUnreadlist,
	selectHasKeyE2ee,
	selectIsShowChatStream,
	selectIsShowPopupQuickMess,
	selectOnboardingMode,
	selectOpenModalAttachment,
	selectOpenModalE2ee,
	selectOrderedClans,
	selectStatusMenu,
	selectTheme,
	selectToastErrors,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { PLATFORM_ENV, Platform, TIME_OF_SHOWING_FIRST_POPUP, isLinuxDesktop, isMacDesktop, isWindowsDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelType } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import ChannelStream from '../channel/ChannelStream';
import DraggableModal from '../channel/DraggableModal/DraggableModal';
import { MainContent } from './MainContent';
import PopupQuickMess from './PopupQuickMess';
import DirectUnread from './directUnreads';

const DraggableModalList = memo(({ currentClanId }: { currentClanId: string }) => {
	const allChannelApp = useSelector(selectAllAppChannelsListShowOnPopUp);
	const groupedByClan = useMemo(() => {
		if (!allChannelApp) return {};
		return allChannelApp?.reduce<Record<string, typeof allChannelApp>>((acc, item) => {
			if (item?.clan_id) {
				(acc[item?.clan_id] ||= []).push(item);
			}
			return acc;
		}, {});
	}, [allChannelApp]);

	return (
		<>
			{Object.entries(groupedByClan).map(([clanId, apps]) => (
				<DraggableModal appChannelList={apps} key={clanId} inVisible={clanId !== currentClanId} />
			))}
		</>
	);
});

function MyApp() {
	const dispatch = useAppDispatch();
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

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			const prefixKey = PLATFORM_ENV === Platform.MACOS ? 'metaKey' : 'ctrlKey';
			if (event[prefixKey] && (event.key === 'k' || event.key === 'K')) {
				event.preventDefault();
				dispatch(fetchDirectMessage({}));
				openSearchModal();
			}
			if (event[prefixKey] && event.shiftKey && event.key === 'Enter' && !directId) {
				dispatch(accountActions.setAnonymousMode());
			}
			if (event[prefixKey] && event.key === '-' && isElectron()) {
				event.preventDefault();
				window.electron.setRatioWindow(false);
			}
			if (event[prefixKey] && event.shiftKey && event.key === '+' && isElectron()) {
				event.preventDefault();
				window.electron.setRatioWindow(true);
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
				document.documentElement.classList.add('dark');
				break;
			case 'light':
				document.documentElement.classList.remove('dark');
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

	return (
		<div className="relative overflow-hidden w-full h-full">
			<DraggableModalList currentClanId={currentClanId as string} />

			<MemoizedErrorModals />

			<div
				className={`flex h-dvh min-[480px]:pl-[72px] ${closeMenu ? (statusMenu ? 'pl-[72px]' : '') : ''} overflow-hidden text-gray-100 relative dark:bg-bgPrimary bg-bgLightModeSecond`}
				onClick={handleClick}
			>
				{previewMode && <PreviewOnboardingMode />}
				{openPopupForward && <ForwardMessageModal openModal={openPopupForward} />}
				<SidebarMenu openCreateClanModal={openCreateClanModal} />
				<Topbar isHidden={currentClanId !== '0' ? !currentChannel?.id : !directId} />
				<MainContent />

				<FooterProfile
					name={userProfile?.user?.display_name || userProfile?.user?.username || ''}
					status={userProfile?.user?.online}
					avatar={userProfile?.user?.avatar_url || ''}
					userId={userProfile?.user?.id || ''}
					isDM={currentClanId !== '0'}
				/>

				<div
					className={`fixed ${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'} bottom-0 ${closeMenu ? (statusMenu ? 'hidden' : 'w-full') : isShowChatStream ? 'max-sm:hidden' : 'w-full'} ${currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && currentClanId !== '0' && memberPath !== currentURL ? 'flex flex-1 justify-center items-center' : 'hidden pointer-events-none'}`}
					style={streamStyle}
				>
					{isStream || currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ? (
						<ChannelStream
							key={currentStreamInfo?.streamId}
							currentChannel={currentChannel}
							currentStreamInfo={currentStreamInfo}
							handleChannelClick={handleChannelClick}
							streamVideoRef={streamVideoRef}
							disconnect={disconnect}
							isStream={isStream}
						/>
					) : null}
				</div>

				<DmCallManager userId={userProfile?.user?.id || ''} directId={directId} />
				<GroupCallManager />

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

const DirectUnreadList = memo(() => {
	const listUnreadDM = useSelector(selectDirectsUnreadlist);
	const [listDmRender, setListDmRender] = useState(listUnreadDM);
	const countUnreadRender = useRef(listDmRender.map((channel) => channel.id));

	const timerRef = useRef<NodeJS.Timeout | null>(null);
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
		!!listDmRender?.length &&
		listDmRender.map((dmGroupChatUnread) => (
			<DirectUnread key={dmGroupChatUnread.id} directMessage={dmGroupChatUnread} checkMoveOut={countUnreadRender.current} />
		))
	);
});

const SidebarMenu = memo(
	({ openCreateClanModal }: { openCreateClanModal: ShowModal }) => {
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

		return (
			<div
				className={`contain-strict h-dvh fixed z-10 left-0 top-0 w-[72px] dark:bg-bgSecondary500 bg-bgLightTertiary duration-100 ${isWindowsDesktop || isLinuxDesktop ? 'mt-[21px]' : ''} ${isMacDesktop ? 'pt-[18px]' : ''} ${closeMenu ? (statusMenu ? '' : 'max-sm:hidden') : ''}`}
				onClick={() => handleMenu}
				id="menu"
			>
				<div
					className={`top-0 left-0 right-0 flex flex-col items-center py-4 px-3 overflow-y-auto hide-scrollbar ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : 'h-dvh'} `}
				>
					<div className="flex flex-col items-center">
						<SidebarLogoItem />
						<DirectUnreadList />
					</div>
					<div className="border-t-2 my-2 dark:border-t-borderDividerLight border-t-buttonLightTertiary"></div>

					<ClansList />

					<div className="mt-3">
						<NavLinkComponent>
							<div
								className="flex items-center justify-between text-contentSecondary rounded-md cursor-pointer hover:bg-bgLightModeButton group"
								onClick={openCreateClanModal}
							>
								<div className="w-[40px] h-[40px] rounded-lg dark:bg-bgPrimary bg-[#E1E1E1] flex justify-center items-center cursor-pointer dark:group-hover:bg-slate-800 group-hover:bg-bgLightModeButton  transition-all duration-200 size-12">
									<p className="text-2xl dark:text-contentSecondary text-textLightTheme">+</p>
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

const ClansList = memo(() => {
	const clans = useSelector(selectOrderedClans);
	const currentClanId = useSelector(selectCurrentClanId);
	const isClanView = useSelector(selectClanView);

	const [items, setItems] = useState<string[]>([]);
	const { draggingState, handleMouseDown, handleMouseEnter } = useClanDragAndDrop(items, setItems);

	useEffect(() => {
		setItems(clans.map((c) => c.id));
	}, [clans]);

	const { isDragging, draggedItem, dragPosition, dragOffset } = draggingState;
	const isActive = (clanId: string) => isClanView && currentClanId === clans.find((c) => c.id === clanId)?.clan_id;

	return (
		<div className="flex flex-col gap-3 relative">
			{items.map((id) => {
				const clan = clans.find((c) => c.id === id)!;
				const draggingThis = isDragging && draggedItem === clan?.id;

				return (
					<div
						key={clan?.id}
						className={`relative transition-all duration-200 ${draggingThis ? 'opacity-0 h-0 overflow-hidden my-0' : isDragging && draggingState.overItem === clan.id ? 'my-8' : 'my-0'}`}
						onMouseEnter={() => handleMouseEnter(clan?.id)}
						onMouseDown={(e) => handleMouseDown(e, clan?.id)}
					>
						<SidebarClanItem option={clan} active={isActive(clan?.id)} className={`${draggingThis ? 'opacity-0' : ''}`} />
					</div>
				);
			})}

			{isDragging && draggedItem && dragPosition && (
				<div
					className="fixed pointer-events-none z-50 w-[40px] h-[40px]"
					style={{
						left: `${dragPosition.x - dragOffset.x}px`,
						top: `${dragPosition.y - dragOffset.y}px`
					}}
				>
					<SidebarClanItem option={clans.find((c) => c.id === draggedItem)!} active={false} />
				</div>
			)}
		</div>
	);
});

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
	return (
		<MessageContextMenuProvider>
			<MessageModalImage />
		</MessageContextMenuProvider>
	);
};

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
