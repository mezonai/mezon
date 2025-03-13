import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import {
	fetchListNotification,
	notificationActions,
	selectCurrentClan,
	selectNotificationClan,
	selectNotificationForYou,
	selectNotificationMentions,
	selectTopicsSort,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { INotification, NotificationCategory, sortNotificationsByDate } from '@mezon/utils';
import { ApiSdTopic } from 'mezon-js/dist/api.gen';
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AllNotification from './AllNotification';
import EmptyNotification from './EmptyNotification';
import TopicNotification from './TopicNotification';

export type MemberListProps = { className?: string };

export type NotificationProps = {
	rootRef?: RefObject<HTMLElement>;
};

const InboxType = {
	INDIVIDUAL: 'individual',
	MESSAGES: 'messages',
	MENTIONS: 'mentions',
	TOPICS: 'topics'
};

const tabDataNotify = [
	{ title: 'For you', value: InboxType.INDIVIDUAL },
	{ title: 'Messages', value: InboxType.MESSAGES },
	{ title: 'Mentions', value: InboxType.MENTIONS },
	{ title: 'Topics', value: InboxType.TOPICS }
];

function NotificationList({ rootRef }: NotificationProps) {
	const currentClan = useSelector(selectCurrentClan);
	const dispatch = useAppDispatch();

	const [currentTabNotify, setCurrentTabNotify] = useState(InboxType.MENTIONS);
	const handleChangeTab = (valueTab: string) => {
		setCurrentTabNotify(valueTab);
	};

	const allNotificationForYou = useSelector(selectNotificationForYou);
	const allNotificationMentions = useSelector(selectNotificationMentions);
	const allNotificationClan = useSelector(selectNotificationClan);
	const getAllTopic = useSelector(selectTopicsSort);

	const getAllNotificationForYou = useMemo(() => {
		return sortNotificationsByDate([...allNotificationForYou.data]);
	}, [allNotificationForYou]);

	const getAllNotificationMentions = useMemo(() => {
		return sortNotificationsByDate([...allNotificationMentions.data]);
	}, [allNotificationMentions]);

	const getAllNotificationClan = useMemo(() => {
		return sortNotificationsByDate([...allNotificationClan.data]);
	}, [allNotificationClan]);

	const modalRef = useRef<HTMLDivElement>(null);
	const handleHideInbox = useCallback(() => {
		dispatch(notificationActions.setIsShowInbox(false));
	}, []);

	useEscapeKeyClose(modalRef, handleHideInbox);
	useOnClickOutside(modalRef, handleHideInbox, rootRef);

	useEffect(() => {
		if (!currentClan?.clan_id) return;

		const isAllNotificationForYouEmpty = !(allNotificationForYou?.data?.length > 0);
		const isAllNotificationClanEmpty = !(allNotificationClan?.data?.length > 0);
		const isAllNotificationMentionsEmpty = !(allNotificationMentions?.data?.length > 0);

		let category = null;

		if (currentTabNotify === InboxType.INDIVIDUAL && isAllNotificationForYouEmpty) {
			category = NotificationCategory.FOR_YOU;
		} else if (currentTabNotify === InboxType.MESSAGES && isAllNotificationClanEmpty) {
			category = NotificationCategory.MESSAGES;
		} else if (currentTabNotify === InboxType.MENTIONS && isAllNotificationMentionsEmpty) {
			category = NotificationCategory.MENTIONS;
		}

		if (category) {
			dispatch(notificationActions.fetchListNotification({ clanId: currentClan.clan_id, category }));
		}
	}, [currentTabNotify]);

	const listRefForYou = useRef<HTMLDivElement | null>(null);
	const listRefMentions = useRef<HTMLDivElement | null>(null);
	const listRefMessages = useRef<HTMLDivElement | null>(null);

	const handleScroll = (category: NotificationCategory, lastId: string | null) => {
		return (event: React.UIEvent<HTMLDivElement>) => {
			const target = event.currentTarget;
			if (!lastId) return;

			const { scrollTop, scrollHeight, clientHeight } = target;

			if (scrollHeight - scrollTop !== clientHeight) return;

			dispatch(
				fetchListNotification({
					clanId: currentClan?.id || '',
					category: category,
					notificationId: lastId
				})
			);
		};
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
						<div className="flex flex-row gap-4 py-3 w-[90%]">
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

				<div className="dark:bg-bgSecondary bg-bgLightSecondary flex flex-col max-w-[600px] max-h-heightInBox overflow-y-auto">
					{currentTabNotify === InboxType.INDIVIDUAL && (
						<div
							ref={listRefForYou}
							className="max-w-[600px] max-h-heightInBox overflow-y-auto"
							onScroll={handleScroll(NotificationCategory.FOR_YOU, allNotificationForYou?.lastId)}
						>
							{getAllNotificationForYou.length > 0 ? (
								getAllNotificationForYou.map((notification: INotification, index: number) => (
									<AllNotification notification={notification} key={`individual-${notification?.id}-${index}`} />
								))
							) : (
								<EmptyNotification isEmptyForYou />
							)}
						</div>
					)}

					{currentTabNotify === InboxType.MENTIONS && (
						<div
							ref={listRefMentions}
							className="max-w-[600px] max-h-heightInBox overflow-y-auto"
							onScroll={handleScroll(NotificationCategory.MENTIONS, allNotificationMentions?.lastId)}
						>
							{getAllNotificationMentions.length > 0 ? (
								getAllNotificationMentions.map((notification: INotification, index: number) => (
									<AllNotification notification={notification} key={`mention-${notification?.id}-${index}`} />
								))
							) : (
								<EmptyNotification isEmptyMentions />
							)}
						</div>
					)}

					{currentTabNotify === InboxType.MESSAGES && (
						<div
							ref={listRefMessages}
							className="max-w-[600px] max-h-heightInBox overflow-y-auto"
							onScroll={handleScroll(NotificationCategory.MESSAGES, allNotificationClan?.lastId)}
						>
							{getAllNotificationClan.length > 0 ? (
								getAllNotificationClan.map((notification: INotification, index: number) => (
									<AllNotification notification={notification} key={`message-${notification?.id}-${index}`} />
								))
							) : (
								<EmptyNotification isEmptyMessages />
							)}
						</div>
					)}

					{currentTabNotify === InboxType.TOPICS && (
						<div>
							{getAllTopic.length > 0 ? (
								getAllTopic.map((topic: ApiSdTopic, index: number) => (
									<TopicNotification topic={topic} key={`topic-${topic?.id}-${index}`} />
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
