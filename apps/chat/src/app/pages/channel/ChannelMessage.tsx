import type { MessageContextMenuProps } from '@mezon/components';
import {
	AvatarImage,
	ChannelMessageOpt,
	ChatWelcome,
	MessageContent,
	MessageReaction,
	MessageWithSystem,
	MessageWithUser,
	OnBoardWelcome,
	TimelineAttachment,
	TimelineDateBadge,
	TopicViewButton,
	UnreadMessageBreak
} from '@mezon/components';
import type { MessagesEntity } from '@mezon/store';
import type { ObserveFn, UsersClanEntity } from '@mezon/utils';
import { TIME_COMBINE_1_HOUR, TIME_COMBINE_SECOND, TypeMessage, convertUnixSecondsToTimeString, createImgproxyUrl } from '@mezon/utils';
import classNames from 'classnames';
import { isSameDay } from 'date-fns';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type MessageProps = {
	channelId: string;
	messageId: string;
	nextMessageId?: string;
	mode: number;
	isHighlight?: boolean;
	channelLabel: string;
	avatarDM?: string;
	username?: string;
	isPrivate?: number;
	index: number;
	checkMessageTargetToMoved?: boolean;
	messageReplyHighlight?: boolean;
	message: MessagesEntity;
	previousMessage: MessagesEntity;
	isTopic?: boolean;
	canSendMessage: boolean;
	wrapperClassName?: string;
	user: UsersClanEntity;
	observeIntersectionForLoading?: ObserveFn;
	showMessageContextMenu: (
		event: React.MouseEvent<HTMLElement>,
		messageId: string,
		mode: ChannelStreamMode,
		isTopic: boolean,
		props?: Partial<MessageContextMenuProps>
	) => void;
	isSelected?: boolean;
	isEditing?: boolean;
	shouldShowUnreadBreak?: boolean;
	viewMode?: 'default' | 'timeline';
	timelinePosition?: 'left' | 'right';
	groupedMessages?: MessagesEntity[];
};

export type MessageRef = {
	scrollIntoView: (options?: ScrollIntoViewOptions) => void;
	messageId: string;
	index: number;
};

type TimelineMessageGroupProps = {
	messages: MessagesEntity[];
	timelinePosition: 'left' | 'right';
	onContextMenu: (event: React.MouseEvent<HTMLElement>, props?: Partial<MessageContextMenuProps>) => void;
	popup: () => ReactNode;
	mode: number;
};

const TimelineMessageGroup = ({ messages, timelinePosition, onContextMenu, popup, mode }: TimelineMessageGroupProps) => {
	const { t, i18n } = useTranslation('common');
	const firstMessage = messages[0];
	const [isHover, setIsHover] = React.useState(false);
	const hoverTimeout = React.useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		return () => {
			if (hoverTimeout.current) {
				clearTimeout(hoverTimeout.current);
			}
		};
	}, []);

	if (!firstMessage) return null;

	const avatarUrl = firstMessage?.clan_avatar || firstMessage?.avatar || '';
	const displayName = firstMessage?.clan_nick || firstMessage?.display_name || firstMessage?.username || '';

	const handleMouseEnter = () => {
		if (hoverTimeout.current) {
			clearTimeout(hoverTimeout.current);
		}
		hoverTimeout.current = setTimeout(() => {
			setIsHover(true);
		}, 200);
	};

	const handleMouseLeave = () => {
		if (hoverTimeout.current) {
			clearTimeout(hoverTimeout.current);
		}
		hoverTimeout.current = setTimeout(() => {
			setIsHover(false);
		}, 100);
	};

	return (
		<div
			className={classNames('timeline-item message-list-item flex items-start gap-4 mb-8 w-full', {
				'timeline-item--left flex-row-reverse': timelinePosition === 'left',
				'timeline-item--right': timelinePosition === 'right'
			})}
			id={`msg-${firstMessage.id}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<TimelineDateBadge timestamp={firstMessage.create_time_seconds} />
			<div className="timeline-dot" />
			<div className="timeline-card bg-white dark:bg-bgSecondary shadow-md rounded-lg p-4 max-w-md relative group">
				{isHover && <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">{popup()}</div>}
				<div className="flex items-center gap-2 mb-3">
					<AvatarImage
						alt={`${displayName}'s avatar`}
						username={displayName}
						src={avatarUrl}
						srcImgProxy={createImgproxyUrl(avatarUrl, { width: 100, height: 100, resizeType: 'fit' })}
						className="w-8 h-8 min-w-8 min-h-8 rounded-full"
					/>
					<span className="font-semibold text-sm text-theme-primary-hover text-theme-primary">{displayName}</span>
				</div>
				{messages.map((msg, index) => {
					const msgTime = msg?.create_time_seconds ? convertUnixSecondsToTimeString(msg.create_time_seconds, t, i18n.language) : '';
					return (
						<div
							key={msg.id}
							id={index > 0 ? `msg-${msg.id}` : undefined}
							className={index > 0 ? 'mt-3 pt-3 border-t border-gray-200 dark:border-gray-700' : ''}
							onContextMenu={(e) => onContextMenu(e)}
						>
							<div className="flex items-center gap-2 mb-1">
								<span className="text-xs text-theme-primary-hover text-theme-primary">{msgTime}</span>
							</div>
							<MessageContent message={msg as MessagesEntity & { content: { t?: string } }} mode={mode} />
							{(msg?.attachments?.length ?? 0) > 0 && (
								<TimelineAttachment message={msg as MessagesEntity & { content: { t?: string } }} mode={mode} />
							)}
							{msg?.code === TypeMessage.Topic && <TopicViewButton message={msg as MessagesEntity & { content: { t?: string } }} />}
							<MessageReaction message={msg as MessagesEntity & { content: { t?: string } }} isTopic={false} />
						</div>
					);
				})}
			</div>
		</div>
	);
};

