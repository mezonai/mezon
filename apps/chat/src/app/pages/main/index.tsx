import {
	FirstJoinPopup,
	ForwardMessageModal,
	MessageContextMenuProvider,
	MessageModalImage,
	ModalCreateClan,
	NavLinkComponent,
	SearchModal,
	SidebarClanItem,
	SidebarTooltip
} from '@mezon/components';
import { useAppParams, useAuth, useFriends, useMenu, useReference } from '@mezon/core';
import {
	accountActions,
	channelsActions,
	clansActions,
	getIsShowPopupForward,
	selectAllChannelMemberIds,
	selectAllClans,
	selectAllRoleIds,
	selectChatStreamWidth,
	selectClanView,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentStreamInfo,
	selectDirectsUnreadlist,
	selectDmGroupCurrentId,
	selectDmGroupCurrentType,
	selectIsShowChatStream,
	selectIsShowPopupQuickMess,
	selectOpenModalAttachment,
	selectStatusMenu,
	selectStreamChannelByChannelId,
	selectStreamMembersByChannelId,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';

import { Image } from '@mezon/ui';
import {
	IClan,
	ModeResponsive,
	Platform,
	TIME_OF_SHOWING_FIRST_POPUP,
	getPlatform,
	isLinuxDesktop,
	isMacDesktop,
	isWindowsDesktop
} from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import ChannelStream from '../channel/ChannelStream';
import { MainContent } from './MainContent';
import PopupQuickMess from './PopupQuickMess';
import DirectUnread from './directUnreads';

function MyApp() {
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
	const [isShowFirstJoinPopup, setIsShowFirstJoinPopup] = useState(isNewGuy);

	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const streamChannelMember = useSelector(selectStreamMembersByChannelId(currentStreamInfo?.streamId || ''));
	const channelStream = useSelector(selectStreamChannelByChannelId(currentStreamInfo?.streamId || ''));

	const { currentURL, directId } = useAppParams();
	const memberPath = `/chat/clans/${currentClanId}/member-safety`;

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			const platform = getPlatform();
			const prefixKey = platform === Platform.MACOS ? 'metaKey' : 'ctrlKey';
			if (event[prefixKey] && (event.key === 'k' || event.key === 'K')) {
				event.preventDefault();
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
	const isShowChatStream = useSelector(selectIsShowChatStream);
	const chatStreamWidth = useSelector(selectChatStreamWidth);

	useEffect(() => {
		if (currentChannel?.type === ChannelType.CHANNEL_TYPE_VOICE) {
			const urlVoice = `https://meet.google.com/${currentChannel.meeting_code}`;
			window.open(urlVoice, '_blank', 'noreferrer');
		}
	}, []);

	const isShowPopupQuickMess = useSelector(selectIsShowPopupQuickMess);

	const dispatch = useAppDispatch();

	const allUserIdsInChannel = useAppSelector((state) => selectAllChannelMemberIds(state, currentChannel?.id as string));
	const allRolesInClan = useSelector(selectAllRoleIds);

	const streamStyle = isShowChatStream
		? { width: `calc(100vw - ${chatStreamWidth}px - 352px)`, right: `${chatStreamWidth + 8}px` }
		: { width: closeMenu ? undefined : `calc(100vw - 344px)`, right: '0' };

	return (
		<div
			className={`flex h-screen min-[480px]:pl-[72px] ${closeMenu ? (statusMenu ? 'pl-[72px]' : '') : ''} overflow-hidden text-gray-100 relative dark:bg-bgPrimary bg-bgLightModeSecond`}
			onClick={handleClick}
		>
			{openPopupForward && <ForwardMessageModal openModal={openPopupForward} />}
			<SidebarMenu openCreateClanModal={openCreateClanModal} />
			<MainContent />
			{currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && (
				<div
					className={`fixed h-[calc(100vh_-_60px)] bottom-0 ${closeMenu ? (statusMenu ? 'hidden' : 'w-full') : isShowChatStream ? 'max-sm:hidden' : 'w-full'} ${currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && currentClanId !== '0' && memberPath !== currentURL ? 'flex flex-1 justify-center items-center' : 'hidden pointer-events-none'}`}
					style={streamStyle}
				>
					<ChannelStream
						key={currentStreamInfo?.streamId}
						hlsUrl={channelStream?.streaming_url}
						memberJoin={streamChannelMember}
						channelName={currentChannel?.channel_label}
						currentStreamInfo={currentStreamInfo}
					/>
				</div>
			)}

			{openModalAttachment && (
				<MessageContextMenuProvider allRolesInClan={allRolesInClan} allUserIdsInChannel={allUserIdsInChannel}>
					<MessageModalImage />
				</MessageContextMenuProvider>
			)}
			{isShowFirstJoinPopup && <FirstJoinPopup openCreateClanModal={openCreateClanModal} onclose={() => setIsShowFirstJoinPopup(false)} />}
			{isShowPopupQuickMess && <PopupQuickMess />}
		</div>
	);
}

export default MyApp;

type ShowModal = () => void;

const SidebarMenu = memo(
	({ openCreateClanModal }: { openCreateClanModal: ShowModal }) => {
		const dispatch = useAppDispatch();
		const clans = useSelector(selectAllClans);
		const listUnreadDM = useSelector(selectDirectsUnreadlist);
		const isClanView = useSelector(selectClanView);
		const appearanceTheme = useSelector(selectTheme);
		const { quantityPendingRequest } = useFriends();
		const currentDmId = useSelector(selectDmGroupCurrentId);
		const currentDmIType = useSelector(selectDmGroupCurrentType);
		const currentClanId = useSelector(selectCurrentClanId);
		const closeMenu = useSelector(selectCloseMenu);
		const statusMenu = useSelector(selectStatusMenu);
		const setModeResponsive = useCallback(
			(value: string) => {
				dispatch(channelsActions.setModeResponsive(value));
			},
			[dispatch]
		);
		const { setCloseMenu, setStatusMenu } = useMenu();

		const handleClickToJoinClan = () => {
			dispatch(clansActions.joinClan({ clanId: '0' }));
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
				className={`fixed z-10 left-0 top-0 w-[72px] dark:bg-bgTertiary bg-bgLightTertiary duration-100 ${isWindowsDesktop ? 'mt-[21px]' : ''} ${isMacDesktop || isLinuxDesktop ? 'pt-[18px]' : ''} ${closeMenu ? (statusMenu ? '' : 'hidden') : ''}`}
				onClick={() => handleMenu}
				id="menu"
			>
				<div
					className={`top-0 left-0 right-0 flex flex-col items-center py-4 px-3 overflow-y-auto hide-scrollbar ${isWindowsDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : 'h-screen'} `}
				>
					<div className="flex flex-col gap-3 ">
						<SidebarTooltip titleTooltip="Direct Message">
							<NavLink
								to={currentDmId ? `/chat/direct/message/${currentDmId}/${currentDmIType}` : '/chat/direct/friends'}
								onClick={() => {
									setModeResponsive(ModeResponsive.MODE_DM);
								}}
							>
								<NavLinkComponent active={!isClanView}>
									<div>
										<Image
											src={`assets/images/${appearanceTheme === 'dark' ? 'mezon-logo-black.svg' : 'mezon-logo-white.svg'}`}
											alt={'logoMezon'}
											width={48}
											height={48}
											className="clan w-full aspect-square object-cover"
											onClick={handleClickToJoinClan}
										/>
										{quantityPendingRequest !== 0 && (
											<div className="absolute border-[4px] dark:border-bgPrimary border-[#ffffff] w-[24px] h-[24px] rounded-full bg-colorDanger text-[#fff] font-bold text-[11px] flex items-center justify-center top-7 right-[-6px]">
												{quantityPendingRequest}
											</div>
										)}
									</div>
								</NavLinkComponent>
							</NavLink>
						</SidebarTooltip>
						{!!listUnreadDM?.length &&
							listUnreadDM.map((dmGroupChatUnread) => (
								<SidebarTooltip key={dmGroupChatUnread.id} titleTooltip={dmGroupChatUnread.channel_label}>
									<DirectUnread directMessage={dmGroupChatUnread} />
								</SidebarTooltip>
							))}
					</div>
					<div className="border-t-2 my-2 dark:border-t-borderDividerLight border-t-buttonLightTertiary duration-100 w-2/3"></div>
					<div className="flex flex-col gap-3 ">
						{clans.map((clan: IClan) => {
							return (
								<SidebarTooltip key={clan.clan_id} titleTooltip={clan.clan_name}>
									<SidebarClanItem
										linkClan={`/chat/clans/${clan.id}`}
										option={clan}
										active={isClanView && currentClanId === clan.clan_id}
									/>
								</SidebarTooltip>
							);
						})}
					</div>
					<div className="mt-3">
						<SidebarTooltip titleTooltip="Add Clan">
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
						</SidebarTooltip>
					</div>
				</div>
			</div>
		);
	},
	() => true
);
