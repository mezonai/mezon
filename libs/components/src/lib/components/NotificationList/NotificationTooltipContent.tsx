import {
	fetchListNotification,
	notificationActions,
	selectCurrentClanId,
	selectNotificationClan,
	selectNotificationForYou,
	selectNotificationMentions,
	selectTheme,
	selectTopicsSort,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { INotification } from '@mezon/utils';
import { NotificationCategory, sortNotificationsByDate } from '@mezon/utils';
import type { ApiSdTopic } from 'mezon-js/dist/api.gen';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import AllNotification from './AllNotification';
import EmptyNotification from './EmptyNotification';
import TopicNotification from './TopicNotification';

const InboxType = {
	INDIVIDUAL: 'individual',
	MESSAGES: 'messages',
	MENTIONS: 'mentions',
	TOPICS: 'topics'
};

function InboxButton() {
	return (
		<div>
			<Icons.Inbox />
		</div>
	);
}

interface NotificationTooltipContentProps {
	onCloseTooltip?: () => void;
}

export function NotificationTooltipContent({ onCloseTooltip }: NotificationTooltipContentProps) {
	const { t } = useTranslation('notifications');
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const appearanceTheme = useSelector(selectTheme);
	const [currentTabNotify, setCurrentTabNotify] = useState(InboxType.MENTIONS);

	const tabDataNotify = useMemo(
		() => [
			{ title: t('tabs.forYou'), value: InboxType.INDIVIDUAL },
			{ title: t('tabs.messages'), value: InboxType.MESSAGES },
			{ title: t('tabs.mentions'), value: InboxType.MENTIONS },
			{ title: t('tabs.topics'), value: InboxType.TOPICS }
		],
		[t]
	);

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

	useEffect(() => {
		if (!currentClanId) return;

		const isAllNotificationForYouEmpty = !(allNotificationForYou?.data?.length > 0);
		const isAllNotificationClanEmpty = !(allNotificationClan?.data?.length > 0);
		const isAllNotificationMentionsEmpty = !(allNotificationMentions?.data?.length > 0);

		let category;

		if (currentTabNotify === InboxType.INDIVIDUAL && isAllNotificationForYouEmpty) {
			category = NotificationCategory.FOR_YOU;
		} else if (currentTabNotify === InboxType.MESSAGES && isAllNotificationClanEmpty) {
			category = NotificationCategory.MESSAGES;
		} else if (currentTabNotify === InboxType.MENTIONS && isAllNotificationMentionsEmpty) {
			category = NotificationCategory.MENTIONS;
		}

		if (category) {
			dispatch(notificationActions.fetchListNotification({ clanId: currentClanId, category }));
		}
	}, [
		currentTabNotify,
		currentClanId,
		allNotificationForYou?.data?.length,
		allNotificationClan?.data?.length,
		allNotificationMentions?.data?.length,
		dispatch
	]);

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
					clanId: currentClanId || '',
					category,
					notificationId: lastId
				})
			);
		};
	};

	return (
		<div className="flex flex-col gap-2 bg-theme-setting-primary text-[14px] text-theme-primary rounded-lg w-[480px] max-w-[600px] max-h-[80vh] z-50 overflow-hidden">
			<div className="py-2 px-3 ">
				<div className="flex flex-row items-center justify-between gap-2 font-bold text-[16px]">
					<div className="flex flex-row items-center gap-4 justify-start">
						<InboxButton />
						<div>{t('inbox')}</div>
					</div>
				</div>
				<div className="flex flex-row border-b-theme-primary">
					<div className="flex flex-row gap-4 py-3 w-[90%]">
						{tabDataNotify.map((tab, index: number) => {
							return (
								<div key={index}>
									<button
										className={`px-2 py-[4px] rounded-[4px] text-base font-medium ${currentTabNotify === tab.value ? 'btn-primary btn-primary-hover' : ''}`}
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
				className={` flex flex-col max-w-[600px] max-h-heightInBox overflow-y-auto overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'app-scroll'}`}
			>
				{currentTabNotify === InboxType.INDIVIDUAL && (
					<div
						ref={listRefForYou}
						className={`max-w-[600px] max-h-heightInBox overflow-y-auto overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'app-scroll'}`}
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
						className={`max-w-[600px] max-h-heightInBox overflow-y-auto overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'app-scroll'}`}
						onScroll={handleScroll(NotificationCategory.MENTIONS, allNotificationMentions?.lastId)}
					>
						{getAllNotificationMentions.length > 0 ? (
							getAllNotificationMentions.map((notification: INotification, index: number) => (
								<AllNotification
									notification={notification}
									key={`mention-${notification?.id}-${index}`}
									onCloseTooltip={onCloseTooltip}
								/>
							))
						) : (
							<EmptyNotification isEmptyMentions />
						)}
					</div>
				)}

				{currentTabNotify === InboxType.MESSAGES && (
					<div
						ref={listRefMessages}
						className={`max-w-[600px] max-h-heightInBox overflow-y-auto overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'app-scroll'}`}
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
								<TopicNotification topic={topic} key={`topic-${topic?.id}-${index}`} onCloseTooltip={onCloseTooltip} />
							))
						) : (
							<EmptyNotification isEmptyMentions />
						)}
					</div>
				)}
			</div>
		</div>
	);
}
