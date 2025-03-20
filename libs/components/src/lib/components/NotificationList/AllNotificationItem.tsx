import { useColorsRoleById, useGetPriorityNameFromUserClan, useNotification, useShowName } from '@mezon/core';
import { messagesActions, selectChannelById, selectClanById, selectMemberDMByUserId, useAppDispatch, useAppSelector } from '@mezon/store';
import {
	DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR,
	IMentionOnMessage,
	IMessageWithUser,
	INotification,
	NotificationCategory,
	addMention,
	convertTimeString,
	createImgproxyUrl
} from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import MessageAttachment from '../MessageWithUser/MessageAttachment';
import { MessageLine } from '../MessageWithUser/MessageLine';
import MessageReply from '../MessageWithUser/MessageReply/MessageReply';
import usePendingNames from '../MessageWithUser/usePendingNames';
export type NotifyMentionProps = {
	readonly notify: INotification;
};

function convertContentToObject(notify: any) {
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

function AllNotificationItem({ notify }: NotifyMentionProps) {
	const navigate = useNavigate();
	const parseNotify = useMemo(() => convertContentToObject(notify), [notify]);
	const dispatch = useAppDispatch();
	const messageId = parseNotify.content.message_id;
	const channelId = parseNotify.content.channel_id;
	const clanId = parseNotify.content.clan_id;
	const mode = parseNotify?.content?.mode - 1;

	const handleClickJump = useCallback(() => {
		dispatch(
			messagesActions.jumpToMessage({
				clanId: clanId || '',
				messageId: messageId,
				channelId: channelId,
				mode: mode,
				navigate
			})
		);
	}, [dispatch]);

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
		<div className="dark:bg-bgTertiary bg-transparent rounded-[8px] relative group">
			<button
				className="absolute dark:bg-bgTertiary bg-bgLightModeButton mr-1 dark:text-contentPrimary text-colorTextLightMode top-[10px] z-50 right-3 rounded-full w-6 h-6 flex items-center justify-center text-[10px]"
				onClick={(event) => handleDeleteNotification(event, parseNotify.id, parseNotify.category as NotificationCategory)}
			>
				✕
			</button>
			{parseNotify.category === NotificationCategory.MENTIONS && (
				<button
					className="absolute py-1 px-2 dark:bg-bgSecondary bg-bgLightTertiary bottom-[10px] z-50 right-3 text-[10px] rounded-[6px] transition-all duration-300 group-hover:block hidden"
					onClick={handleClickJump}
				>
					Jump
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
		<div className="flex flex-col p-2 bg-[#FFFFFF] dark:bg-[#313338] rounded-lg ">
			{checkMessageHasReply && (
				<div className="max-w-full overflow-hidden">
					<MessageReply message={message} />
				</div>
			)}

			<div className="flex flex-row items-start p-1 w-full gap-4 rounded-lg bg-[#FFFFFF] dark:bg-[#313338]">
				<AvatarImage
					alt="user avatar"
					className="w-10 h-10 min-w-10"
					username={message?.username}
					srcImgProxy={createImgproxyUrl((priorityAvatar ? priorityAvatar : message.avatar || user?.user?.avatar_url) ?? '', {
						width: 300,
						height: 300,
						resizeType: 'fit'
					})}
					src={priorityAvatar ? priorityAvatar : message.avatar || user?.user?.avatar_url}
				/>

				<div className="h-full w-full">
					<div>
						<div className="flex flex-col gap-[2px] text-[12px] font-bold uppercase">
							{category === NotificationCategory.MENTIONS ? (
								clan?.clan_name ? (
									<>
										<span className="text-[13px]">
											{isChannel ? `#${message.channel_label}` : `#${parentChannel.channel_label} > ${message.channel_label}`}
										</span>
										<span>
											{clan.clan_name} {'>'} {isChannel ? `${message.category_name}` : `${parentChannel.category_name}`}
										</span>
									</>
								) : (
									'direct message'
								)
							) : category === NotificationCategory.MESSAGES ? (
								clan?.clan_name
							) : (
								''
							)}
						</div>
					</div>
					{category === NotificationCategory.MENTIONS || category === NotificationCategory.MESSAGES ? (
						<div>
							<MessageHead message={message} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />
							<MessageLine
								messageId={message.message_id}
								isEditted={false}
								content={contentUpdatedMention}
								isTokenClickAble={false}
								isJumMessageEnabled={false}
							/>
							{Array.isArray(message.attachments) && (
								<MessageAttachment mode={ChannelStreamMode.STREAM_MODE_CHANNEL} message={message} />
							)}
						</div>
					) : (
						<div className="flex flex-col gap-1">
							<div>
								<span className="font-bold">{user?.user?.display_name || username}</span>
								<span>{subjectText}</span>
							</div>
							<span className="text-zinc-400 text-[11px]">{convertTimeString(message.create_time as string)}</span>
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
	const { pendingClannick, pendingDisplayName, pendingUserName } = usePendingNames(
		message,
		clanNick ?? '',
		displayName ?? '',
		usernameSender ?? '',
		message.clan_nick ?? '',
		message?.display_name ?? '',
		message?.username ?? ''
	);

	const nameShowed = useShowName(
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