type ChannelMessageComponent = React.FC<MessageProps> & {
	Skeleton?: () => JSX.Element;
};

export const ChannelMessage: ChannelMessageComponent = ({
	messageId,
	channelId,
	mode,
	channelLabel,
	isHighlight,
	avatarDM,
	username,
	isPrivate,
	nextMessageId,
	checkMessageTargetToMoved,
	messageReplyHighlight,
	message,
	previousMessage,
	isTopic = false,
	canSendMessage,
	user,
	observeIntersectionForLoading,
	showMessageContextMenu,
	isSelected,
	isEditing,
	shouldShowUnreadBreak,
	viewMode = 'default',
	timelinePosition = 'left',
	groupedMessages = []
}: Readonly<MessageProps>) => {
	const isSameUser = message?.user?.id === previousMessage?.user?.id;
	const isTimeGreaterThan60Minutes =
		!!message?.create_time_seconds && message.create_time_seconds - (previousMessage?.create_time_seconds || 0) < TIME_COMBINE_SECOND;
	const isDifferentDay =
		!!message?.create_time_seconds &&
		!!previousMessage?.create_time_seconds &&
		!isSameDay(new Date(message.create_time_seconds * 1000), new Date(previousMessage?.create_time_seconds * 1000));

	const isCombine = isSameUser && isTimeGreaterThan60Minutes;

	const isCombine1Hour =
		isSameUser &&
		!!message?.create_time_seconds &&
		message.create_time_seconds - (previousMessage?.create_time_seconds || 0) < TIME_COMBINE_1_HOUR;

	const handleContextMenu = useCallback(
		(event: React.MouseEvent<HTMLElement>, props?: Partial<MessageContextMenuProps>) => {
			showMessageContextMenu(event, messageId, mode, isTopic as boolean, { ...props, viewMode });
		},
		[showMessageContextMenu, messageId, mode, viewMode]
	);

	const mess = (() => {
		if (typeof message.content === 'object' && typeof (message.content as Record<string, unknown>)?.id === 'string') {
			return message.content;
		}
		return message;
	})();

	const isChannelThreadDmGroup =
		mode === ChannelStreamMode.STREAM_MODE_CHANNEL ||
		mode === ChannelStreamMode.STREAM_MODE_THREAD ||
		mode === ChannelStreamMode.STREAM_MODE_DM ||
		mode === ChannelStreamMode.STREAM_MODE_GROUP;

	const popup = useCallback(() => {
		return (
			<ChannelMessageOpt
				message={message}
				handleContextMenu={handleContextMenu}
				isCombine={isCombine}
				mode={mode}
				isDifferentDay={isDifferentDay}
				hasPermission={isChannelThreadDmGroup || (!isTopic ? !!canSendMessage : true)}
				isTopic={isTopic}
				canSendMessage={canSendMessage}
				viewMode={viewMode}
			/>
		);
	}, [message, handleContextMenu, isCombine, mode, viewMode]);

	const isMessageSystem =
		message?.code === TypeMessage.Welcome ||
		message?.code === TypeMessage.UpcomingEvent ||
		message?.code === TypeMessage.CreateThread ||
		message?.code === TypeMessage.CreatePin ||
		message?.code === TypeMessage.AuditLog;

	const isMessageIndicator = message.code === TypeMessage.Indicator;

	if (viewMode === 'timeline') {
		if (isCombine1Hour) {
			return null;
		}

		if (groupedMessages.length > 0) {
			return (
				<>
					{shouldShowUnreadBreak && <UnreadMessageBreak key={`unread-${messageId}`} />}
					<TimelineMessageGroup
						messages={groupedMessages}
						timelinePosition={timelinePosition}
						onContextMenu={handleContextMenu}
						popup={popup}
						mode={mode}
					/>
				</>
			);
		}
	}

	return (
		<>
			{shouldShowUnreadBreak && <UnreadMessageBreak key={`unread-${messageId}`} />}
			{isMessageIndicator && mode === ChannelStreamMode.STREAM_MODE_CHANNEL ? (
				<>
					<OnBoardWelcome nextMessageId={nextMessageId} />
					{isMessageIndicator ? (
						<ChatWelcome isPrivate={isPrivate} key={messageId} name={channelLabel} avatarDM={avatarDM} username={username} mode={mode} />
					) : null}
				</>
			) : isMessageIndicator ? (
				<ChatWelcome isPrivate={isPrivate} key={messageId} name={channelLabel} avatarDM={avatarDM} username={username} mode={mode} />
			) : isMessageSystem ? (
				<MessageWithSystem message={mess} popup={popup} onContextMenu={handleContextMenu} showDivider={isDifferentDay} isTopic={isTopic} />
			) : (
				<MessageWithUser
					allowDisplayShortProfile={true}
					message={mess}
					mode={mode}
					isEditing={isEditing}
					isHighlight={isHighlight}
					popup={popup}
					channelId={channelId}
					onContextMenu={handleContextMenu}
					isCombine={isCombine}
					showDivider={isDifferentDay}
					checkMessageTargetToMoved={checkMessageTargetToMoved}
					messageReplyHighlight={messageReplyHighlight}
					isTopic={isTopic}
					observeIntersectionForLoading={observeIntersectionForLoading}
					user={user}
					isSelected={isSelected}
					previousMessage={previousMessage}
				/>
			)}
		</>
	);
};

