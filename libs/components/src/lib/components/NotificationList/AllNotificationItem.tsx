import { getShowName, getTagById, useColorsRoleById, useGetPriorityNameFromUserClan, useNotification } from '@mezon/core';
import { selectChannelById, selectClanById, selectMemberDMByUserId, useAppSelector } from '@mezon/store';
import type { IMentionOnMessage, IMessageWithUser, INotification } from '@mezon/utils';
import {
	DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR,
	NotificationCategory,
	TOPBARS_MAX_WIDTH,
	convertTimeString,
	createImgproxyUrl,
	generateE2eId
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { DirectFcmProto } from 'mezon-js/dist/api/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationJump } from '../../hooks/useNotificationJump';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import MessageAttachment from '../MessageWithUser/MessageAttachment';
import { MessageLine } from '../MessageWithUser/MessageLine';
import getPendingNames from '../MessageWithUser/usePendingNames';
export type NotifyMentionProps = {
	readonly notify: INotification;
	onCloseTooltip?: () => void;
};

function AllNotificationItem({ notify, onCloseTooltip }: NotifyMentionProps) {
	const { t } = useTranslation('channelTopbar');
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
	const messageId = message?.messageId;
	const channelId = notify?.channel_id;
	const clanId = message?.clanId;

	const topicId = notify?.topic_id || '';

	const isTopic = !!topicId;

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
		senderId: notify?.content?.senderId
	};

	return (
		<div className=" bg-transparent rounded-[8px] relative group">
			<button
				onClick={(event) => handleDeleteNotification(event, notify.id, notify.category as NotificationCategory)}
				className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-item-theme-hover text-theme-primary hover:text-red-500 text-sm font-bold shadow-md transition-all  hover:scale-110 active:scale-95"
			>
				✕
			</button>

			{notify.category === NotificationCategory.MENTIONS && (
				<button
					className="absolute py-1 px-2 bottom-[10px] z-50 right-3 text-[10px] rounded-lg border-theme-primary transition-all duration-300 group-hover:block hidden bg-item-theme"
					onClick={handleClickJump}
				>
					{t('tooltips.jump')}
				</button>
			)}
			{message && <AllTabContent {...allTabProps} message={message} />}
		</div>
	);
}

export default AllNotificationItem;

interface IMentionTabContent {
	message: DirectFcmProto;
	subject?: string;
	category?: number;
	senderId?: string;
}

function AllTabContent({ message, subject, category, senderId }: IMentionTabContent) {
	const { t } = useTranslation('channelTopbar');
	const { priorityAvatar } = useGetPriorityNameFromUserClan(message.sender_id || '');

	const currentChannel = useAppSelector((state) => selectChannelById(state, message.channel_id || '')) || {};
	const parentChannel = useAppSelector((state) => selectChannelById(state, currentChannel.parent_id || '')) || {};

	const clan = useAppSelector(selectClanById(message.clan_id as string));
	const user = useAppSelector((state) => selectMemberDMByUserId(state, senderId ?? ''));

	const username = message.username;
	let subjectText = subject;

	if (username) {
		const usernameLenght = username.length;
		subjectText = subject?.slice(usernameLenght);
	}
	const isChannel = currentChannel.type === ChannelType.CHANNEL_TYPE_CHANNEL;

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
	}, [message.mention_ids]);

	return (
		<div className="flex flex-col p-2 bg-item-theme rounded-lg overflow-hidden">
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
											{isChannel ? currentChannel.category_name : parentChannel.category_name}
										</span>
									</div>

									<div className="flex items-center gap-1 min-w-0 text-[13px]">
										<span className="truncate max-w-[120px] overflow-hidden whitespace-nowrap">
											{isChannel ? `#${currentChannel.channel_label}` : `#${parentChannel.channel_label}`}
										</span>
										{!isChannel && (
											<>
												<span>{'>'}</span>
												<span className="truncate max-w-[130px] overflow-hidden whitespace-nowrap">
													{`${currentChannel.channel_label}`}
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
						<div className="w-[85%] max-w-[85%]" data-e2e={generateE2eId('chat.channel_message.inbox.mentions')}>
							<MessageHead
								message={{
									id: message.message_id,
									avatar: message.avatar,
									channel_id: message.channel_id,
									clan_id: message.clan_id,
									channel_label: isChannel ? currentChannel.channel_label || '' : parentChannel.channel_label || '',
									content: message.content,
									code: 0,
									sender_id: message.sender_id,
									user: {
										id: message.sender_id,
										name: message.username,
										username: message.username
									}
								}}
								mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
							/>
							<MessageLine
								messageId={message.message_id}
								isEditted={false}
								content={{
									mentions: mentions || [],
									t: message.content
								}}
								isTokenClickAble={false}
								isJumMessageEnabled={false}
							/>
							{message.attachment_link && (
								<div>
									<div className="max-h-[150px] max-w-[150px] overflow-hidden rounded-lg">
										<div>
											<MessageAttachment
												mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
												message={{
													...{
														id: message.message_id,
														avatar: message.avatar,
														channel_id: message.channel_id,
														clan_id: message.clan_id,
														channel_label: isChannel
															? currentChannel.channel_label || ''
															: parentChannel.channel_label || '',
														content: message.content,
														code: 0,
														sender_id: message.sender_id,
														user: {
															id: message.sender_id,
															name: message.username,
															username: message.username
														}
													},
													attachments: [{ url: message.attachment_link }]
												}}
												defaultMaxWidth={TOPBARS_MAX_WIDTH}
											/>
										</div>
									</div>
									{message.has_more_attachment && <div className="text-xs text-zinc-400 mt-1 ml-1">{t('moreFiles')}</div>}
								</div>
							)}
						</div>
					) : (
						<div className="flex flex-col gap-1">
							<div>
								<span className="font-bold">{user?.display_name || username}</span>
								<span>{subjectText}</span>
							</div>
							{message?.create_time_seconds && (
								<span className="text-zinc-400 text-[11px]">{convertTimeString(message?.create_time_seconds)}</span>
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
	const messageTime = message?.create_time_seconds ? convertTimeString(message?.create_time_seconds) : '';
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
