import { useAuth, useCustomNavigate, useFriends } from '@mezon/core';
import {
	channelsActions,
	clansActions,
	selectClanView,
	selectCurrentClanId,
	selectDmGroupCurrentId,
	selectDmGroupCurrentType,
	selectLogoCustom,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Image } from '@mezon/ui';
import { ModeResponsive, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { useCallback, useState } from 'react';
import { useModal } from 'react-modal-hook';
import type { Coords } from '../ChannelLink';
import NavLinkComponent from '../NavLink';
import PanelClan from '../PanelClan';

const SidebarLogoItem = () => {
	const navigate = useCustomNavigate();
	const dispatch = useAppDispatch();
	const appearanceTheme = useAppSelector(selectTheme);
	const { userProfile } = useAuth();
	const currentClanId = useAppSelector(selectCurrentClanId);
	const currentDmId = useAppSelector(selectDmGroupCurrentId);
	const currentDmIType = useAppSelector(selectDmGroupCurrentType);
	const logoCustom = useAppSelector(selectLogoCustom);

	const setModeResponsive = useCallback(
		(value: ModeResponsive) => {
			dispatch(channelsActions.setModeResponsive({ clanId: currentClanId as string, mode: value }));
		},
		[dispatch, currentClanId]
	);
	const isClanView = useAppSelector(selectClanView);
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const [openRightClickModal, closeRightClickModal] = useModal(
		() => <PanelClan coords={coords} setShowClanListMenuContext={closeRightClickModal} userProfile={userProfile || undefined} />,
		[coords, userProfile]
	);
	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		if (!logoCustom) return;
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;
		const distanceToBottom = windowHeight - event.clientY;
		setCoords({ mouseX, mouseY, distanceToBottom });
		openRightClickModal();
	};
	const handleClickToJoinClan = () => {
		dispatch(clansActions.joinClan({ clanId: '0' }));
	};
	const { quantityPendingRequest } = useFriends();
	const combinedBadge = quantityPendingRequest || 0;
	return (
		<div className="relative h-[40px]">
			<button
				onClick={() => {
					setModeResponsive(ModeResponsive.MODE_DM);
					navigate(!currentDmId ? '/chat/direct/friends' : `/chat/direct/message/${currentDmId}/${currentDmIType}`);
				}}
				draggable="false"
			>
				<NavLinkComponent active={!isClanView}>
					<div onContextMenu={handleMouseClick} data-e2e={generateE2eId('clan_page.side_bar.DM_item')}>
						<Image
							src={
								logoCustom
									? createImgproxyUrl(logoCustom, { width: 40, height: 40, resizeType: 'fit' })
									: `assets/images/${appearanceTheme === 'dark' ? 'mezon-logo-black.svg' : 'mezon-logo-white.svg'}`
							}
							className="rounded-lg clan w-[40px] h-[40px] aspect-square object-cover"
							onClick={handleClickToJoinClan}
							draggable="false"
						/>
					</div>
				</NavLinkComponent>
			</button>
			{combinedBadge > 0 ? (
				<div
					className={`flex items-center text-center justify-center text-[12px] font-bold rounded-full bg-colorDanger absolute bottom-[-2px] right-[-2px]  ${
						combinedBadge >= 10 ? 'w-[22px] h-[16px]' : 'w-[16px] h-[16px]'
					}`}
				>
					{combinedBadge >= 100 ? '99+' : combinedBadge}
				</div>
			) : null}
		</div>
	);
};

export default SidebarLogoItem;
