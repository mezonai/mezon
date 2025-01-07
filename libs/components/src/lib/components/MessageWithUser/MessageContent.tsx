import {
	getFirstMessageOfTopic,
	selectCurrentChannelId,
	selectMemberClanByUserId2,
	selectMessageByMessageId,
	selectTheme,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	ETypeLinkMedia,
	IExtendedMessage,
	IMessageWithUser,
	TypeMessage,
	addMention,
	convertTimeString,
	createImgproxyUrl,
	isValidEmojiData
} from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { MessageLine } from './MessageLine';
import { MessageLineSystem } from './MessageLineSystem';

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
};

const MessageContent = memo(({ message, mode, isSearchMessage, isInTopic }: IMessageContentProps) => {
	const dispatch = useAppDispatch();
	const lines = message?.content?.t;
	const contentUpdatedMention = addMention(message.content, message?.mentions as any);
	const isOnlyContainEmoji = isValidEmojiData(contentUpdatedMention);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentMessage = useAppSelector((state) => selectMessageByMessageId(state, currentChannelId, message.id || ''));
	const topicCreator = useAppSelector((state) => selectMemberClanByUserId2(state, currentMessage?.content?.cid as string));
	const lineValue = (() => {
		if (lines === undefined && typeof message.content === 'string') {
			return safeJSONParse(message.content).t;
		} else {
			return lines;
		}
	})();
	const theme = useAppSelector(selectTheme);

	const handleOpenTopic = () => {
		dispatch(topicsActions.setIsShowCreateTopic({ channelId: message.channel_id as string, isShowCreateTopic: true }));
		dispatch(threadsActions.setIsShowCreateThread({ channelId: message.channel_id as string, isShowCreateThread: false }));
		dispatch(topicsActions.setCurrentTopicId(currentMessage?.content?.tp || ''));
		dispatch(getFirstMessageOfTopic(currentMessage?.content?.tp || ''));
	};

	const handleCopyMessage = useCallback(
		(event: React.ClipboardEvent<HTMLDivElement>, startIndex: number, endIndex: number) => {
			if (message?.content && message?.mentions) {
				const key = 'text/mezon-mentions';
				const copyData = {
					message: message,
					startIndex: startIndex,
					endIndex: endIndex
				};
				const value = JSON.stringify(copyData);

				event.preventDefault();

				event.clipboardData.setData(key, value);
			}
		},
		[message]
	);

	const avatarToDisplay = topicCreator?.clan_avatar ? topicCreator?.clan_avatar : topicCreator?.user?.avatar_url;

	return (
		<>
			<MessageText
				isOnlyContainEmoji={isOnlyContainEmoji}
				isSearchMessage={isSearchMessage}
				content={contentUpdatedMention}
				message={message}
				lines={lineValue as string}
				mode={mode}
				onCopy={handleCopyMessage}
			/>
			{!isInTopic && currentMessage?.code === TypeMessage.Topic && (
				<div
					className="border border-colorTextLightMode dark:border-contentTertiary dark:text-contentTertiary text-colorTextLightMode rounded-md my-1 p-1 w-[70%] flex justify-between items-center bg-textPrimary dark:bg-bgSearchHover cursor-pointer hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white group/view-topic-btn"
					onClick={handleOpenTopic}
				>
					<div className="flex items-center gap-2 text-sm h-fit">
						<img
							src={createImgproxyUrl(avatarToDisplay ?? '', { width: 300, height: 300, resizeType: 'fit' })}
							alt={`${topicCreator?.user?.username}'s avatar`}
							className="size-7 rounded-md object-cover"
							title={`${topicCreator?.user?.username}'s avatar`}
						/>
						<div className="font-semibold text-blue-500 group-hover/view-topic-btn:text-blue-700">Creator</div>
						<p>View topic</p>
					</div>
					<Icons.ArrowRight
						defaultFill={theme === 'dark' ? '#AEAEAE' : '#535353'}
						defaultSize={'w-4 h-4 min-w-4 hover:text-white text-borderDividerLight'}
					/>
				</div>
			)}
		</>
	);
});

export default MessageContent;

const MessageText = memo(
	({
		message,
		lines,
		mode,
		content,
		isOnlyContainEmoji,
		isSearchMessage,
		onCopy
	}: {
		message: IMessageWithUser;
		lines: string;
		mode?: number;
		content?: IExtendedMessage;
		isSearchMessage?: boolean;
		isOnlyContainEmoji?: boolean;
		onCopy?: (event: React.ClipboardEvent<HTMLDivElement>, startIndex: number, endIndex: number) => void;
	}) => {
		const attachmentOnMessage = message.attachments;

		const contentToMessage = message.content?.t;

		const checkOneLinkImage =
			attachmentOnMessage?.length === 1 &&
			attachmentOnMessage[0].filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) &&
			attachmentOnMessage[0].url === contentToMessage?.trim();
		const showEditted = !message.hide_editted;
		const messageTime = convertTimeString(message?.create_time as string);
		return (
			// eslint-disable-next-line react/jsx-no-useless-fragment
			<>
				{lines?.length > 0 ? (
					<div className="flex w-full">
						<div className="w-full flex gap-4 max-2xl:flex-col max-2xl:gap-0">
							{message.code === TypeMessage.CreatePin || message.code === TypeMessage.CreateThread ? (
								<MessageLineSystem
									message={message}
									isHideLinkOneImage={checkOneLinkImage}
									isTokenClickAble={true}
									isSearchMessage={isSearchMessage}
									isJumMessageEnabled={false}
									content={content}
									mode={mode}
								/>
							) : (
								<MessageLine
									isEditted={showEditted}
									isHideLinkOneImage={checkOneLinkImage}
									isTokenClickAble={true}
									isSearchMessage={isSearchMessage}
									isOnlyContainEmoji={isOnlyContainEmoji}
									isJumMessageEnabled={false}
									content={content}
									mode={mode}
									code={message.code}
									onCopy={onCopy}
								/>
							)}
							{(message.code === TypeMessage.Welcome ||
								message.code === TypeMessage.CreateThread ||
								message.code === TypeMessage.AuditLog ||
								message.code === TypeMessage.CreatePin) && (
								<div className="dark:text-zinc-400 text-colorTextLightMode text-[10px] cursor-default">{messageTime}</div>
							)}
						</div>
					</div>
				) : null}
			</>
		);
	}
);
