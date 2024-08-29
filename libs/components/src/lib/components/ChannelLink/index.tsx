import { useAppNavigation, useAppParams, useClanRestriction, useMenu, useOnClickOutside, useThreads } from '@mezon/core';
import {
	channelsActions,
	notificationSettingActions,
	selectCloseMenu,
	selectCurrentChannelId,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelStatusEnum, EPermission, IChannel, MouseButton } from '@mezon/utils';
import { Spinner } from 'flowbite-react';
import { ChannelType } from 'mezon-js';
import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import SettingChannel from '../ChannelSetting';
import { DeleteModal } from '../ChannelSetting/Component/Modal/deleteChannelModal';
import PanelChannel from '../PanelChannel';

export type ChannelLinkProps = {
	clanId?: string;
	channel: IChannel;
	createInviteLink: (clanId: string, channelId: string) => void;
	isPrivate?: number;
	isUnReadChannel?: boolean;
	numberNotification?: number;
	channelType?: number;
};

export type Coords = {
	mouseX: number;
	mouseY: number;
	distanceToBottom: number;
};

enum StatusVoiceChannel {
	Active = 1,
	No_Active = 0
}

export const classes = {
	active: 'flex flex-row items-center px-2 mx-2 rounded relative p-1',
	inactiveUnread: 'flex flex-row items-center px-2 mx-2 rounded relative p-1 dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton',
	inactiveRead: 'flex flex-row items-center px-2 mx-2 rounded relative p-1 dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton'
};

