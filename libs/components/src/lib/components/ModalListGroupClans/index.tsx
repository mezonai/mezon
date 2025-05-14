// SidebarClanGroupItem.tsx

import { useCustomNavigate } from '@mezon/core';
import { appActions, getStore, selectBadgeCountByClanId, selectIsUseProfileDM, useAppDispatch } from '@mezon/store';

import { Image } from '@mezon/ui';
import { IClan, createImgproxyUrl } from '@mezon/utils';
import React, { memo } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { Coords } from '../ChannelLink';
import PanelClan from '../PanelClan';

export type SidebarClanGroupItemProps = {
	group: { id: string; clanIds: string[] };
	clanMap: Record<string, IClan>;
	active?: boolean;
	expanded: boolean;
	onToggle: () => void;
	onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
	onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
	overItemId?: string;
};

const SidebarClanGroupItem = ({
	group,
	clanMap,
	active,
	expanded,
	onToggle,
	onMouseDown,
	className = '',
	overItemId,
}: SidebarClanGroupItemProps) => {
	const dispatch = useAppDispatch();
	const navigate = useCustomNavigate();

	const [coords, setCoords] = React.useState<Coords>({ mouseX: 0, mouseY: 0, distanceToBottom: 0 });

	const defaultClan: IClan = { id: '' };

	// Hook mở modal context menu (click chuột phải)
	const [openRightClickModal, closeRightClickModal] = useModal(
		() => (
			<PanelClan
				coords={coords}
				setShowClanListMenuContext={closeRightClickModal}
				clan={clanMap[group.clanIds[0]] || defaultClan}
			/>
		),
		[coords]
	);

	const isShowDmProfile = useSelector((state) => selectIsUseProfileDM(getStore().getState()));

	const avatars = group.clanIds.slice(0, 4).map((cid, idx) => {

		const clan = clanMap[cid];
		if (!clan) return null;
		return clan.logo ? (
			<Image
				key={cid}
				draggable="false"
				src={createImgproxyUrl(clan.logo, { width: 40, height: 40, resizeType: 'fit' }) || ''}
				className={`w-[28px] h-[28px] object-cover rounded-lg border-2 border-white ${idx > 0 ? '-ml-2' : ''}`}
				placeholder="blur"
				blurdataurl={clan.logo}
			/>
		) : (
			<div
				key={cid}
				className={`w-[28px] h-[28px] ${idx > 0 ? '-ml-2' : ''} bg-bgLightMode dark:bg-bgSecondary flex items-center justify-center rounded-lg text-[14px]`}
			>
				{clan.clan_name?.charAt(0).toUpperCase()}
			</div>
		);
	});

	const handleClick = () => {

		const firstClanId = group.clanIds[0];
		if (firstClanId) {
			const store = getStore();
			const clan = clanMap[firstClanId];
			const channelId = clan.welcome_channel_id;
			const link = `/chat/clans/${firstClanId}${channelId ? `/channels/${channelId}` : ''}`;
			navigate(link);
			if (isShowDmProfile) {
				requestIdleCallback(() => {
					dispatch(appActions.setIsUseProfileDM(false));
				});
			}
		}
	};

	const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		const mouseX = e.clientX;
		const mouseY = e.clientY;
		const distanceToBottom = window.innerHeight - e.clientY;
		setCoords({ mouseX, mouseY, distanceToBottom });
		openRightClickModal();
	};

	const badgeCounts = useSelector((state: any) => group.clanIds.map((cid) => (selectBadgeCountByClanId(cid)(state) || 0)));
	const badgeCountGroup = badgeCounts.reduce((sum, badge) => sum + badge, 0);

	const displayIds = group.clanIds.slice(0, 4);

	const cornerStyles = [
		'absolute top-0 left-0',
		'absolute top-0 right-0',
		'absolute bottom-0 left-0',
		'absolute bottom-0 right-0',

	];

	return (
		<div
			onClick={(e) => {
				e.stopPropagation();
				onToggle();
			}}
			onMouseDown={onMouseDown}
			onContextMenu={handleContextMenu}
			data-id={group.id}
			className={`
				relative w-[40px] h-[40px] flex items-center justify-center cursor-pointer
				rounded-lg transition-colors
				${className}
				${overItemId === group.id ? 'ring-2 ring-sky-400' : ''}
				bg-gray-100 dark:bg-gray-800
			`}

		>
			{displayIds.map((cid, idx) => {
				const clan = clanMap[cid];
				if (!clan) return null;
				return clan.logo ? (
					<img
						key={cid}
						src={createImgproxyUrl(clan.logo, { width: 40, height: 40, resizeType: 'fit' })}
						className={`${cornerStyles[idx]} w-[20px] h-[20px] object-cover rounded-md border-2 border-white`}
						draggable={false}
					/>
				) : (
					<div
						key={cid}
						className={`${cornerStyles[idx]} w-[20px] h-[20px] bg-gray-300 rounded-md border-2 border-white`}
					/>
				);
			})}

			{badgeCountGroup > 0 && (
				<div
					className={`
					flex items-center justify-center text-[12px] font-bold rounded-full
					bg-colorDanger absolute bottom-[-5px] right-[-5px]
					outline outline-[3px] outline-white dark:outline-bgSecondary500
					${badgeCountGroup >= 10 ? 'w-[22px] h-[16px]' : 'w-[16px] h-[16px]'}
				`}
				>
					{badgeCountGroup >= 100 ? '99+' : badgeCountGroup}
				</div>
			)}
		</div>
	);

};

export default memo(SidebarClanGroupItem);
