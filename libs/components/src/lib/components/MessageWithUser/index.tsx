/* eslint-disable @typescript-eslint/no-empty-function */
import type { MessagesEntity } from '@mezon/store';
import { topicsActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ObserveFn, UsersClanEntity } from '@mezon/utils';
import {
	HEIGHT_PANEL_PROFILE,
	HEIGHT_PANEL_PROFILE_DM,
	ID_MENTION_HERE,
	TOPIC_MAX_WIDTH,
	TypeMessage,
	WIDTH_CHANNEL_LIST_BOX,
	WIDTH_CLAN_SIDE_BAR,
	convertDateString,
	convertTimeHour,
	generateE2eId
} from '@mezon/utils';
import classNames from 'classnames';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import type { ApiMessageMention } from 'mezon-js/api.gen';
import type { ReactNode } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import CallLogMessage from '../CallLogMessage/CallLogMessage';
import { EmbedMessageWrap } from '../EmbedMessage/EmbedMessageWrap';
import { MessageActionsPanel } from '../MessageActionsPanel';
import ModalUserProfile from '../ModalUserProfile';
import TokenTransactionMessage from '../TokenTransactionMsg/TokenTransactionMsg';
import MessageAttachment from './MessageAttachment';
import MessageAvatar from './MessageAvatar';
import MessageContent, { TopicViewButton } from './MessageContent';
import MessageHead from './MessageHead';
import MessageInput from './MessageInput';
import MessageReaction from './MessageReaction/MessageReaction';
import MessageReply from './MessageReply/MessageReply';

const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';

export type ReactedOutsideOptional = {
	id: string;
	emoji?: string;
	messageId: string;
};

export type MessageWithUserProps = {
	message: MessagesEntity;
	mode: number;
	isMention?: boolean;
	isEditing?: boolean;
	isShowFull?: boolean;
	isHighlight?: boolean;
	editor?: JSX.Element;
	onContextMenu?: (event: React.MouseEvent<HTMLParagraphElement>) => void;
	popup?: () => ReactNode;
	isSearchMessage?: boolean;
	allowDisplayShortProfile: boolean;
	isCombine?: boolean;
	showDivider?: boolean;
	channelLabel?: string;
	checkMessageTargetToMoved?: boolean;
	messageReplyHighlight?: boolean;
	isTopic?: boolean;
	observeIntersectionForLoading?: ObserveFn;
	user: UsersClanEntity;
	isSelected?: boolean;
	previousMessage?: MessagesEntity;
};

