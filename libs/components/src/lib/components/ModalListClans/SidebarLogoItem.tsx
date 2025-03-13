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
	useAppDispatch
} from '@mezon/store';
import { Image } from '@mezon/ui';
import { ModeResponsive, createImgproxyUrl } from '@mezon/utils';
import { useCallback, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { Coords } from '../ChannelLink';
import NavLinkComponent from '../NavLink';
import PanelClan from '../PanelClan';

const SidebarLogoItem = () => {
	const navigate = useCustomNavigate();
	const dispatch = useAppDispatch();
	const appearanceTheme = useSelector(selectTheme);
	const { userProfile } = useAuth();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const currentDmIType = useSelector(selectDmGroupCurrentType);
	const setModeResponsive = useCallback(
		(value: ModeResponsive) => {
			dispatch(channelsActions.setModeResponsive({ clanId: currentClanId as string, mode: value }));
		},
		[dispatch]
	);
	const isClanView = useSelector(selectClanView);
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const [openRightClickModal, closeRightClickModal] = useModal(() => {
		return <PanelClan coords={coords} setShowClanListMenuContext={closeRightClickModal} userProfile={userProfile || undefined} />;
	}, [coords]);
	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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
	const logoCustom = useSelector(selectLogoCustom);
	return (
		<div className="relative">
			<button
				onClick={() => {
					setModeResponsive(ModeResponsive.MODE_DM);
					navigate(currentDmId ? `/chat/direct/message/${currentDmId}/${currentDmIType}` : '/chat/direct/friends');
				}}
				draggable="false"
			>
				<NavLinkComponent active={!isClanView}>
					<div onContextMenu={handleMouseClick}>
						<Image
							src={
								logoCustom
									? createImgproxyUrl(logoCustom, { width: 44, height: 44, resizeType: 'fit' })
									: `assets/images/${appearanceTheme === 'dark' ? 'mezon-logo-black.svg' : 'mezon-logo-white.svg'}`
							}
							width={48}
							height={48}
							className="clan w-full aspect-square object-cover"
							onClick={handleClickToJoinClan}
							draggable="false"
						/>
					</div>
				</NavLinkComponent>
			</button>
			{quantityPendingRequest > 0 ? (
				<div
					className={`flex items-center text-center justify-center text-[12px] font-bold rounded-full bg-colorDanger absolute bottom-[5px] right-[-4px] outline outline-[3px] outline-white dark:outline-bgSecondary500 ${
						quantityPendingRequest >= 10 ? 'w-[22px] h-[16px]' : 'w-[16px] h-[16px]'
					}`}
				>
					{quantityPendingRequest >= 100 ? '99+' : quantityPendingRequest}
				</div>
			) : null}
		</div>
	);
};

export default SidebarLogoItem;
