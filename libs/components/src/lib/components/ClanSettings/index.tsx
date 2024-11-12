import { useEscapeKeyClose, usePermissionChecker } from '@mezon/core';
import { fetchWebhooks, selectCloseMenu, selectCurrentChannel, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import DeleteClanModal from '../DeleteClanModal';
import { ExitSetting } from '../SettingProfile';
import ClanSettingOverview from './ClanSettingOverview';
import Integrations from './Integrations';
import { ItemObjProps, ItemSetting, listItemSetting } from './ItemObj';
import NotificationSoundSetting from './NotificationSoundSetting';
import CategoryOrderSetting from './OrderCategorySetting';
import SettingEmoji from './SettingEmoji';
import ServerSettingMainRoles from './SettingMainRoles';
import SettingOnBoarding from './SettingOnBoarding';
import SettingSidebar from './SettingSidebar';
import SettingSticker from './SettingSticker';

export type ModalSettingProps = {
	onClose: () => void;
	initialSetting?: string;
};

const ClanSetting = (props: ModalSettingProps) => {
	const { onClose, initialSetting } = props;
	const [currentSettingId, setCurrentSettingId] = useState<string>(() => (initialSetting ? initialSetting : listItemSetting[0].id));
	const currentSetting = useMemo(() => {
		return listItemSetting.find((item) => item.id === currentSettingId);
	}, [currentSettingId]);

	const handleSettingItemClick = (settingItem: ItemObjProps) => {
		setCurrentSettingId(settingItem.id);
	};

	const [canManageClan] = usePermissionChecker([EPermission.manageClan]);

	const [menu, setMenu] = useState(true);
	const closeMenu = useSelector(selectCloseMenu);
	const [isShowDeletePopup, setIsShowDeletePopup] = useState<boolean>(false);
	const currentChannel = useSelector(selectCurrentChannel) || undefined;

	const currentSettingPage = () => {
		switch (currentSettingId) {
			case ItemSetting.OVERVIEW:
				return <ClanSettingOverview />;
			case ItemSetting.ROLES:
				return <ServerSettingMainRoles />;
			case ItemSetting.INTEGRATIONS:
				return <Integrations isClanSetting currentChannel={currentChannel} />;
			case ItemSetting.EMOJI:
				return <SettingEmoji parentRef={modalRef} />;
			case ItemSetting.NOTIFICATION_SOUND:
				return <NotificationSoundSetting />;
			case ItemSetting.STICKERS:
				return <SettingSticker parentRef={modalRef} />;
			case ItemSetting.CATEGORY_ORDER:
				return <CategoryOrderSetting />;
			case ItemSetting.ON_BOARDING:
				return <SettingOnBoarding />;
		}
	};
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId) as string;
	useEffect(() => {
		if (canManageClan) {
			dispatch(fetchWebhooks({ channelId: '0', clanId: currentClanId }));
		}
	}, [canManageClan, currentClanId, dispatch]);

	useEffect(() => {
		if (currentSettingId === ItemSetting.DELETE_SERVER) {
			setIsShowDeletePopup(true);
		}
	}, [currentSettingId]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	return (
		<div ref={modalRef} tabIndex={-1} className="  flex fixed inset-0  w-screen z-30">
			<div className="flex flex-row w-screen">
				<div className="z-50 h-fit absolute top-5 right-5 block sbm:hidden">
					<div
						onClick={() => onClose()}
						className="rounded-full p-[10px] border-2 dark:border-[#a8a6a6] border-black cursor-pointer dark:text-[#a8a6a6] text-black"
					>
						<Icons.CloseButton className="w-4" />
					</div>
				</div>
				<div className="z-50 h-fit absolute top-5 left-5 block sbm:hidden">
					<button
						className={`bg-[#AEAEAE] w-[30px] h-[30px] rounded-[50px] font-bold transform hover:scale-105 hover:bg-slate-400 transition duration-300 ease-in-out flex justify-center items-center ${menu ? 'rotate-90' : '-rotate-90'}`}
						onClick={() => setMenu(!menu)}
					>
						<Icons.ArrowDown defaultFill="white" defaultSize="w-[20px] h-[30px]" />
					</button>
				</div>
				<div className={`flex-col flex-1 dark:bg-bgSecondary bg-bgLightSecondary ${closeMenu && !menu ? 'hidden' : 'flex'}`}>
					<SettingSidebar
						onClickItem={handleSettingItemClick}
						handleMenu={(value: boolean) => setMenu(value)}
						currentSetting={currentSetting?.id || ''}
						setIsShowDeletePopup={() => setIsShowDeletePopup(true)}
					/>
				</div>

				<div className="flex-3 bg-white dark:bg-bgPrimary overflow-y-auto hide-scrollbar">
					<div className="flex flex-row flex-1 justify-start h-full">
						<div className="w-[740px] pl-7 sbm:pl-10 pr-7">
							<div className="relative max-h-full sbm:min-h-heightRolesEdit min-h-heightRolesEditMobile">
								{!(currentSetting?.id === ItemSetting.INTEGRATIONS) ? (
									<h2 className="text-xl font-semibold mb-5 dark:text-textDarkTheme text-textLightTheme sbm:mt-[60px] mt-[10px]">
										{currentSetting?.name}
									</h2>
								) : (
									''
								)}
								{currentSettingPage()}
							</div>
						</div>
						{isShowDeletePopup && <DeleteClanModal onClose={() => setIsShowDeletePopup(false)} />}
						<ExitSetting onClose={onClose} />
					</div>
				</div>
				<div className="w-1 h-full dark:bg-bgPrimary bg-bgLightModeSecond"></div>
			</div>
		</div>
	);
};

export default ClanSetting;
