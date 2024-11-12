import { usePermissionChecker } from '@mezon/core';
import { authActions, selectCurrentClan, useAppDispatch } from '@mezon/store';
import { LogoutModal } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
	const navigate = useNavigate();
	const sideBarListItemWithPermissions = sideBarListItem.map((sidebarItem) => {
		const filteredListItem = sidebarItem.listItem.filter((item) => {
			if ([ItemSetting.OVERVIEW, ItemSetting.ROLES, ItemSetting.INTEGRATIONS].includes(item.id)) {
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
		dispatch(authActions.logOut());
	};
	const handleCloseModal = () => {
		setOpenModal(false);
		setSelectedButton('');
	};

	const handleClickButtonSidebar = (settingItem: ItemObjProps) => {
		if (settingItem.id === ItemSetting.APP_DIRECTORY) {
			navigate('/application-directory');
			return;
		}
		onClickItem?.(settingItem);
		setSelectedButton(settingItem.id);
	};

	return (
		<div className="flex flex-row flex-1 justify-end">
			<div className="w-[220px] py-[60px] pl-5 pr-[6px]">
				<p className="text-[#84ADFF] pl-[10px] pb-[6px] font-bold text-sm tracking-wider uppercase truncate">{currentClan?.clan_name}</p>
				{sideBarListItemWithPermissions.map((sidebarItem) => (
					<div key={sidebarItem.title} className={'mt-[5px] border-b-[0.08px] dark:border-borderDividerLight border-bgModifierHoverLight'}>
						{sidebarItem.title && (
							<p className="select-none font-semibold px-[10px] py-[4px] text-xs uppercase dark:text-textSecondary text-textSecondary">
								{sidebarItem.title}
							</p>
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
						className={`mt-[5px] text-red-500 w-full py-1 px-[10px] mb-1 text-[16px] font-medium rounded text-left dark:hover:bg-bgHover hover:bg-bgModifierHoverLight`}
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