function MessageWithUser({
	message,
	mode,
	isMention,
	onContextMenu,
	isEditing,
	isHighlight,
	popup,
	isShowFull,
	isSearchMessage,
	isCombine,
	showDivider,
	channelLabel,
	checkMessageTargetToMoved,
	messageReplyHighlight,
	isTopic,
	user,
	observeIntersectionForLoading,
	isSelected,
	previousMessage
}: Readonly<MessageWithUserProps>) {
	const dispatch = useAppDispatch();
	const userId = user?.user?.id as string;
	const positionShortUser = useRef<{ top: number; left: number } | null>(null);
	const shortUserId = useRef('');
	const isClickReply = useRef(false);
	const checkAnonymous = message?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID;
	const checkAnonymousOnReplied = message?.references && message?.references[0]?.message_sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID;
	const showMessageHead = !(message?.references?.length === 0 && isCombine && !isShowFull);

	const shouldShowForwardedText = useMemo(() => {
		if (!message?.content?.fwd) return false;

		if (!previousMessage) return true;

		if (!previousMessage?.content?.fwd) return true;

		const timeDiff = Date.parse(message.create_time) - Date.parse(previousMessage.create_time);
		const isDifferentSender = message.sender_id !== previousMessage.sender_id;
		const isTimeGap = timeDiff > 600000;

		return isDifferentSender || isTimeGap;
	}, [message, previousMessage]);

	const checkReplied = userId && message?.references && message?.references[0]?.message_sender_id === userId;

	const hasIncludeMention = (() => {
		if (!userId) return false;
		if (typeof message?.content?.t == 'string') {
			if (message?.mentions?.some((mention) => mention?.user_id === ID_MENTION_HERE)) return true;
		}
		if (typeof message?.mentions === 'string') {
			const parsedMentions = safeJSONParse(message?.mentions) as ApiMessageMention[] | undefined;
			const userIdMention = userId;
			const includesUser = parsedMentions?.some((mention) => mention?.user_id === userIdMention);
			const includesRole = parsedMentions?.some((item) => user?.role_id?.includes(item?.role_id as string));
			return includesUser || includesRole;
		}
		const userIdMention = userId;
		const includesUser = message?.mentions?.some((mention) => mention?.user_id === userIdMention);
		const includesRole = message?.mentions?.some((item) => user?.role_id?.includes(item?.role_id as string));
		return includesUser || includesRole;
	})();

	const checkMessageHasReply = !!message?.references?.length && message?.code === TypeMessage.Chat;
	const isEphemeralMessage = message?.code === TypeMessage.Ephemeral;

	const handleOpenShortUser = useCallback(
		(e: React.MouseEvent<HTMLImageElement, MouseEvent>, userId: string, isClickOnReply = false) => {
			setIsAnonymousOnModal(isClickOnReply);
			shortUserId.current = userId;
			const heightPanel =
				mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
					? HEIGHT_PANEL_PROFILE
					: HEIGHT_PANEL_PROFILE_DM;
			if (window.innerHeight - e.clientY > heightPanel) {
				positionShortUser.current = {
					top: e.clientY,
					left: WIDTH_CLAN_SIDE_BAR + WIDTH_CHANNEL_LIST_BOX + e.currentTarget.offsetWidth + 24
				};
			} else {
				positionShortUser.current = {
					top: window.innerHeight - heightPanel,
					left: WIDTH_CLAN_SIDE_BAR + WIDTH_CHANNEL_LIST_BOX + e.currentTarget.offsetWidth + 24
				};
			}
			openProfileItem();
		},
		[mode]
	);

	const handleLeaveComment = useCallback(() => {
		dispatch(topicsActions.setIsShowCreateTopic(true));
		dispatch(topicsActions.setCurrentTopicInitMessage(message));
		dispatch(topicsActions.setCurrentTopicId(''));
		dispatch(topicsActions.setFirstMessageOfCurrentTopic(message));
	}, [dispatch, message]);

	const isDM = mode === ChannelStreamMode.STREAM_MODE_GROUP || mode === ChannelStreamMode.STREAM_MODE_DM;

	const [isAnonymousOnModal, setIsAnonymousOnModal] = useState<boolean>(false);

	const [openProfileItem, closeProfileItem] = useModal(() => {
		return (
			<div
				className={`fixed z-50 max-[480px]:!left-16 max-[700px]:!left-9  w-[300px] max-w-[89vw] rounded-lg flex flex-col duration-300 ease-in-out animate-fly_in border-theme-primary bg-outside-footer `}
				style={{
					top: `${positionShortUser.current?.top}px`,
					left: `${positionShortUser.current?.left}px`
				}}
			>
				<ModalUserProfile
					onClose={() => {
						closeProfileItem();
					}}
					userID={shortUserId.current}
					classBanner="rounded-tl-lg rounded-tr-lg h-[105px]"
					message={message}
					mode={mode}
					avatar={isClickReply.current ? message?.references?.[0]?.mesages_sender_avatar : message?.clan_avatar || message?.avatar}
					name={message?.clan_nick || message?.display_name || message?.username}
					isDM={isDM}
					checkAnonymous={isAnonymousOnModal}
				/>
			</div>
		);
	}, [message]);

	// (message?.content as any)?.isCard

	return (
		<>
			{message && showDivider && <MessageDateDivider message={message} />}
			{message && (
				<HoverStateWrapper
					isSearchMessage={isSearchMessage}
					popup={!isEphemeralMessage ? popup : undefined}
					onContextMenu={!isEphemeralMessage ? onContextMenu : () => {}}
					messageId={message.id}
					className={classNames(
						'fullBoxText relative group dark:font-normal font-medium',
						{
							'mt-[10px]': !isCombine
						},
						{
							'pt-3': !isCombine || (message.code !== TypeMessage.CreatePin && message.references?.[0]?.message_ref_id)
						},
						{
							'bg-highlight-no-hover':
								(hasIncludeMention || checkReplied) && !messageReplyHighlight && !checkMessageTargetToMoved && !isEphemeralMessage
						},
						{ '!bg-bgMessageReplyHighline': messageReplyHighlight },
						{ 'bg-highlight': isHighlight },
						{ '!bg-[#eab30833]': checkMessageTargetToMoved },
						{
							' bg-item-theme border-l-4  border-[#A78BFA] ': isEphemeralMessage
						},
						{ 'bg-item-msg-selected': isSelected },
						{ 'pointer-events-none': message.isSending },
						{ 'is-error pointer-events-none': message.isError },
						{
							'max-w-[37rem] bg-[#2f3136] border border-[#40444b] rounded-lg mx-2 my-1 p-3': message.content?.isCard
						}
					)}
					create_time={message.create_time}
					showMessageHead={showMessageHead}
				>
					{checkMessageHasReply && !isEphemeralMessage && message?.references?.[0]?.message_sender_id !== '0' && (
						<MessageReply
							message={message}
							mode={mode}
							onClick={
								checkAnonymousOnReplied
									? () => {}
									: (e) => {
											isClickReply.current = true;
											handleOpenShortUser(e, message?.references?.[0]?.message_sender_id as string, checkAnonymousOnReplied);
										}
							}
							isAnonymousReplied={checkAnonymousOnReplied}
							isTopic={isTopic}
						/>
					)}
					<div
						className={`pl-[72px] justify-start inline-flex flex-wrap w-full mb-1 relative h-fit overflow-visible ${isSearchMessage ? '' : 'pr-12'}`}
					>
						{showMessageHead && (
							<>
								<MessageAvatar
									message={message}
									isEditing={isEditing}
									mode={mode}
									onClick={
										checkAnonymous
											? () => {}
											: (e) => {
													isClickReply.current = false;
													handleOpenShortUser(e, message?.sender_id);
												}
									}
								/>
								<MessageHead
									message={message}
									mode={mode}
									onClick={
										checkAnonymous
											? () => {}
											: (e) => {
													isClickReply.current = false;
													handleOpenShortUser(e, message?.sender_id);
												}
									}
									isDM={isDM}
								/>
							</>
						)}
						{!!message?.content?.fwd && (
							<div
								style={{ height: `${!isCombine ? 'calc(100% - 50px)' : '100%'}` }}
								className="border-l-4 border-[var(--text-theme-primary)]  rounded absolute left-[58px] bottom-0"
							></div>
						)}
						{!!message?.content?.fwd && shouldShowForwardedText && (
							<div className="flex gap-1 items-center italic font-medium w-full text-theme-primary opacity-60">
								<Icons.ForwardRightClick defaultSize="w-4 h-4" />
								<p>Forwarded</p>
							</div>
						)}

						{isEditing && (
							<MessageInput
								messageId={message?.id}
								channelId={message?.channel_id}
								mode={mode}
								channelLabel={channelLabel as string}
								message={message}
								isTopic={!!isTopic}
							/>
						)}
						{!isEditing && !message?.content?.callLog?.callLogType && !(message.code === TypeMessage.SendToken) && (
							<>
								<MessageContent
									message={message}
									isSending={message?.isSending}
									isError={message?.isError}
									mode={mode}
									isSearchMessage={isSearchMessage}
									isInTopic={isTopic}
									isEphemeral={isEphemeralMessage}
								/>
								{isEphemeralMessage && (
									<div className="flex items-center gap-1 mt-1 mb-1 text-xs italic text-theme-primary opacity-60">
										<Icons.EyeClose className="w-3 h-3" />
										<span>Only visible to recipient</span>
									</div>
								)}
							</>
						)}

						{(message?.attachments?.length as number) > 0 && (
							<MessageAttachment
								observeIntersectionForLoading={observeIntersectionForLoading}
								mode={mode}
								message={message}
								onContextMenu={onContextMenu}
								isInSearchMessage={isSearchMessage}
								defaultMaxWidth={isTopic ? TOPIC_MAX_WIDTH : undefined}
							/>
						)}

						{Array.isArray(message?.content?.embed) && (
							<EmbedMessageWrap
								observeIntersectionForLoading={observeIntersectionForLoading}
								embeds={message.content.embed}
								senderId={message?.sender_id}
								messageId={message?.id}
								channelId={message.channel_id}
							/>
						)}
						{!isTopic && message?.code === TypeMessage.Topic && <TopicViewButton message={message} />}

						{!!message?.content?.callLog?.callLogType && (
							<CallLogMessage
								userId={userId || ''}
								username={message?.display_name || message?.username || ''}
								channelId={message?.channel_id}
								messageId={message?.id}
								senderId={message?.sender_id}
								callLog={message?.content?.callLog}
								contentMsg={message?.content?.t || ''}
							/>
						)}

						{!!(message.code === TypeMessage.SendToken) && <TokenTransactionMessage message={message} />}

						{message?.content?.components &&
							message?.content.components.map((actionRow, index) => (
								<div className={'flex flex-col w-full'} key={index}>
									<MessageActionsPanel
										actionRow={actionRow}
										messageId={message?.id}
										senderId={message?.sender_id}
										channelId={message.channel_id}
									/>
								</div>
							))}
					</div>
					{!isEphemeralMessage && <MessageReaction message={message} isTopic={!!isTopic} />}

					{!isTopic && message?.content?.isCard && !isEphemeralMessage && message?.code !== TypeMessage.Topic && (
						<div
							className="border-t border-[#40444b] mt-3 pt-3 flex items-center justify-between cursor-pointer hover:bg-[#36393f] transition-colors duration-150 rounded-b-lg -mx-3 -mb-3 px-3 py-2"
							onClick={handleLeaveComment}
						>
							<div className="flex items-center gap-2 text-sm text-[#b9bbbe]">
								<Icons.MessageSquareIcon className="w-5 h-5" />
								<span>Go to Topic</span>
							</div>
							<Icons.ArrowRight className="w-4 h-4 text-[#72767d]" />
						</div>
					)}
				</HoverStateWrapper>
			)}
		</>
	);
}

