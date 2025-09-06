import { getShowName, useUserById } from '@mezon/core';
import { getStoreAsync, messagesActions, selectClanView, selectCurrentChannelId, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IMessageWithUser, createImgproxyUrl } from '@mezon/utils';

import { useCallback, useRef } from 'react';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

import { safeJSONParse } from 'mezon-js';
import { useSelector } from 'react-redux';
import { MessageLine } from '../MessageLine';
type MessageReplyProps = {
	message: IMessageWithUser;
	mode?: number;
	onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
	isAnonymousReplied?: boolean;
	isTopic?: boolean;
};

// TODO: refactor component for message lines
const MessageReply: React.FC<MessageReplyProps> = ({ message, onClick, isTopic, isAnonymousReplied }) => {
	const senderIdMessageRef = message?.references?.[0]?.message_sender_id as string;
	const messageIdRef = message?.references?.[0]?.message_ref_id;
	const messageUsernameSenderRef = message?.references?.[0]?.message_sender_username ?? '';
	const messageSender = useUserById(senderIdMessageRef);
	const content = safeJSONParse(message?.references?.[0]?.content ?? '{}');
	const hasAttachmentInMessageRef = message?.references?.[0]?.has_attachment;
	const isEmbedMessage = !content?.t && content?.embed;

	const dispatch = useAppDispatch();

	const getIdMessageToJump = useCallback(
		async (e: React.MouseEvent<HTMLDivElement | HTMLSpanElement>) => {
			e.stopPropagation();
			if (messageIdRef) {
				const store = await getStoreAsync();
				const currentChannelId = selectCurrentChannelId(store.getState());
				dispatch(
					messagesActions.jumpToMessage({
						clanId: message?.clan_id || '',
						messageId: messageIdRef,
						channelId: currentChannelId || message?.channel_id || '',
						topicId: isTopic ? message?.channel_id || '' : undefined
					})
				);
			}
		},
		[dispatch, message?.channel_id, message?.clan_id, messageIdRef]
	);

	const markUpOnReplyParent = useRef<HTMLDivElement | null>(null);

	const nameShowed = getShowName(
		message?.references?.[0]?.message_sender_clan_nick ?? '',
		message?.references?.[0]?.message_sender_display_name ?? '',
		messageUsernameSenderRef ?? '',
		senderIdMessageRef ?? ''
	);

	const isClanView = useSelector(selectClanView);

	return (
		<div className="overflow-hidden max-w-[97%]" style={{ height: 24 }} ref={markUpOnReplyParent}>
			{message.references?.[0].message_ref_id ? (
				<div className="rounded flex flex-row gap-1 items-center justify-start w-fit text-[14px] ml-9 mb-[-5px] replyMessage">
					<Icons.ReplyCorner />
					<div className="flex flex-row gap-1 pr-12 items-center w-full">
						<div onClick={onClick} className="w-5 h-5">
							<AvatarImage
								className="w-5 h-5"
								alt="user avatar"
								username={messageUsernameSenderRef}
								srcImgProxy={createImgproxyUrl(
									(!isClanView
										? (message?.references?.[0]?.mesages_sender_avatar ?? '')
										: messageSender?.clan_avatar || messageSender?.user?.avatar_url) ?? '',
									{ width: 100, height: 100, resizeType: 'fit' }
								)}
								src={
									!isClanView
										? (message?.references?.[0]?.mesages_sender_avatar ?? '')
										: messageSender?.clan_avatar || messageSender?.user?.avatar_url
								}
								isAnonymous={isAnonymousReplied}
							/>
						</div>

						<div className="gap-1 flex flex-row items-center w-full">
							<span
								onClick={onClick}
								className="h-6 text-[#84ADFF] font-bold hover:underline cursor-pointer tracking-wide whitespace-nowrap"
							>
								{!isClanView ? message?.references?.[0]?.message_sender_display_name || messageUsernameSenderRef : nameShowed}
							</span>
							{hasAttachmentInMessageRef || isEmbedMessage ? (
								<div className=" flex flex-row items-center">
									<div
										onClick={getIdMessageToJump}
										className="text-[14px] pr-1 dark:hover:text-white dark:text-[#A8BAB8] text-[#818388]  hover:text-[#060607] cursor-pointer italic   w-fit one-line break-all pt-0"
									>
										Click to see attachment
									</div>
									<Icons.ImageThumbnail />
								</div>
							) : (
								<div className="h-6 overflow-hidden flex-1">
									<MessageLine
										isEditted={false}
										isTokenClickAble={false}
										isJumMessageEnabled={true}
										onClickToMessage={getIdMessageToJump}
										content={content}
										messageId={message.id}
										isReply={true}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
				<div
					className="rounded flex flex-row gap-1 items-center justify-start w-fit text-[14px] ml-9 mb-[-5px] mt-1 replyMessage"
					style={{ height: 24 }}
				>
					<Icons.ReplyCorner />
					<div className="flex flex-row gap-1 mb-2 pr-12 items-center">
						<div className="rounded-full dark:bg-bgSurface bg-bgLightModeButton size-4">
							<Icons.IconReplyMessDeleted />
						</div>
						<i className="dark:text-zinc-400 text-colorTextLightMode text-[13px]">Original message was deleted</i>
					</div>
				</div>
			)}
		</div>
	);
};

export default MessageReply;
