import { useEscapeKeyClose, usePermissionChecker } from '@mezon/core';
import {
	deleteClan,
	fetchClanWebhooks,
	fetchWebhooks,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClan,
	selectCurrentClanId,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DeleteClanModal from '../DeleteClanModal';
import SettingComunity from '../SettingComunity';
import { ExitSetting } from '../SettingProfile';
import AuditLog from './AuditLog';
import ClanSettingOverview from './ClanSettingOverview';
import Integrations from './Integrations';
import { ItemObjProps, ItemSetting, listItemSetting } from './ItemObj';
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
	const { onClose, initialSetting } = props;
	const [currentSettingId, setCurrentSettingId] = useState<string>(() => (initialSetting ? initialSetting : listItemSetting[0].id));
	const currentSetting = useMemo(() => {
		return listItemSetting.find((item) => item.id === currentSettingId);
	}, [currentSettingId]);

	const dispatch = useAppDispatch();
	const [canManageClan] = usePermissionChecker([EPermission.manageClan]);

	const handleSettingItemClick = (settingItem: ItemObjProps) => {
		setCurrentSettingId(settingItem.id);
		if (settingItem.id === ItemSetting.INTEGRATIONS && canManageClan) {
			dispatch(fetchWebhooks({ channelId: '0', clanId: currentClanId }));
			dispatch(fetchClanWebhooks({ clanId: currentClanId }));
		}
	};

	const [menu, setMenu] = useState(true);
	const closeMenu = useSelector(selectCloseMenu);
	const [isShowDeletePopup, setIsShowDeletePopup] = useState<boolean>(false);
	const currentChannel = useSelector(selectCurrentChannel) || undefined;
	const currentClanId = useSelector(selectCurrentClanId) as string;
	const currentClan = useSelector(selectCurrentClan);
	const navigate = useNavigate();
	const [isCommunityEnabled, setIsCommunityEnabled] = useState(false);

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
	}, [currentSettingId]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	const handleDeleteCurrentClan = async () => {
		await deleteClan({ clanId: currentClanId || '' });
		navigate('/mezon');
	};
	return (
		<div ref={modalRef} tabIndex={-1} className="  flex fixed inset-0  w-screen z-30">
			<div className="flex flex-row w-screen">
				<div className="z-50 h-fit absolute top-5 right-5 block sbm:hidden">
					<div onClick={() => onClose()} className="rounded-full p-[10px] border-theme-primary">
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
				<div className={`flex-col flex-1 bg-theme-setting-nav text-theme-primary ${closeMenu && !menu ? 'hidden' : 'flex'}`}>
					<SettingSidebar
						onClickItem={handleSettingItemClick}
						handleMenu={(value: boolean) => setMenu(value)}
						currentSetting={currentSetting?.id || ''}
						setIsShowDeletePopup={() => setIsShowDeletePopup(true)}
					/>
				</div>

				<div className="flex-3 bg-theme-setting-primary text-theme-primary overflow-y-auto hide-scrollbar">
					<div className="flex flex-row flex-1 justify-start h-full">
						<div className="w-[740px] pl-7 sbm:pl-10 pr-7">
							<div className="relative max-h-full sbm:min-h-heightRolesEdit min-h-heightRolesEditMobile text-theme-primary">
								{!(currentSetting?.id === ItemSetting.INTEGRATIONS) ? (
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
								buttonLabel="Delete clan"
								title={`Delete '${currentClan?.clan_name}'`}
								onClick={handleDeleteCurrentClan}
							/>
						)}
						<ExitSetting onClose={onClose} />
					</div>
				</div>
				<div className="w-1 h-full"></div>
			</div>
		</div>
	);
};

export default ClanSetting;
