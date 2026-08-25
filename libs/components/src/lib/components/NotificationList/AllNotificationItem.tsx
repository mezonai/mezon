import { getShowName, getTagById, useColorsRoleById, useGetPriorityNameFromUserClan, useNotification, useOnClickOutside } from '@mezon/core';
import { selectChannelById, selectClanById, selectMemberDMByUserId, useAppSelector } from '@mezon/store';
import type { IEmbedProps, IExtendedMessage, IMentionOnMessage, IMessageWithUser, INotification, INotificationContent } from '@mezon/utils';
import {
	DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR,
	NotificationCategory,
	TOPBARS_MAX_WIDTH,
	adjustMentionsForStrippedMarkers,
	convertTimeString,
	createImgproxyUrl,
	generateE2eId,
	getShareContactInfo,
	patchLinkTokens,
	processText,
	stripNotificationMarkers
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationJump } from '../../hooks/useNotificationJump';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import ButtonCopy from '../ButtonSwitchCustom/CopyButtonComponent';
import MessageAttachment from '../MessageWithUser/MessageAttachment';
import { MessageLine } from '../MessageWithUser/MessageLine';
import getPendingNames from '../MessageWithUser/usePendingNames';
import ShareContactCard from '../ShareContact/ShareContactCard';
import { NotificationAttachmentItem } from './NotificationAttachmentItem';
export type NotifyMentionProps = {
	readonly notify: INotification;
	onCloseTooltip?: () => void;
};

function buildNotificationMessageContent(contentRaw: string | undefined, mentions: IMentionOnMessage[]): IExtendedMessage {
	if (!contentRaw) {
		return { t: '', mentions };
	}

	if (contentRaw.startsWith('{')) {
		try {
			const parsed = safeJSONParse(contentRaw) as IExtendedMessage;
			if (parsed && typeof parsed === 'object' && (parsed.t !== undefined || parsed.lk || parsed.mk)) {
				return patchLinkTokens({ ...parsed, mentions });
			}
		} catch {
			// fall through to plain-text parsing
		}
	}

	const text = stripNotificationMarkers(contentRaw);
	const adjustedMentions = adjustMentionsForStrippedMarkers(contentRaw, mentions);
	const { links, voiceRooms, markdowns } = processText(text);

	return patchLinkTokens({
		t: text,
		mentions: adjustedMentions,
		...(links.length > 0 ? { lk: links } : {}),
		...(voiceRooms.length > 0 ? { vk: voiceRooms } : {}),
		...(markdowns.length > 0 ? { mk: markdowns } : {})
	});
}

function getNotificationCopyText(contentRaw: string | undefined): string {
	if (!contentRaw) {
		return '';
	}

	if (contentRaw.startsWith('{')) {
		try {
			const parsed = safeJSONParse(contentRaw) as IExtendedMessage;
			if (parsed?.t) {
				return parsed.t;
			}
		} catch {
			// fall through to plain-text parsing
		}
	}

	return stripNotificationMarkers(contentRaw);
}

