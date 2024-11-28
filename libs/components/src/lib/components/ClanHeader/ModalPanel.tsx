import { useEscapeKeyClose, useMarkAsRead, useOnClickOutside, usePermissionChecker } from '@mezon/core';
import { selectCurrentClanId } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import React, { RefObject, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ItemModal from './ItemModal';

type ModalPanelProps = {
	handleShowCreateCategory: () => void;
	handleShowInviteClanModal: () => void;
	handleShowServerSettings: () => void;
	handleShowNotificationSetting: () => void;
	toggleShowEmptyCategory: () => void;
	toggleLeaveClanPopup: () => void;
	isShowEmptyCategory: boolean;
	isClanOwner: boolean;
	setIsShowModalPanelClan: (show: boolean) => void;
	rootRef: RefObject<HTMLElement>;
};

const ModalPanel: React.FC<ModalPanelProps> = ({
	handleShowCreateCategory,
	handleShowInviteClanModal,
	handleShowServerSettings,
	toggleShowEmptyCategory,
	toggleLeaveClanPopup,
	handleShowNotificationSetting,
	isShowEmptyCategory,
	isClanOwner,
	setIsShowModalPanelClan,
	rootRef
}) => {
	const [canManageClan] = usePermissionChecker([EPermission.clanOwner, EPermission.manageClan]);
	const currentClanId = useSelector(selectCurrentClanId);
	useEscapeKeyClose(rootRef, () => setIsShowModalPanelClan(false));
	useOnClickOutside(rootRef, () => setIsShowModalPanelClan(false));

	const { handleMarkAsReadClan, statusMarkAsReadClan } = useMarkAsRead();
	useEffect(() => {
		if (statusMarkAsReadClan === 'success' || statusMarkAsReadClan === 'error') {
			setIsShowModalPanelClan(false);
		}
	}, [statusMarkAsReadClan]);
	return (
		<div
			onClick={(e) => e.stopPropagation()}
			className="dark:bg-bgProfileBody bg-white p-2 rounded w-[250px] absolute left-1/2 top-[68px] z-[9999] transform translate-x-[-50%] shadow-xl"
		>
			<div className="flex flex-col pb-1 mb-1 border-b-[0.08px] border-b-[#6A6A6A] last:border-b-0 last:mb-0 last:pb-0">
				{canManageClan && <ItemModal onClick={handleShowCreateCategory} children="Create Category" endIcon={<Icons.CreateCategoryIcon />} />}
				<ItemModal
					onClick={statusMarkAsReadClan === 'pending' ? undefined : () => handleMarkAsReadClan(currentClanId as string)}
					disabled={statusMarkAsReadClan === 'pending'}
				>
					{statusMarkAsReadClan === 'pending' ? 'Processing...' : 'Mark As Read'}
				</ItemModal>

				<ItemModal
					onClick={handleShowInviteClanModal}
					children="Invite People"
					endIcon={<Icons.AddPerson className="dark:text-[#AEAEAE] text-colorTextLightMode group-hover:text-white" />}
				/>
				<ItemModal
					onClick={handleShowServerSettings}
					children="Clan Settings"
					endIcon={<Icons.SettingProfile className="dark:text-[#AEAEAE] text-colorTextLightMode group-hover:text-white" />}
				/>
				<ItemModal
					onClick={handleShowNotificationSetting}
					children="Notification Settings"
					endIcon={<Icons.Bell className="dark:text-[#AEAEAE] text-colorTextLightMode group-hover:text-white" />}
				/>
				<button
					onClick={toggleShowEmptyCategory}
					className="flex items-center w-full justify-between rounded-sm hover:text-white group pr-2 hover:bg-bgSelectItem group"
				>
					<li className="text-[14px] dark:text-[#AEAEAE] text-colorTextLightMode group-hover:text-white font-medium w-full py-[6px] px-[8px] text-left cursor-pointer list-none ">
						Show Empty Categories
					</li>
					<input
						className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
                            bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
                            after:bg-slate-500 after:transition-all checked:bg-blue-200 checked:after:left-4 checked:after:bg-blue-500
                            hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-blue-300 checked:after:hover:bg-blue-600
                            focus:outline-none checked:focus:bg-blue-400 checked:after:focus:bg-blue-700 focus-visible:outline-none disabled:cursor-not-allowed
                            disabled:bg-slate-200 disabled:after:bg-slate-300"
						type="checkbox"
						checked={isShowEmptyCategory}
						id="id-c01"
						onChange={toggleShowEmptyCategory}
					/>
				</button>
				{!isClanOwner && (
					<button
						onClick={toggleLeaveClanPopup}
						className="flex items-center w-full justify-between rounded-sm hover:bg-red-600 text-red-600 hover:text-white group pr-2"
					>
						<li className="text-[14px]  font-medium w-full py-[6px] px-[8px] text-left cursor-pointer list-none ">Leave Clan</li>
						<div className="flex items-center justify-center h-[18px] w-[18px]">
							<Icons.LeaveClanIcon className="text-red-600 group-hover:text-white" />
						</div>
					</button>
				)}
			</div>
		</div>
	);
};

export default ModalPanel;
