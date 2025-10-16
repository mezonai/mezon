import { getShowName, useColorsRoleById, useGetPriorityNameFromUserClan, useNotification } from '@mezon/core';
import { selectChannelById, selectClanById, selectMemberDMByUserId, useAppSelector } from '@mezon/store';
import type { IMentionOnMessage, IMessageWithUser, INotification } from '@mezon/utils';
import {
	DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR,
	NotificationCategory,
	TOPBARS_MAX_WIDTH,
	TypeMessage,
	addMention,
	convertTimeString,
	createImgproxyUrl
} from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationJump } from '../../hooks/useNotificationJump';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import MessageAttachment from '../MessageWithUser/MessageAttachment';
import { MessageLine } from '../MessageWithUser/MessageLine';
import MessageReply from '../MessageWithUser/MessageReply/MessageReply';
import getPendingNames from '../MessageWithUser/usePendingNames';
export type NotifyMentionProps = {
	readonly notify: INotification;
	onCloseTooltip?: () => void;
};

function convertContentToObject(notify: INotification) {
	if (notify && notify.content && typeof notify.content === 'object') {
		try {
			const parsedContent = {
				...notify.content,
				content: notify.content.content ? safeJSONParse(notify.content.content) : null,
				mentions: notify.content.mentions ? safeJSONParse(notify.content.mentions) : null,
				reactions: notify.content.reactions ? safeJSONParse(notify.content.reactions) : null,
				references: notify.content.references ? safeJSONParse(notify.content.references) : null,
				attachments: notify.content.attachments ? safeJSONParse(notify.content.attachments) : null,
				create_time: notify.create_time
			};

			return {
				...notify,
				content: parsedContent
			};
		} catch (error) {
			return notify;
		}
	}
	return notify;
}

function AllNotificationItem({ notify, onCloseTooltip }: NotifyMentionProps) {
	const { t } = useTranslation('channelTopbar');
	const parseNotify = useMemo(() => convertContentToObject(notify), [notify]);
	const messageId = parseNotify.content.message_id;
	const channelId = parseNotify.content.channel_id;
	const clanId = parseNotify.content.clan_id;
	const mode = parseNotify?.content?.mode - 1;

	const topicId = parseNotify?.content?.topic_id;

	const isTopic = Number(topicId) !== 0 || parseNotify?.content?.code === TypeMessage.Topic;

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

	const allTabProps = {
		message: parseNotify.content,
		subject: parseNotify.subject,
		category: parseNotify.category,
		senderId: parseNotify.sender_id
	};

	return (
		<div className=" bg-transparent rounded-[8px] relative group">
			<button
				onClick={(event) => handleDeleteNotification(event, parseNotify.id, parseNotify.category as NotificationCategory)}
				className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-item-theme-hover text-theme-primary hover:text-red-500 text-sm font-bold shadow-md transition-all  hover:scale-110 active:scale-95"
			>
				✕
			</button>

			{parseNotify.category === NotificationCategory.MENTIONS && (
				<button
					className="absolute py-1 px-2 bottom-[10px] z-50 right-3 text-[10px] rounded-lg border-theme-primary transition-all duration-300 group-hover:block hidden bg-item-theme"
					onClick={handleClickJump}
				>
					{t('tooltips.jump')}
				</button>
			)}
			{<AllTabContent {...allTabProps} />}
		</div>
	);
}

export default AllNotificationItem;

interface IMentionTabContent {
	message: IMessageWithUser;
	subject?: string;
	category?: number;
	senderId?: string;
}

