import { usePermissionChecker } from '@mezon/core';
import type { RootState } from '@mezon/store';
import { authActions, selectAllAccount, selectCurrentClanId, selectCurrentClanName, selectIsCommunityEnabled, useAppDispatch } from '@mezon/store';
import { LogoutModal } from '@mezon/ui';
import { EPermission, generateE2eId } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { ItemObjProps } from '../ItemObj';
import { ItemSetting, sideBarListItem } from '../ItemObj';
import SettingItem from '../SettingItem';

type SettingSidebarProps = {
	onClickItem?: (settingItem: ItemObjProps) => void;
	handleMenu: (value: boolean) => void;
	currentSetting: string;
	setIsShowDeletePopup: () => void;
};

const SettingSidebar = ({ onClickItem, handleMenu, currentSetting, setIsShowDeletePopup }: SettingSidebarProps) => {
	const { t } = useTranslation('clanSettings');
	const [selectedButton, setSelectedButton] = useState<string | null>(currentSetting);
	const clanId = useSelector(selectCurrentClanId);
	const currentClanName = useSelector(selectCurrentClanName);
	const [isClanOwner, hasClanPermission, hasChannelPermission] = usePermissionChecker([
		EPermission.clanOwner,
		EPermission.manageClan,
		EPermission.manageChannel
	]);
	const userProfile = useSelector(selectAllAccount);
	const isCommunityEnabled = useSelector((state: RootState) => (clanId ? selectIsCommunityEnabled(state, clanId) : false));

	const getTranslatedItemName = (item: ItemObjProps) => {
		const translationMap: Record<string, string> = {
			[ItemSetting.OVERVIEW]: t('sidebar.items.overview'),
			[ItemSetting.ROLES]: t('sidebar.items.roles'),
			[ItemSetting.EMOJI]: t('sidebar.items.emoji'),
			[ItemSetting.IMAGE_STICKERS]: t('sidebar.items.imageStickers'),
			[ItemSetting.VOIDE_STICKERS]: t('sidebar.items.voiceStickers'),
			[ItemSetting.CATEGORY_ORDER]: t('sidebar.items.categoryOrder'),
			[ItemSetting.INTEGRATIONS]: t('sidebar.items.integrations'),
			[ItemSetting.AUDIT_LOG]: t('sidebar.items.auditLog'),
			[ItemSetting.ON_BOARDING]: t('sidebar.items.onboarding'),
			[ItemSetting.ON_COMUNITY]: isCommunityEnabled ? t('sidebar.communityOverview') : t('sidebar.items.enableCommunity')
		};
		return translationMap[item.id] || item.name;
	};

	const getTranslatedSectionTitle = (title: string) => {
		const sectionMap: Record<string, string> = {
			Apps: t('sidebar.sectionTitles.apps'),
			Moderation: t('sidebar.sectionTitles.moderation'),
			Emotions: t('sidebar.sectionTitles.emotions')
		};
		return sectionMap[title] || title;
	};

	const sideBarListItemWithPermissions = sideBarListItem.map((sidebarItem) => {
		const filteredListItem = sidebarItem.listItem.filter((item) => {
			if (item.id === ItemSetting.INTEGRATIONS) {
				return hasClanPermission || hasChannelPermission;
			}
			if ([ItemSetting.OVERVIEW, ItemSetting.ROLES, ItemSetting.AUDIT_LOG].includes(item.id)) {
				return hasClanPermission;
			}
			if (item.id === ItemSetting.ON_BOARDING || item.id === ItemSetting.ON_COMUNITY) {
				return hasClanPermission;
			}
			return true;
		});

		return {
			...sidebarItem,
			listItem: filteredListItem
		};
	});

	const [openModal, setOpenModal] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const handleLogOut = () => {
		dispatch(authActions.logOut({ device_id: userProfile?.user?.username || '', platform: 'desktop' }));
	};
	const handleCloseModal = () => {
		setOpenModal(false);
		setSelectedButton('');
	};

	const handleClickButtonSidebar = (settingItem: ItemObjProps) => {
		onClickItem?.(settingItem);
		setSelectedButton(settingItem.id);
	};

	return (
		<div className="flex flex-row flex-1 justify-end max-sbm:justify-center">
			<div className="w-[220px] py-[60px] pl-5 pr-[6px]">
				<p className=" pl-[10px] pb-[6px] font-bold text-sm tracking-wider uppercase truncate text-theme-primary-active">{currentClanName}</p>
				{sideBarListItemWithPermissions.map((sidebarItem, index) => (
					<div
						key={`${sidebarItem.title}_${index}`}
						className={`${sidebarItem.listItem.length > 0 ? 'mt-[5px] border-b-theme-primary' : ''}`}
					>
						{sidebarItem.title && sidebarItem.listItem.length > 0 && (
							<p className="select-none font-semibold px-[10px] py-[4px] text-xs uppercase ">
								{getTranslatedSectionTitle(sidebarItem.title)}
							</p>
						)}
						{sidebarItem.listItem.map((setting) => (
							<SettingItem
								key={setting.id}
								name={getTranslatedItemName(setting)}
								active={selectedButton === setting.id}
								onClick={() => handleClickButtonSidebar(setting)}
								handleMenu={handleMenu}
								setting={setting}
							/>
						))}
					</div>
				))}
				{isClanOwner && (
					<button
						className={`mt-[5px] text-red-500 w-full py-1 px-[10px] mb-1 text-[16px] font-medium rounded text-left hover:bg-[#f67e882a]`}
						onClick={setIsShowDeletePopup}
						data-e2e={generateE2eId('clan_page.settings.sidebar.delete')}
					>
						{t('sidebar.deleteClan')}
					</button>
				)}
				{openModal && <LogoutModal handleLogOut={handleLogOut} onClose={handleCloseModal} />}
			</div>
		</div>
	);
};

export default SettingSidebar;
