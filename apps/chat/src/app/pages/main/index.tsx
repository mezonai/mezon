import {
	ClanGroup,
	DmCallManager,
	FirstJoinPopup,
	FooterProfile,
	ForwardMessageModal,
	GroupCallManager,
	InternetStatusPopover,
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
import { useAppParams, useAuth, useClanGroupDragAndDrop, useMenu, useReference } from '@mezon/core';
import type { ClanGroupItem } from '@mezon/store';
import {
	accountActions,
	clansActions,
	e2eeActions,
	fetchDirectMessage,
	getIsShowPopupForward,
	onboardingActions,
	selectAllAppChannelsListShowOnPopUp,
	selectChatStreamWidth,
	selectClanNumber,
	selectClanView,
	selectClansEntities,
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
	selectOrderedClansWithGroups,
	selectStatusMenu,
	selectTheme,
	selectToastErrors,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { PLATFORM_ENV, Platform, TIME_OF_SHOWING_FIRST_POPUP, generateE2eId, isLinuxDesktop, isMacDesktop, isWindowsDesktop } from '@mezon/utils';
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
	const [openSearchModal, closeSearchModal] = useModal(() => <SearchModal onClose={closeSearchModal} />);
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
	const openDiscoverPage = () => {
		window.open('https://mezon.ai/clans', '_blank');
	};

	return (
		<div className="relative overflow-hidden w-full h-full">
			<DraggableModalList currentClanId={currentClanId as string} />

			<MemoizedErrorModals />

			<div
				className={`flex h-dvh min-[480px]:pl-[72px] ${closeMenu ? (statusMenu ? 'pl-[72px]' : '') : ''} overflow-hidden text-gray-100 relative  `}
				onClick={handleClick}
			>
				{previewMode && <PreviewOnboardingMode />}
				{openPopupForward && <ForwardMessageModal />}
				<SidebarMenu openCreateClanModal={openCreateClanModal} openDiscoverPage={openDiscoverPage} />
				<Topbar isHidden={currentClanId !== '0' ? false : !directId} />
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

			<InternetStatusPopover />
		</div>
	);
}

export default MyApp;

type ShowModal = () => void;

const DirectUnreadList = memo(({ onClose }: { onClose?: () => void }) => {
	const listUnreadDM = useSelector(selectDirectsUnreadlist);
	const [listDmRender, setListDmRender] = useState(listUnreadDM);
	const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
	const [isVisible, setIsVisible] = useState(false);
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

	useEffect(() => {
		setHiddenItems(new Set());
		setTimeout(() => setIsVisible(true), 50);
	}, []);

	const handleItemClick = (itemId: string) => {
		setHiddenItems((prev) => new Set(prev).add(itemId));

		const visibleItems = listDmRender.filter((item) => !hiddenItems.has(item.id) && item.id !== itemId);
		if (visibleItems.length === 0) {
			setTimeout(() => {
				onClose?.();
			}, 300);
		}
	};

	const visibleItems = listDmRender.filter((item) => !hiddenItems.has(item.id));

	return (
		<div
			className={`transition-all duration-300 ease-out overflow-visible origin-top transform ${
				isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
			}`}
		>
			{!!visibleItems?.length &&
				visibleItems.map((dmGroupChatUnread, index) => (
					<div
						key={dmGroupChatUnread.id}
						className={`transition-all duration-200 ease-out transform ${
							isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
						}`}
						style={{
							transitionDelay: isVisible ? `${index * 50}ms` : '0ms'
						}}
					>
						<DirectUnread
							directMessage={dmGroupChatUnread}
							checkMoveOut={countUnreadRender.current}
							onMemberClick={() => handleItemClick(dmGroupChatUnread.id)}
							isHiding={hiddenItems.has(dmGroupChatUnread.id)}
						/>
					</div>
				))}
		</div>
	);
});

const SidebarMenu = memo(
	({ openCreateClanModal, openDiscoverPage }: { openCreateClanModal: ShowModal; openDiscoverPage: ShowModal }) => {
		const closeMenu = useSelector(selectCloseMenu);
		const statusMenu = useSelector(selectStatusMenu);
		const { setCloseMenu, setStatusMenu } = useMenu();
		const [isAtTop, setIsAtTop] = useState(true);
		const [showDmUnreadList, setShowDmUnreadList] = useState(false);
		const [hasUserToggled, setHasUserToggled] = useState(false);
		const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
		const unreadList = useSelector(selectDirectsUnreadlist);
		const [allwaysShowListUnread, setAllwaysShowListUnread] = useState(false);
		const { currentURL } = useAppParams();

		const handleClanClick = () => {
			if (unreadList.length > 0) {
				setShowDmUnreadList(true);
				setHasUserToggled(true);
			}
		};

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

		useEffect(() => {
			const currentUnreadCount = unreadList.length;

			if (currentUnreadCount > previousUnreadCount && currentUnreadCount > 0) {
				setShowDmUnreadList(true);
				setHasUserToggled(false);
			} else if (currentUnreadCount === 0 && showDmUnreadList) {
				setShowDmUnreadList(false);
				if (allwaysShowListUnread) {
					setAllwaysShowListUnread(false);
				}
			}

			setPreviousUnreadCount(currentUnreadCount);
		}, [unreadList.length, previousUnreadCount, showDmUnreadList, allwaysShowListUnread]);

		useEffect(() => {
			if (currentURL && currentURL.includes('/chat/direct/message/')) {
				if (allwaysShowListUnread && unreadList.length > 0) {
					setShowDmUnreadList(true);
				} else if (showDmUnreadList && !hasUserToggled && !allwaysShowListUnread) {
					setShowDmUnreadList(false);
				}
			}
		}, [currentURL, showDmUnreadList, hasUserToggled, allwaysShowListUnread, unreadList.length]);

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
				className={`contain-strict h-dvh fixed z-10 left-0 top-0 w-[72px] duration-100 ${isWindowsDesktop || isLinuxDesktop || isMacDesktop ? 'mt-[21px]' : ''} ${closeMenu ? (statusMenu ? '' : 'max-sm:hidden') : ''}`}
				onClick={() => handleMenu}
				id="menu"
			>
				<div
					className={`top-0 left-0 right-0 flex flex-col items-center pt-0 md:pb-32 pb-4 overflow-y-auto hide-scrollbar ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : 'h-[calc(100dvh_-_56px)]'} `}
					onScroll={(e) => setIsAtTop(e.currentTarget.scrollTop === 0)}
				>
					<div className={`flex flex-col items-center sticky top-0 z-10 bg-theme-primary w-full ${isAtTop ? 'pt-3' : 'py-3'}`}>
						<SidebarLogoItem
							onToggleUnreadList={() => {
								setShowDmUnreadList((prev) => !prev);
								setHasUserToggled(true);
								if (currentURL && currentURL.includes('/chat/direct/message/')) {
									setAllwaysShowListUnread((prev) => !prev);
								}
							}}
							isUnreadListOpen={showDmUnreadList}
						/>
						{showDmUnreadList && <DirectUnreadList onClose={() => setShowDmUnreadList(false)} />}
						{isAtTop && <div className="w-10 border-b border-color-theme mx-auto mt-3" />}
					</div>

					<div className="pb-12">
						<ClansList onClanClick={handleClanClick} />
						<div className="mt-3">
							<NavLinkComponent>
								<div
									className="flex items-center justify-between text-theme-primary group"
									onClick={openDiscoverPage}
									title="Discover"
								>
									<div className="w-[40px] h-[40px] rounded-xl theme-base-color flex justify-center items-center  cursor-pointer transition-all bg-add-clan-hover duration-200 size-12">
										<svg
											className="text-theme-primary-active size-5"
											viewBox="0 0 16 16"
											fill="currentColor"
											xmlns="http://www.w3.org/2000/svg"
											width={40}
											height={40}
										>
											<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
											<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
											<g id="SVGRepo_iconCarrier">
												{' '}
												<path d="M8 9C8.55229 9 9 8.55229 9 8C9 7.44772 8.55229 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55229 7.44772 9 8 9Z"></path>{' '}
												<path
													fillRule="evenodd"
													clipRule="evenodd"
													d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM6 6L4 11L5 12L10 10L12 5L11 4L6 6Z"
												></path>{' '}
											</g>
										</svg>
									</div>
								</div>
							</NavLinkComponent>
						</div>
						<div className="mt-3">
							<NavLinkComponent>
								<div
									className="flex items-center justify-between text-theme-primary group"
									onClick={openCreateClanModal}
									title="Create CLans"
									data-e2e={generateE2eId('clan_page.side_bar.button.add_clan')}
								>
									<div className="w-[40px] h-[40px] rounded-xl theme-base-color flex justify-center items-center  cursor-pointer transition-all bg-add-clan-hover duration-200 size-12">
										<p className="text-2xl font-semibold ">+</p>
									</div>
								</div>
							</NavLinkComponent>
						</div>
					</div>
				</div>
			</div>
		);
	},
	() => true
);

