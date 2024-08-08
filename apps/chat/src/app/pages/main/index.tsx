import { ForwardMessageModal, ModalCreateClan, ModalListClans, NavLinkComponent, SearchModal } from '@mezon/components';
import { useAppNavigation, useAuth, useFriends, useMenu, useMessageValue, useReference } from '@mezon/core';
import {
	channelsActions,
	getIsShowPopupForward,
	selectAllClans,
	selectCloseMenu,
	selectCountNotifyByClanId,
	selectCurrentChannel,
	selectCurrentClan,
	selectDirectsUnreadlist,
	selectDmGroupCurrentId,
	selectDmGroupCurrentType,
	selectStatusMenu,
	selectTheme,
	useAppDispatch,
	usersClanActions,
} from '@mezon/store';
import { Image } from '@mezon/ui';
import { ModeResponsive } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { MainContent } from './MainContent';
import DirectUnreads from './directUnreads';

function MyApp() {
	const elementHTML = document.documentElement;
	const clans = useSelector(selectAllClans);
	const currentClan = useSelector(selectCurrentClan);
	const { userId } = useAuth();
	const [openListClans, setOpenListClans] = useState(false);
	const { navigate, toClanPage } = useAppNavigation();
	const pathName = useLocation().pathname;
	const [openCreateClanModal, closeCreateClanModal] = useModal(() => <ModalCreateClan open={true} onClose={closeCreateClanModal} />);
	const [openSearchModal, closeSearchModal] = useModal(() => <SearchModal onClose={closeSearchModal} open={true} />);
	const numberOfNotifyClan = useSelector(selectCountNotifyByClanId(currentClan?.clan_id ?? ''));
	const handleChangeClan = (clanId: string) => {
		navigate(toClanPage(clanId));
	};
	const listUnreadDM = useSelector(selectDirectsUnreadlist);
	const currentChannel = useSelector(selectCurrentChannel);
	const { quantityPendingRequest } = useFriends();

	const dispatch = useDispatch();
	const { setCloseMenu, setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
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

	const handleMenu = (event: any) => {
		const elementClick = event.target;
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

	const handleKeyDown = useCallback(
		(event: any) => {
			if (event.ctrlKey && event.key === 'k') {
				event.preventDefault();
				openSearchModal();
			}
		},
		[openSearchModal],
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

	const { setModeResponsive } = useMessageValue();
	const { setOpenOptionMessageState } = useReference();

	const handleClick = useCallback(() => {
		setOpenOptionMessageState(false);
	}, []);

	const currentDmId = useSelector(selectDmGroupCurrentId);
	const currentDmIType = useSelector(selectDmGroupCurrentType);

	const initClan = useMemo(() => {
		if (currentChannel?.id && currentClan?.id) {
			localStorage.setItem('initClan', currentClan?.id);
			return `/chat/clans/${currentClan?.id}/channels/${currentChannel?.id}`;
		} else if (currentClan?.id) {
			localStorage.setItem('initClan', currentClan?.id);
			return `/chat/clans/${currentClan?.id}`;
		} else if (clans?.length > 0) {
			localStorage.setItem('initClan', clans[0].id);
			return `/chat/clans/${clans[0].id}`;
		}
		return ``;
	}, [clans, currentChannel?.id, currentClan?.id]);

	const dispatchApp = useAppDispatch();
	useEffect(() => {
		const initClanId = localStorage.getItem('initClan');
		if (initClanId) {
			dispatchApp(channelsActions.fetchChannels({ clanId: initClanId }));
			dispatchApp(usersClanActions.fetchUsersClan({ clanId: initClanId }));
		}
	}, []);

	return (
		<div className="flex h-screen text-gray-100 overflow-hidden relative dark:bg-bgPrimary bg-bgLightModeSecond" onClick={handleClick}>
			{openPopupForward && <ForwardMessageModal openModal={openPopupForward} />}
			<div
				className={`w-[72px] overflow-visible py-4 px-3 space-y-2 dark:bg-bgTertiary bg-bgLightTertiary duration-100 scrollbar-hide  ${closeMenu ? (statusMenu ? '' : 'hidden') : ''}`}
				onClick={handleMenu}
				id="menu"
			>
				<NavLink
					to={currentDmId ? `/chat/direct/message/${currentDmId}/${currentDmIType}` : '/chat/direct/friends'}
					onClick={() => setModeResponsive(ModeResponsive.MODE_DM)}
				>
					<NavLinkComponent active={pathName.includes('direct')} clanName="Direct Messages">
						<div>
							<Image
								src={`assets/images/${appearanceTheme === 'dark' ? 'mezon-logo-black.svg' : 'mezon-logo-white.svg'}`}
								alt={'logoMezon'}
								width={48}
								height={48}
								className="clan w-full aspect-square object-cover"
							/>
							{quantityPendingRequest !== 0 && (
								<div className="absolute border-[4px] dark:border-bgPrimary border-[#ffffff] w-[24px] h-[24px] rounded-full bg-colorDanger text-[#fff] font-bold text-[11px] flex items-center justify-center top-7 right-[-6px]">
									{quantityPendingRequest}
								</div>
							)}
						</div>
					</NavLinkComponent>
				</NavLink>
				{listUnreadDM.map(
					(dmGroupChatUnread) =>
						dmGroupChatUnread?.last_sent_message?.sender_id !== userId && (
							<DirectUnreads key={dmGroupChatUnread.id} directMessage={dmGroupChatUnread} />
						),
				)}
				<div className="py-1 border-t-2 dark:border-t-borderDividerLight border-t-buttonLightTertiary duration-100 w-2/3 mx-auto my-2"></div>
				<div className="relative">
					{Boolean(initClan) && (
						<NavLink to={initClan}>
							<NavLinkComponent active={!pathName.includes('direct')} clanName={currentClan?.clan_name || clans[0]?.clan_name || ''}>
								{currentClan?.logo || clans[0]?.logo ? (
									<Image
										src={currentClan?.logo || clans[0]?.logo || ''}
										alt={currentClan?.clan_name || clans[0]?.clan_name || ''}
										placeholder="blur"
										width={48}
										blurdataurl={currentClan?.logo || clans[0]?.logo}
										className="min-w-12 min-h-12 object-cover clan"
									/>
								) : (
									(currentClan?.clan_name || clans[0]?.clan_name) && (
										<div className="w-[48px] h-[48px] dark:bg-bgTertiary bg-bgLightMode rounded-full flex justify-center items-center dark:text-contentSecondary text-textLightTheme text-[20px] clan">
											{(currentClan?.clan_name || clans[0]?.clan_name || '').charAt(0).toUpperCase()}
										</div>
									)
								)}
							</NavLinkComponent>
						</NavLink>
					)}
					{numberOfNotifyClan ? (
						<div className="w-[20px] h-[20px] flex items-center justify-center text-[13px] font-medium rounded-full bg-colorDanger absolute bottom-[-3px] right-[-3px] border-[2px] border-solid dark:border-bgPrimary border-white">
							{numberOfNotifyClan}
						</div>
					) : (
						<></>
					)}
				</div>
				<div
					className="relative py-2"
					onClick={() => {
						setOpenListClans(!openListClans);
					}}
				>
					<div className="size-12 dark:bg-bgPrimary bg-[#E1E1E1] flex justify-center items-center rounded-full cursor-pointer hover:rounded-xl dark:hover:bg-slate-800 hover:bg-bgLightModeButton  transition-all duration-200 ">
						<p className="text-2xl font-bold text-[#155EEF]">+</p>
					</div>
					<div className="absolute bottom-0 right-0 top-0 left-[60px] z-10 bg-bgSecondary">
						<ModalListClans
							options={clans}
							showModal={openListClans}
							idSelectedClan={currentClan?.clan_id}
							onChangeClan={handleChangeClan}
							createClan={openCreateClanModal}
							onClose={() => setOpenListClans(false)}
						/>
					</div>
				</div>
			</div>
			<MainContent />
		</div>
	);
}

export default MyApp;
