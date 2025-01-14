import { ChannelMessageOpt, ChatWelcome, MessageContextMenuProps, MessageWithUser, OnBoardWelcome, useMessageContextMenu } from '@mezon/components';
import { MessagesEntity, selectChannelDraftMessage, selectIdMessageRefEdit, selectOpenEditMessageState, useAppSelector } from '@mezon/store';
import { TypeMessage } from '@mezon/utils';
import { isSameDay } from 'date-fns';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

export type MessageProps = {
	channelId: string;
	messageId: string;
	nextMessageId?: string;
	mode: number;
	isHighlight?: boolean;
	channelLabel: string;
	avatarDM?: string;
	userName?: string;
	isLastSeen?: boolean;
	index: number;
	checkMessageTargetToMoved?: boolean;
	messageReplyHighlight?: boolean;
	message: MessagesEntity;
	previousMessage: MessagesEntity;
	isTopic?: boolean;
	canSendMessage: boolean;
};

export type MessageRef = {
	scrollIntoView: (options?: ScrollIntoViewOptions) => void;
	messageId: string;
	index: number;
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
	userName,
	isLastSeen,
	nextMessageId,
	checkMessageTargetToMoved,
	messageReplyHighlight,
	message,
	previousMessage,
	isTopic = false,
	canSendMessage
}: Readonly<MessageProps>) => {
	const openEditMessageState = useSelector(selectOpenEditMessageState);
	const idMessageRefEdit = useSelector(selectIdMessageRefEdit);
	const { showMessageContextMenu } = useMessageContextMenu();
	const channelDraftMessage = useAppSelector((state) => selectChannelDraftMessage(state, channelId));

	const isEditing = channelDraftMessage?.message_id === messageId ? openEditMessageState : openEditMessageState && idMessageRefEdit === messageId;

	const isSameUser = message?.user?.id === previousMessage?.user?.id;
	const isTimeGreaterThan60Minutes =
		!!message?.create_time && Date.parse(message.create_time) - Date.parse(previousMessage?.create_time) < 60 * 60 * 1000;

	const isDifferentDay =
		!!message?.create_time && !!previousMessage?.create_time && !isSameDay(new Date(message.create_time), new Date(previousMessage?.create_time));

	const isCombine = isSameUser && isTimeGreaterThan60Minutes;

	const handleContextMenu = useCallback(
		(event: React.MouseEvent<HTMLElement>, props?: Partial<MessageContextMenuProps>) => {
			showMessageContextMenu(event, messageId, mode, isTopic as boolean, props);
		},
		[showMessageContextMenu, messageId, mode]
	);

	const mess = (() => {
		if (typeof message.content === 'object' && typeof (message.content as Record<string, unknown>)?.id === 'string') {
			return message.content;
		}
		return message;
	})();

	const channelOrThread = mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD;

	const popup = useCallback(() => {
		return (
			<ChannelMessageOpt
				message={message}
				handleContextMenu={handleContextMenu}
				isCombine={isCombine}
				mode={mode}
				isDifferentDay={isDifferentDay}
				hasPermission={channelOrThread || !isTopic ? !!canSendMessage : true}
				isTopic={isTopic}
			/>
		);
	}, [message, handleContextMenu, isCombine, mode]);

	return (
		<>
			{message.code === TypeMessage.Indicator && mode === ChannelStreamMode.STREAM_MODE_CHANNEL && (
				<div className="pb-10">
					<OnBoardWelcome nextMessageId={nextMessageId} />
				</div>
			)}
			{message.isFirst && <ChatWelcome key={messageId} name={channelLabel} avatarDM={avatarDM} userName={userName} mode={mode} />}

			{!message.isFirst && (
				<div
					className={`fullBoxText relative group ${!isCombine || (mess.code !== TypeMessage.CreatePin && mess.references?.[0]?.message_ref_id) ? 'pt-3' : ''}`}
				>
					<MessageWithUser
						allowDisplayShortProfile={true}
						message={mess}
						mode={mode}
						isEditing={isEditing}
						isHighlight={isHighlight}
						popup={popup}
						onContextMenu={handleContextMenu}
						isCombine={isCombine}
						showDivider={isDifferentDay}
						checkMessageTargetToMoved={checkMessageTargetToMoved}
						messageReplyHighlight={messageReplyHighlight}
					/>
				</div>
			)}

			{/* {!isMyMessage && isLastSeen && <UnreadMessageBreak />} */}
		</>
	);
};

export const MemorizedChannelMessage = memo(
	ChannelMessage,
	(prev, curr) =>
		prev.messageId + prev?.message?.update_time === curr.messageId + curr?.message?.update_time &&
		prev.channelId === curr.channelId &&
		prev.messageReplyHighlight === curr.messageReplyHighlight &&
		prev.checkMessageTargetToMoved === curr.checkMessageTargetToMoved &&
		prev.message.content === curr.message.content &&
		prev.previousMessage === curr.previousMessage
);

MemorizedChannelMessage.displayName = 'MemorizedChannelMessage';
