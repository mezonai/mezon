import { usePermissionChecker } from '@mezon/core';
import type { RootState } from '@mezon/store';
import { authActions, selectAllAccount, selectCurrentClan, selectIsCommunityEnabled, useAppDispatch } from '@mezon/store';
import { LogoutModal } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ItemObjProps, ItemSetting, sideBarListItem } from '../ItemObj';
import SettingItem from '../SettingItem';

type SettingSidebarProps = {
	onClickItem?: (settingItem: ItemObjProps) => void;
	handleMenu: (value: boolean) => void;
	currentSetting: string;
	setIsShowDeletePopup: () => void;
};

const SettingSidebar = ({ onClickItem, handleMenu, currentSetting, setIsShowDeletePopup }: SettingSidebarProps) => {
	const [selectedButton, setSelectedButton] = useState<string | null>(currentSetting);
	const currentClan = useSelector(selectCurrentClan);
	const [isClanOwner, hasClanPermission] = usePermissionChecker([EPermission.clanOwner, EPermission.manageClan]);
	const userProfile = useSelector(selectAllAccount);
	const clanId = currentClan?.clan_id;
	const isCommunityEnabled = useSelector((state: RootState) => (clanId ? selectIsCommunityEnabled(state, clanId) : false));

	const sideBarListItemWithPermissions = sideBarListItem.map((sidebarItem) => {
		let filteredListItem = sidebarItem.listItem.filter((item) => {
			if ([ItemSetting.OVERVIEW, ItemSetting.ROLES, ItemSetting.INTEGRATIONS, ItemSetting.AUDIT_LOG].includes(item.id)) {
				return hasClanPermission;
			}
			if (item.id === ItemSetting.ON_BOARDING || item.id === ItemSetting.ON_COMUNITY) {
				return hasClanPermission;
			}
			return true;
		});

		filteredListItem = filteredListItem.map((item) =>
			item.id === ItemSetting.ON_COMUNITY && isCommunityEnabled ? { ...item, name: 'Community Overview' } : item
		);

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
		<div className="flex flex-row flex-1 justify-end">
			<div className="w-[220px] py-[60px] pl-5 pr-[6px]">
				<p className=" pl-[10px] pb-[6px] font-bold text-sm tracking-wider uppercase truncate text-theme-primary-active">
					{currentClan?.clan_name}
				</p>
				{sideBarListItemWithPermissions.map((sidebarItem) => (
					<div key={sidebarItem.title} className={`${sidebarItem.listItem.length > 0 ? 'mt-[5px] border-b-theme-primary' : ''}`}>
						{sidebarItem.title && sidebarItem.listItem.length > 0 && (
							<p className="select-none font-semibold px-[10px] py-[4px] text-xs uppercase ">{sidebarItem.title}</p>
						)}
						{sidebarItem.listItem.map((setting) => (
							<SettingItem
								key={setting.id}
								name={setting.name}
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
					>
						Delete clan
					</button>
				)}
				{openModal && <LogoutModal handleLogOut={handleLogOut} onClose={handleCloseModal} />}
			</div>
		</div>
	);
};

export default SettingSidebar;
