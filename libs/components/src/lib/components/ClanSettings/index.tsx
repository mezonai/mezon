import { useEscapeKeyClose, usePermissionChecker } from '@mezon/core';
import {
	deleteClan,
	fetchClanWebhooks,
	fetchWebhooks,
	onboardingActions,
	selectCloseMenu,
	selectCurrentClanId,
	selectCurrentClanName,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission, generateE2eId } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DeleteClanModal from '../DeleteClanModal';
import SettingComunity from '../SettingComunity';
import { ExitSetting } from '../SettingProfile';
import AuditLog from './AuditLog';
import ClanSettingOverview from './ClanSettingOverview';
import Integrations from './Integrations';
import type { ItemObjProps } from './ItemObj';
import { ItemSetting, createTranslatedListItemSetting } from './ItemObj';
import CategoryOrderSetting from './OrderCategorySetting';
import SettingEmoji from './SettingEmoji';
import ServerSettingMainRoles from './SettingMainRoles';
import SettingOnBoarding from './SettingOnBoarding';
import SettingSidebar from './SettingSidebar';
import SettingSoundEffect from './SettingSoundEffect';
import SettingSticker from './SettingSticker';

export type ModalSettingProps = {
	onClose: () => void;
	initialSetting?: string;
};

const ClanSetting = (props: ModalSettingProps) => {
	const { t } = useTranslation('clanSettings');
	const { onClose, initialSetting } = props;

	const listItemSetting = createTranslatedListItemSetting(t);

	const allSettings: ItemObjProps[] = useMemo(
		() => [
			{ id: ItemSetting.OVERVIEW, name: t('sidebar.items.overview') },
			{ id: ItemSetting.ROLES, name: t('sidebar.items.roles') },
			{ id: ItemSetting.CATEGORY_ORDER, name: t('sidebar.items.categoryOrder') },
			{ id: ItemSetting.EMOJI, name: t('sidebar.items.emoji') },
			{ id: ItemSetting.IMAGE_STICKERS, name: t('sidebar.items.imageStickers') },
			{ id: ItemSetting.VOIDE_STICKERS, name: t('sidebar.items.voiceStickers') },
			{ id: ItemSetting.INTEGRATIONS, name: t('sidebar.items.integrations') },
			{ id: ItemSetting.AUDIT_LOG, name: t('sidebar.items.auditLog') },
			{ id: ItemSetting.ON_BOARDING, name: t('sidebar.items.onboarding') },
			{ id: ItemSetting.ON_COMUNITY, name: t('sidebar.items.enableCommunity') }
		],
		[t]
	);
	const [currentSettingId, setCurrentSettingId] = useState<string>(() => (initialSetting ? initialSetting : listItemSetting[0].id));
	const currentSetting = useMemo(() => {
		return allSettings.find((item) => item.id === currentSettingId);
	}, [currentSettingId, allSettings]);

	const dispatch = useAppDispatch();
	const [canManageClan, canManagerChannel] = usePermissionChecker([EPermission.manageClan, EPermission.manageChannel]);

	const handleSettingItemClick = (settingItem: ItemObjProps) => {
		setCurrentSettingId(settingItem.id);
		if (window.innerWidth < 768) {
			setIsSidebarOpen(false);
		}
		if (settingItem.id === ItemSetting.INTEGRATIONS) {
			if (canManageClan) {
				dispatch(fetchClanWebhooks({ clanId: currentClanId }));
				dispatch(fetchWebhooks({ channelId: '0', clanId: currentClanId }));
			} else if (canManagerChannel) {
				dispatch(fetchWebhooks({ channelId: '0', clanId: currentClanId }));
			}
		}
	};

	const [menu, setMenu] = useState(true);
	const closeMenu = useSelector(selectCloseMenu);
	const [isShowDeletePopup, setIsShowDeletePopup] = useState<boolean>(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
	const currentClanId = useSelector(selectCurrentClanId) as string;
	const currentClanName = useSelector(selectCurrentClanName);
	const navigate = useNavigate();
	const [_isCommunityEnabled, setIsCommunityEnabled] = useState(false);

	const handleMenuBtn = () => {
		setIsSidebarOpen((prev) => !prev);
	};

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setIsSidebarOpen(true);
			} else {
				setIsSidebarOpen(false);
			}
		};
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const currentSettingPage = () => {
		switch (currentSettingId) {
			case ItemSetting.OVERVIEW:
				return <ClanSettingOverview />;
			case ItemSetting.ROLES:
				return <ServerSettingMainRoles />;
			case ItemSetting.INTEGRATIONS:
				return <Integrations isClanSetting />;
			case ItemSetting.EMOJI:
				return <SettingEmoji parentRef={modalRef} />;
			// case ItemSetting.NOTIFICATION_SOUND:
			// 	return <NotificationSoundSetting />;
			case ItemSetting.IMAGE_STICKERS:
				return <SettingSticker parentRef={modalRef} />;
			case ItemSetting.VOIDE_STICKERS:
				return <SettingSoundEffect />;
			case ItemSetting.CATEGORY_ORDER:
				return <CategoryOrderSetting />;
			case ItemSetting.AUDIT_LOG:
				return <AuditLog currentClanId={currentClanId} />;
			case ItemSetting.ON_BOARDING:
				return <SettingOnBoarding onClose={onClose} />;
			case ItemSetting.ON_COMUNITY:
				return <SettingComunity clanId={currentClanId} onClose={onClose} onCommunityEnabledChange={setIsCommunityEnabled} />;
		}
	};

	useEffect(() => {
		if (currentSettingId === ItemSetting.DELETE_SERVER) {
			setIsShowDeletePopup(true);
		}
		if (currentSettingId === ItemSetting.ON_BOARDING) {
			dispatch(onboardingActions.closeToOnboard());
		}
	}, [currentSettingId, dispatch]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	const handleDeleteCurrentClan = async () => {
		await dispatch(deleteClan({ clanId: currentClanId || '' }));
		navigate('/mezon');
	};
	return (
		<div ref={modalRef} tabIndex={-1} className="  flex fixed inset-0  w-screen z-30" data-e2e={generateE2eId('clan_page.settings')}>
			<div className="flex flex-col w-screen h-full">
				<div className="flex sbm:hidden fixed top-0 left-0 right-0 justify-between items-center z-[60] bg-theme-setting-primary pb-4 pt-4 px-4">
					<div className="absolute inset-0 bg-gradient-to-b from-theme-setting-primary via-theme-setting-primary/95 to-transparent pointer-events-none" />
					<div className="relative z-10">
						{!isSidebarOpen ? (
							<button className="text-theme-primary w-[30px] h-[30px] text-theme-primary-hover cursor-pointer" onClick={handleMenuBtn}>
								<Icons.OpenMenu className="w-full h-full" />
							</button>
						) : (
							<button className="text-theme-primary w-[30px] h-[30px] text-theme-primary-hover cursor-pointer" onClick={handleMenuBtn}>
								<Icons.ArrowLeftCircleActive className="w-full h-full" />
							</button>
						)}
					</div>
					<div onClick={onClose} className="relative z-10 cursor-pointer">
						<Icons.CloseIcon className="text-theme-primary w-[30px] h-[30px] text-theme-primary-hover" />
					</div>
				</div>

				<div className="flex flex-row flex-1 w-screen overflow-hidden">
					{isSidebarOpen && (
						<div className="fixed inset-0 bg-black bg-opacity-50 z-40 sbm:hidden" onClick={() => setIsSidebarOpen(false)} />
					)}
					<div
						className={`${
							!isSidebarOpen ? 'hidden sbm:flex' : 'flex fixed sbm:relative left-0 top-0 h-full z-50 sbm:z-auto'
						} w-1/6 xl:w-1/4 min-w-56 relative bg-theme-setting-nav text-theme-primary ${closeMenu && !menu && window.innerWidth >= 768 ? 'hidden' : ''}`}
					>
						<div className="overflow-y-auto sbm:h-auto sbm:flex-1 h-full">
							<SettingSidebar
								onClickItem={handleSettingItemClick}
								handleMenu={(value: boolean) => setMenu(value)}
								currentSetting={currentSettingId}
								setIsShowDeletePopup={() => setIsShowDeletePopup(true)}
							/>
						</div>
					</div>

					<div className="flex-3 bg-theme-setting-primary text-theme-primary overflow-y-auto hide-scrollbar">
						<div className="flex flex-row flex-1 justify-start h-full">
							<div className="w-full max-w-[740px] pl-4 pr-4 sbm:pl-10 sbm:pr-7">
								<div className="relative max-h-full sbm:min-h-heightRolesEdit min-h-heightRolesEditMobile text-theme-primary pt-[70px] sbm:pt-0">
									{!(currentSetting?.id === ItemSetting.INTEGRATIONS || currentSetting?.id === ItemSetting.AUDIT_LOG) ? (
										<h2 className="text-xl font-semibold mb-5 sbm:mt-[60px] mt-[10px] text-theme-primary-active">
											{currentSetting?.name}
										</h2>
									) : (
										''
									)}
									{currentSettingPage()}
								</div>
							</div>
							{isShowDeletePopup && (
								<DeleteClanModal
									onClose={() => setIsShowDeletePopup(false)}
									buttonLabel={t('sidebar.deleteClan')}
									title={t('deleteClanTitle', { clanName: currentClanName })}
									onClick={handleDeleteCurrentClan}
								/>
							)}
							<ExitSetting onClose={onClose} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ClanSetting;