const MessageDateDivider = ({ message }: { message: MessagesEntity }) => {
	const messageDate = !message.create_time ? '' : convertDateString(message.create_time as string);
	return (
		<div className="mt-5 mb-2  w-full h-px flex items-center justify-center border-b-theme-primary">
			<span className="px-4 bg-item text-theme-primary text-xs font-semibold bg-theme-primary rounded-lg ">{messageDate}</span>
		</div>
	);
};

interface HoverStateWrapperProps {
	children: ReactNode;
	popup?: () => ReactNode;
	isSearchMessage?: boolean;
	onContextMenu?: (event: React.MouseEvent<HTMLParagraphElement>) => void;
	messageId?: string;
	className?: string;
	create_time?: string;
	showMessageHead?: boolean;
}
const HoverStateWrapper: React.FC<HoverStateWrapperProps> = ({
	children,
	popup,
	isSearchMessage,
	onContextMenu,
	messageId,
	className,
	create_time,
	showMessageHead
}) => {
	const [isHover, setIsHover] = useState(false);
	const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

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
			className={classNames(
				'message-list-item relative message-container bg-item-hover transition-colors duration-150',
				{
					'w-full': isSearchMessage
				},
				className
			)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onContextMenu={onContextMenu}
			id={`msg-${messageId}`}
			data-e2e={generateE2eId(`chat.direct_message.message.item`)}
		>
			{children}
			{isHover && (
				<>
					{!showMessageHead && create_time && (
						<span className="absolute text-theme-primary left-[24px] top-[4px] text-[11px]">{convertTimeHour(create_time)}</span>
					)}
					{popup?.()}
				</>
			)}
		</div>
	);
};

export default MessageWithUser;
