import { usePermissionChecker } from '@mezon/core';
import { EOverriddenPermission } from '@mezon/utils';
import type { ChannelStreamMode } from 'mezon-js';
import React, { memo } from 'react';
import { ChatBoxMain } from './ChatBoxMain';
import type { EMessageActionType } from './enums';

interface IChatBoxProps {
	channelId: string;
	mode: ChannelStreamMode;
	messageAction?: EMessageActionType;
	hiddenIcon?: {
		threadIcon: boolean;
	};
	directMessageId?: string;
	isPublic: boolean;
	topicChannelId?: string;
	isBlocked?: boolean;
}
export const ChatBox = memo((props: IChatBoxProps) => {
	const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], props.channelId);
	return <ChatBoxMain {...props} canSendMessage={canSendMessage} />;
});
