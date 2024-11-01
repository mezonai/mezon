import { useEventManagement, useOnClickOutside, usePermissionChecker } from '@mezon/core';
import { EventManagementEntity, selectChannelById, selectChannelFirst, selectMemberClanByUserId, selectTheme, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EEventStatus, EPermission, OptionEvent } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import { Coords } from '../../../ChannelLink';
import { differenceTime, timeFomat } from '../timeFomatEvent';
import ModalDelEvent from './modalDelEvent';
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
	setOpenModalDetail?: (status: boolean) => void;
	openModelUpdate?: () => void;
	onEventUpdateId?: (id: string) => void;
};

const ItemEventManagement = (props: ItemEventManagementProps) => {
	const {
		topic,
		voiceChannel,
		reviewDescription,
		titleEvent,
		option,
		address,
		logo,
		logoRight,
		start,
		end,
		event,
		isReviewEvent,
		setOpenModalDetail,
		openModelUpdate,
		onEventUpdateId
	} = props;
	const { setChooseEvent, deleteEventManagement } = useEventManagement();
	const channelFirst = useSelector(selectChannelFirst);
	const channelVoice = useAppSelector((state) => selectChannelById(state, voiceChannel ?? '')) || {};

	const userCreate = useSelector(selectMemberClanByUserId(event?.creator_id || ''));
	const appearanceTheme = useSelector(selectTheme);
	const [isClanOwner] = usePermissionChecker([EPermission.clanOwner]);
	const checkOptionVoice = useMemo(() => option === OptionEvent.OPTION_SPEAKER, [option]);
	const checkOptionLocation = useMemo(() => option === OptionEvent.OPTION_LOCATION, [option]);

	const [openPanel, setOpenPanel] = useState(false);
	const [openModalDelEvent, setOpenModalDelEvent] = useState(false);
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const eventStatus = useMemo(() => {
		if (event?.status) {
			return event.status;
		} else if (start) {
			const currentTime = Date.now();
			const startTimeLocal = new Date(start);
			const startTimeUTC = startTimeLocal.getTime() + startTimeLocal.getTimezoneOffset() * 60000;
			const leftTime = startTimeUTC - currentTime;

			if (leftTime > 0 && leftTime <= 1000 * 60 * 10) {
				return EEventStatus.UPCOMING;
			}

			if (leftTime <= 0) {
				return EEventStatus.ONGOING;
			}
		}

		return EEventStatus.UNKNOWN;
	}, [start, event?.status]);
	const handleStopPropagation = (e: any) => {
		e.stopPropagation();
	};

	const handleOpenPanel = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY + window.screenY;
		const windowHeight = window.innerHeight;
		const distanceToBottom = windowHeight - event.clientY;
		setCoords({ mouseX, mouseY, distanceToBottom });
		setOpenPanel(true);
	};

	const panelRef = useRef(null);
	useOnClickOutside(panelRef, () => setOpenPanel(false));

	const checkTimeVoice = useMemo(() => differenceTime(end || '') + 30 < 0, [end]);
	const checkTimeLocation = useMemo(() => differenceTime(end || '') < 0, [end]);
	useEffect(() => {
		if (checkTimeVoice && checkOptionVoice) {
			deleteEventManagement(event?.clan_id || '', event?.id || '');
		}
		if (checkTimeLocation && checkOptionLocation && !isReviewEvent) {
			deleteEventManagement(event?.clan_id || '', event?.id || '');
		}
	}, []);

	const cssEventStatus = useMemo(() => {
		return eventStatus === EEventStatus.UPCOMING
			? 'text-purple-500'
			: eventStatus === EEventStatus.ONGOING
				? 'text-green-500'
				: 'dark:text-zinc-400 text-colorTextLightMode';
	}, [eventStatus]);

	return (
		<div
			className="dark:bg-[#212529] bg-bgModifierHoverLight rounded-lg overflow-hidden"
			onClick={
				setOpenModalDetail && event
					? () => {
							setOpenModalDetail(true);
							setChooseEvent(event);
						}
					: // eslint-disable-next-line @typescript-eslint/no-empty-function
						() => {}
			}
			ref={panelRef}
		>
			{logo && <img src={logo} alt="logo" className="w-full max-h-[180px] object-cover" />}
			<div className="p-4 border-b dark:border-slate-600 border-white">
				<div className="flex justify-between">
					<div className="flex items-center gap-x-2 mb-4">
						<Icons.IconEvents defaultSize={`font-semibold ${cssEventStatus}`} />
						<p className={`font-semibold ${cssEventStatus}`}>
							{eventStatus === EEventStatus.UPCOMING
								? '10 minutes left. Join in!'
								: eventStatus === EEventStatus.ONGOING
									? 'Event is taking place!'
									: timeFomat(event?.start_time || start)}
						</p>
					</div>
					{event?.creator_id && (
						// <Tooltip
						// 	content={`Created by ${userCreate?.user?.username}`}
						// 	trigger="hover"
						// 	animation="duration-500"
						// 	style={appearanceTheme === 'light' ? 'light' : 'dark'}
						// >
						// TODO: check error loop resize
						// </Tooltip>
						<AvatarImage
							alt={userCreate?.user?.username || ''}
							userName={userCreate?.user?.username}
							className="min-w-6 min-h-6 max-w-6 max-h-6"
							src={userCreate?.user?.avatar_url}
							classNameText="text-[9px] pt-[3px]"
						/>
					)}
				</div>
				<div className="flex justify-between gap-4">
					<div className={`${isReviewEvent || !logoRight ? 'w-full' : 'w-3/5'}`}>
						<p className="hover:underline font-bold dark:text-white text-black text-base">{topic}</p>
						<div className="break-all max-h-[75px] eventDescriptionTruncate">
							{isReviewEvent ? reviewDescription : event?.description}
						</div>
					</div>
					{logoRight && <img src={logoRight} alt="logoRight" className="w-[60%] max-h-[100px] object-cover rounded flex-grow basis-2/5" />}
				</div>
			</div>
			<div
				onClick={(e) => {
					handleStopPropagation(e);
				}}
				className="px-4 py-3 flex items-center gap-x-2 justify-between cursor-default"
			>
				<div className="flex gap-x-2">
					{checkOptionVoice && (
						<a href={`https://meet.google.com/${channelVoice.meeting_code}`} rel="noreferrer" target="_blank" className="flex gap-x-2">
							<Icons.Speaker />
							<p>{channelVoice?.channel_label}</p>
						</a>
					)}
					{checkOptionLocation && (
						<>
							<Icons.Location />
							<p>{address}</p>
						</>
					)}
					{option === '' && !address && !channelVoice && (
						<>
							<Icons.Location />
							<p className="hover:underline text-slate-400">{channelFirst.channel_label}</p>
						</>
					)}
				</div>
				{event && (
					<div
						className="flex gap-x-2 items-center"
						onClick={(e) => {
							handleStopPropagation(e);
						}}
					>
						<div onClick={(e) => handleOpenPanel(e)}>
							<Icons.IconEditThreeDot className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black rotate-90" />
						</div>

						<button className="flex gap-x-1 rounded px-4 py-2 dark:bg-zinc-600 bg-[#6d6f78] hover:bg-opacity-80 font-medium text-white">
							{checkOptionVoice && <Icons.IconShareEventVoice />}
							{checkOptionLocation && <Icons.IConShareEventLocation />}
							Share
						</button>

						{eventStatus === EEventStatus.ONGOING && isClanOwner ? (
							<button
								className="flex gap-x-1 rounded px-4 py-2 dark:bg-zinc-600 bg-[#6d6f78] hover:bg-opacity-80 font-medium text-white"
								onClick={() => setOpenModalDelEvent(true)}
							>
								End event
							</button>
						) : eventStatus !== EEventStatus.ONGOING ? (
							<button className="flex gap-x-1 rounded px-4 py-2 dark:bg-zinc-600 bg-[#6d6f78] hover:bg-opacity-80 font-medium text-white">
								<Icons.MuteBell defaultSize="size-4 text-white" />
								Interested
							</button>
						) : (
							<></>
						)}
					</div>
				)}
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
					onClose={() => setOpenPanel(false)}
				/>
			)}
			{openModalDelEvent && (
				<ModalDelEvent
					event={event}
					onClose={() => setOpenPanel(false)}
					setOpenModalDelEvent={setOpenModalDelEvent}
					onHandle={handleStopPropagation}
				/>
			)}
		</div>
	);
};

export default ItemEventManagement;
