import { useAppNavigation, useAuth, useEscapeKeyClose, useMenu, useOnClickOutside } from '@mezon/core';
import {
	appActions,
	selectCanvasEntityById,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClanId,
	selectIdCanvas,
	selectIsShowCanvas,
	selectStatusMenu,
	selectTheme,
	selectTitle,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelStatusEnum, IChannel, MouseButton, ThreadNameProps } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Coords } from '../../ChannelLink';
import PanelCanvas from '../../PanelCanvas';

export const ChannelLabel = ({ channel }: { channel: IChannel | null | undefined }) => {
	const type = Number(channel?.type);
	const { setStatusMenu } = useMenu();
	const { navigate, toChannelPage } = useAppNavigation();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowCanvas = useSelector(selectIsShowCanvas);
	const currentChannel = useSelector(selectCurrentChannel);
	const isChannelVoice = type === ChannelType.CHANNEL_TYPE_VOICE;
	const isChannelText = type === ChannelType.CHANNEL_TYPE_TEXT;
	const isChannelStream = type === ChannelType.CHANNEL_TYPE_STREAMING;
	const isAppChannel = type === ChannelType.CHANNEL_TYPE_APP;

	const channelParent =
		useAppSelector((state) => selectChannelById(state, (channel?.parrent_id ? (channel.parrent_id as string) : '') ?? '')) || {};

	const isPrivate = channelParent ? channelParent?.channel_private : channel?.channel_private;
	const isActive = currentChannel?.channel_id === channel?.channel_id && !channelParent;
	const theme = useSelector(selectTheme);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentCanvasId = useSelector(selectIdCanvas);
	const canvasById = useSelector((state) => selectCanvasEntityById(state, currentChannel?.channel_id, currentCanvasId));
	const { userProfile } = useAuth();
	const isDisableDelCanvas = Boolean(
		canvasById?.creator_id && canvasById?.creator_id !== userProfile?.user?.id && currentChannel?.creator_id !== userProfile?.user?.id
	);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const [isShowPanelCanvas, setIsShowPanelCanvas] = useState<boolean>(false);
	const dispatch = useAppDispatch();

	const handleRedirect = () => {
		if (channelParent) {
			navigate(toChannelPage(channelParent.id, channelParent?.clan_id ?? ''));
		}
		if (isShowCanvas) {
			dispatch(appActions.setIsShowCanvas(false));
		}
	};
	const title = useSelector(selectTitle);

	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;

		if (event.button === MouseButton.RIGHT) {
			const distanceToBottom = windowHeight - event.clientY;
			setCoords({ mouseX, mouseY, distanceToBottom });
			setIsShowPanelCanvas(!isShowPanelCanvas);
		}
	};
	const handClosePannel = useCallback(() => {
		setIsShowPanelCanvas(false);
	}, []);

	useEscapeKeyClose(panelRef, handClosePannel);
	useOnClickOutside(panelRef, handClosePannel);

	return (
		<div
			onMouseDown={handleMouseClick}
			ref={panelRef}
			className={`flex flex-row items-center relative ${closeMenu && !statusMenu ? 'ml-[25px]' : ''}`}
		>
			<div className="absolute flex text-zinc-400 gap-2 text-lg pb-0">
				{closeMenu && !statusMenu && (
					<div className="flex items-end" onClick={() => setStatusMenu(true)} role="button">
						<Icons.OpenMenu />
					</div>
				)}

				{isPrivate === ChannelStatusEnum.isPrivate && isChannelVoice && <Icons.SpeakerLocked defaultSize="w-6 h-6" />}
				{isPrivate === ChannelStatusEnum.isPrivate && isChannelText && <Icons.HashtagLocked defaultSize="w-6 h-6 " />}
				{isPrivate === undefined && isChannelVoice && <Icons.Speaker defaultSize="w-6 h-6" defaultFill="text-contentTertiary" />}
				{isPrivate === undefined && isChannelStream && <Icons.Stream defaultSize="w-6 h-6" defaultFill="text-contentTertiary" />}
				{isPrivate === undefined && isChannelText && <Icons.Hashtag defaultSize="w-6 h-6" />}
				{isAppChannel && <Icons.AppChannelIcon className={'w-6 h-6'} fill={theme} />}
			</div>

			<p
				className={`mr-2 text-base font-semibold mt-[2px] max-w-[200px] overflow-x-hidden text-ellipsis one-line ${closeMenu && !statusMenu ? 'ml-[56px]' : 'ml-7 '} ${isActive ? 'dark:text-white text-colorTextLightMode cursor-default' : 'dark:text-textSecondary text-colorTextLightMode cursor-pointer'} ${isChannelVoice && 'text-white'}`}
				onClick={handleRedirect}
			>
				{channelParent?.channel_label ? channelParent?.channel_label : channel?.channel_label}
			</p>
			{channelParent?.channel_label && channel && !isShowCanvas && (
				<div className="flex flex-row items-center gap-2">
					<Icons.ArrowRight />
					{channelParent?.channel_label && channel.channel_private === ChannelStatusEnum.isPrivate ? (
						<Icons.ThreadIconLocker className="dark:text-[#B5BAC1] text-colorTextLightMode min-w-6" />
					) : (
						<Icons.ThreadIcon defaultSize="w-6 h-6 min-w-6" />
					)}
					<p
						className={`mt-[2px] text-base font-semibold cursor-default one-line ${currentChannel?.channel_id === channel?.channel_id ? 'dark:text-white text-colorTextLightMode' : 'dark:colorTextLightMode text-colorTextLightMode'}`}
					>
						{channel.channel_label}
					</p>
				</div>
			)}
			{isShowCanvas && (
				<div role={'button'}>
					<div className="flex flex-row items-center gap-2">
						<Icons.ArrowRight />
						<Icons.CanvasIcon defaultSize="w-6 h-6 min-w-6" />
						<p
							className={`mt-[2px] text-base font-semibold cursor-default one-line ${currentChannel?.channel_id === channel?.channel_id ? 'dark:text-white text-colorTextLightMode' : 'dark:colorTextLightMode text-colorTextLightMode'}`}
						>
							{title ? title : 'Untitled'}
						</p>
					</div>
					{isShowPanelCanvas && !isDisableDelCanvas && (
						<PanelCanvas
							coords={coords}
							channelId={currentChannel?.channel_id}
							clanId={currentClanId || ''}
							canvasId={currentCanvasId || ''}
						/>
					)}
				</div>
			)}
		</div>
	);
};

export const ThreadLable: React.FC<ThreadNameProps> = ({ name }) => {
	return (
		<div className="items-center flex flex-row gap-1">
			<Icons.ArrowToThread />
			<Icons.ThreadNotClick />
			<p className="text-white mb-0.5 font-thin"> {name}</p>
		</div>
	);
};