function ChannelLink({ clanId, channel, isPrivate, createInviteLink, isUnReadChannel, numberNotification, channelType }: ChannelLinkProps) {
	const [hasAdminPermission, { isClanOwner }] = useClanRestriction([EPermission.administrator]);
	const [hasClanPermission] = useClanRestriction([EPermission.manageClan]);
	const [hasChannelManagePermission] = useClanRestriction([EPermission.manageChannel]);
	const dispatch = useAppDispatch();

	const [openSetting, setOpenSetting] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [isShowPanelChannel, setIsShowPanelChannel] = useState<boolean>(false);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const currentChannelId = useAppSelector(selectCurrentChannelId);

	const handleOpenCreate = () => {
		setOpenSetting(true);
		setIsShowPanelChannel(false);
	};

	const { toChannelPage } = useAppNavigation();
	const { currentURL } = useAppParams();

	const channelPath = toChannelPage(channel.id, channel?.clan_id ?? '');

	const state = currentURL === channelPath ? 'active' : channel?.unread ? 'inactiveUnread' : 'inactiveRead';

	const handleCreateLinkInvite = () => {
		createInviteLink(clanId ?? '', channel.channel_id ?? '');
		setIsShowPanelChannel(false);
	};

	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;

		if (event.button === MouseButton.RIGHT) {
			await dispatch(
				notificationSettingActions.getNotificationSetting({
					channelId: channel.channel_id || '',
					isCurrentChannel: channel.channel_id === currentChannelId
				})
			);
			const distanceToBottom = windowHeight - event.clientY;
			setCoords({ mouseX, mouseY, distanceToBottom });
			setIsShowPanelChannel((s) => !s);
		}
	};

	useOnClickOutside(panelRef, () => setIsShowPanelChannel(false));

	const handleVoiceChannel = (id: string) => {
		if (channel.status === StatusVoiceChannel.Active) {
			dispatch(channelsActions.setCurrentVoiceChannelId(id));
			dispatch(voiceActions.setStatusCall(true));
		}
	};

	const handleDeleteChannel = () => {
		setShowModal(true);
		setIsShowPanelChannel(false);
	};

	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const { setTurnOffThreadMessage } = useThreads();
	const handleClick = () => {
		setTurnOffThreadMessage();
		if (closeMenu) {
			setStatusMenu(false);
		}
	};

	const openModalJoinVoiceChannel = useCallback(
		(url: string) => {
			if (channel.status === 1) {
				const urlVoice = `https://meet.google.com/${url}`;
				window.open(urlVoice, '_blank', 'noreferrer');
			}
		},
		[channel.status]
	);
	const isShowSettingChannel = isClanOwner || hasAdminPermission || hasClanPermission || hasChannelManagePermission;
	return (
		<div ref={panelRef} onMouseDown={(event) => handleMouseClick(event)} role="button" className="relative group">
			{channelType === ChannelType.CHANNEL_TYPE_VOICE ? (
				<span
					className={`${classes[state]} ${channel.status === StatusVoiceChannel.Active ? 'cursor-pointer' : 'cursor-not-allowed'} ${currentURL === channelPath ? 'dark:bg-bgModifierHover bg-bgModifierHoverLight' : ''}`}
					onClick={() => {
						handleVoiceChannel(channel.id);
						openModalJoinVoiceChannel(channel.meeting_code || '');
					}}
					role="link"
				>
					{state === 'inactiveUnread' && <div className="absolute left-0 -ml-2 w-1 h-2 bg-white rounded-r-full"></div>}
					<div className="relative mt-[-5px]">
						{isPrivate === ChannelStatusEnum.isPrivate && <Icons.SpeakerLocked defaultSize="w-5 h-5" />}
						{(isPrivate === undefined || isPrivate === 0) && <Icons.Speaker defaultSize="w-5 5-5" />}
					</div>
					<p
						className={`ml-2 w-full dark:group-hover:text-white group-hover:text-black text-base focus:bg-bgModifierHover ${currentURL === channelPath || isUnReadChannel ? 'dark:text-white text-black dark:font-medium font-semibold' : 'font-medium dark:text-[#AEAEAE] text-colorTextLightMode'}`}
						title={channel.channel_label && channel?.channel_label.length > 20 ? channel?.channel_label : undefined}
					>
						{channel.channel_label && channel?.channel_label.length > 20
							? `${channel?.channel_label.substring(0, 20)}...`
							: channel?.channel_label}
					</p>
					{channel.status === StatusVoiceChannel.No_Active && <Spinner aria-label="Loading spinner" />}
				</span>
			) : (
				<Link to={channelPath} onClick={handleClick}>
					<span className={`${classes[state]} ${currentURL === channelPath ? 'dark:bg-bgModifierHover bg-bgLightModeButton' : ''}`}>
						{state === 'inactiveUnread' && <div className="absolute left-0 -ml-2 w-1 h-2 bg-white rounded-r-full"></div>}
						<div className="relative mt-[-5px]">
							{isPrivate === ChannelStatusEnum.isPrivate && channel.type === ChannelType.CHANNEL_TYPE_VOICE && (
								<Icons.SpeakerLocked defaultSize="w-5 h-5" />
							)}
							{isPrivate === ChannelStatusEnum.isPrivate && channel.type === ChannelType.CHANNEL_TYPE_TEXT && (
								<Icons.HashtagLocked defaultSize="w-5 h-5 " />
							)}
							{isPrivate === undefined && channel.type === ChannelType.CHANNEL_TYPE_VOICE && <Icons.Speaker defaultSize="w-5 5-5" />}
							{isPrivate !== 1 && channel.type === ChannelType.CHANNEL_TYPE_TEXT && <Icons.Hashtag defaultSize="w-5 h-5" />}
						</div>
						<p
							className={`ml-2 w-full dark:group-hover:text-white group-hover:text-black text-base focus:bg-bgModifierHover ${currentURL === channelPath || isUnReadChannel ? 'dark:text-white text-black dark:font-medium font-semibold' : 'font-medium dark:text-[#AEAEAE] text-colorTextLightMode'}`}
							title={channel.channel_label && channel?.channel_label.length > 20 ? channel?.channel_label : undefined}
						>
							{channel.channel_label && channel?.channel_label.length > 20
								? `${channel?.channel_label.substring(0, 20)}...`
								: channel?.channel_label}
						</p>
					</span>
				</Link>
			)}

			{isShowSettingChannel ? (
				numberNotification !== 0 ? (
					<>
						<Icons.AddPerson
							className={`absolute ml-auto w-4 h-4  top-[6px] right-8 cursor-pointer hidden group-hover:block dark:text-white text-black `}
							onClick={handleCreateLinkInvite}
						/>
						<Icons.SettingProfile
							className={`absolute ml-auto w-4 h-4  top-[6px] right-3 cursor-pointer hidden group-hover:block dark:text-white text-black `}
							onClick={handleOpenCreate}
						/>
						<div
							className={`absolute ml-auto w-4 h-4 text-white right-3 group-hover:hidden bg-red600 rounded-full text-xs text-center top-2`}
						>
							{numberNotification}
						</div>
					</>
				) : (
					<>
						<Icons.AddPerson
							className={`absolute ml-auto w-4 h-4 top-[6px] hidden group-hover:block dark:group-hover:text-white group-hover:text-black ${currentURL === channelPath ? 'dark:text-white text-black' : 'text-transparent'} right-8 cursor-pointer`}
							onClick={handleCreateLinkInvite}
						/>
						<Icons.SettingProfile
							className={`absolute ml-auto w-4 h-4 top-[6px] right-3 ${currentURL === channelPath ? 'dark:text-white text-black' : 'text-transparent'} hidden group-hover:block dark:group-hover:text-white group-hover:text-black cursor-pointer`}
							onClick={handleOpenCreate}
						/>
					</>
				)
			) : (
				<>
					<Icons.AddPerson
						className={`absolute ml-auto w-4 h-4  top-[6px] group-hover:block dark:group-hover:text-white group-hover:text-black  ${currentURL === channelPath ? 'dark:text-white text-black' : 'text-transparent'} hidden right-3 cursor-pointer`}
						onClick={handleCreateLinkInvite}
					/>
					{numberNotification !== 0 && (
						<div className="absolute ml-auto w-4 h-4 top-[9px] text-white right-3 group-hover:hidden bg-red-600 flex justify-center items-center rounded-full text-xs">
							{numberNotification}
						</div>
					)}
				</>
			)}

			{openSetting && (
				<SettingChannel
					onClose={() => {
						setOpenSetting(false);
					}}
					channel={channel}
				/>
			)}
			{isShowPanelChannel && (
				<PanelChannel
					onDeleteChannel={handleDeleteChannel}
					channel={channel}
					coords={coords}
					setOpenSetting={setOpenSetting}
					setIsShowPanelChannel={setIsShowPanelChannel}
				/>
			)}

			{showModal && (
				<DeleteModal
					onClose={() => setShowModal(false)}
					channelLabel={channel.channel_label || ''}
					channelId={channel.channel_id as string}
				/>
			)}
		</div>
	);
}

export default ChannelLink;
