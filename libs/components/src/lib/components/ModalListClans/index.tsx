import { useCustomNavigate } from '@mezon/core';
import { appActions, selectBadgeCountByClanId, selectIsUseProfileDM, useAppDispatch } from '@mezon/store';
import { Image } from '@mezon/ui';
import { IClan, createImgproxyUrl } from '@mezon/utils';
import { memo, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { Coords } from '../ChannelLink';
import NavLinkComponent from '../NavLink';
import PanelClan from '../PanelClan';

export type SidebarClanItemProps = {
	option: IClan;
	linkClan: string;
	active?: boolean;
};

const SidebarClanItem = ({ option, linkClan, active }: SidebarClanItemProps) => {
	const badgeCountClan = useSelector(selectBadgeCountByClanId(option.clan_id ?? '')) || 0;
	const navigate = useCustomNavigate();
	const isShowDmProfile = useSelector(selectIsUseProfileDM);
	const dispatch = useAppDispatch();
	const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (isShowDmProfile) {
			dispatch(appActions.setIsUseProfileDM(false));
		}
		navigate(linkClan);
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
		<div onContextMenu={handleMouseClick} className="relative">
			<button onClick={handleClick} draggable="false">
				<NavLinkComponent active={active}>
					{option.logo ? (
						<Image
							draggable="false"
							src={createImgproxyUrl(option.logo ?? '', { width: 100, height: 100, resizeType: 'fit' }) || ''}
							alt={option.clan_name || ''}
							placeholder="blur"
							width={48}
							blurdataurl={option.logo}
							className="min-w-12 min-h-12 object-cover clan"
						/>
					) : (
						option.clan_name && (
							<div className="w-[48px] h-[48px] dark:bg-bgTertiary bg-bgLightMode rounded-full flex justify-center items-center dark:text-contentSecondary text-textLightTheme text-[20px] clan">
								{(option.clan_name || '').charAt(0).toUpperCase()}
							</div>
						)
					)}
				</NavLinkComponent>
			</button>
			{badgeCountClan > 0 ? (
				<div className="w-[20px] h-[20px] flex items-center justify-center text-[13px] font-medium rounded-full bg-colorDanger absolute bottom-[-3px] right-[-3px] border-[2px] border-solid dark:border-bgPrimary border-white">
					{badgeCountClan > 99 ? '99+' : badgeCountClan}
				</div>
			) : null}
		</div>
	);
};

export default memo(SidebarClanItem);
