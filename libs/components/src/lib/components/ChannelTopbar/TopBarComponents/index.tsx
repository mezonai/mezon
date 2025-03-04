import { useAppNavigation, useAuth, useEscapeKeyClose, useMenu, useOnClickOutside } from '@mezon/core';
import {
	ChannelsEntity,
	DirectEntity,
	appActions,
	selectCanvasEntityById,
	selectChannelById,
	selectCloseMenu,
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
import { IChannel, MouseButton, ThreadNameProps } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Coords } from '../../ChannelLink';
import PanelCanvas from '../../PanelCanvas';

export const ChannelLabel = ({ currentChannel }: { currentChannel: DirectEntity | ChannelsEntity }) => {
	const { setStatusMenu } = useMenu();

	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowCanvas = useSelector(selectIsShowCanvas);

	const channelParent = useAppSelector((state) => selectChannelById(state, currentChannel?.parent_id as string));

	const isPrivate = channelParent?.id ? channelParent?.channel_private : currentChannel?.channel_private;
	const isActive = currentChannel?.channel_id === currentChannel?.channel_id && !channelParent;
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

				<ChannelIcon
					type={channelParent?.type || currentChannel?.type}
					isPrivate={!!isPrivate}
					isRestric={!!currentChannel?.age_restricted}
					img={currentChannel.channel_avatar?.[0]}
					name={currentChannel.creator_name?.charAt(0)}
				/>
			</div>

			<ChannelLabelContent
				currentChannel={currentChannel}
				channelParent={channelParent}
				isActive={isActive}
				isChannelVoice={false}
				isShowCanvas={isShowCanvas}
				closeMenu={closeMenu}
				statusMenu={statusMenu}
			/>
			{isShowCanvas && (
				<div role={'button'}>
					<div className="flex flex-row items-center gap-2">
						<Icons.ArrowRight />
						<Icons.CanvasIcon defaultSize="w-6 h-6 min-w-6" />
						<p
							className={`mt-[2px] text-base font-semibold cursor-default one-line ${currentChannel?.channel_id ? 'dark:text-white text-colorTextLightMode' : 'dark:colorTextLightMode text-colorTextLightMode'}`}
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

interface ChannelLabelContentProps {
	currentChannel: IChannel | null | undefined;
	channelParent: IChannel | null | undefined;
	isActive: boolean;
	isChannelVoice: boolean;
	isShowCanvas: boolean;
	closeMenu: boolean;
	statusMenu: boolean;
}

const ChannelLabelContent: React.FC<ChannelLabelContentProps> = ({
	channelParent,
	isActive,
	isChannelVoice,
	currentChannel,
	isShowCanvas,
	closeMenu,
	statusMenu
}) => {
	const dispatch = useAppDispatch();
	const { navigate, toChannelPage } = useAppNavigation();
	const handleRedirect = () => {
		if (channelParent?.id) {
			navigate(toChannelPage(channelParent.id, channelParent?.clan_id ?? ''));
		}
		if (isShowCanvas) {
			navigate(toChannelPage(currentChannel?.id ?? '', currentChannel?.clan_id ?? ''));
			dispatch(appActions.setIsShowCanvas(false));
		}
	};
	return (
		<>
			<p
				className={`mr-2 text-base font-semibold mt-[2px] max-w-[200px] overflow-x-hidden text-ellipsis one-line ${closeMenu && !statusMenu ? 'ml-[56px]' : 'ml-7 '} ${isActive ? 'dark:text-white text-colorTextLightMode cursor-default' : 'dark:text-textSecondary text-colorTextLightMode cursor-pointer'} ${isChannelVoice && 'text-white'}`}
				onClick={handleRedirect}
			>
				{channelParent?.channel_label ? channelParent?.channel_label : currentChannel?.channel_label}
			</p>
			{channelParent?.channel_label && currentChannel && !isShowCanvas && (
				<div className="flex flex-row items-center gap-2">
					<Icons.ArrowRight />
					<ChannelIcon
						isPrivate={!!currentChannel?.channel_private}
						type={currentChannel?.type}
						isRestric={!!currentChannel?.age_restricted}
					/>
					<p
						className={`mt-[2px] text-base font-semibold cursor-default one-line ${currentChannel?.channel_id ? 'dark:text-white text-colorTextLightMode' : 'dark:colorTextLightMode text-colorTextLightMode'}`}
					>
						{currentChannel.channel_label}
					</p>
				</div>
			)}
		</>
	);
};

export const ChannelIcon = ({
	type,
	isPrivate,
	isRestric,
	img,
	name
}: {
	type?: ChannelType;
	isPrivate?: boolean;
	isRestric?: boolean;
	img?: string;
	name?: string;
}) => {
	const theme = useSelector(selectTheme);

	switch (type) {
		case ChannelType.CHANNEL_TYPE_THREAD:
			return isPrivate ? (
				<Icons.ThreadIconLocker className="dark:text-[#B5BAC1] text-colorTextLightMode min-w-6" />
			) : (
				<Icons.ThreadIcon defaultSize="w-6 h-6 min-w-6" />
			);
		case ChannelType.CHANNEL_TYPE_CHANNEL:
			if (isRestric) {
				return <Icons.HashtagWarning className="w-6 h-6 dark:text-channelTextLabel text-colorTextLightMode" />;
			}
			return isPrivate ? <Icons.HashtagLocked defaultSize="w-6 h-6 " /> : <Icons.Hashtag defaultSize="w-6 h-6" />;
		case ChannelType.CHANNEL_TYPE_GMEET_VOICE:
			return isPrivate ? (
				<Icons.SpeakerLocked defaultSize="w-6 h-6" />
			) : (
				<Icons.Speaker defaultSize="w-6 h-6" defaultFill="text-contentTertiary" />
			);
		case ChannelType.CHANNEL_TYPE_MEZON_VOICE:
			return isPrivate ? (
				<Icons.SpeakerLocked defaultSize="w-6 h-6" />
			) : (
				<Icons.Speaker defaultSize="w-6 h-6" defaultFill="text-contentTertiary" />
			);
		case ChannelType.CHANNEL_TYPE_STREAMING:
			return <Icons.Stream defaultSize="w-6 h-6" defaultFill="text-contentTertiary" />;
		case ChannelType.CHANNEL_TYPE_APP:
			return <Icons.AppChannelIcon className={'w-6 h-6'} fill={theme} />;

		case ChannelType.CHANNEL_TYPE_DM:
			return <AvatarDM img={img} word={name || ''} />;
		case ChannelType.CHANNEL_TYPE_GROUP:
			return <AvatarDM img={'assets/images/avatar-group.png'} word={name || ''} />;

		default:
			return <></>;
	}
};

ChannelLabel.displayName = 'ChannelLabel';

export const ThreadLable: React.FC<ThreadNameProps> = ({ name }) => {
	return (
		<div className="items-center flex flex-row gap-1">
			<Icons.ArrowToThread />
			<Icons.ThreadNotClick />
			<p className="text-white mb-0.5 font-thin"> {name}</p>
		</div>
	);
};

const AvatarDM = ({ img, word }: { img?: string; word: string }) => {
	return <img src={img} alt="log_DM" className="h-6 w-6 rounded-full overflow-hidden object-cover" />;
};
