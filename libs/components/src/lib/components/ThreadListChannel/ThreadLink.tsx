import {
	notificationSettingActions,
	selectBuzzStateByChannelId,
	selectEventsByChannelId,
	selectIsUnreadChannelById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IChannel } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useImperativeHandle, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import { Link } from 'react-router-dom';
import BuzzBadge from '../BuzzBadge';
import { Coords, classes } from '../ChannelLink';
import SettingChannel from '../ChannelSetting';
import { DeleteModal } from '../ChannelSetting/Component/Modal/deleteChannelModal';
import EventSchedule from '../EventSchedule';
import PanelChannel from '../PanelChannel';

type ThreadLinkProps = {
	thread: IChannel;
	isFirstThread: boolean;
	isActive: boolean;
	handleClick: (thread: IChannel) => void;
};

export type ThreadLinkRef = {
	scrollToIntoView: (options?: ScrollIntoViewOptions) => void;
};

const ThreadLink = React.forwardRef<ThreadLinkRef, ThreadLinkProps>(({ thread, isFirstThread, isActive, handleClick }: ThreadLinkProps, ref) => {
	const isUnReadChannel = useAppSelector((state) => selectIsUnreadChannelById(state, thread.id));
	const numberNotification = thread.count_mess_unread ? thread.count_mess_unread : 0;
	const panelRef = useRef<HTMLDivElement | null>(null);
	const threadLinkRef = useRef<HTMLAnchorElement | null>(null);

	const coords = useRef<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const channelPath = `/chat/clans/${thread.clan_id}/channels/${thread.channel_id}`;
	const buzzState = useAppSelector((state) => selectBuzzStateByChannelId(state, thread?.channel_id ?? ''));
	const events = useAppSelector((state) => selectEventsByChannelId(state, thread?.clan_id ?? '', thread?.channel_id ?? ''));

	const state = isActive ? 'active' : thread?.unread ? 'inactiveUnread' : 'inactiveRead';

	useImperativeHandle(ref, () => ({
		scrollToIntoView: (options?: ScrollIntoViewOptions) => {
			threadLinkRef.current?.scrollIntoView(options);
		}
	}));

	const dispatch = useAppDispatch();

	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;
		const distanceToBottom = windowHeight - event.clientY;
		coords.current = { mouseX, mouseY, distanceToBottom };
		await dispatch(notificationSettingActions.getNotificationSetting({ channelId: thread.id, isCurrentChannel: isActive }));
		openProfileItem();
	};

	const [openProfileItem, closeProfileItem] = useModal(() => {
		return (
			<PanelChannel
				selectedChannel={thread.id}
				onDeleteChannel={handleDeleteChannel}
				channel={thread}
				coords={coords.current}
				openSetting={openSettingModal}
				setIsShowPanelChannel={closeProfileItem}
				rootRef={panelRef}
			/>
		);
	}, [thread.count_mess_unread]);

	const [openDeleteModal, closeDeleteModal] = useModal(() => {
		return <DeleteModal onClose={closeDeleteModal} channelLabel={thread.channel_label || ''} channelId={thread.channel_id as string} />;
	}, []);

	const handleDeleteChannel = useCallback(() => {
		openDeleteModal();
		closeProfileItem();
	}, [openDeleteModal, closeProfileItem]);

	const [openSettingModal, closeSettingModal] = useModal(() => {
		return <SettingChannel onClose={closeSettingModal} channel={thread} />;
	}, []);

	return (
		<div
			className="flex flex-row items-center h-[34px] relative "
			ref={panelRef}
			role={'button'}
			onContextMenu={(event) => handleMouseClick(event)}
		>
			<span className={`absolute ${isFirstThread ? 'top-2 left-5' : 'top-[-18px] left-[21px]'} `}>
				{isFirstThread ? <Icons.ShortCorner /> : <Icons.LongCorner />}
			</span>

			<Link
				draggable="false"
				ref={threadLinkRef}
				to={channelPath}
				key={thread.channel_id}
				className={`${classes[state]} ml-10 w-full leading-[24px] rounded font-medium dark:hover:text-white hover:text-black text-[16px] max-w-full one-line ${isActive || isUnReadChannel || numberNotification > 0 ? 'dark:font-medium font-semibold dark:text-white text-black' : ' dark:text-channelTextLabel text-colorTextLightMode'} ${isActive ? 'dark:bg-[#36373D] bg-bgLightModeButton' : ''}`}
				onClick={() => {
					handleClick(thread);
				}}
			>
				<div className="flex items-center gap-2">
					{events[0] && <EventSchedule event={events[0]} className="inline" />}

					<span title={thread?.channel_label && thread?.channel_label?.length >= 15 ? thread?.channel_label : ''} className="truncate">
						{thread.channel_label}
					</span>
				</div>
			</Link>

			{numberNotification !== 0 && (
				<div className="absolute ml-auto w-4 h-4 top-[9px] text-white right-3 group-hover:hidden bg-red-600 flex justify-center items-center rounded-full text-xs font-medium">
					{numberNotification}
				</div>
			)}
			{buzzState?.isReset ? (
				<BuzzBadge
					timestamp={buzzState?.timestamp as number}
					isReset={buzzState?.isReset}
					channelId={thread.channel_id as string}
					senderId={buzzState.senderId as string}
					mode={ChannelStreamMode.STREAM_MODE_THREAD}
				/>
			) : null}
		</div>
	);
});
export default memo(ThreadLink, (next, curr) => {
	return next.isActive === curr.isActive && next.isFirstThread === curr.isFirstThread && next.thread === curr.thread;
});