function AllNotificationItem({ notify, onCloseTooltip }: NotifyMentionProps) {
	const { t } = useTranslation('channelTopbar');
	const { t: tContextMenu } = useTranslation('contextMenu');
	const channelJump = getTagById(notify?.channel_id);
	const mode = useMemo<ChannelStreamMode>(() => {
		if (!channelJump) {
			return ChannelStreamMode.STREAM_MODE_CHANNEL;
		}

		switch (channelJump.type) {
			case ChannelType.CHANNEL_TYPE_CHANNEL:
				return ChannelStreamMode.STREAM_MODE_CHANNEL;
			case ChannelType.CHANNEL_TYPE_THREAD:
				return ChannelStreamMode.STREAM_MODE_THREAD;
			case ChannelType.CHANNEL_TYPE_GROUP:
				return ChannelStreamMode.STREAM_MODE_GROUP;
			default:
				return ChannelStreamMode.STREAM_MODE_DM;
		}
	}, [channelJump]);
	const message = notify?.content;
	const messageId = message?.message_id;
	const channelId = message?.channel_id;
	const clanId = message?.clan_id;

	const topicId = notify?.topic_id || notify?.content?.tp || '0';

	const isTopic = !!topicId && topicId !== '0';

	const { handleClickJump } = useNotificationJump({
		messageId,
		channelId,
		clanId,
		topicId,
		isTopic,
		mode,
		onCloseTooltip
	});

	const { deleteNotify } = useNotification();
	const handleDeleteNotification = (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		notificationId: string,
		category: NotificationCategory
	) => {
		event.stopPropagation();
		deleteNotify(notificationId, category);
	};

	const contentSenderId = notify?.content?.sender_id;
	const messageContent = getNotificationCopyText(notify?.content?.content);
	const allTabProps = {
		subject: notify.subject,
		category: notify.category,
		senderId: contentSenderId && contentSenderId !== '0' ? contentSenderId : notify.sender_id,
		embed: notify?.content?.embed as IEmbedProps[] | undefined,
		onCloseTooltip
	};

	const isShowJump =
		notify.category === NotificationCategory.MENTIONS ||
		(notify.category === NotificationCategory.MESSAGES &&
			notify?.content?.channel_id &&
			notify?.content?.channel_id !== '0' &&
			notify?.content?.clan_id &&
			notify?.content?.message_id);

	return (
		<div className=" bg-transparent rounded-[8px] relative group">
			<button
				onClick={(event) => handleDeleteNotification(event, notify.id, notify.category as NotificationCategory)}
				className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-item-theme-hover text-theme-primary hover:text-red-500 text-sm font-bold shadow-md transition-all  hover:scale-110 active:scale-95"
				data-e2e={generateE2eId('chat.channel_message.inbox.for_you.button.remove')}
			>
				✕
			</button>

			{notify.category === NotificationCategory.MESSAGES && messageContent && (
				<div
					className="absolute top-1 right-7 z-50 opacity-0 group-hover:opacity-100 transition-opacity"
					title={tContextMenu('copyText')}
					onClick={(event) => event.stopPropagation()}
				>
					<ButtonCopy
						copyText={messageContent}
						className="flex items-center justify-center w-5 h-5 rounded-full bg-item-theme-hover text-theme-primary hover:text-theme-primary-active p-0 shadow-md hover:scale-110 active:scale-95"
					/>
				</div>
			)}

			{isShowJump && (
				<button
					className="absolute py-1 px-2 bottom-[10px] z-50 right-3 text-[10px] rounded-lg border-theme-primary transition-all duration-300 group-hover:block hidden bg-item-theme"
					onClick={handleClickJump}
					data-e2e={generateE2eId('chat.channel_message.inbox.for_you.button.jump')}
				>
					{t('tooltips.jump')}
				</button>
			)}
			{message && (
				<AllTabContent
					{...allTabProps}
					onCloseTooltip={onCloseTooltip}
					message={{
						...message,
						create_time_seconds:
							(notify?.category === NotificationCategory.FOR_YOU ? notify.create_time_seconds : message?.create_time_seconds) ?? 0
					}}
				/>
			)}
		</div>
	);
}

export default AllNotificationItem;

interface IMentionTabContent {
	message: INotificationContent;
	subject?: string;
	category?: number;
	senderId?: string;
	embed?: IEmbedProps[];
	onCloseTooltip?: () => void;
}