function AllTabContent({ message, subject, category, senderId }: IMentionTabContent) {
	const { t } = useTranslation('channelTopbar');
	const contentUpdatedMention = addMention(message?.content, message?.mentions as IMentionOnMessage[]);
	const { priorityAvatar } = useGetPriorityNameFromUserClan(message.sender_id);

	const currentChannel = useAppSelector((state) => selectChannelById(state, message.channel_id)) || {};
	const parentChannel = useAppSelector((state) => selectChannelById(state, currentChannel.parent_id || '')) || {};

	const checkMessageHasReply = useMemo(() => {
		return message.references && message.references?.length > 0;
	}, [message.references]);

	const clan = useAppSelector(selectClanById(message.clan_id as string));
	const user = useAppSelector((state) => selectMemberDMByUserId(state, senderId ?? ''));

	const username = message.username;
	let subjectText = subject;

	if (username) {
		const usernameLenght = username.length;
		subjectText = subject?.slice(usernameLenght);
	}
	const isChannel = message.mode === ChannelStreamMode.STREAM_MODE_CHANNEL;

	return (
		<div className="flex flex-col p-2 bg-item-theme rounded-lg overflow-hidden">
			{checkMessageHasReply && (
				<div className="max-w-full overflow-hidden">
					<MessageReply message={message} />
				</div>
			)}

			<div className="flex flex-row items-start p-1 w-full gap-4 rounded-lg ">
				<AvatarImage
					alt="user avatar"
					className="w-10 h-10 min-w-10 flex-shrink-0"
					username={message?.username}
					srcImgProxy={createImgproxyUrl((priorityAvatar ? priorityAvatar : message.avatar || user?.avatar_url) ?? '', {
						width: 300,
						height: 300,
						resizeType: 'fit'
					})}
					src={priorityAvatar ? priorityAvatar : message.avatar || user?.avatar_url}
				/>

				<div className="h-full w-full min-w-0 flex-1">
					<div className="flex flex-col gap-[2px] text-[12px] font-bold ">
						{category === NotificationCategory.MENTIONS ? (
							clan?.clan_name ? (
								<div className="flex flex-col text-sm min-w-0">
									<div className="flex items-center gap-1 min-w-0">
										<span className="uppercase truncate max-w-[120px] overflow-hidden whitespace-nowrap">{clan.clan_name}</span>
										<span>{'>'}</span>
										<span className="truncate max-w-[130px] overflow-hidden whitespace-nowrap uppercase">
											{isChannel ? message.category_name : parentChannel.category_name}
										</span>
									</div>

									<div className="flex items-center gap-1 min-w-0 text-[13px]">
										<span className="truncate max-w-[120px] overflow-hidden whitespace-nowrap">
											{isChannel ? `#${message.channel_label}` : `#${parentChannel.channel_label}`}
										</span>
										{!isChannel && (
											<>
												<span>{'>'}</span>
												<span className="truncate max-w-[130px] overflow-hidden whitespace-nowrap">
													{`${message.channel_label}`}
												</span>
											</>
										)}
									</div>
								</div>
							) : (
								t('directMessage')
							)
						) : category === NotificationCategory.MESSAGES ? (
							clan?.clan_name
						) : (
							''
						)}
					</div>
					{category === NotificationCategory.MENTIONS || category === NotificationCategory.MESSAGES ? (
						<div className="w-[85%] max-w-[85%]">
							<MessageHead message={message} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />
							<MessageLine
								messageId={message.message_id}
								isEditted={false}
								content={contentUpdatedMention}
								isTokenClickAble={false}
								isJumMessageEnabled={false}
							/>
							{Array.isArray(message.attachments) && (
								<div className="max-h-[200px] overflow-hidden">
									<div style={{ transform: 'scale(0.7)', transformOrigin: 'top left' }}>
										<MessageAttachment
											mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
											message={message}
											defaultMaxWidth={TOPBARS_MAX_WIDTH}
										/>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="flex flex-col gap-1">
							<div>
								<span className="font-bold">{user?.display_name || username}</span>
								<span>{subjectText}</span>
							</div>
							<span className="text-zinc-400 text-[11px]">{convertTimeString(message?.create_time as string)}</span>
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
	const messageTime = convertTimeString(message?.create_time as string);
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
