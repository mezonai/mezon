import { useAuth, useGetPriorityNameFromUserClan } from '@mezon/core';
import type { MessagesEntity } from '@mezon/store';
import {
	appActions,
	getStore,
	messagesActions,
	notificationActions,
	selectAllUserClans,
	selectCurrentChannelId,
	selectIsShowCanvas,
	selectIsShowInbox,
	selectMemberClanByUserId,
	selectMessageByMessageId,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import type { ApiChannelMessageHeader, ApiSdTopic } from 'mezon-js/dist/api.gen';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AvatarImage } from '../AvatarImage/AvatarImage';
export type TopicProps = {
	readonly topic: ApiSdTopic;
	onCloseTooltip?: () => void;
};

function TopicNotificationItem({ topic, onCloseTooltip }: TopicProps) {
	const { t } = useTranslation('channelTopbar');
	const navigate = useNavigate();
	const isShowInbox = useSelector(selectIsShowInbox);
	const [subjectTopic, setSubjectTopic] = useState('');
	const dispatch = useAppDispatch();
	const memberClan = useSelector(selectAllUserClans);
	const isShowCanvas = useSelector(selectIsShowCanvas);

	const { userId } = useAuth();
	const userIds = topic.last_sent_message?.repliers;
	const usernames = useMemo(() => {
		return memberClan
			.filter((profile) => (userIds || []).includes(profile?.user?.id || '') && profile?.user?.id !== userId)
			.map((profile) => profile?.user?.username);
	}, [memberClan, userIds, userId]);
	useEffect(() => {
		if (usernames.length === 0) {
			setSubjectTopic('Topic and you');
		}
		if (usernames.length === 1) {
			setSubjectTopic(`${usernames[0]} and you`);
		}
		if (usernames.length > 1) {
			setSubjectTopic(`${usernames[usernames.length - 1]} and ${usernames.length - 1} others`);
		}
	}, [usernames, userIds]);

	const handleOpenTopic = async () => {
		if (isShowCanvas) {
			dispatch(appActions.setIsShowCanvas(false));
		}
		onCloseTooltip?.();
		dispatch(notificationActions.setIsShowInbox(!isShowInbox));
		if (topic.message_id && topic.channel_id) {
			const state = getStore().getState();
			const currentChannelId = selectCurrentChannelId(state);
			if (currentChannelId !== topic.channel_id) {
				await navigate(`/chat/clans/${topic.clan_id}/channels/${topic.channel_id}`);
			}

			dispatch(
				messagesActions.jumpToMessage({
					clanId: topic.clan_id || '',
					messageId: topic.message_id,
					channelId: topic.channel_id,
					navigate
				})
			);

			const waitForMessage = (timeout = 5000): Promise<MessagesEntity | null> =>
				new Promise((resolve) => {
					const startTime = Date.now();
					const checkMessage = () => {
						const state = getStore().getState();
						const msg = selectMessageByMessageId(state, topic.channel_id as string, topic.message_id as string);
						if (msg) {
							return resolve(msg);
						}
						if (Date.now() - startTime > timeout) {
							console.warn('Timeout waiting for message to load');
							return resolve(null);
						}
						requestAnimationFrame(checkMessage);
					};
					checkMessage();
				});

			const fullMessage = await waitForMessage();

			if (fullMessage) {
				dispatch(topicsActions.setCurrentTopicInitMessage(fullMessage as IMessageWithUser));
				dispatch(topicsActions.setInitTopicMessageId(fullMessage.id));
			} else {
				console.error('Failed to load message, cannot set currentTopicInitMessage');
			}

			dispatch(topicsActions.setIsShowCreateTopic(true));
			dispatch(threadsActions.setIsShowCreateThread({ channelId: topic.channel_id as string, isShowCreateThread: false }));
			dispatch(topicsActions.setCurrentTopicId(topic.id || ''));
		}
	};
	const allTabProps = {
		messageReplied: topic?.message,
		subject: subjectTopic,
		senderId: topic?.last_sent_message?.sender_id,
		lastMessageTopic: topic?.last_sent_message,
		topic
	};

	return (
		<div className=" rounded-[8px] relative group" data-e2e={generateE2eId('chat.channel_message.inbox.topics')}>
			<button
				className="absolute py-1 px-2 bg-item-theme bottom-[10px] z-50 right-3 text-[10px] rounded-[6px] transition-all duration-300 group-hover:block hidden"
				onClick={handleOpenTopic}
				data-e2e={generateE2eId('chat.channel_message.inbox.topics.button.jump')}
			>
				{t('tooltips.jump')}
			</button>
			<AllTabContent {...allTabProps} />
		</div>
	);
}

export default TopicNotificationItem;

interface ITopicTabContent {
	messageReplied?: ApiChannelMessageHeader;
	subject?: string;
	senderId?: string;
	lastMessageTopic?: ApiChannelMessageHeader;
	topic?: ApiSdTopic;
}

function AllTabContent({ messageReplied, subject, lastMessageTopic, topic }: ITopicTabContent) {
	const messageRl = useMemo(() => {
		return messageReplied?.content ? safeJSONParse(messageReplied?.content) : null;
	}, [messageReplied]);
	const lastMsgTopic = useMemo(() => {
		return lastMessageTopic?.content ? safeJSONParse(lastMessageTopic?.content) : null;
	}, [lastMessageTopic]);
	const [senderId, setSubjectTopic] = useState(topic?.last_sent_message?.sender_id ?? '');
	useEffect(() => {
		setSubjectTopic(lastMessageTopic?.sender_id ?? '');
	}, [lastMessageTopic]);

	const { priorityAvatar } = useGetPriorityNameFromUserClan(senderId || '');
	const lastSentUser = useAppSelector((state) => selectMemberClanByUserId(state, lastMessageTopic?.sender_id ?? ''));

	return (
		<div className="flex flex-col p-2 bg-item-theme rounded-lg">
			<div className="flex flex-row items-start p-1 w-full gap-4 rounded-lg relative">
				<div className="relative w-11 h-10">
					<AvatarImage
						alt="user avatar"
						className="w-11 h-10 rounded-full border-2 border-color-theme z-10"
						username={lastSentUser?.user?.username}
						srcImgProxy={createImgproxyUrl((priorityAvatar ? priorityAvatar : lastSentUser?.user?.avatar_url) ?? '', {
							width: 300,
							height: 300,
							resizeType: 'fit'
						})}
						src={priorityAvatar ? priorityAvatar : lastSentUser?.user?.avatar_url}
					/>
				</div>
				<div className="h-full flex-1 max-w-full min-w-0">
					<div>
						<div className="text-[12px] font-bold uppercase">{subject}</div>
					</div>
					<div>
						<div
							className="text-[12px] w-fit max-w-full break-words whitespace-normal"
							data-e2e={generateE2eId('chat.channel_message.inbox.topics.init_message')}
						>
							<b className="font-semibold">Replied to</b>: {messageRl ? messageRl?.t : 'Unreachable message'}
						</div>
					</div>
					<div>
						<div
							className="text-[13px] w-fit max-w-full break-words whitespace-normal"
							data-e2e={generateE2eId('chat.channel_message.inbox.topics.last_reply_message')}
						>
							<b className="font-semibold">{lastSentUser ? lastSentUser?.user?.username : 'Sender'}</b>:{' '}
							{lastMsgTopic ? lastMsgTopic?.t : 'Unreachable message'}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