export const MemorizedChannelMessage = memo(ChannelMessage, (prev, curr) => {
	const prevGrouped = prev.groupedMessages || [];
	const currGrouped = curr.groupedMessages || [];
	const groupedMessagesEqual =
		prevGrouped.length === currGrouped.length &&
		prevGrouped.every((msg, i) => msg.id === currGrouped[i]?.id && msg.update_time === currGrouped[i]?.update_time);

	return (
		prev.messageId + prev?.message?.update_time === curr.messageId + curr?.message?.update_time &&
		prev.channelId === curr.channelId &&
		prev.messageReplyHighlight === curr.messageReplyHighlight &&
		prev.checkMessageTargetToMoved === curr.checkMessageTargetToMoved &&
		prev.previousMessage?.id === curr.previousMessage?.id &&
		prev.message?.code === curr.message?.code &&
		prev.message?.references?.[0]?.content === curr.message?.references?.[0]?.content &&
		prev.message?.references?.[0]?.message_ref_id === curr.message?.references?.[0]?.message_ref_id &&
		prev.avatarDM === curr.avatarDM &&
		prev.channelLabel === curr.channelLabel &&
		prev.isHighlight === curr.isHighlight &&
		prev.isSelected === curr.isSelected &&
		prev.isEditing === curr.isEditing &&
		prev.message?.isError === curr.message?.isError &&
		prev.shouldShowUnreadBreak === curr.shouldShowUnreadBreak &&
		prev.viewMode === curr.viewMode &&
		prev.timelinePosition === curr.timelinePosition &&
		groupedMessagesEqual
	);
});

MemorizedChannelMessage.displayName = 'MemorizedChannelMessage';
