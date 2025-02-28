import { useChannels, useMenu } from '@mezon/core';
import {
	ETypeMission,
	FAVORITE_CATEGORY_ID,
	appActions,
	categoriesActions,
	channelsActions,
	notificationSettingActions,
	onboardingActions,
	selectBuzzStateByChannelId,
	selectCloseMenu,
	selectCurrentMission,
	selectEventsByChannelId,
	selectTheme,
	threadsActions,
	useAppDispatch,
	useAppSelector,
	videoStreamActions,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelStatusEnum, ChannelThreads, IChannel, openVoiceChannel } from '@mezon/utils';
import { Spinner } from 'flowbite-react';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import BuzzBadge from '../BuzzBadge';
import { IChannelLinkPermission } from '../ChannelList/CategorizedChannels';
import SettingChannel from '../ChannelSetting';
import EventSchedule from '../EventSchedule';
import ModalConfirm from '../ModalConfirm';
import PanelChannel from '../PanelChannel';

export type ChannelLinkProps = {
	clanId?: string;
	channel: IChannel;
	createInviteLink: (clanId: string, channelId: string) => void;
	isPrivate?: number;
	isUnReadChannel?: boolean;
	numberNotification?: number;
	channelType?: number;
	permissions: IChannelLinkPermission;
	isActive: boolean;
};

export interface Coords {
	mouseX: number;
	mouseY: number;
	distanceToBottom: number;
}

enum StatusVoiceChannel {
	Active = 1,
	No_Active = 0
}

export const classes = {
	active: 'flex flex-row items-center px-2 mx-2 rounded relative p-1',
	inactiveUnread: 'flex flex-row items-center px-2 mx-2 rounded relative p-1 dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton',
	inactiveRead: 'flex flex-row items-center px-2 mx-2 rounded relative p-1 dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton'
};

export type ChannelLinkRef = {
	scrollIntoView: (options?: ScrollIntoViewOptions) => void;
	isInViewport: () => boolean;
};

