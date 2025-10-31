import { useAppNavigation, useAuth, useOnClickOutside, usePermissionChecker } from '@mezon/core';
import type { EventManagementEntity } from '@mezon/store';
import {
	addUserEvent,
	deleteUserEvent,
	eventManagementActions,
	selectChannelById,
	selectChannelFirst,
	selectMeetRoomByEventId,
	selectMemberClanByUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EEventStatus, EPermission, OptionEvent, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import isElectron from 'is-electron';
import { ButtonCopy } from 'libs/components/src/lib/components';
import { ChannelType } from 'mezon-js';
import type { ApiUserEventRequest } from 'mezon-js/api.gen';
import Tooltip from 'rc-tooltip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import type { Coords } from '../../../ChannelLink';
import ModalInvite from '../../../ListMemberInvite/modalInvite';
import { createI18nTimeFormatter } from '../timeFomatEvent';
import ModalDelEvent from './modalDelEvent';
import ModalShareEvent from './modalShareEvent';
import PanelEventItem from './panelEventItem';

export type ItemEventManagementProps = {
	reviewDescription?: string;
	option: string;
	topic: string;
	voiceChannel: string;
	titleEvent: string;
	address?: string;
	logo?: string;
	logoRight?: string;
	start: string;
	end?: string;
	event?: EventManagementEntity;
	createTime?: string;
	isReviewEvent?: boolean;
	openModelUpdate?: () => void;
	onEventUpdateId?: (id: string) => void;
	textChannelId?: string;
	onClose: () => void;
	isPrivate?: boolean;
};

const ItemEventManagement = (props: ItemEventManagementProps) => {
	const {
		topic,
		voiceChannel,
		reviewDescription,
		option,
		address,
		logo,
		logoRight,
		start,
		event,
		isReviewEvent,
		openModelUpdate,
		onEventUpdateId,
		textChannelId,
		onClose,
		isPrivate
	} = props;
	const isChannelEvent = textChannelId && textChannelId !== '0';
	const isPrivateEvent = !isChannelEvent && ((!isReviewEvent && event?.is_private) || (isReviewEvent && isPrivate));
	const isClanEvent = !isChannelEvent && ((!isReviewEvent && !event?.is_private) || (isReviewEvent && !isPrivate));
	const { t, i18n } = useTranslation(['eventMenu', 'eventCreator']);
	const dispatch = useAppDispatch();

	// Create i18n-aware time formatter
	const formatTimeI18n = useMemo(() => createI18nTimeFormatter(i18n.language), [i18n.language]);
	const channelFirst = useSelector(selectChannelFirst);
	const channelVoice = useAppSelector((state) => selectChannelById(state, voiceChannel ?? '')) || {};
	const textChannel = useAppSelector((state) => selectChannelById(state, textChannelId ?? '')) || {};
	const isThread = textChannel?.type === ChannelType.CHANNEL_TYPE_THREAD;
	const userCreate = useAppSelector((state) => selectMemberClanByUserId(state, event?.creator_id || ''));
	const [isClanOwner] = usePermissionChecker([EPermission.clanOwner]);
	const checkOptionVoice = useMemo(() => option === OptionEvent.OPTION_SPEAKER, [option]);
	const checkOptionLocation = useMemo(() => option === OptionEvent.OPTION_LOCATION, [option]);

	const [openPanel, setOpenPanel] = useState(false);
	const [openModalDelEvent, setOpenModalDelEvent] = useState(false);
	const [openModalShare, setOpenModalShare] = useState(false);
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const getPrivateMeetingRoom = useAppSelector((state) => selectMeetRoomByEventId(state, event?.id as string));
	const eventIsUpcomming = event?.event_status === EEventStatus.UPCOMING;
	const eventIsOngoing = event?.event_status === EEventStatus.ONGOING;

	const actualEventStatus = useMemo(() => {
		if (!event?.start_time) return { isUpcoming: eventIsUpcomming, isOngoing: eventIsOngoing };

		const startTime = new Date(event.start_time).getTime();
		const currentTime = Date.now();
		const endTime = event.end_time ? new Date(event.end_time).getTime() : startTime + 2 * 60 * 60 * 1000;

		const isActuallyUpcoming = currentTime < startTime;
		const isActuallyOngoing = currentTime >= startTime && currentTime <= endTime;

		return {
			isUpcoming: isActuallyUpcoming,
			isOngoing: isActuallyOngoing
		};
	}, [event?.start_time, event?.end_time, eventIsUpcomming, eventIsOngoing]);

	const externalLink = event?.meet_room?.external_link || getPrivateMeetingRoom?.external_link;
	const hasLink = Boolean(externalLink);

	const link = useMemo(() => {
		if (isPrivateEvent) {
			return `${process.env.NX_CHAT_APP_REDIRECT_URI}${externalLink}`;
		}
		return `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/clans/${event?.clan_id}/channels/${event?.channel_voice_id || event?.channel_id}`;
	}, []);

	const handleCopyLink = useCallback(() => {
		navigator.clipboard.writeText(link).catch((err) => {
			toast.error(err?.message || 'Failed to copy link.');
		});
	}, [link]);

	const handleOpenLink = useCallback(() => {
		window.open(link, '_blank', 'noopener,noreferrer');
	}, [link]);

	const [openInviteClanModal, closeInviteClanModal] = useModal(() => (
		<ModalInvite onClose={closeInviteClanModal} open={true} isInviteExternalCalling={true} privateRoomLink={link} />
	));

	const handleInvite = useCallback(() => {
		openInviteClanModal();
	}, []);

	const handleStopPropagation = (e: any) => {
		e.stopPropagation();
	};

	const handleOpenPanel = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY + (isElectron() ? 0 : window.screenY);
		const windowHeight = window.innerHeight;
		const distanceToBottom = windowHeight - event.clientY;
		setCoords({ mouseX, mouseY, distanceToBottom });
		setOpenPanel(true);
	};

	const panelRef = useRef(null);
	useOnClickOutside(panelRef, () => setOpenPanel(false));
	const timeUntilEvent = useMemo(() => {
		if (!event?.start_time || !actualEventStatus.isUpcoming) return null;

		const startTime = new Date(event.start_time).getTime();
		const currentTime = Date.now();
		const timeDiff = startTime - currentTime;
		const minutesLeft = Math.ceil(timeDiff / (1000 * 60));
		if (minutesLeft <= 10 && minutesLeft > 0) {
			return minutesLeft === 1 ? t('countdown.joinIn_one') : t('countdown.joinIn_other', { count: minutesLeft });
		}

		return null;
	}, [event?.start_time, actualEventStatus.isUpcoming, t]);

	const cssEventStatus = useMemo(() => {
		if (actualEventStatus.isOngoing) return 'text-green-500';
		if (actualEventStatus.isUpcoming && timeUntilEvent) return 'text-purple-500';
		return '';
	}, [actualEventStatus.isOngoing, actualEventStatus.isUpcoming, timeUntilEvent]);

	const { toChannelPage, navigate } = useAppNavigation();

	const redirectToVoice = () => {
		if (channelVoice) {
			const channelUrl = toChannelPage(channelVoice.channel_id as string, channelVoice.clan_id as string);
			navigate(channelUrl);
			onClose();
		}
	};

	const setChooseEvent = useCallback(
		(event: EventManagementEntity) => {
			dispatch(eventManagementActions.setChooseEvent(event));
			dispatch(eventManagementActions.showModalDetailEvent(true));
		},
		[dispatch]
	);

	const { userId } = useAuth();
	const [isInterested, setIsInterested] = useState(false);

	useEffect(() => {
		if (userId && event?.user_ids) {
			setIsInterested(event.user_ids.includes(userId));
		}
	}, [userId, event]);

	const handleToggleUserEvent = () => {
		if (!event?.id) return;

		const request: ApiUserEventRequest = {
			clan_id: event.clan_id,
			event_id: event.id
		};

		if (isInterested) {
			dispatch(deleteUserEvent(request));
		} else {
			dispatch(addUserEvent(request));
		}

		setIsInterested(!isInterested);
	};

	return (
		<div className="rounded-lg overflow-hidden bg-theme-setting-nav border-theme-primary" ref={panelRef}>
			{logo && <img src={logo} alt="logo" className="w-full max-h-[180px] object-cover" />}
			<div className="p-4 border-b-theme-primary cursor-pointer" onClick={() => event && setChooseEvent(event)}>
				<div className="flex justify-between">
					<div className="flex items-center gap-x-2 mb-4">
						<Icons.IconEvents defaultSize={`font-semibold ${cssEventStatus}`} />
						<p className={`font-semibold ${cssEventStatus}`} data-e2e={generateE2eId('clan_page.modal.create_event.review.start_time')}>
							{actualEventStatus.isUpcoming
								? timeUntilEvent || formatTimeI18n(event?.start_time || start)
								: actualEventStatus.isOngoing
									? t('countdown.joinNow')
									: formatTimeI18n(event?.start_time || start)}
						</p>
						{isClanEvent && (
							<p
								className="bg-blue-500 text-white rounded-sm px-1 text-center"
								data-e2e={generateE2eId('clan_page.modal.create_event.review.type')}
							>
								{t('eventCreator:eventDetail.clanEvent')}
							</p>
						)}
						{isChannelEvent && (
							<p
								className="bg-orange-500 text-white rounded-sm px-1 text-center"
								data-e2e={generateE2eId('clan_page.modal.create_event.review.type')}
							>
								{t('eventCreator:eventDetail.channelEvent')}
							</p>
						)}
						{isPrivateEvent && (
							<p
								className="bg-red-500 text-white rounded-sm px-1 text-center"
								data-e2e={generateE2eId('clan_page.modal.create_event.review.type')}
							>
								{t('eventCreator:eventDetail.privateEvent')}
							</p>
						)}
					</div>
					{event?.creator_id && (
						<Tooltip
							placement="left"
							overlay={
								<p className="text-theme-primary-active w-[max-content]">
									{t('eventCreator:eventDetail.createdBy', { username: userCreate?.user?.username })}
								</p>
							}
						>
							<div
								className="flex  items-center gap-x-4 mb-3 mr-4"
								data-e2e={generateE2eId('clan_page.modal.create_event.event_management.item.button.open_detail_modal')}
							>
								<AvatarImage
									alt={userCreate?.user?.username || ''}
									username={userCreate?.user?.username}
									className="min-w-6 min-h-6 max-w-6 max-h-6"
									srcImgProxy={createImgproxyUrl(userCreate?.user?.avatar_url ?? '')}
									src={userCreate?.user?.avatar_url}
									classNameText="text-[9px] pt-[3px]"
								/>
								<div
									className="flex items-center gap-x-1 w-full justify-end px-2 py-1 rounded-full bg-theme-primary text-theme-primary-active"
									title={t('eventCreator:eventDetail.personInterested', { count: event?.user_ids?.length })}
								>
									<span className="text-md">{event?.user_ids?.length}</span>
									<Icons.MemberList defaultSize="h-4 w-4" />
								</div>
							</div>
						</Tooltip>
					)}
				</div>

				<div className="flex justify-between gap-4 select-text">
					<div className={`${isReviewEvent || !logoRight ? 'w-full' : 'w-3/5'} `}>
						<p
							className="hover:underline font-bold  text-base"
							data-e2e={generateE2eId('clan_page.modal.create_event.review.event_topic')}
						>
							{topic}
						</p>
						<div className="flex justify-between">
							<div
								className="break-all max-h-[75px] eventDescriptionTruncate whitespace-pre-wrap"
								data-e2e={generateE2eId('clan_page.modal.create_event.review.description')}
							>
								{isReviewEvent ? reviewDescription : event?.description}
							</div>
						</div>
					</div>
					{logoRight && (
						<img src={logoRight} alt="logoRight" className="w-[60%] max-h-[100px] object-contain rounded flex-grow basis-2/5" />
					)}
				</div>
			</div>

			<div
				onClick={(e) => {
					handleStopPropagation(e);
				}}
				className="px-4 py-3 flex items-center gap-x-2 justify-between cursor-default"
			>
				<div
					className="flex gap-x-2"
					onClick={(e) => {
						handleStopPropagation(e);
					}}
				>
					{checkOptionVoice &&
						!isPrivateEvent &&
						(() => {
							const linkProps = {
								onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
									handleStopPropagation(e);
									redirectToVoice();
								}
							};
							return (
								<a {...linkProps} className="flex gap-x-2 cursor-pointer">
									<Icons.Speaker />
									<p data-e2e={generateE2eId('clan_page.modal.create_event.review.voice_channel')}>{channelVoice?.channel_label}</p>
								</a>
							);
						})()}
					{checkOptionLocation && (
						<>
							<Icons.Location />
							<p data-e2e={generateE2eId('clan_page.modal.create_event.review.location_name')}>{address}</p>
						</>
					)}
					{option === '' && !address && !channelVoice && (
						<>
							<Icons.Location />
							<p className="hover:underline ">{channelFirst.channel_label}</p>
						</>
					)}
					{isPrivateEvent && (
						<div className="flex gap-x-2 items-center">
							<Icons.SpeakerLocked />
							{link ? (
								<a href={link} target="_blank" rel="noopener noreferrer" className="cursor-pointer whitespace-normal break-words">
									{t('eventCreator:eventDetail.privateRoom')}
								</a>
							) : (
								<span className="whitespace-normal break-words cursor-not-allowed">{t('eventCreator:eventDetail.privateRoom')}</span>
							)}
						</div>
					)}
				</div>

				{event && (
					<div
						className="flex gap-x-2 items-center"
						onClick={(e) => {
							handleStopPropagation(e);
						}}
					>
						<div className="text-theme-primary-hover cursor-pointer" onClick={(e) => handleOpenPanel(e)}>
							<Icons.IconEditThreeDot className="rotate-90" />
						</div>

						{!checkOptionLocation && (
							<button
								onClick={() => setOpenModalShare(true)}
								className="flex gap-x-1 rounded-lg px-4 py-2  bg-theme-primary text-theme-primary-hover  hover:bg-opacity-80 font-medium "
							>
								{checkOptionVoice && <Icons.IconShareEventVoice />}
								{checkOptionLocation && <Icons.IConShareEventLocation />}
								{t('eventCreator:eventDetail.share')}
							</button>
						)}

						{actualEventStatus.isOngoing && isClanOwner ? (
							<button
								className="flex gap-x-1 rounded-lg text-theme-primary-hover px-4 py-2 bg-theme-primary "
								onClick={() => setOpenModalDelEvent(true)}
							>
								{t('dashboard.endEvent')}
							</button>
						) : !actualEventStatus.isOngoing ? (
							<button
								onClick={handleToggleUserEvent}
								className="flex items-center gap-x-1 rounded-lg text-theme-primary-hover px-4 py-2 bg-theme-primary text-theme-primary-active"
							>
								{isInterested ? <Icons.MuteBell defaultSize="size-4" /> : <Icons.Bell className="size-4 " />}
								<span className="whitespace-nowrap">{isInterested ? t('dashboard.UnInterested') : t('dashboard.Interested')}</span>
							</button>
						) : (
							<></>
						)}
					</div>
				)}
			</div>
			<div className="flex gap-x-2 mx-4 mb-2">
				{isPrivateEvent ? (
					<span className="flex flex-row items-center gap-2">
						<p className="">{t('eventCreator:eventDetail.onlyInvitedMembers')}</p>
						{hasLink && (
							<>
								<button onClick={handleOpenLink} className="text-blue-500 hover:underline">
									{t('eventCreator:eventDetail.openLink')}
								</button>

								<button onClick={handleInvite} className="text-blue-500 hover:underline">
									{t('eventCreator:eventDetail.invite')}
								</button>
								<ButtonCopy
									copyText={link}
									title={t('eventCreator:eventDetail.copyLink')}
									className="bg-transparent flex-row-reverse hover:!bg-transparent !text-blue-500 hover:!underline"
								/>
							</>
						)}
					</span>
				) : isChannelEvent ? (
					<span className="flex flex-row">
						<p className="">
							{t('eventCreator:eventDetail.audienceConsists')}{' '}
							{isThread ? t('eventCreator:eventDetail.thread') : t('eventCreator:eventDetail.channel')}
							<strong className="" data-e2e={generateE2eId('clan_page.modal.create_event.review.text_channel')}>
								{textChannel.channel_label}
							</strong>
						</p>
					</span>
				) : isClanEvent ? (
					<span className="flex flex-row">
						<p className="">{t('dashboard.noti')}</p>
					</span>
				) : null}
			</div>

			{openPanel && (
				<PanelEventItem
					event={event}
					coords={coords}
					onHandle={handleStopPropagation}
					setOpenModalUpdateEvent={openModelUpdate}
					setOpenModalDelEvent={setOpenModalDelEvent}
					onTrigerEventUpdateId={() => {
						if (onEventUpdateId) {
							onEventUpdateId(event?.id || '');
						}
					}}
					handleCopyLink={handleCopyLink}
					onClose={() => setOpenPanel(false)}
				/>
			)}
			{openModalDelEvent && <ModalDelEvent event={event} setOpenModalDelEvent={setOpenModalDelEvent} />}
			{openModalShare && <ModalShareEvent link={link} channel={channelVoice} setOpenModalShareEvent={setOpenModalShare} />}
		</div>
	);
};

export default ItemEventManagement;
