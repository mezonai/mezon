import { useGetPriorityNameFromUserClan } from '@mezon/core';
import type { MessagesEntity } from '@mezon/store';
import {
	appActions,
	getStore,
	messagesActions,
	notificationActions,
	selectChannelById,
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
import { createImgproxyUrl, generateE2eId, getShareContactInfo } from '@mezon/utils';
import type { ApiChannelMessageHeader, ApiSdTopic } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { extractIdsFromUrl } from '../MessageWithUser/MessageLine';

export type TopicProps = {
	readonly topic: ApiSdTopic;
	onCloseTooltip?: () => void;
};

const PlainChannelName = ({ channelId }: { channelId: string }) => {
	const channel = useAppSelector((state) => selectChannelById(state, channelId));
	return <span>#{channel?.channel_label || 'unknown'}</span>;
};

function TopicNotificationItem({ topic, onCloseTooltip }: TopicProps) {
	const { t } = useTranslation(['channelTopbar', 'notification']);
	const navigate = useNavigate();
	const isShowInbox = useSelector(selectIsShowInbox);
	const subjectTopic = t('notification:topicAndYou');
	const dispatch = useAppDispatch();
	const isShowCanvas = useSelector(selectIsShowCanvas);

	const rafIdsRef = useRef<Set<number>>(new Set());
	const isUnmountedRef = useRef(false);
	useEffect(() => {
		return () => {
			isUnmountedRef.current = true;
			rafIdsRef.current.forEach((id) => cancelAnimationFrame(id));
			rafIdsRef.current.clear();
		};
	}, []);

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
					clanId: topic.clan_id || '0',
					messageId: topic.message_id,
					channelId: topic.channel_id,
					navigate
				})
			);

			const waitForMessage = (timeout = 5000): Promise<MessagesEntity | null> =>
				new Promise((resolve) => {
					const startTime = Date.now();
					const checkMessage = () => {
						if (isUnmountedRef.current) {
							return resolve(null);
						}
						const state = getStore().getState();
						const msg = selectMessageByMessageId(state, topic.channel_id as string, topic.message_id as string);
						if (msg) {
							return resolve(msg);
						}
						if (Date.now() - startTime > timeout) {
							console.warn('Timeout waiting for message to load');
							return resolve(null);
						}
						const id = requestAnimationFrame(() => {
							rafIdsRef.current.delete(id);
							checkMessage();
						});
						rafIdsRef.current.add(id);
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
		messageReplied: topic,
		subject: subjectTopic,
		topic
	};

	return (
		<div className="rounded-[8px] relative group max-h-[150px] overflow-hidden" data-e2e={generateE2eId('chat.channel_message.inbox.topics')}>
			<button
				className="absolute py-1 px-2 bg-theme-setting-primary bottom-[10px] z-50 right-3 text-[10px] rounded-[6px] transition-all duration-300 group-hover:block hidden"
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
	topic?: ApiSdTopic;
}

function AllTabContent({ messageReplied, subject, topic }: ITopicTabContent) {
	const { t } = useTranslation(['channelTopbar', 'notification', 'common']);
	
	const originalMessage = useAppSelector((state) => 
		topic?.channel_id && topic?.message_id 
			? selectMessageByMessageId(state, topic.channel_id, topic.message_id) 
			: null
	);

	const messageRl = useMemo(() => {
		const contentRaw = (messageReplied as any)?.content || topic?.message?.content;
		const mentionsRaw = (messageReplied as any)?.mentions || topic?.message?.mentions;
		let parsedContent: any = null;

		if (originalMessage?.content) {
			if (typeof originalMessage.content === 'string' && originalMessage.content.startsWith('{')) {
				parsedContent = safeJSONParse(originalMessage.content);
			} else if (typeof originalMessage.content === 'string') {
				parsedContent = { t: originalMessage.content };
			} else {
				parsedContent = originalMessage.content;
			}
		} else if (contentRaw) {
			if (typeof contentRaw === 'string' && contentRaw.startsWith('{')) {
				parsedContent = safeJSONParse(contentRaw);
			} else {
				parsedContent = { t: contentRaw };
			}
		}

		if (parsedContent) {
			const mentions = mentionsRaw || originalMessage?.mentions || [];
			return { ...parsedContent, mentions };
		}

		return null;
	}, [messageReplied, topic, originalMessage]);

	const { isShareContact } = useMemo(() => {
		return getShareContactInfo(messageRl?.embed);
	}, [messageRl?.embed]);

	const resolvedSenderId = useMemo(() => {
		const senderId = topic?.last_sent_message?.sender_id;
		if (!senderId) {
			return topic?.creator_id || '';
		}
		return senderId;
	}, [topic?.last_sent_message?.sender_id, topic?.creator_id]);

	const { priorityAvatar, isAnonymous } = useGetPriorityNameFromUserClan(resolvedSenderId);
	const lastSentUser = useAppSelector((state) => selectMemberClanByUserId(state, resolvedSenderId));

	const renderMessagePreview = () => {
		if (isShareContact) return t('notification:contactMessage');
		if ((messageRl as any)?.attachments?.length > 0 || (messageRl as any)?.components?.length > 0) return t('notification:attachmentMessage');
		if (messageRl?.embed) return t('notification:interactiveMessage');
		if (!messageRl?.t) return t('notification:attachmentMessage');

		const text = messageRl.t;
		const regex = /(https?:\/\/[^\s]+\/chat\/clans\/\d{19}\/channels\/\d{19}(?:\/canvas\/[^/\s]+)?)/g;
		const parts = text.split(regex);

		return (
			<span className="whitespace-pre-wrap">
				{parts.map((part: string, index: number) => {
					const ids = extractIdsFromUrl(part);
					if (ids) {
						return <PlainChannelName key={index} channelId={ids.channelId} />;
					}
					return <span key={index}>{part}</span>;
				})}
			</span>
		);
	};

	return (
		<div className="flex flex-col p-2 bg-item-theme rounded-lg">
			<div className="flex flex-row items-start p-1 w-full gap-4 rounded-lg relative">
				<div className="relative w-12 h-12">
					<AvatarImage
						alt="user avatar"
						className="!w-12 !h-12 rounded-full border-2 border-color-theme z-10"
						username={isAnonymous ? '' : lastSentUser?.user?.username}
						isAnonymous={isAnonymous}
						srcImgProxy={
							isAnonymous
								? ''
								: createImgproxyUrl((priorityAvatar ? priorityAvatar : lastSentUser?.user?.avatar_url) ?? '', {
										width: 300,
										height: 300,
										resizeType: 'fit'
									})
						}
						src={isAnonymous ? '' : priorityAvatar ? priorityAvatar : lastSentUser?.user?.avatar_url}
					/>
				</div>
				<div className="h-full flex-1 max-w-full min-w-0 gap-1">
					<div>
						<div className="text-[12px] font-bold uppercase">{subject}</div>
					</div>
					<div className="pt-1">
						<div
							className="text-[12px] w-full max-w-full font-normal"
							style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}
							data-e2e={generateE2eId('chat.channel_message.inbox.topics.init_message')}
						>
							<span className="font-semibold">{t('notification:repliedTo')} </span>
							{renderMessagePreview()}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
