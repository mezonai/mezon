import { useCustomNavigate } from '@mezon/core';
import { appActions, getStore, selectBadgeCountByClanId, selectIsUseProfileDM, useAppDispatch } from '@mezon/store';
import { Image } from '@mezon/ui';
import { IClan, createImgproxyUrl } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { memo, useState, useTransition } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { Coords } from '../ChannelLink';
import NavLinkComponent from '../NavLink';
import PanelClan from '../PanelClan';

export type SidebarClanItemProps = {
	option: IClan;
	active?: boolean;
	onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
	overItemId?: string;
	badgeCountGroup?: number;
};

const SidebarClanItem = ({ option, active, onMouseDown, className = '', overItemId, badgeCountGroup }: SidebarClanItemProps) => {
	const [_, startTransition] = useTransition();
	const badgeCountClan = useSelector(selectBadgeCountByClanId(option.clan_id ?? '')) || 0;
	const navigate = useCustomNavigate();
	const dispatch = useAppDispatch();

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		const store = getStore();
		const idsSelectedChannel = safeJSONParse(localStorage.getItem('remember_channel') || '{}');
		const channelId = idsSelectedChannel[option.id] || option.welcome_channel_id;
		const link = `/chat/clans/${option.id}${channelId ? `/channels/${channelId}` : ''}`;
		const isShowDmProfile = selectIsUseProfileDM(store.getState());

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

	const [openRightClickModal, closeRightClickModal] = useModal(
		() => <PanelClan coords={coords} setShowClanListMenuContext={closeRightClickModal} clan={option} />,
		[coords, option]
	);

	const handleMouseClick = (event: React.MouseEvent<HTMLDivElement>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;
		const distanceToBottom = windowHeight - mouseY;
		setCoords({ mouseX, mouseY, distanceToBottom });
		openRightClickModal();
	};

	return (
		<div
			onMouseDown={onMouseDown}
			onContextMenu={handleMouseClick}
			data-id={option.id}
			className={`relative h-[40px] w-[40px] ${className}`}
		>
			<button onClick={handleClick} draggable={false}>
				<NavLinkComponent active={active}>
					{option.logo ? (
						<Image
							draggable={false || 'false'}
							src={
								createImgproxyUrl(option.logo ?? '', {
									width: 100,
									height: 100,
									resizeType: 'fit',
								}) || ''
							}
							placeholder="blur"
							blurdataurl={option.logo}
							className={`
							w-[40px] h-[40px] object-cover rounded-lg clan
							${overItemId === option.id ? 'ring-2 ring-sky-400' : ''}
						`}
						/>
					) : (
						<div
							className={`
							w-[40px] h-[40px] rounded-lg flex items-center justify-center
							text-[20px]
							dark:bg-bgSecondary bg-bgLightMode
							dark:text-contentSecondary text-textLightTheme
							${overItemId === option.id ? 'ring-2 ring-sky-400' : ''} 
						`}
						>
							{option.clan_name?.charAt(0).toUpperCase()}
						</div>
					)}
				</NavLinkComponent>
			</button>

			{(badgeCountGroup ? badgeCountGroup > 0 : badgeCountClan > 0) && (
				<div
					className={`
					flex items-center justify-center text-[12px] font-bold rounded-full
					bg-colorDanger absolute bottom-[-5px] right-[-5px]
					outline outline-[3px] outline-white dark:outline-bgSecondary500
					${(badgeCountGroup || badgeCountClan) >= 10 ? 'w-[22px] h-[16px]' : 'w-[16px] h-[16px]'}
				`}
				>
					{(badgeCountGroup || badgeCountClan) >= 100 ? '99+' : (badgeCountGroup || badgeCountClan)}
				</div>
			)}
		</div>
	);

};

export default memo(SidebarClanItem);
