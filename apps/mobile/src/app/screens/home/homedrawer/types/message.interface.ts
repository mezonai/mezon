import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { MessagesEntity } from '@mezon/store-mobile';
import { EmojiDataOptionals, IMessageSendPayload, IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef, ApiUser } from 'mezon-js/api.gen';
import { RefObject } from 'react';
import { EMessageActionType, EMessageBSToShow } from '../enums';

export interface IReplyBottomSheet {
	message: MessagesEntity;
	onClose: () => void;
	type: EMessageBSToShow | null;
	onConfirmAction: (payload: IConfirmActionPayload) => void;
	mode?: ChannelStreamMode;
	clanId?: string;
	isOnlyEmojiPicker?: boolean;
	user?: ApiUser | null;
	senderDisplayName?: string;
	isPublic?: boolean;
	channelId?: string;
	handleBottomSheetExpand?: () => void;
}

export interface IMessageActionPayload {
	type: EMessageBSToShow;
	message?: IMessageWithUser;
	user?: ApiUser;
	senderDisplayName?: string;
	isOnlyEmoji?: boolean;
}

export interface IConfirmActionPayload {
	type: EMessageActionType;
	message?: IMessageWithUser;
	user?: ApiUser;
	senderDisplayName?: string;
}

export interface IMessageAction {
	id: number;
	title: string;
	type: EMessageActionType;
}

export interface IMessageActionNeedToResolve {
	type: EMessageActionType;
	targetMessage: IMessageWithUser;
	isStillShowKeyboard?: boolean;
	replyTo?: string;
}

export interface IMessageReactionProps {
	message: IMessageWithUser;
	mode: number;
	openEmojiPicker?: () => void;
	preventAction?: boolean;
	messageReactions?: EmojiDataOptionals[];
	userId?: string;
}

export interface IDetailReactionBottomSheet {
	bottomSheetRef: RefObject<BottomSheetModal>;
	allReactionDataOnOneMessage: EmojiDataOptionals[];
	emojiSelectedId: string | null;
	userId: string | null;
	onClose: () => void;
	removeEmoji?: (emoji: EmojiDataOptionals) => void;
	onShowUserInformation?: (userId: string) => void;
	channelId?: string;
}
export interface IPayloadThreadSendMessage {
	content: IMessageSendPayload;
	mentions?: Array<ApiMessageMention>;
	attachments?: Array<ApiMessageAttachment>;
	references?: Array<ApiMessageRef>;
}
