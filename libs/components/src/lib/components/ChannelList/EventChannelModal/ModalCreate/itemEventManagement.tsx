import { useAppNavigation, useEventManagement, useOnClickOutside, usePermissionChecker } from '@mezon/core';
import { EventManagementEntity, selectChannelById, selectChannelFirst, selectMemberClanByUserId, selectTheme, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EEventStatus, EPermission, OptionEvent, createImgproxyUrl } from '@mezon/utils';
import Tippy from '@tippy.js/react';
import { ChannelType } from 'mezon-js';
import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import { Coords } from '../../../ChannelLink';
import { timeFomat } from '../timeFomatEvent';
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
	textChannelId?: string;
	onClose: () => void;
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
		onEventUpdateId,
		textChannelId,
		onClose
	} = props;
	const isPrivateEvent = textChannelId && textChannelId !== '0';
	const { setChooseEvent, deleteEventManagement } = useEventManagement();
	const channelFirst = useSelector(selectChannelFirst);
	const channelVoice = useAppSelector((state) => selectChannelById(state, voiceChannel ?? '')) || {};
	const textChannel = useAppSelector((state) => selectChannelById(state, textChannelId ?? '')) || {};
	const isThread = textChannel?.type === ChannelType.CHANNEL_TYPE_THREAD;
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

	const eventIsUpcomming = event?.event_status === EEventStatus.UPCOMING;
	const eventIsOngoing = event?.event_status === EEventStatus.ONGOING;

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

	const cssEventStatus = useMemo(() => {
		return eventIsUpcomming ? 'text-purple-500' : eventIsOngoing ? 'text-green-500' : 'dark:text-zinc-400 text-colorTextLightMode';
	}, [event?.event_status]);

	const { toChannelPage, navigate } = useAppNavigation();

	const redirectToVoice = () => {
		if (channelVoice) {
			const channelUrl = toChannelPage(channelVoice.channel_id as string, channelVoice.clan_id as string);
			navigate(channelUrl);
			onClose();
		}
	};

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
							{eventIsUpcomming
								? '10 minutes left. Join in!'
								: eventIsOngoing
									? 'Event is taking place!'
									: timeFomat(event?.start_time || start)}
						</p>
						{isPrivateEvent && <p className="bg-red-500 text-white rounded-sm px-1 text-center">Private Event</p>}{' '}
					</div>
					{event?.creator_id && (
						<Tippy content={<p style={{ width: 'max-content' }}>{`Created by ${userCreate?.user?.username}`}</p>}>
							<div>
								<AvatarImage
									alt={userCreate?.user?.username || ''}
									username={userCreate?.user?.username}
									className="min-w-6 min-h-6 max-w-6 max-h-6"
									srcImgProxy={createImgproxyUrl(userCreate?.user?.avatar_url ?? '')}
									src={userCreate?.user?.avatar_url}
									classNameText="text-[9px] pt-[3px]"
								/>
							</div>
						</Tippy>
					)}
				</div>
				<div className="flex justify-between gap-4 select-text">
					<div className={`${isReviewEvent || !logoRight ? 'w-full' : 'w-3/5'}`}>
						<p className="hover:underline font-bold dark:text-white text-black text-base">{topic}</p>
						<div className="break-all max-h-[75px] eventDescriptionTruncate">
							{isReviewEvent ? reviewDescription : event?.description}
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
						(() => {
							const isGMeet = channelVoice.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE;
							const linkProps = isGMeet
								? { href: `https://meet.google.com/${channelVoice.meeting_code}`, rel: 'noreferrer', target: '_blank' }
								: {
										onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
											handleStopPropagation(e);
											redirectToVoice();
										}
									};
							return (
								<a {...linkProps} className="flex gap-x-2 cursor-pointer">
									<Icons.Speaker />
									<p>{channelVoice?.channel_label}</p>
								</a>
							);
						})()}
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

						{eventIsOngoing && isClanOwner ? (
							<button
								className="flex gap-x-1 rounded px-4 py-2 dark:bg-zinc-600 bg-[#6d6f78] hover:bg-opacity-80 font-medium text-white"
								onClick={() => setOpenModalDelEvent(true)}
							>
								End event
							</button>
						) : !eventIsOngoing ? (
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
			<div className="flex gap-x-2 mx-4 mb-2">
				{textChannelId && textChannelId !== '0' && (
					<span className="flex flex-row">
						<p className="text-slate-400">
							{`The audience consists of members from ${isThread ? 'thread: ' : 'channel: '}`}
							<strong className="text-slate-100">{textChannel.channel_label}</strong>
						</p>
					</span>
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
