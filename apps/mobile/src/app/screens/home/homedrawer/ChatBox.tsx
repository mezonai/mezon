import { usePermissionChecker } from '@mezon/core';
import { EOverriddenPermission } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo } from 'react';
import { ChatBoxMain } from './ChatBoxMain';
import { EMessageActionType } from './enums';

interface IChatBoxProps {
	channelId: string;
	mode: ChannelStreamMode;
	messageAction?: EMessageActionType;
	hiddenIcon?: {
		threadIcon: boolean;
	};
	directMessageId?: string;
	onShowKeyboardBottomSheet?: (isShow: boolean, type?: string) => void;
	isPublic: boolean;
}
export const ChatBox = memo((props: IChatBoxProps) => {
	const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], props.channelId);
	return <ChatBoxMain {...props} canSendMessage={canSendMessage} />;
});
