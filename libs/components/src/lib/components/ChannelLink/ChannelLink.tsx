import { useChannels, useMenu } from '@mezon/core';
import {
	ETypeMission,
	FAVORITE_CATEGORY_ID,
	appActions,
	categoriesActions,
	channelsActions,
	getStore,
	notificationSettingActions,
	onboardingActions,
	selectAppChannelById,
	selectBuzzStateByChannelId,
	selectCurrentMission,
	selectEventsByChannelId,
	selectToCheckAppIsOpening,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ApiChannelAppResponseExtend, ChannelThreads, IChannel } from '@mezon/utils';
import { ChannelStatusEnum, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { DragEvent } from 'react';
import React, { memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import BuzzBadge from '../BuzzBadge';
import type { IChannelLinkPermission } from '../ChannelList/CategorizedChannels';
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
	dragStart: (e: DragEvent<HTMLDivElement>) => void;
	dragEnter: (e: DragEvent<HTMLDivElement>) => void;
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
	active: 'flex flex-row items-center px-2 mx-2 rounded relative p-1 text-theme-primary-active',
	inactiveUnread: 'flex flex-row items-center px-2 mx-2 rounded relative p-1 bg-item-hover text-theme-primary-hover',
	inactiveRead: 'flex flex-row items-center px-2 mx-2 rounded relative p-1 bg-item-hover text-theme-primary-hover'
};

export type ChannelLinkRef = {
	scrollIntoView: (options?: ScrollIntoViewOptions) => void;
	isInViewport: () => boolean;
};

const ChannelLinkComponent = ({
	clanId,
	channel,
	isPrivate,
	createInviteLink,
	isUnReadChannel,
	numberNotification,
	isActive,
	channelType,
	permissions,
	dragStart,
	dragEnter
}: ChannelLinkProps) => {
	const { hasAdminPermission, hasClanPermission, hasChannelManagePermission, isClanOwner } = permissions;
	const dispatch = useAppDispatch();
	const channelLinkRef = useRef<HTMLAnchorElement | null>(null);
	const coords = useRef<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const buzzState = useAppSelector((state) => selectBuzzStateByChannelId(state, channel?.channel_id ?? ''));
	const events = useAppSelector((state) => selectEventsByChannelId(state, channel.clan_id ?? '', channel?.channel_id ?? ''));

	const handleOpenCreate = () => {
		openSettingModal();
		closeProfileItem();
	};

	const channelPath = `/chat/clans/${clanId}/channels/${channel.id}`;
	const state = isActive ? 'active' : channel?.unread ? 'inactiveUnread' : 'inactiveRead';

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

	const handleOpenModalConfirm = () => {
		openDeleteModal();
		closeProfileItem();
	};

	const { setStatusMenu } = useMenu();

	const setTurnOffThreadMessage = () => {
		dispatch(threadsActions.setOpenThreadMessageState(false));
		dispatch(threadsActions.setValueThread(null));
	};

	const currentMission = useSelector((state) => selectCurrentMission(state, clanId as string));
	const handleClick = () => {
		const store = getStore();
		const isChannelApp = channel.type === ChannelType.CHANNEL_TYPE_APP;
		const appIsOpening = selectToCheckAppIsOpening(store.getState(), channel.channel_id as string);
		if (channel.category_id === FAVORITE_CATEGORY_ID) {
			dispatch(categoriesActions.setCtrlKFocusChannel({ id: channel?.id, parentId: channel?.parent_id ?? '' }));
		}

		setTurnOffThreadMessage();
		setStatusMenu(false);
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
		if (isChannelApp && appIsOpening) {
			const appChannel = selectAppChannelById(store.getState(), channel.channel_id as string);
			dispatch(channelsActions.setAppChannelFocus({ app: appChannel as ApiChannelAppResponseExtend }));
		}
	};

	const isShowSettingChannel = isClanOwner || hasAdminPermission || hasClanPermission || hasChannelManagePermission;

	const notVoiceOrAppOrStreamChannel =
		channel.type !== ChannelType.CHANNEL_TYPE_APP &&
		channel.type !== ChannelType.CHANNEL_TYPE_STREAMING &&
		channel.type !== ChannelType.CHANNEL_TYPE_MEZON_VOICE;
	const showWhiteDot = isUnReadChannel && !isActive && notVoiceOrAppOrStreamChannel;
	const hightLightTextChannel = (isActive || isUnReadChannel) && notVoiceOrAppOrStreamChannel;

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
				modalName={`${channel?.channel_label || 'Unknown Channel'}`}
			/>
		);
	}, [channel.channel_id, channel?.channel_label]);

	const [openSettingModal, closeSettingModal] = useModal(() => {
		return <SettingChannel onClose={closeSettingModal} channel={channel} />;
	}, [channel]);

	const isAgeRestrictedChannel = useMemo(() => {
		return channel?.age_restricted === 1;
	}, [channel?.age_restricted]);
	const countNumberNotification = numberNotification && numberNotification > 99 ? '99+' : (numberNotification ?? 0);

	return (
		<div
			onContextMenu={handleMouseClick}
			id={channel.id}
			role="button"
			className={`relative group z-10   ${showWhiteDot ? 'before:bg-[var(--text-secondary)] :content-[""] before:w-1 before:h-2 before:rounded-[0px_4px_4px_0px] before:absolute  before:top-3' : ''}`}
		>
			{
				<Link
					to={channelPath}
					id={`${channel.category_id}-${channel.id}`}
					onClick={handleClick}
					className={`channel-link block  rounded-lg mt-[0.2rem] text-theme-primary-hover  ${classes[state]} ${isActive ? 'bg-item-theme text-theme-primary-active' : 'text-theme-primary'}`}
					draggable="false"
				>
					<span
						ref={channelLinkRef}
						className={`flex flex-row items-center rounded relative flex-1 pointer-events-none  ${hightLightTextChannel ? ' font-semibold text-theme-primary-active' : 'font-medium '}`}
					>
						{state === 'inactiveUnread' && <div className="absolute left-0 -ml-2 w-1 h-2 bg-white rounded-r-full"></div>}

						<div className={`relative`} data-e2e={generateE2eId('clan_page.channel_list.item.icon')}>
							{channel.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel && (
								<Icons.HashtagWarning className="w-5 h-5 " />
							)}
							{isPrivate === ChannelStatusEnum.isPrivate &&
								channel.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
								!isAgeRestrictedChannel && <Icons.HashtagLocked defaultSize="w-5 h-5" />}
							{channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && <Icons.Speaker defaultSize="w-5 h-5 " />}
							{isPrivate !== 1 && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL && !isAgeRestrictedChannel && (
								<Icons.Hashtag defaultSize="w-5 h-5 " data-e2e={generateE2eId('clan_page.channel_list.item.icon.hashtag')} />
							)}
							{channel.type === ChannelType.CHANNEL_TYPE_STREAMING && (
								<Icons.Stream defaultSize="w-5 h-5 " data-e2e={generateE2eId('clan_page.channel_list.item.icon.stream')} />
							)}
							{isPrivate !== 1 && channel.type === ChannelType.CHANNEL_TYPE_APP && <Icons.AppChannelIcon className={'w-5 h-5'} />}
							{isPrivate && channel.type === ChannelType.CHANNEL_TYPE_APP ? (
								<Icons.PrivateAppChannelIcon className={'w-5 h-5'} />
							) : null}
						</div>
						{events[0] && <EventSchedule event={events[0]} className="ml-0.2 mt-0.5" />}
						<p
							className={`ml-2 w-full pointer-events-none text-base focus:bg-bgModifierHover`}
							title={channel.channel_label && channel?.channel_label.length > 20 ? channel?.channel_label : undefined}
							data-e2e={generateE2eId('clan_page.channel_list.item.name')}
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
			}

			{isShowSettingChannel ? (
				numberNotification && numberNotification > 0 ? (
					<>
						<Icons.SettingProfile
							className={`absolute ml-auto w-4 h-4  top-[6px] right-3 cursor-pointer hidden group-hover:block text-theme-primary `}
							onClick={handleOpenCreate}
						/>
						<div
							className={`absolute ml-auto w-5 h-5 text-white right-3 group-hover:hidden bg-red-600 rounded-full text-[12px] flex items-center justify-center top-2`}
							data-e2e={generateE2eId('clan_page.channel_list.item.badge')}
						>
							{countNumberNotification}
						</div>
					</>
				) : (
					<Icons.SettingProfile
						className={`absolute ml-auto w-5 h-5 top-2 right-3 ${isActive ? 'text-theme-primary-active' : 'text-transparent'} hidden group-hover:block text-theme-primary-hover cursor-pointer`}
						onClick={handleOpenCreate}
					/>
				)
			) : (
				<>
					{numberNotification && numberNotification > 0 ? (
						<div className="absolute ml-auto w-4 h-4 top-[9px] text-white right-3 group-hover:hidden bg-red-600 flex justify-center items-center rounded-full text-xs">
							{numberNotification}
						</div>
					) : null}
				</>
			)}
		</div>
	);
};

export const ChannelLink = memo(
	ChannelLinkComponent,
	(prev, curr) =>
		prev.channel?.id === curr?.channel?.id &&
		prev.isActive === curr.isActive &&
		prev.numberNotification === curr.numberNotification &&
		prev.isUnReadChannel === curr.isUnReadChannel &&
		prev.channel?.channel_label === curr?.channel?.channel_label &&
		prev.channel?.channel_private === curr?.channel?.channel_private &&
		prev.channel?.age_restricted === curr?.channel?.age_restricted &&
		(prev.channel as ChannelThreads)?.threads === (curr?.channel as ChannelThreads)?.threads &&
		prev.permissions === curr.permissions
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
	const { t } = useTranslation('channelSetting');

	return (
		<ModalConfirm
			handleCancel={handleCancel}
			handleConfirm={handleDeleteChannel}
			title={t('confirm.deleteChannel.title')}
			modalName={modalName}
			customTitle={t('confirm.deleteChannel.content', { channelName: modalName || 'Unknown Channel' })}
		/>
	);
};
