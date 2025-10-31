import { useExpandedGroupDragAndDrop } from '@mezon/core';
import type { ClanGroup as ClanGroupType, RootState } from '@mezon/store';
import {
	clansActions,
	selectBadgeCountByClanId,
	selectClanHasUnreadMessage,
	selectClanView,
	selectClansEntities,
	selectCurrentClanId
} from '@mezon/store';
import { createImgproxyUrl } from '@mezon/utils';
import { useDispatch, useSelector } from 'react-redux';
import SidebarClanItem from '../ModalListClans';

const FolderIcon = ({ className }: { className?: string }) => (
	<svg viewBox="0 0 24 24" fill="currentColor" className={`dark:text-contentSecondary text-textLightTheme ${className}`}>
		<path
			d="M4 6V4a2 2 0 0 1 2-2h4.586a1 1 0 0 1 .707.293L13 4h5a2 2 0 0 1 2 2v2M4 6h16M4 6v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6"
			stroke="currentColor"
			strokeWidth="2"
			fill="none"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
		<line x1="18" y1="6" x2="6" y2="18"></line>
		<line x1="6" y1="6" x2="18" y2="18"></line>
	</svg>
);

export type ClanGroupProps = {
	group: ClanGroupType;
	onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
	onMouseEnter?: () => void;
	className?: string;
	isGroupIntent?: boolean;
	onClanMouseDown?: (e: React.MouseEvent<HTMLDivElement>, clanId: string, fromGroup: { groupId: string; clanId: string }) => void;
	onClanClick?: () => void;
};

