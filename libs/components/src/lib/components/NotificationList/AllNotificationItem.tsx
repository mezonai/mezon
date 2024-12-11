import { useGetPriorityNameFromUserClan, useNotification } from '@mezon/core';
import { messagesActions, selectClanById, selectMemberClanByUserId, useAppDispatch, useAppSelector } from '@mezon/store';
import { IMentionOnMessage, IMessageWithUser, INotification, NotificationCode, addMention, convertTimeString, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import MessageAttachment from '../MessageWithUser/MessageAttachment';
import MessageHead from '../MessageWithUser/MessageHead';
import { MessageLine } from '../MessageWithUser/MessageLine';
import MessageReply from '../MessageWithUser/MessageReply/MessageReply';
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
				attachments: notify.content.attachments ? safeJSONParse(notify.content.attachments) : null
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
	}, [dispatch, messageId, notify.id]);

	const { deleteNotify } = useNotification();
	const handleDeleteNotification = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, notificationId: string) => {
		event.stopPropagation();
		deleteNotify(notificationId, clanId ?? '0');
	};

	const allTabProps = {
		message: parseNotify.content,
		subject: parseNotify.subject,
		code: parseNotify.code,
		senderId: parseNotify.sender_id
	};

	return (
		<div className="dark:bg-bgTertiary bg-transparent rounded-[8px] relative group">
			<button
				className="absolute dark:bg-bgTertiary bg-bgLightModeButton mr-1 dark:text-contentPrimary text-colorTextLightMode top-[10px] z-50 right-3 rounded-full w-6 h-6 flex items-center justify-center text-[10px]"
				onClick={(event) => handleDeleteNotification(event, notify.id)}
			>
				✕
			</button>
			{(parseNotify.code === NotificationCode.USER_MENTIONED || parseNotify.code === NotificationCode.USER_REPLIED) && (
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
	code?: number;
	senderId?: string;
}

function AllTabContent({ message, subject, code, senderId }: IMentionTabContent) {
	const contentUpdatedMention = addMention(message?.content, message?.mentions as IMentionOnMessage[]);
	const { priorityAvatar } = useGetPriorityNameFromUserClan(message.sender_id);
	const checkMessageHasReply = useMemo(() => {
		return message.references && message.references?.length > 0;
	}, [message.references]);

	const clan = useAppSelector(selectClanById(message.clan_id as string));
	const user = useSelector(selectMemberClanByUserId(senderId ?? ''));

	const userName = message.username;
	let subjectText = subject;

	if (userName) {
		const userNameLenght = userName.length;
		subjectText = subject?.slice(userNameLenght);
	}

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
					userName={message?.username}
					srcImgProxy={createImgproxyUrl((priorityAvatar ? priorityAvatar : message.avatar || user?.user?.avatar_url) ?? '', {
						width: 300,
						height: 300,
						resizeType: 'fit'
					})}
					src={priorityAvatar ? priorityAvatar : message.avatar || user?.user?.avatar_url}
				/>

				<div className="h-full w-full">
					<div>
						<div className="text-[12px] font-bold uppercase">
							{code === NotificationCode.USER_MENTIONED || code === NotificationCode.USER_REPLIED ? (
								clan?.clan_name ? (
									<>
										{clan.clan_name} {'>'} {message.channel_label}
									</>
								) : (
									'direct message'
								)
							) : code === NotificationCode.NOTIFICATION_CLAN ? (
								clan?.clan_name
							) : (
								''
							)}
						</div>
					</div>
					{code === NotificationCode.USER_MENTIONED ||
					code === NotificationCode.USER_REPLIED ||
					code === NotificationCode.NOTIFICATION_CLAN ? (
						<div>
							<MessageHead message={message} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />
							<MessageLine isEditted={false} content={contentUpdatedMention} isTokenClickAble={false} isJumMessageEnabled={false} />
							{Array.isArray(message.attachments) && (
								<MessageAttachment mode={ChannelStreamMode.STREAM_MODE_CHANNEL} message={message} />
							)}
						</div>
					) : (
						<div className="flex flex-col gap-1">
							<div>
								<span className="font-bold">{user?.user?.display_name || userName}</span>
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
