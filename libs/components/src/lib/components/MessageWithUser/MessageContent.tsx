import { getFirstMessageOfTopic, selectMemberClanByUserId, threadsActions, topicsActions, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IExtendedMessage, IMessageWithUser } from '@mezon/utils';
import { EBacktickType, ETypeLinkMedia, addMention, createImgproxyUrl, isValidEmojiData } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import React, { memo, useCallback } from 'react';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { MessageLine } from './MessageLine';

type IMessageContentProps = {
	message: IMessageWithUser;
	isCombine?: boolean;
	newMessage?: string;
	isSending?: boolean;
	isError?: boolean;
	mode?: number;
	content?: IExtendedMessage;
	isSearchMessage?: boolean;
	isInTopic?: boolean;
	isEphemeral?: boolean;
	onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
};

const MessageContent = ({ message, mode, isSearchMessage, isEphemeral, isSending, onContextMenu }: IMessageContentProps) => {
	const lines = message?.content?.t;
	const contentUpdatedMention = addMention(message.content, message?.mentions as any);
	const isOnlyContainEmoji = isValidEmojiData(contentUpdatedMention);
	const lineValue = (() => {
		if (lines === undefined && typeof message.content === 'string') {
			return safeJSONParse(message.content).t;
		} else {
			return lines;
		}
	})();

	const handleCopyMessage = (event: React.ClipboardEvent<HTMLDivElement>, startIndex: number, endIndex: number) => {};

	return (
		<MessageText
			isOnlyContainEmoji={isOnlyContainEmoji}
			isSearchMessage={isSearchMessage}
			content={contentUpdatedMention}
			message={message}
			lines={lineValue as string}
			mode={mode}
			onCopy={handleCopyMessage}
			isEphemeral={isEphemeral}
			isSending={isSending}
			onContextMenu={onContextMenu}
		/>
	);
};

export const TopicViewButton = ({ message }: { message: IMessageWithUser }) => {
	const dispatch = useAppDispatch();
	const topicCreator = useAppSelector((state) => selectMemberClanByUserId(state, message?.content?.cid as string));
	const avatarToDisplay = topicCreator?.clan_avatar ? topicCreator?.clan_avatar : topicCreator?.user?.avatar_url;

	const handleOpenTopic = useCallback(() => {
		dispatch(topicsActions.setIsShowCreateTopic(true));
		dispatch(threadsActions.setIsShowCreateThread({ channelId: message.channel_id as string, isShowCreateThread: false }));
		dispatch(topicsActions.setCurrentTopicId(message?.content?.tp || ''));
		dispatch(getFirstMessageOfTopic(message?.content?.tp || ''));
	}, [dispatch, message]);

	return (
		<div
			className=" border-theme-primary  text-theme-primary bg-item-theme text-theme-primary-hover rounded-lg my-1 p-1 w-[70%] flex justify-between items-center cursor-pointer group/view-topic-btn "
			onClick={handleOpenTopic}
		>
			<div className="flex items-center gap-2 text-sm h-fit flex-1 min-w-0">
				<AvatarImage
					alt={`${topicCreator?.user?.username}'s avatar`}
					username={topicCreator?.user?.username}
					className="size-7 rounded-md object-cover flex-shrink-0"
					srcImgProxy={createImgproxyUrl(avatarToDisplay ?? '', { width: 300, height: 300, resizeType: 'fit' })}
					src={avatarToDisplay}
				/>
				<div className="font-semibold text-blue-500 group-hover:underline group-hover:decoration-solid flex-shrink-0">Creator</div>
				<p className="flex-shrink-0">View topic</p>
			</div>
			<Icons.ArrowRight className="flex-shrink-0" />
		</div>
	);
};

export default memo(
	MessageContent,
	(prev, curr) =>
		prev.message === curr.message &&
		prev.mode === curr.mode &&
		prev.isSearchMessage === curr.isSearchMessage &&
		prev.isInTopic === curr.isInTopic &&
		prev.isEphemeral === curr.isEphemeral &&
		prev.isSending === curr.isSending
);

const MessageText = ({
	message,
	lines,
	mode,
	content,
	isOnlyContainEmoji,
	isSearchMessage,
	onCopy,
	isEphemeral,
	isSending,
	onContextMenu
}: {
	message: IMessageWithUser;
	lines: string;
	mode?: number;
	content?: IExtendedMessage;
	isSearchMessage?: boolean;
	isOnlyContainEmoji?: boolean;
	onCopy?: (event: React.ClipboardEvent<HTMLDivElement>, startIndex: number, endIndex: number) => void;
	isEphemeral?: boolean;
	isSending?: boolean;
	onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
}) => {
	let patchedContent = content;
	if ((!content?.mk || content.mk.length === 0) && Array.isArray(content?.lk) && content.lk.length > 0) {
		patchedContent = {
			...content,
			mk: content.lk.map((lkItem) => ({ ...lkItem, type: EBacktickType.LINK }))
		};
	}

	const attachmentOnMessage = message.attachments;
	const contentToMessage = message.content?.t;
	const checkOneLinkImage =
		attachmentOnMessage?.length === 1 &&
		attachmentOnMessage[0].filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) &&
		attachmentOnMessage[0].url === contentToMessage?.trim();
	const showEditted = !message.hide_editted && !isSearchMessage;

	const linkFromMarkdown = patchedContent?.mk?.find?.((item) => item?.type === EBacktickType.LINK);
	let displayLine = lines;
	if ((!lines || lines.length === 0) && linkFromMarkdown && typeof linkFromMarkdown.s === 'number' && typeof linkFromMarkdown.e === 'number') {
		let linkFromLk = '';
		if (Array.isArray(message?.content?.lk) && typeof message?.content?.lk[0] === 'string') {
			linkFromLk = message?.content?.lk[0];
		}
		displayLine = typeof message?.content?.t === 'string' && message?.content?.t.length > 0 ? message?.content?.t : linkFromLk;
		if (!displayLine && message?.content?.t === '') {
			const raw = message?.content?.t || '';
			displayLine = raw.substring(linkFromMarkdown.s, linkFromMarkdown.e);
		}
	}

	const hasLinkMarkdown = !!linkFromMarkdown;

	return (
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<>
			{displayLine?.length > 0 || hasLinkMarkdown ? (
				<MessageLine
					isEditted={showEditted}
					isHideLinkOneImage={checkOneLinkImage}
					isTokenClickAble={!isEphemeral}
					isSearchMessage={isSearchMessage}
					isOnlyContainEmoji={isOnlyContainEmoji}
					isJumMessageEnabled={false}
					content={patchedContent as any} // fix later
					mode={mode}
					code={message.code}
					onCopy={onCopy}
					messageId={message.id}
					isEphemeral={isEphemeral}
					isSending={isSending}
					onContextMenu={onContextMenu}
				/>
			) : null}
		</>
	);
};