const ClanGroup = ({ group, onMouseDown, onMouseEnter, className = '', isGroupIntent, onClanMouseDown, onClanClick }: ClanGroupProps) => {
	const dispatch = useDispatch();
	const allClansEntities = useSelector(selectClansEntities);

	const currentClanId = useSelector(selectCurrentClanId);
	const isClanView = useSelector(selectClanView);

	const clans = group.clanIds.map((clanId) => allClansEntities[clanId]).filter(Boolean);

	// recheck
	const totalBadgeCount = useSelector((state: RootState) => {
		return group.clanIds.reduce((total, clanId) => {
			const badgeCount = selectBadgeCountByClanId(clanId)(state) || 0;
			return total + badgeCount;
		}, 0);
	});

	const hasUnreadInGroup = useSelector((state: RootState) => {
		return group.clanIds.some((clanId) => {
			return selectClanHasUnreadMessage(clanId)(state);
		});
	});

	const expandedGroupDragAndDrop = useExpandedGroupDragAndDrop(group.id, group.clanIds);

	const handleToggle = () => {
		dispatch(clansActions.toggleGroupExpanded(group.id));
		onClanClick?.();
	};

	const maxDisplayClans = 4;
	const displayClans = clans.slice(0, maxDisplayClans);

	const isActive = (clanId: string) => isClanView && currentClanId === clanId;

	const handleClanMouseEnter = (e: React.MouseEvent<HTMLDivElement>, clanId: string) => {
		if (expandedGroupDragAndDrop.draggingState.isDragging) {
			const rect = e.currentTarget.getBoundingClientRect();
			const mouseY = e.pageY || e.clientY;
			expandedGroupDragAndDrop.handleMouseEnter(clanId, mouseY, rect);
		}
	};

	const handleClanMouseDown = (e: React.MouseEvent<HTMLDivElement>, clan: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (e.button === 2) {
			return;
		}

		if (e.ctrlKey || e.metaKey) {
			if (onClanMouseDown) {
				onClanMouseDown(e, clan.id, { groupId: group.id, clanId: clan.id });
			}
		} else {
			expandedGroupDragAndDrop.handleMouseDown(e, clan.id);
		}
	};

	const handleRemoveClanFromGroup = (e: React.MouseEvent, clanId: string) => {
		e.preventDefault();
		e.stopPropagation();
		dispatch(
			clansActions.removeClanFromGroup({
				groupId: group.id,
				clanId
			})
		);
	};

	if (group.isExpanded) {
		return (
			<div
				className={`is-group-expanded p-2 flex flex-col gap-2 rounded-lg dark:bg-[#ffffff0d] bg-bgLightModeButton/20  dark:border-bgSecondary600 border-bgLightModeButton ${className}`}
			>
				<div
					className={`relative h-[40px] ${isGroupIntent ? 'ring-2 ring-blue-400' : ''}`}
					onMouseDown={onMouseDown}
					onMouseEnter={onMouseEnter}
				>
					<button
						onClick={handleToggle}
						className="w-full h-full flex items-center justify-center rounded-lg dark:bg-bgSecondary bg-bgLightMode hover:dark:bg-bgSecondary600 hover:bg-bgLightModeButton transition-all duration-200"
						draggable="false"
					>
						<FolderIcon className="w-6 h-6" />
						{group.name && <span className="ml-2 text-sm dark:text-contentSecondary text-textLightTheme truncate">{group.name}</span>}
					</button>
				</div>

				<div className="flex flex-col gap-2 dark:border-bgSecondary600 border-bgLightModeButton">
					{clans.map(
						(clan) =>
							clan && (
								<div
									key={clan.id}
									className={`group relative cursor-move ${
										expandedGroupDragAndDrop.draggingState.isDragging &&
										expandedGroupDragAndDrop.draggingState.draggedItem === clan.id
											? 'opacity-50'
											: ''
									} ${
										expandedGroupDragAndDrop.draggingState.overItem === clan.id
											? expandedGroupDragAndDrop.draggingState.dropZone === 'top'
												? 'border-t-2 border-blue-400'
												: 'border-b-2 border-blue-400'
											: ''
									}`}
									onMouseEnter={(e) => handleClanMouseEnter(e, clan.id)}
									onMouseMove={(e) => handleClanMouseEnter(e, clan.id)}
								>
									<SidebarClanItem
										option={clan}
										active={isActive(clan.id)}
										className="scale-100 hover:scale-105 transition-transform duration-200"
										onMouseDown={(e) => handleClanMouseDown(e, clan)}
										onClanClick={onClanClick}
									/>

									{!expandedGroupDragAndDrop.draggingState.isDragging && (
										<button
											onClick={(e) => handleRemoveClanFromGroup(e, clan.id)}
											className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 z-10 bg-gray-100 hover:bg-gray-200  dark:hover:bg-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shadow-sm"
											title={`Remove ${clan.clan_name} from group`}
										>
											<CloseIcon className="w-2.5 h-2.5 stroke-2" />
										</button>
									)}

									{expandedGroupDragAndDrop.draggingState.overItem === clan.id && (
										<>
											{expandedGroupDragAndDrop.draggingState.dropZone === 'top' && (
												<div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
											)}
											{expandedGroupDragAndDrop.draggingState.dropZone === 'bottom' && (
												<div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
											)}
										</>
									)}
								</div>
							)
					)}

					{expandedGroupDragAndDrop.draggingState.isDragging &&
						expandedGroupDragAndDrop.draggingState.draggedItem &&
						expandedGroupDragAndDrop.draggingState.dragPosition && (
							<div
								className="fixed pointer-events-none z-50 w-[40px] h-[40px] transform rotate-1 shadow-lg"
								style={{
									left: `${expandedGroupDragAndDrop.draggingState.dragPosition.x - expandedGroupDragAndDrop.draggingState.dragOffset.x}px`,
									top: `${expandedGroupDragAndDrop.draggingState.dragPosition.y - expandedGroupDragAndDrop.draggingState.dragOffset.y}px`
								}}
							>
								{(() => {
									const draggedClan = allClansEntities[expandedGroupDragAndDrop.draggingState.draggedItem];
									if (draggedClan) {
										return <SidebarClanItem option={draggedClan} active={false} className="opacity-80" />;
									}
									return null;
								})()}
							</div>
						)}
				</div>
			</div>
		);
	}

	return (
		<div
			className={`relative h-[40px] flex items-center justify-center cursor-pointer ${isGroupIntent ? 'ring-2 ring-blue-400' : ''} ${className}`}
			onMouseDown={onMouseDown}
			onMouseEnter={onMouseEnter}
			onClick={handleToggle}
		>
			<div className="w-[40px] h-[40px] rounded-lg relative overflow-hidden dark:bg-bgSecondary bg-bgLightMode hover:dark:bg-bgSecondary600 hover:bg-bgLightModeButton transition-all duration-200">
				{displayClans.length === 1 && displayClans[0] ? (
					<div className="w-full h-full" title={displayClans[0]?.clan_name}>
						{displayClans[0].logo ? (
							<img
								src={createImgproxyUrl(displayClans[0].logo || '', { width: 100, height: 100, resizeType: 'fill-down' })}
								alt={displayClans[0].clan_name || ''}
								className="w-full h-full object-cover rounded-lg"
								draggable="false"
							/>
						) : (
							<div className="w-full h-full dark:bg-bgSecondary bg-bgLightMode rounded-lg flex justify-center items-center dark:text-contentSecondary text-textLightTheme text-[20px]">
								{(displayClans[0].clan_name || '').charAt(0).toUpperCase()}
							</div>
						)}
					</div>
				) : displayClans.length === 2 ? (
					<div className="w-full h-full flex">
						{displayClans.slice(0, 2).map(
							(clan, index) =>
								clan && (
									<div key={clan.id} className="w-1/2 h-full" title={clan?.clan_name}>
										{clan.logo ? (
											<img
												src={createImgproxyUrl(clan.logo, { width: 100, height: 100, resizeType: 'fill-down' })}
												alt={clan.clan_name || ''}
												className="w-full h-full object-cover"
												draggable="false"
											/>
										) : (
											<div className="w-full h-full dark:bg-bgSecondary bg-bgLightMode flex justify-center items-center dark:text-contentSecondary text-textLightTheme text-[10px]">
												{(clan.clan_name || '').charAt(0).toUpperCase()}
											</div>
										)}
									</div>
								)
						)}
					</div>
				) : displayClans.length >= 3 ? (
					<div className="w-full h-full grid grid-cols-2 grid-rows-2">
						{displayClans.slice(0, 4).map(
							(clan, index) =>
								clan && (
									<div key={clan.id} className="w-full h-full" title={clan?.clan_name}>
										{clan.logo ? (
											<img
												src={createImgproxyUrl(clan.logo || '', { width: 100, height: 100, resizeType: 'fill-down' })}
												alt={clan.clan_name || ''}
												className="w-full h-full object-cover"
												draggable="false"
											/>
										) : (
											<div className="w-full h-full dark:bg-bgSecondary bg-bgLightMode flex justify-center items-center dark:text-contentSecondary text-textLightTheme text-[8px]">
												{(clan.clan_name || '').charAt(0).toUpperCase()}
											</div>
										)}
									</div>
								)
						)}
					</div>
				) : (
					<div className="w-full h-full dark:bg-bgSecondary bg-bgLightMode rounded-lg flex justify-center items-center">
						<FolderIcon className="w-5 h-5" />
					</div>
				)}
			</div>

			{totalBadgeCount > 0 && (
				<div
					className={`flex items-center justify-center text-[12px] font-bold rounded-full bg-colorDanger absolute bottom-[-1px] right-[-2px] outline outline-[1px] outline-white ${
						totalBadgeCount >= 10 ? 'w-[22px] h-[16px]' : 'w-[16px] h-[16px]'
					}`}
				>
					{totalBadgeCount >= 100 ? '99+' : totalBadgeCount}
				</div>
			)}

			{hasUnreadInGroup && totalBadgeCount === 0 && (
				<div className="before:content-[''] before:w-1 before:h-2 before:rounded-[0px_4px_4px_0px] before:absolute before:top-3 before:left-[-14px] before:bg-white"></div>
			)}
		</div>
	);
};

export { ClanGroup };