const ChannelLinkComponent = React.forwardRef<ChannelLinkRef, ChannelLinkProps>(
	({ clanId, channel, isPrivate, createInviteLink, isUnReadChannel, numberNotification, isActive, channelType, permissions }: ChannelLinkProps) => {
		const { hasAdminPermission, hasClanPermission, hasChannelManagePermission, isClanOwner } = permissions;
		const dispatch = useAppDispatch();
		const channelLinkRef = useRef<HTMLAnchorElement | null>(null);
		const coords = useRef<Coords>({
			mouseX: 0,
			mouseY: 0,
			distanceToBottom: 0
		});
		const theme = useSelector(selectTheme);

		const buzzState = useAppSelector((state) => selectBuzzStateByChannelId(state, channel?.channel_id ?? ''));
		const events = useAppSelector((state) => selectEventsByChannelId(state, channel.clan_id ?? '', channel?.channel_id ?? ''));

		const handleOpenCreate = () => {
			openSettingModal();
			closeProfileItem();
		};

		const channelPath = `/chat/clans/${clanId}/channels/${channel.id}`;
		const state = isActive ? 'active' : channel?.unread ? 'inactiveUnread' : 'inactiveRead';

		const handleCreateLinkInvite = () => {
			createInviteLink(clanId ?? '', channel.channel_id ?? '');
			closeProfileItem();
		};

		const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
			const mouseX = event.clientX;
			const mouseY = event.clientY;
			const windowHeight = window.innerHeight;

			await dispatch(
				notificationSettingActions.getNotificationSetting({
					channelId: channel.channel_id || '',
					isCurrentChannel: isActive
				})
			);

			const distanceToBottom = windowHeight - event.clientY;
			coords.current = { mouseX, mouseY, distanceToBottom };
			openProfileItem();
		};

		const handleVoiceChannel = (id: string) => {
			if (channel.status === StatusVoiceChannel.Active) {
				dispatch(channelsActions.setCurrentVoiceChannelId({ channelId: id, clanId: channel.clan_id as string }));
				dispatch(voiceActions.setStatusCall(true));
				dispatch(videoStreamActions.stopStream());
			}
		};

		const handleOpenModalConfirm = () => {
			openDeleteModal();
			closeProfileItem();
		};

		const { setStatusMenu } = useMenu();
		const closeMenu = useSelector(selectCloseMenu);

		const setTurnOffThreadMessage = () => {
			dispatch(threadsActions.setOpenThreadMessageState(false));
			dispatch(threadsActions.setValueThread(null));
		};

		const currentMission = useSelector((state) => selectCurrentMission(state, clanId as string));
		const handleClick = () => {
			if (channel.category_id === FAVORITE_CATEGORY_ID) {
				dispatch(categoriesActions.setCtrlKFocusChannel({ id: channel?.id, parentId: channel?.parent_id ?? '' }));
			}

			setTurnOffThreadMessage();
			if (closeMenu) {
				setStatusMenu(false);
			}
			if (channel.type !== ChannelType.CHANNEL_TYPE_STREAMING) {
				dispatch(
					channelsActions.setCurrentChannelId({
						clanId: channel.clan_id as string,
						channelId: channel.id
					})
				);
			}
			dispatch(appActions.setIsShowCanvas(false));
			if (currentMission && currentMission.channel_id === channel.id && currentMission.task_type === ETypeMission.VISIT) {
				dispatch(onboardingActions.doneMission({ clan_id: clanId as string }));
			}
		};

		const openModalJoinVoiceChannel = useCallback(
			(url: string) => {
				if (channel.status === 1) {
					openVoiceChannel(url);
				}
			},
			[channel.status]
		);

		const isShowSettingChannel = isClanOwner || hasAdminPermission || hasClanPermission || hasChannelManagePermission;

		const notVoiceOrAppOrStreamChannel =
			channel.type !== ChannelType.CHANNEL_TYPE_GMEET_VOICE &&
			channel.type !== ChannelType.CHANNEL_TYPE_APP &&
			channel.type !== ChannelType.CHANNEL_TYPE_STREAMING;

		const activeChannelChannelText = isActive && notVoiceOrAppOrStreamChannel;
		const notMuteAndUnread =
			(channel?.is_mute === undefined ? true : !channel?.is_mute) && isUnReadChannel && notVoiceOrAppOrStreamChannel && !isActive;
		const notMuteAndHasCountNoti =
			(channel?.is_mute === undefined ? true : !channel?.is_mute) &&
			numberNotification &&
			numberNotification > 0 &&
			notVoiceOrAppOrStreamChannel &&
			!isActive;
		const showWhiteDot = (notMuteAndUnread && !isActive) || (notMuteAndHasCountNoti && !isActive);
		const hightLightTextChannel = activeChannelChannelText || notMuteAndUnread || notMuteAndHasCountNoti;
		const highLightVoiceChannel = isActive && !notVoiceOrAppOrStreamChannel;

		const [openProfileItem, closeProfileItem] = useModal(() => {
			return (
				<PanelChannel
					isUnread={isUnReadChannel}
					onDeleteChannel={handleOpenModalConfirm}
					channel={channel}
					coords={coords.current}
					openSetting={openSettingModal}
					setIsShowPanelChannel={closeProfileItem}
				/>
			);
		}, [channel]);

		const [openDeleteModal, closeDeleteModal] = useModal(() => {
			return (
				<ModalConfirmComponent
					handleCancel={closeDeleteModal}
					channelId={channel.channel_id as string}
					clanId={clanId as string}
					modalName={`${channel.channel_label}`}
				/>
			);
		}, [channel.channel_id]);

		const [openSettingModal, closeSettingModal] = useModal(() => {
			return <SettingChannel onClose={closeSettingModal} channel={channel} />;
		}, [channel]);

		const isAgeRestrictedChannel = useMemo(() => {
			return channel?.age_restricted === 1;
		}, [channel?.age_restricted]);

		return (
			<div
				onContextMenu={handleMouseClick}
				id={channel.channel_id}
				role="button"
				className={`relative group ${showWhiteDot ? 'before:content-[""] before:w-1 before:h-2 before:rounded-[0px_4px_4px_0px] before:absolute dark:before:bg-channelActiveColor before:bg-channelActiveLightColor before:top-3' : ''}`}
			>
				{channelType === ChannelType.CHANNEL_TYPE_GMEET_VOICE ? (
					<span
						ref={channelLinkRef}
						className={`${classes[state]} ${channel.status === StatusVoiceChannel.Active ? 'cursor-pointer' : 'cursor-not-allowed'} ${isActive ? 'dark:bg-bgModifierHover bg-bgModifierHoverLight' : ''}`}
						onClick={() => {
							handleVoiceChannel(channel.id);
							openModalJoinVoiceChannel(channel.meeting_code || '');
						}}
						role="link"
					>
						{state === 'inactiveUnread' && <div className="absolute left-0 -ml-2 w-1 h-2 bg-white rounded-r-full"></div>}
						<div className="relative mt-[-5px]">
							{isPrivate === ChannelStatusEnum.isPrivate && <Icons.SpeakerLocked defaultSize="w-5 h-5 " />}
							{!isPrivate && <Icons.Speaker defaultSize="w-5 5-5 " />}
						</div>
						<p
							className={`ml-2 w-full dark:group-hover:text-white group-hover:text-black text-base focus:bg-bgModifierHover ${highLightVoiceChannel ? 'dark:text-white text-black dark:font-medium font-semibold' : 'font-medium dark:text-channelTextLabel text-colorTextLightMode'}`}
							title={channel.channel_label && channel?.channel_label.length > 20 ? channel?.channel_label : undefined}
						>
							{channel.channel_label && channel?.channel_label.length > 20
								? `${channel?.channel_label.substring(0, 20)}...`
								: channel?.channel_label}
						</p>
						{channel.status === StatusVoiceChannel.No_Active && <Spinner aria-label="Loading spinner" />}
					</span>
				) : (
					<Link to={channelPath} onClick={handleClick} className="channel-link" draggable="false">
						<span ref={channelLinkRef} className={`${classes[state]} ${isActive ? 'dark:bg-bgModifierHover bg-bgLightModeButton' : ''}`}>
							{state === 'inactiveUnread' && <div className="absolute left-0 -ml-2 w-1 h-2 bg-white rounded-r-full"></div>}
							{events[0] && <EventSchedule event={events[0]} className="mr-1 mt-0.5" />}
							<div className={`relative  ${channel.type !== ChannelType.CHANNEL_TYPE_STREAMING ? 'mt-[-5px]' : ''}`}>
								{isPrivate === ChannelStatusEnum.isPrivate && channel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE && (
									<Icons.SpeakerLocked defaultSize="w-5 h-5 dark:text-channelTextLabel" />
								)}
								{channel.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel && (
									<Icons.HashtagWarning className="w-5 h-5 dark:text-channelTextLabel text-colorTextLightMode" />
								)}
								{isPrivate === ChannelStatusEnum.isPrivate &&
									channel.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
									!isAgeRestrictedChannel && <Icons.HashtagLocked defaultSize="w-5 h-5 dark:text-channelTextLabel" />}
								{isPrivate !== 1 && channel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE && (
									<Icons.Speaker defaultSize="w-5 h-5 dark:text-channelTextLabel" />
								)}
								{isPrivate !== 1 && channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && (
									<Icons.Speaker defaultSize="w-5 h-5 dark:text-channelTextLabel" />
								)}
								{isPrivate !== 1 && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL && !isAgeRestrictedChannel && (
									<Icons.Hashtag defaultSize="w-5 h-5 dark:text-channelTextLabel" />
								)}
								{isPrivate !== 1 && channel.type === ChannelType.CHANNEL_TYPE_STREAMING && (
									<Icons.Stream defaultSize="w-5 h-5 dark:text-channelTextLabel" />
								)}
								{channel.type === ChannelType.CHANNEL_TYPE_APP && <Icons.AppChannelIcon className={'w-5 h-5'} fill={theme} />}
							</div>
							<p
								className={`ml-2 w-full dark:group-hover:text-white group-hover:text-black text-base focus:bg-bgModifierHover ${hightLightTextChannel ? 'dark:text-white text-black dark:font-medium font-semibold' : 'font-medium dark:text-channelTextLabel text-colorTextLightMode'}`}
								title={channel.channel_label && channel?.channel_label.length > 20 ? channel?.channel_label : undefined}
							>
								{channel.channel_label && channel?.channel_label.length > 20
									? `${channel?.channel_label.substring(0, 20)}...`
									: channel?.channel_label}
							</p>
						</span>
						{buzzState?.isReset ? (
							<BuzzBadge
								timestamp={buzzState?.timestamp as number}
								isReset={buzzState?.isReset}
								channelId={channel.channel_id as string}
								senderId={buzzState.senderId as string}
								mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
							/>
						) : null}
					</Link>
				)}

				{isShowSettingChannel ? (
					numberNotification && numberNotification > 0 ? (
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
								className={`absolute ml-auto w-4 h-4 text-white right-3 group-hover:hidden bg-red-600 rounded-full text-xs text-center top-2`}
							>
								{numberNotification}
							</div>
						</>
					) : (
						<>
							<Icons.AddPerson
								className={`absolute ml-auto w-4 h-4 top-[6px] hidden group-hover:block dark:group-hover:text-white group-hover:text-black ${isActive ? 'dark:text-white text-black' : 'text-transparent'} right-8 cursor-pointer`}
								onClick={handleCreateLinkInvite}
							/>
							<Icons.SettingProfile
								className={`absolute ml-auto w-4 h-4 top-[6px] right-3 ${isActive ? 'dark:text-white text-black' : 'text-transparent'} hidden group-hover:block dark:group-hover:text-white group-hover:text-black cursor-pointer`}
								onClick={handleOpenCreate}
							/>
						</>
					)
				) : (
					<>
						<Icons.AddPerson
							className={`absolute ml-auto w-4 h-4  top-[6px] group-hover:block dark:group-hover:text-white group-hover:text-black  ${isActive ? 'dark:text-white text-black' : 'text-transparent'} hidden right-3 cursor-pointer`}
							onClick={handleCreateLinkInvite}
						/>
						{numberNotification && numberNotification > 0 ? (
							<div className="absolute ml-auto w-4 h-4 top-[9px] text-white right-3 group-hover:hidden bg-red-600 flex justify-center items-center rounded-full text-xs">
								{numberNotification}
							</div>
						) : null}
					</>
				)}
			</div>
		);
	}
);

export const ChannelLink = memo(
	ChannelLinkComponent,
	(prev, curr) =>
		prev.channel?.id === curr?.channel?.id &&
		prev.isActive === curr.isActive &&
		prev.numberNotification === curr.numberNotification &&
		prev.isUnReadChannel === curr.isUnReadChannel &&
		prev.channel?.channel_label === curr?.channel?.channel_label &&
		prev.channel?.channel_private === curr?.channel?.channel_private &&
		(prev.channel as ChannelThreads)?.threads === (curr?.channel as ChannelThreads)?.threads
);
type ModalConfirmComponentProps = {
	handleCancel: () => void;
	channelId: string;
	clanId: string;
	modalName: string;
};

const ModalConfirmComponent: React.FC<ModalConfirmComponentProps> = ({ handleCancel, channelId, clanId, modalName }) => {
	const { handleConfirmDeleteChannel } = useChannels();

	const handleDeleteChannel = () => {
		handleConfirmDeleteChannel(channelId, clanId);
		handleCancel();
	};

	return <ModalConfirm handleCancel={handleCancel} handleConfirm={handleDeleteChannel} title="delete" modalName={modalName} />;
};
