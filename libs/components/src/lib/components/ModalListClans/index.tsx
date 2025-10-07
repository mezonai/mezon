import { useCustomNavigate } from '@mezon/core';
import { appActions, getStore, selectBadgeCountByClanId, selectIsUseProfileDM, useAppDispatch } from '@mezon/store';
import { Image } from '@mezon/ui';
import type { IClan } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { memo, useState, useTransition } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import type { Coords } from '../ChannelLink';
import NavLinkComponent from '../NavLink';
import PanelClan from '../PanelClan';

export type SidebarClanItemProps = {
	option: IClan;
	active?: boolean;
	onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
	onClanClick?: () => void;
};

const SidebarClanItem = ({ option, active, onMouseDown, className = '', onClanClick }: SidebarClanItemProps) => {
	const [_, startTransition] = useTransition();
	const badgeCountClan = useSelector(selectBadgeCountByClanId(option?.clan_id ?? '')) || 0;
	const navigate = useCustomNavigate();
	const dispatch = useAppDispatch();

	const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		const store = getStore();
		const idsSelectedChannel = safeJSONParse(localStorage.getItem('remember_channel') || '{}');
		const channelId = idsSelectedChannel[option?.id] || option?.welcome_channel_id;
		const link = `/chat/clans/${option?.id}${channelId ? `/channels/${channelId}` : ''}`;
		const isShowDmProfile = selectIsUseProfileDM(store.getState());
		onClanClick?.();

		startTransition(() => {
			navigate(link);
			if (isShowDmProfile) {
				requestIdleCallback(() => {
					dispatch(appActions.setIsUseProfileDM(false));
				});
			}
		});
	};

	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const [openRightClickModal, closeRightClickModal] = useModal(() => {
		return <PanelClan coords={coords} setShowClanListMenuContext={closeRightClickModal} clan={option} />;
	}, [coords, option]);

	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;
		const distanceToBottom = windowHeight - event.clientY;
		setCoords({ mouseX, mouseY, distanceToBottom });
		openRightClickModal();
	};

	return (
		<div
			onMouseDown={onMouseDown}
			onContextMenu={handleMouseClick}
			data-id={option?.id}
			className={`relative h-[40px] ${className}`}
			title={option?.clan_name}
			data-e2e={generateE2eId('clan_page.side_bar.clan_item')}
		>
			<button onClick={handleClick} draggable="false">
				<NavLinkComponent active={active}>
					{option?.logo ? (
						<Image
							draggable="false"
							src={createImgproxyUrl(option?.logo ?? '', { width: 100, height: 100, resizeType: 'fill-down' }) || ''}
							placeholder="clan"
							className="w-[40px] h-[40px] object-cover rounded-lg clan"
						/>
					) : (
						option?.clan_name && (
							<div
								className="w-[40px] h-[40px] bg-add-clan-hover theme-base-color rounded-xl flex justify-center items-center text-theme-primary text-theme-primary-hover hover:text-white text-[20px] clan"
								data-e2e={generateE2eId('clan_page.side_bar.clan_item.name')}
							>
								{(option?.clan_name || '').charAt(0).toUpperCase()}
							</div>
						)
					)}
				</NavLinkComponent>
			</button>

			{badgeCountClan > 0 && (
				<div
					className={`flex items-center justify-center text-[12px] font-bold rounded-full bg-colorDanger absolute bottom-[-1px] right-[-2px] outline outline-[1px] outline-white  ${
						badgeCountClan >= 10 ? 'w-[22px] h-[16px]' : 'w-[16px] h-[16px]'
					}`}
				>
					{badgeCountClan >= 100 ? '99+' : badgeCountClan}
				</div>
			)}

			{option?.has_unread_message && badgeCountClan === 0 && !active && (
				<div className="before:content-[''] before:w-1 before:h-2 before:rounded-[0px_4px_4px_0px] before:absolute before:top-3 before:left-[-14px] before:bg-white"></div>
			)}
		</div>
	);
};

export default memo(SidebarClanItem);