function AllTabContent({ message, subject, category, senderId, embed, onCloseTooltip }: IMentionTabContent) {
	const { t } = useTranslation(['channelTopbar', 'common', 'message']);
	const [isExpanded, setIsExpanded] = useState(false);
	const attachmentContainerRef = useRef<HTMLDivElement>(null);

	useOnClickOutside(attachmentContainerRef, () => {
		if (isExpanded) {
			setIsExpanded(false);
		}
	});

	const { priorityAvatar, namePriority, usernameSender } = useGetPriorityNameFromUserClan(senderId || message.sender_id || '');

	const currentChannel = useAppSelector((state) => selectChannelById(state, message.channel_id || '0')) || {};
	const parentChannel = useAppSelector((state) => selectChannelById(state, currentChannel.parent_id || '')) || {};

	const clan = useAppSelector(selectClanById(message.clan_id as string));
	const user = useAppSelector((state) => selectMemberDMByUserId(state, senderId ?? ''));

	const username = message.username || user?.username || usernameSender || '';
	let subjectText = subject;

	if (username && subject?.startsWith(username)) {
		const usernameLenght = username.length;
		subjectText = subject?.slice(usernameLenght);
	}
	const isChannel = currentChannel.type === ChannelType.CHANNEL_TYPE_CHANNEL;

	const { isShareContact, shareContactEmbed } = useMemo(() => {
		return getShareContactInfo(embed);
	}, [embed]);

	const mentions = useMemo<IMentionOnMessage[]>(() => {
		const mention = message.mention_ids?.map((item, index) => {
			return {
				e: message.position_e?.[index],
				s: message.position_s?.[index],
				role_id: message.is_mention_role?.[index] ? item : '',
				user_id: message.is_mention_role?.[index] ? '' : item
			};
		});
		return mention || [];
	}, [message.mention_ids, message.position_e, message.position_s, message.is_mention_role]);

	const messageLineContent = useMemo(() => buildNotificationMessageContent(message.content, mentions), [message.content, mentions]);
	const hasMessageText = useMemo(() => {
		return Boolean(
			messageLineContent?.t?.trim() ||
				messageLineContent?.mk?.length ||
				messageLineContent?.lk?.length ||
				messageLineContent?.vk?.length ||
				messageLineContent?.ej?.length
		);
	}, [messageLineContent]);

	return (
		<div className="flex flex-col p-2 bg-item-theme rounded-lg overflow-hidden">
			<div className="flex flex-row items-start p-1 w-full gap-4 rounded-lg ">
				<AvatarImage
					alt="user avatar"
					className="w-10 h-10 min-w-10 flex-shrink-0"
					username={username}
					srcImgProxy={createImgproxyUrl((priorityAvatar ? priorityAvatar : message.avatar || user?.avatar_url) ?? '', {
						width: 300,
						height: 300,
						resizeType: 'fit'
					})}
					src={priorityAvatar ? priorityAvatar : message.avatar || user?.avatar_url}
				/>

				<div className="h-full w-full min-w-0 flex-1">
					<div className="flex flex-col gap-[2px] text-[12px] font-bold ">
						{category === NotificationCategory.MENTIONS || category === NotificationCategory.MESSAGES ? (
							clan?.clan_name ? (
								<div className="flex flex-col text-sm min-w-0">
									<div className="flex items-center gap-1 min-w-0">
										<span className="uppercase truncate max-w-[120px] overflow-hidden whitespace-nowrap">{clan.clan_name}</span>
										{(isChannel ? currentChannel.category_name : parentChannel.category_name) && (
											<>
												<span>{'>'}</span>
												<span className="truncate max-w-[130px] overflow-hidden whitespace-nowrap uppercase">
													{isChannel ? currentChannel.category_name : parentChannel.category_name}
												</span>
											</>
										)}
									</div>

									{(currentChannel?.channel_label || parentChannel?.channel_label) && (
										<div className="flex items-center gap-1 min-w-0 text-[13px]">
											<span className="truncate max-w-[120px] overflow-hidden whitespace-nowrap">
												{isChannel ? `#${currentChannel.channel_label}` : `#${parentChannel.channel_label}`}
											</span>
											{!isChannel && currentChannel?.channel_label && (
												<>
													<span>{'>'}</span>
													<span className="truncate max-w-[130px] overflow-hidden whitespace-nowrap">
														{`${currentChannel.channel_label}`}
													</span>
												</>
											)}
										</div>
									)}
								</div>
							) : (
								t('directMessage')
							)
						) : (
							''
						)}
					</div>
					{category === NotificationCategory.MENTIONS || category === NotificationCategory.MESSAGES ? (
						<div
							className={`w-[85%] max-w-[85%]${category === NotificationCategory.MESSAGES ? ' enableSelectText cursor-text' : ''}`}
							data-e2e={generateE2eId('chat.channel_message.inbox.mentions')}
						>
							<MessageHead
								message={{
									id: message.message_id || '',
									avatar: message.avatar || '',
									channel_id: message.channel_id || '',
									clan_id: message.clan_id || '',
									channel_label: isChannel ? currentChannel.channel_label || '' : parentChannel.channel_label || '',
									content: message.content || '',
									code: 0,
									sender_id: message.sender_id || '',
									display_name: message.display_name || message.username || '',
									username: message.username || '',
									user: {
										id: message.sender_id || '',
										name: message.display_name || message.username || '',
										username: message.username || ''
									},
									create_time_seconds: message.create_time_seconds || 0
								}}
								mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
							/>
							{isShareContact && shareContactEmbed ? (
								<ShareContactCard embed={shareContactEmbed} />
							) : hasMessageText ? (
								<MessageLine
									messageId={message.message_id}
									isEditted={false}
									content={messageLineContent}
									isTokenClickAble={false}
									isJumMessageEnabled={false}
									onCloseTooltip={onCloseTooltip}
								/>
							) : null}
							{message.attachment_link && (
								<div ref={attachmentContainerRef} className="flex flex-col">
									{!isExpanded ? (
										<div className="max-h-[150px] max-w-[150px] overflow-hidden rounded-lg">
											<div>
												<MessageAttachment
													mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
													message={{
														...{
															id: message.message_id || '',
															avatar: message.avatar || '',
															channel_id: message.channel_id || '',
															clan_id: message.clan_id || '',
															channel_label: isChannel
																? currentChannel.channel_label || ''
																: parentChannel.channel_label || '',
															content: message.content || '',
															code: 0,
															sender_id: message.sender_id || '',
															user: {
																id: message.sender_id || '',
																name: message.username || '',
																username: message.username || ''
															}
														},
														attachments: [
															{
																url: message.attachments?.[0]?.url || message.attachment_link || '',
																filetype: message.attachments?.[0]?.filetype || message.attachment_type || '',
																size: message.attachments?.[0]?.size || message.attachment_size || 0,
																filename: message.attachments?.[0]?.filename || message.content || ''
															}
														]
													}}
													defaultMaxWidth={TOPBARS_MAX_WIDTH}
												/>
											</div>
										</div>
									) : (
										<div className="flex flex-col gap-1.5 w-full">
											{(message.attachments && message.attachments.length > 0
												? message.attachments
												: [
														{
															url: message.attachment_link,
															filetype: message.attachment_type,
															size: message.attachment_size || 0
														}
													]
											).map((attachment, idx) => (
												<NotificationAttachmentItem
													key={attachment?.url || idx}
													attachment={attachment}
													index={idx}
													compact={true}
												/>
											))}
										</div>
									)}

									{message.has_more_attachment && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setIsExpanded((prev) => !prev);
											}}
											className="text-xs text-blue-400 hover:underline mt-1.5 ml-1 cursor-pointer flex items-center gap-1 font-medium transition-colors hover:text-blue-300 w-fit"
										>
											{isExpanded ? (
												<span>{t('showLess', { ns: 'message', defaultValue: 'Show less' })}</span>
											) : (
												<>
													<span>{t('moreFiles', { ns: 'channelTopbar' })}</span>
													{message.attachments && message.attachments.length > 1 && (
														<span className="text-[10px] bg-item-theme px-1.5 py-0.5 rounded-full text-zinc-300">
															+{message.attachments.length - 1}
														</span>
													)}
												</>
											)}
										</button>
									)}
								</div>
							)}
						</div>
					) : (
						<div className="flex flex-col gap-1 justify-center" data-e2e={generateE2eId('chat.channel_message.inbox.for_you')}>
							<div>
								<span className="font-bold" data-e2e={generateE2eId('chat.channel_message.inbox.for_you.username')}>
									{namePriority || user?.display_name || username}
								</span>
								<span data-e2e={generateE2eId('chat.channel_message.inbox.for_you.message')}>{subjectText}</span>
							</div>
							{!!message?.create_time_seconds && (
								<span className="text-zinc-400 text-[11px]" data-e2e={generateE2eId('chat.channel_message.inbox.for_you.timestamp')}>
									{convertTimeString(message?.create_time_seconds * 1000)}
								</span>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

type IMessageHeadProps = {
	message: IMessageWithUser;
	mode?: number;
	onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
};

// fix later
const MessageHead = ({ message, mode, onClick }: IMessageHeadProps) => {
	const messageTime = message?.create_time_seconds ? convertTimeString(message?.create_time_seconds * 1000) : '';
	const usernameSender = message?.username;
	const clanNick = message?.clan_nick;
	const displayName = message?.display_name;
	const userRolesClan = useColorsRoleById(message?.sender_id);
	const { pendingClannick, pendingDisplayName, pendingUserName } = getPendingNames(
		message,
		clanNick ?? '',
		displayName ?? '',
		usernameSender ?? '',
		message.clan_nick ?? '',
		message?.display_name ?? '',
		message?.username ?? ''
	);

	const nameShowed = getShowName(
		clanNick ? clanNick : (pendingClannick ?? ''),
		displayName ? displayName : (pendingDisplayName ?? ''),
		usernameSender ? usernameSender : (pendingUserName ?? ''),
		message?.sender_id ?? ''
	);

	const priorityName = message.display_name ? message.display_name : message.username;

	return (
		<div className="flex flex-row">
			<div
				className="text-base font-medium tracking-normal cursor-pointer break-all username hover:underline"
				onClick={onClick}
				role="button"
				style={{
					letterSpacing: '-0.01rem',
					color:
						mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
							? userRolesClan.highestPermissionRoleColor
							: DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR
				}}
			>
				{mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? nameShowed : priorityName}
			</div>
			<div className="ml-1 pt-[3px] dark:text-zinc-400 text-colorTextLightMode text-[10px] cursor-default">{messageTime}</div>
		</div>
	);
};
