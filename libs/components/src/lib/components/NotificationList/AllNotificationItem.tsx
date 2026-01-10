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
	createImgproxyUrl,
	generateE2eId
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
	if (notify && notify.content) {
		try {
			const parsedContent = {
				content: safeJSONParse(notify.content),
				createTime: notify.createTimeSeconds
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
	const message = (parseNotify?.content as any).content as IMessageWithUser;
	const messageId = message.messageId;
	const channelId = message?.content;
	const clanId = message?.clanId;
	const mode = message?.mode;

	const topicId = message?.topicId;

	const isTopic = Number(topicId) !== 0 || message.code === TypeMessage.Topic;

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
		message,
		subject: notify.subject,
		category: notify.category,
		senderId: message.senderId
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
	const { priorityAvatar } = useGetPriorityNameFromUserClan(message.senderId);

	const currentChannel = useAppSelector((state) => selectChannelById(state, message.channelId)) || {};
	const parentChannel = useAppSelector((state) => selectChannelById(state, currentChannel.parentId || '')) || {};

	const checkMessageHasReply = useMemo(() => {
		return Array.isArray(message.references) && message.references?.length > 0;
	}, [message.references]);

	const clan = useAppSelector(selectClanById(message.clanId as string));
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
					srcImgProxy={createImgproxyUrl((priorityAvatar ? priorityAvatar : message.avatar || user?.avatarUrl) ?? '', {
						width: 300,
						height: 300,
						resizeType: 'fit'
					})}
					src={priorityAvatar ? priorityAvatar : message.avatar || user?.avatarUrl}
				/>

				<div className="h-full w-full min-w-0 flex-1">
					<div className="flex flex-col gap-[2px] text-[12px] font-bold ">
						{category === NotificationCategory.MENTIONS ? (
							clan?.clanName ? (
								<div className="flex flex-col text-sm min-w-0">
									<div className="flex items-center gap-1 min-w-0">
										<span className="uppercase truncate max-w-[120px] overflow-hidden whitespace-nowrap">{clan.clanName}</span>
										<span>{'>'}</span>
										<span className="truncate max-w-[130px] overflow-hidden whitespace-nowrap uppercase">
											{isChannel ? message.categoryName : parentChannel.categoryName}
										</span>
									</div>

									<div className="flex items-center gap-1 min-w-0 text-[13px]">
										<span className="truncate max-w-[120px] overflow-hidden whitespace-nowrap">
											{isChannel ? `#${message.channelLabel}` : `#${parentChannel.channelLabel}`}
										</span>
										{!isChannel && (
											<>
												<span>{'>'}</span>
												<span className="truncate max-w-[130px] overflow-hidden whitespace-nowrap">
													{`${message.channelLabel}`}
												</span>
											</>
										)}
									</div>
								</div>
							) : (
								t('directMessage')
							)
						) : category === NotificationCategory.MESSAGES ? (
							clan?.clanName
						) : (
							''
						)}
					</div>
					{category === NotificationCategory.MENTIONS || category === NotificationCategory.MESSAGES ? (
						<div className="w-[85%] max-w-[85%]" data-e2e={generateE2eId('chat.channel_message.inbox.mentions')}>
							<MessageHead message={message} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />
							<MessageLine
								messageId={message.messageId}
								isEditted={false}
								content={{
									mentions:
										typeof message.mentions === 'string'
											? safeJSONParse(message.mentions)
											: Array.isArray(message.mentions)
												? message.mentions
												: [],
									t: safeJSONParse(message.content).t
								}}
								isTokenClickAble={false}
								isJumMessageEnabled={false}
							/>
							{Array.isArray(message.attachments) && message.attachments.length > 0 && (
								<div>
									<div className="max-h-[150px] max-w-[150px] overflow-hidden rounded-lg">
										<div>
											<MessageAttachment
												mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
												message={{ ...message, attachments: [message.attachments[0]] }}
												defaultMaxWidth={TOPBARS_MAX_WIDTH}
											/>
										</div>
									</div>
									{message.attachments.length > 1 && (
										<div className="text-xs text-zinc-400 mt-1 ml-1">
											+{message.attachments.length - 1} {t(message.attachments.length - 1 === 1 ? 'moreFile' : 'moreFiles')}
										</div>
									)}
								</div>
							)}
						</div>
					) : (
						<div className="flex flex-col gap-1">
							<div>
								<span className="font-bold">{user?.displayName || username}</span>
								<span>{subjectText}</span>
							</div>
							{message?.createTimeSeconds && (
								<span className="text-zinc-400 text-[11px]">{convertTimeString(message?.createTimeSeconds)}</span>
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
	const messageTime = message?.createTimeSeconds ? convertTimeString(message?.createTimeSeconds) : '';
	const usernameSender = message?.username;
	const clanNick = message?.clanNick;
	const displayName = message?.displayName;
	const userRolesClan = useColorsRoleById(message?.senderId);
	const { pendingClannick, pendingDisplayName, pendingUserName } = getPendingNames(
		message,
		clanNick ?? '',
		displayName ?? '',
		usernameSender ?? '',
		message.clanNick ?? '',
		message?.displayName ?? '',
		message?.username ?? ''
	);

	const nameShowed = getShowName(
		clanNick ? clanNick : (pendingClannick ?? ''),
		displayName ? displayName : (pendingDisplayName ?? ''),
		usernameSender ? usernameSender : (pendingUserName ?? ''),
		message?.senderId ?? ''
	);

	const priorityName = message.displayName ? message.displayName : message.username;

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
