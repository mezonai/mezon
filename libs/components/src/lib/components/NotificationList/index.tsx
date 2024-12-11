import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import {
	fetchListNotification,
	notificationActions,
	selectAllNotification,
	selectAllNotificationClan,
	selectAllNotificationExcludeMentionAndReply,
	selectAllNotificationMentionAndReply,
	selectCurrentClan,
	selectLastNotificationId,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { INotification, sortNotificationsByDate } from '@mezon/utils';
import { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AllNotification from './AllNotification';
import EmptyNotification from './EmptyNotification';
import NotificationChannel from './NotificationChannel';
import NotificationItem from './NotificationItem';
import NotificationWebhookClan from './NotificationWebhookClan';

export type MemberListProps = { className?: string };

export type NotificationProps = {
	rootRef?: RefObject<HTMLElement>;
};

const InboxType = {
	ALL: 'all',
	INDIVIDUAL: 'individual',
	MESSAGES: 'messages',
	MENTIONS: 'mentions'
};

const tabDataNotify = [
	{ title: 'All', value: InboxType.ALL },
	{ title: 'For you', value: InboxType.INDIVIDUAL },
	{ title: 'Messages', value: InboxType.MESSAGES },
	{ title: 'Mentions', value: InboxType.MENTIONS }
];

function NotificationList({ rootRef }: NotificationProps) {
	const currentClan = useSelector(selectCurrentClan);
	const dispatch = useAppDispatch();
	const allNotificationClan = useSelector(selectAllNotificationClan);

	const [currentTabNotify, setCurrentTabNotify] = useState(InboxType.ALL);
	const handleChangeTab = (valueTab: string) => {
		setCurrentTabNotify(valueTab);
	};

	const getNotificationExcludeMentionAndReplyUnread = useSelector(selectAllNotificationExcludeMentionAndReply);
	const getAllNotificationMentionAndReply = useSelector(selectAllNotificationMentionAndReply);

	const getExcludeMentionAndReply = useMemo(() => {
		return sortNotificationsByDate(getNotificationExcludeMentionAndReplyUnread);
	}, [getNotificationExcludeMentionAndReplyUnread]);

	const getAllNotificationClan = useMemo(() => {
		return sortNotificationsByDate(allNotificationClan);
	}, [allNotificationClan]);

	const getAllMentionAndReply = useMemo(() => {
		return sortNotificationsByDate(getAllNotificationMentionAndReply);
	}, [getAllNotificationMentionAndReply]);

	const modalRef = useRef<HTMLDivElement>(null);
	const handleHideInbox = useCallback(() => {
		dispatch(notificationActions.setIsShowInbox(false));
	}, []);

	useEscapeKeyClose(modalRef, handleHideInbox);
	useOnClickOutside(modalRef, handleHideInbox, rootRef);

	const listRef = useRef<HTMLDivElement | null>(null);
	const notifications = useSelector(selectAllNotification);
	const getAllNotifications = useMemo(() => {
		return sortNotificationsByDate(notifications);
	}, [notifications]);
	const lastNotificationId = useSelector(selectLastNotificationId);
	const handleScroll = () => {
		if (!listRef.current || !lastNotificationId) return;

		const { scrollTop, scrollHeight, clientHeight } = listRef.current;

		if (scrollHeight - scrollTop !== clientHeight) return;

		dispatch(
			fetchListNotification({
				clanId: currentClan?.id || '',
				notificationId: lastNotificationId
			})
		);
	};

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 right-0 z-[99999999] rounded-lg dark:shadow-shadowBorder shadow-shadowInbox w-[480px]"
		>
			<div className="flex flex-col dark:bg-bgPrimary bg-white border-borderDefault dark:text-contentSecondary text-black text-[14px] rounded-lg w-1/2 min-w-[480px] max-w-[600px] z-50 overflow-hidden">
				<div className="py-2 px-3 dark:bg-[#2B2D31] bg-[#F2F3F5]">
					<div className="flex flex-row items-center justify-between gap-2 font-bold text-[16px]">
						<div className="flex flex-row items-center justify-start">
							<InboxButton />
							<div>Inbox </div>
						</div>
					</div>
					<div className="flex flex-row border-b-[1px] border-b-gray-300">
						<div className="flex flex-row gap-4 py-3 w-[70%]">
							{tabDataNotify.map((tab, index: number) => {
								return (
									<div key={index}>
										<button
											className={`px-2 py-[4px] rounded-[4px] text-base font-medium ${currentTabNotify === tab.value ? 'dark:bg-bgTertiary bg-bgLightModeButton dark:text-contentPrimary text-colorTextLightMode' : ''}`}
											tabIndex={index}
											onClick={() => handleChangeTab(tab.value)}
										>
											{tab.title}
										</button>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<div
					ref={listRef}
					className="dark:bg-bgSecondary bg-bgLightSecondary flex flex-col max-w-[600px] max-h-heightInBox overflow-y-auto"
					onScroll={handleScroll}
				>
					{currentTabNotify === InboxType.ALL && (
						<div>
							{getAllNotifications.length > 0 ? (
								getAllNotifications.map((notification, index) => (
									<AllNotification notification={notification} key={`all-${notification?.id}-${index}`} />
								))
							) : (
								<EmptyNotification isEmptyMessages />
							)}
						</div>
					)}

					{currentTabNotify === InboxType.INDIVIDUAL && (
						<div>
							{getExcludeMentionAndReply.length > 0 ? (
								getExcludeMentionAndReply.map((notify, index) => (
									<NotificationItem notify={notify} key={`individual-${notify?.id}-${index}`} />
								))
							) : (
								<EmptyNotification isEmptyForYou />
							)}
						</div>
					)}

					{currentTabNotify === InboxType.MESSAGES && (
						<div>
							{getAllNotificationClan.length > 0 ? (
								getAllNotificationClan.map((notification: INotification, index: number) => (
									<NotificationWebhookClan
										key={`message-${notification?.id}-${index}`}
										isUnreadTab={true}
										notification={notification}
									/>
								))
							) : (
								<EmptyNotification isEmptyMessages />
							)}
						</div>
					)}

					{currentTabNotify === InboxType.MENTIONS && (
						<div>
							{getAllMentionAndReply.length > 0 ? (
								getAllMentionAndReply.map((notification: INotification, index: number) => (
									<NotificationChannel
										key={`mention-${notification?.id}-${index}`}
										isUnreadTab={false}
										unreadListConverted={[]}
										notification={notification}
									/>
								))
							) : (
								<EmptyNotification isEmptyMentions />
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default NotificationList;

function InboxButton() {
	return (
		<div>
			<Icons.Inbox />
		</div>
	);
}