const ClansList = memo(({ onClanClick }: { onClanClick?: () => void }) => {
	const dispatch = useAppDispatch();
	const orderedClansWithGroups = useSelector(selectOrderedClansWithGroups);
	const currentClanId = useSelector(selectCurrentClanId);
	const isClanView = useSelector(selectClanView);
	const allClansEntities = useSelector(selectClansEntities);

	const [items, setItems] = useState<ClanGroupItem[]>([]);
	const { draggingState, handleMouseDown, handleMouseEnter } = useClanGroupDragAndDrop(items, setItems);

	useEffect(() => {
		dispatch(clansActions.initializeClanGroupOrder());
	}, [dispatch]);

	useEffect(() => {
		setItems(
			orderedClansWithGroups
				.filter((item): item is NonNullable<typeof item> => item != null)
				.map((item) => ({
					type: item.type,
					id: item.id,
					clanId: item.type === 'clan' ? item.clan?.id : undefined,
					groupId: item.type === 'group' && 'group' in item ? item.group?.id : undefined
				}))
		);
	}, [orderedClansWithGroups]);

	const { isDragging, draggedItem, dragPosition, dragOffset, overItem, dropZone, groupIntent, draggedFromGroup } = draggingState;

	const isActive = (clanId: string) => isClanView && currentClanId === clanId;

	const handleItemMouseEnter = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
		if (isDragging) {
			const rect = e.currentTarget.getBoundingClientRect();
			const mouseY = e.pageY || e.clientY;
			handleMouseEnter(id, mouseY, rect);
		}
	};

	const handleClanMouseDown = (e: React.MouseEvent<HTMLDivElement>, clanId: string, fromGroup: { groupId: string; clanId: string }) => {
		handleMouseDown(e, clanId, fromGroup);
	};

	return (
		<div className="flex flex-col gap-1 relative">
			{orderedClansWithGroups
				.filter((item): item is NonNullable<typeof item> => item != null)
				.map((item, index) => {
					const draggingThis = isDragging && draggedItem === item.id;
					const isOverThis = isDragging && overItem === item.id;
					const isGroupIntentTarget = groupIntent?.targetId === item.id;

					let hoverEffect = '';
					let dropIndicator = null;

					if (isOverThis && dropZone) {
						switch (dropZone) {
							case 'top':
								hoverEffect = 'border-t-4 border-blue-500';
								dropIndicator = (
									<div className="absolute -top-2 left-0 right-0 h-1 bg-blue-500 rounded-full animate-pulse shadow-md" />
								);
								break;
							case 'bottom':
								hoverEffect = 'border-b-4 border-blue-500';
								dropIndicator = (
									<div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500 rounded-full animate-pulse shadow-md" />
								);
								break;
							case 'center':
								if (isGroupIntentTarget) {
									hoverEffect = 'ring-4 ring-green-400 ring-opacity-90 bg-green-200 dark:bg-green-700/50 transform scale-105';
								} else {
									hoverEffect = 'ring-2 ring-green-300 ring-opacity-70 bg-green-100 dark:bg-green-800/30';
								}
								break;
						}
					}

					const gapId = `gap-${index}`;
					const isOverGap = isDragging && overItem === gapId;

					const draggedFromGroupStyling = draggedFromGroup && draggedFromGroup.clanId === item.id ? 'opacity-50 transform scale-95' : '';

					return (
						<div key={item.id}>
							{index === 0 && (
								<div
									className={`h-3 w-full relative transition-all duration-200 ${isOverGap ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
									onMouseEnter={(e) => {
										if (isDragging) {
											const rect = e.currentTarget.getBoundingClientRect();
											const mouseY = e.pageY || e.clientY;
											handleMouseEnter(gapId, mouseY, rect);
										}
									}}
									onMouseMove={(e) => {
										if (isDragging) {
											const rect = e.currentTarget.getBoundingClientRect();
											const mouseY = e.pageY || e.clientY;
											handleMouseEnter(gapId, mouseY, rect);
										}
									}}
								>
									{isOverGap && (
										<div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-500 rounded-full animate-pulse shadow-md transform -translate-y-1/2" />
									)}
								</div>
							)}

							<div
								className={`${item.type === 'group' && item.group.isExpanded ? '' : 'px-2'} relative transition-all duration-200 ${draggedFromGroupStyling}`}
								onMouseEnter={(e) => handleItemMouseEnter(e, item.id)}
								onMouseMove={(e) => handleItemMouseEnter(e, item.id)}
								onMouseDown={(e) => handleMouseDown(e, item.id)}
							>
								{item.type === 'clan' && item.clan ? (
									<SidebarClanItem
										option={item.clan}
										active={isActive(item.clan.clan_id || '')}
										className={`transition-all duration-200 ${draggingThis ? 'opacity-30' : ''} ${
											isGroupIntentTarget && dropZone === 'center' ? 'animate-pulse' : ''
										}`}
										onClanClick={onClanClick}
									/>
								) : item.type === 'group' && 'group' in item && item.group ? (
									<div onMouseEnter={(e) => handleItemMouseEnter(e, item.id)} onMouseMove={(e) => handleItemMouseEnter(e, item.id)}>
										<ClanGroup
											group={item.group}
											className={`transition-all duration-200 ${draggingThis ? 'opacity-30' : ''} ${
												isGroupIntentTarget ? 'animate-pulse' : ''
											}`}
											isGroupIntent={isGroupIntentTarget}
											onMouseDown={(e) => handleMouseDown(e, item.id)}
											onClanMouseDown={handleClanMouseDown}
											onClanClick={onClanClick}
										/>
									</div>
								) : null}

								{dropIndicator}

								{isOverThis && dropZone === 'center' && isGroupIntentTarget && (
									<div className="absolute inset-0 pointer-events-none">
										<div className="absolute top-[15%] bottom-[15%] left-0 right-0 border-2 border-dashed border-green-400 rounded bg-green-200/20 dark:bg-green-400/10" />
									</div>
								)}
							</div>

							{(() => {
								const nextGapId = `gap-${index + 1}`;
								const isOverNextGap = isDragging && overItem === nextGapId;

								return (
									<div
										className={`h-3 w-full relative transition-all duration-200 ${isOverNextGap ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
										onMouseEnter={(e) => {
											if (isDragging) {
												const rect = e.currentTarget.getBoundingClientRect();
												const mouseY = e.pageY || e.clientY;
												handleMouseEnter(nextGapId, mouseY, rect);
											}
										}}
										onMouseMove={(e) => {
											if (isDragging) {
												const rect = e.currentTarget.getBoundingClientRect();
												const mouseY = e.pageY || e.clientY;
												handleMouseEnter(nextGapId, mouseY, rect);
											}
										}}
									>
										{isOverNextGap && (
											<div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-500 rounded-full animate-pulse shadow-md transform -translate-y-1/2" />
										)}
									</div>
								);
							})()}
						</div>
					);
				})}

			{/* Floating dragged item */}
			{isDragging && draggedItem && dragPosition && (
				<div
					className="fixed pointer-events-none z-50 w-[40px] h-[40px] transform rotate-3 shadow-lg"
					style={{
						left: `${dragPosition.x - dragOffset.x}px`,
						top: `${dragPosition.y - dragOffset.y}px`
					}}
				>
					{(() => {
						if (draggedFromGroup) {
							const draggedClan = orderedClansWithGroups
								.filter((item): item is NonNullable<typeof item> => item != null)
								.find((item) => item.type === 'group' && 'group' in item && item.group?.clanIds.includes(draggedFromGroup.clanId));

							if (draggedClan && draggedClan.type === 'group' && 'group' in draggedClan) {
								const clan = allClansEntities[draggedFromGroup.clanId];
								if (clan) {
									return <SidebarClanItem option={clan} active={false} className="opacity-80" />;
								}
							}
						} else {
							const draggedItemData = orderedClansWithGroups
								.filter((item): item is NonNullable<typeof item> => item != null)
								.find((item) => item.id === draggedItem);
							if (draggedItemData?.type === 'clan' && draggedItemData.clan) {
								return <SidebarClanItem option={draggedItemData.clan} active={false} className="opacity-80" />;
							} else if (draggedItemData?.type === 'group' && 'group' in draggedItemData && draggedItemData.group) {
								return <ClanGroup group={draggedItemData.group} className="opacity-80" />;
							}
						}
						return null;
					})()}
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

	if (!toastError || toastError?.length < 1) {
		return null;
	}
	const error = toastError[0];
	return <ModalUnknowChannel key={error.id} isError={true} errMessage={error.message} idErr={error.id} />;
});
