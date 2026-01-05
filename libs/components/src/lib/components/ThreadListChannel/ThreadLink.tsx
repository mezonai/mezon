import { toChannelPage, useChannels, useCustomNavigate, useMenu } from '@mezon/core';
import {
	appActions,
	notificationSettingActions,
	referencesActions,
	selectBuzzStateByChannelId,
	selectCloseMenu,
	selectEventsByChannelId,
	selectIsUnreadChannelById,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import { generateE2eId } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { Link } from 'react-router-dom';
import BuzzBadge from '../BuzzBadge';
import type { Coords } from '../ChannelLink';
import { classes } from '../ChannelLink';
import SettingChannel from '../ChannelSetting';
import EventSchedule from '../EventSchedule';
import ModalConfirm from '../ModalConfirm';
import PanelChannel from '../PanelChannel';

type ThreadLinkProps = {
	thread: IChannel;
	hasLine: boolean;
	isActive: boolean;
	currentChannelId: string;
};

export type ThreadLinkRef = {
	scrollToIntoView: (options?: ScrollIntoViewOptions) => void;
};

const ThreadLink = React.forwardRef<ThreadLinkRef, ThreadLinkProps>(({ thread, hasLine, isActive, currentChannelId }: ThreadLinkProps, ref) => {
	const isUnReadChannel = useAppSelector((state) => selectIsUnreadChannelById(state, thread.id));
	const numberNotification = thread.count_mess_unread ? thread.count_mess_unread : 0;
	const panelRef = useRef<HTMLDivElement | null>(null);
	const threadLinkRef = useRef<HTMLAnchorElement | null>(null);

	const coords = useRef<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const channelPath = `/chat/clans/${thread.clanId}/channels/${thread.channelId}`;
	const buzzState = useAppSelector((state) => selectBuzzStateByChannelId(state, thread?.channelId ?? ''));
	const events = useAppSelector((state) => selectEventsByChannelId(state, thread?.clanId ?? '', thread?.channelId ?? ''));

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
		return (
			<ModalConfirmComponent
				handleCancel={closeDeleteModal}
				channelId={thread.channelId as string}
				clanId={thread.clanId as string}
				modalName={`${thread?.channelLabel || 'Unknown Channel'}`}
			/>
		);
	}, [thread.channelId, thread?.channelLabel]);

	const handleDeleteChannel = useCallback(() => {
		openDeleteModal();
		closeProfileItem();
	}, [openDeleteModal, closeProfileItem]);

	const [openSettingModal, closeSettingModal] = useModal(() => {
		return <SettingChannel onClose={closeSettingModal} channel={thread} />;
	}, [thread.channelLabel]);

	const closeMenu = useAppSelector(selectCloseMenu);
	const { setStatusMenu } = useMenu();
	const navigate = useCustomNavigate();
	const handleClickLink = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, thread: IChannel) => {
		if (e.shiftKey || e.ctrlKey || e.metaKey) {
			e.preventDefault();
			e.stopPropagation();
			const link = toChannelPage(thread.id, thread.clanId as string);
			navigate(link);
		}
		dispatch(referencesActions.setOpenEditMessageState(false));
		if (currentChannelId === thread.parent_id) {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: thread.parent_id as string, isShowCreateThread: false }));
		}
		if (closeMenu) {
			setStatusMenu(false);
		}
		dispatch(threadsActions.setOpenThreadMessageState(false));
		dispatch(threadsActions.setValueThread(null));
		dispatch(appActions.setIsShowCanvas(false));
	};

	return (
		<div
			id={thread.id}
			className={`flex flex-row items-center h-[34px] relative ${isUnReadChannel ? 'before:bg-[var(--text-secondary)] :content-[""] before:w-1 before:h-2 before:rounded-[0px_4px_4px_0px] before:absolute  before:top-3' : ''}`}
			ref={panelRef}
			role={'button'}
			onContextMenu={(event) => handleMouseClick(event)}
		>
			<span className={`absolute top-2 left-5 `}>
				<Icons.ShortCorner />
				{hasLine && <Icons.LongCorner className="absolute -left-[5px] top-2" />}
			</span>

			<Link
				draggable="false"
				ref={threadLinkRef}
				to={channelPath}
				key={thread.channelId}
				className={`${classes[state]} ml-10 w-full leading-[24px] rounded-lg font-medium text-theme-primary-hover  text-[16px] max-w-full one-line ${isActive || isUnReadChannel || numberNotification > 0 ? 'dark:font-medium font-semibold text-theme-primary-active ' : ' '} ${isActive ? 'bg-item-hover text-theme-primary-active bg-item-theme' : 'text-theme-primary'}`}
				onClick={(e) => {
					handleClickLink(e, thread);
				}}
			>
				<div className="flex items-center gap-2">
					{events[0] && <EventSchedule event={events[0]} className="inline" />}

					<span
						title={thread?.channelLabel && thread?.channelLabel?.length >= 15 ? thread?.channelLabel : ''}
						className="truncate"
						data-e2e={generateE2eId('clan_page.channel_list.thread_item.name')}
					>
						{thread.channelLabel}
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
					channelId={thread.channelId as string}
					senderId={buzzState.senderId as string}
					mode={ChannelStreamMode.STREAM_MODE_THREAD}
				/>
			) : null}
		</div>
	);
});
export default memo(ThreadLink, (next, curr) => {
	return next.isActive === curr.isActive && next.hasLine === curr.hasLine && next.thread === curr.thread;
});

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
			title={t('confirm.deleteThread.title')}
			modalName={modalName}
			customTitle={t('confirm.deleteThread.content', { channelName: modalName || 'Unknown Channel' })}
		/>
	);
};
