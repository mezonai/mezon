import { MessagesEntity, selectAllAccount, selectMemberClanByUserId2, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	HEIGHT_PANEL_PROFILE,
	HEIGHT_PANEL_PROFILE_DM,
	TypeMessage,
	WIDTH_CHANNEL_LIST_BOX,
	WIDTH_CLAN_SIDE_BAR,
	convertDateString,
	convertTimeHour
} from '@mezon/utils';
import classNames from 'classnames';
import { ChannelStreamMode } from 'mezon-js';
import React, { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import CallLogMessage from '../CallLogMessage/CallLogMessage';
import EmbedMessage from '../EmbedMessage/EmbedMessage';
import { MessageActionsPanel } from '../MessageActionsPanel';
import ModalUserProfile from '../ModalUserProfile';
import MessageAttachment from './MessageAttachment';
import MessageAvatar from './MessageAvatar';
import MessageContent from './MessageContent';
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
	isTopic
}: Readonly<MessageWithUserProps>) {
	const userId = useSelector(selectAllAccount)?.user?.id as string;
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, userId));
	const positionShortUser = useRef<{ top: number; left: number } | null>(null);
	const shortUserId = useRef('');
	const checkAnonymous = message?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID;

	const modalState = useRef({
		profileItem: false
	});

	const checkReplied = message?.references && message?.references[0]?.message_sender_id === userId;

	const attachments = message?.attachments ?? [];
	const hasFailedAttachment = attachments.length === 1 && attachments[0].filename === 'failAttachment' && attachments[0].filetype === 'unknown';
	const isMeMessage = message?.isMe;

	const shouldNotRender = hasFailedAttachment && !isMeMessage && Object.keys(message?.content).length === 0 && !message?.mentions?.length;

	const hasIncludeMention = (() => {
		if (typeof message?.content?.t == 'string') {
			if (message?.content.t?.includes('@here')) return true;
		}
		const userIdMention = userId;
		const includesUser = message?.mentions?.some((mention) => mention.user_id === userIdMention);
		const includesRole = message?.mentions?.some((item) => user?.role_id?.includes(item?.role_id as string));
		return includesUser || includesRole;
	})();

	const checkMessageHasReply = !!message?.references?.length && message?.code === TypeMessage.Chat;

	const checkMessageIncludeMention = hasIncludeMention;

	const containerClass = classNames('relative', 'message-container', {
		'is-sending': message?.isSending,
		'is-error': message?.isError,
		'bg-[#383B47]': isHighlight
	});

	const parentDivClass = classNames(
		'flex h-15 flex-col w-auto px-3',
		{ 'mt-0': isMention },
		{ 'pt-[2px]': !isCombine },
		{ 'dark:bg-[#383B47]': hasIncludeMention || checkMessageTargetToMoved },
		{
			'dark:bg-[#403D38] bg-[#EAB3081A]': (checkMessageIncludeMention || checkReplied) && !messageReplyHighlight && !checkMessageTargetToMoved
		},
		// {
		// 	'dark:group-hover:bg-bgPrimary1 ': !hasIncludeMention && !checkReplied && !checkMessageTargetToMoved && !messageReplyHighlight
		// },
		{ 'bg-bgMessageReplyHighline': messageReplyHighlight }
	);

	const childDivClass = classNames(
		'absolute w-0.5 h-full left-0',
		{ 'bg-blue-500': messageReplyHighlight },
		{ 'bg-bgMentionReply': hasIncludeMention || checkReplied }
		// {
		// 	'dark:group-hover:bg-bgPrimary1 group-hover:bg-[#EAB3081A]':
		// 		!hasIncludeMention && !checkReplied && !checkMessageTargetToMoved && !messageReplyHighlight
		// }
	);

	const handleOpenShortUser = useCallback(
		(e: React.MouseEvent<HTMLImageElement, MouseEvent>, userId: string) => {
			if (checkAnonymous) {
				return;
			}
			if (modalState.current.profileItem) {
				return;
			}
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
			modalState.current.profileItem = true;
		},
		[checkAnonymous, mode]
	);

	const isDM = useMemo(() => {
		return mode === ChannelStreamMode.STREAM_MODE_GROUP || mode === ChannelStreamMode.STREAM_MODE_DM;
	}, [mode]);

	const avatar = useMemo(() => {
		if (isDM && shortUserId.current === message?.sender_id) {
			return message?.avatar;
		}

		if (shortUserId.current === message?.sender_id) {
			return message?.clan_avatar || message?.avatar;
		}
	}, [isDM, message?.avatar, message?.clan_avatar, message?.sender_id]);

	const messageHour = message ? convertTimeHour(message.create_time) : '';

	const [openProfileItem, closeProfileItem] = useModal(() => {
		return (
			<div
				className={`fixed z-50 max-[480px]:!left-16 max-[700px]:!left-9 dark:bg-black bg-gray-200 w-[300px] max-w-[89vw] rounded-lg flex flex-col duration-300 ease-in-out animate-fly_in`}
				style={{
					top: `${positionShortUser.current?.top}px`,
					left: `${positionShortUser.current?.left}px`
				}}
			>
				<ModalUserProfile
					onClose={() => {
						closeProfileItem();
						setTimeout(() => {
							modalState.current.profileItem = false;
						}, 100);
					}}
					userID={shortUserId.current}
					classBanner="rounded-tl-lg rounded-tr-lg h-[105px]"
					message={message}
					mode={mode}
					positionType={''}
					avatar={avatar}
					name={message?.clan_nick || message?.display_name || message?.username}
					isDM={isDM}
				/>
			</div>
		);
	}, [message, avatar]);

	const isMessageSystem =
		message?.code === TypeMessage.Welcome ||
		message?.code === TypeMessage.CreateThread ||
		message?.code === TypeMessage.CreatePin ||
		message?.code === TypeMessage.AuditLog;

	return (
		<>
			{message && showDivider && <MessageDateDivider message={message} />}
			{message && !shouldNotRender && (
				<HoverStateWrapper isSearchMessage={isSearchMessage} popup={popup}>
					<div className={containerClass} onContextMenu={onContextMenu} id={`msg-${message?.id}`}>
						<div className="relative rounded-sm overflow-visible">
							<div className={!isMessageSystem ? childDivClass : 'absolute w-0.5 h-full left-0'}></div>
							<div className={!isMessageSystem ? parentDivClass : 'flex h-15 flex-col w-auto px-3 pt-[2px]'}>
								{checkMessageHasReply && (
									<MessageReply
										message={message}
										mode={mode}
										onClick={(e) => handleOpenShortUser(e, message?.references?.[0]?.message_sender_id as string)}
									/>
								)}
								<div
									className={`justify-start gap-4 inline-flex w-full relative h-fit overflow-visible ${isSearchMessage ? '' : 'pr-12'}`}
								>
									{isMessageSystem ? (
										<div className="size-10 mt-[2px] flex justify-center rounded-full object-cover min-w-5 min-h-5">
											{message?.code === TypeMessage.Welcome && <Icons.WelcomeIcon defaultSize="size-8" />}
											{message?.code === TypeMessage.CreateThread && <Icons.ThreadIcon defaultSize="size-6" />}
											{message?.code === TypeMessage.CreatePin && <Icons.PinRight defaultSize="size-6" />}
											{message?.code === TypeMessage.AuditLog && <Icons.AuditLogIcon defaultSize="size-8" />}
										</div>
									) : (
										<div>
											{message?.references?.length === 0 && isCombine && !isShowFull ? (
												<div className="w-10 flex items-center justify-center min-w-10">
													<div className="hidden group-hover:text-zinc-400 group-hover:text-[10px] group-hover:block cursor-default">
														{messageHour}
													</div>
												</div>
											) : (
												<MessageAvatar
													message={message}
													isEditing={isEditing}
													mode={mode}
													onClick={(e) => handleOpenShortUser(e, message?.sender_id)}
												/>
											)}
										</div>
									)}

									<div className="w-full relative h-full select-text">
										{!isMessageSystem && (
											<div>
												{!(isCombine && message?.references?.length === 0 && !isShowFull) && (
													<MessageHead
														message={message}
														mode={mode}
														onClick={(e) => handleOpenShortUser(e, message?.sender_id)}
													/>
												)}
											</div>
										)}
										<div className={`flex gap-4 ${message?.content?.fwd ? 'pt-2' : ''}`}>
											{!!message?.content?.fwd && (
												<div className="border-l-4 dark:border-[#414348] border-[#ebebeb] rounded"></div>
											)}
											<div className="h-full w-full">
												{!!message?.content?.fwd && (
													<div className="flex gap-1 items-center italic text-[#5e6068] dark:text-[#949ba4] font-medium">
														<Icons.ForwardRightClick defaultSize="w-4 h-4" />
														<p>Forwarded</p>
													</div>
												)}

												<div className="justify-start items-center inline-flex w-full h-full pt-[2px] textChat">
													<div
														className="flex flex-col whitespace-pre-wrap text-base w-full cursor-text"
														style={{ wordBreak: 'break-word' }}
													>
														{isEditing && (
															<MessageInput
																messageId={message?.id}
																channelId={message?.channel_id}
																mode={mode}
																channelLabel={channelLabel as string}
																message={message}
															/>
														)}
														{!isEditing && !message?.content?.callLog?.callLogType && (
															<MessageContent
																message={message}
																isSending={message?.isSending}
																isError={message?.isError}
																mode={mode}
																isSearchMessage={isSearchMessage}
																isInTopic={isTopic}
															/>
														)}

														{(message?.attachments?.length as number) > 0 && (
															<MessageAttachment mode={mode} message={message} onContextMenu={onContextMenu} />
														)}

														{Array.isArray(message?.content?.embed) &&
															message?.content.embed?.map((embed, index) => (
																<EmbedMessage
																	key={index}
																	embed={embed}
																	senderId={message?.sender_id}
																	message_id={message?.id}
																/>
															))}

														{!!message?.content?.callLog?.callLogType && (
															<CallLogMessage
																userId={userId || ''}
																userName={user?.user?.display_name || ''}
																channelId={message?.channel_id}
																messageId={message?.id}
																senderId={message?.sender_id}
																callLog={message?.content?.callLog}
																contentMsg={message?.content?.t || ''}
															/>
														)}

														{message?.content?.components &&
															message?.content.components.map((actionRow, index) => (
																<div className={'flex flex-col'} key={index}>
																	<MessageActionsPanel
																		actionRow={actionRow}
																		messageId={message?.id}
																		senderId={message?.sender_id}
																	/>
																</div>
															))}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<MessageReaction message={message} mode={mode} />
					</div>
				</HoverStateWrapper>
			)}
		</>
	);
}

const MessageDateDivider = ({ message }: { message: MessagesEntity }) => {
	const messageDate = !message?.create_time ? '' : convertDateString(message?.create_time as string);
	return (
		<div className="flex flex-row w-full px-4 items-center pt-3 text-zinc-400 text-[12px] font-[600] dark:bg-transparent bg-transparent">
			<div className="w-full border-b-[1px] dark:border-borderDivider border-borderDividerLight opacity-50 text-center"></div>
			<span className="text-center px-3 whitespace-nowrap">{messageDate}</span>
			<div className="w-full border-b-[1px] dark:border-borderDivider border-borderDividerLight opacity-50 text-center"></div>
		</div>
	);
};

interface HoverStateWrapperProps {
	children: ReactNode;
	popup?: () => ReactNode;
	isSearchMessage?: boolean;
}
const HoverStateWrapper: React.FC<HoverStateWrapperProps> = ({ children, popup, isSearchMessage }) => {
	const [isHover, setIsHover] = useState(false);
	const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

	const handleMouseEnter = () => {
		if (hoverTimeout.current) {
			clearTimeout(hoverTimeout.current);
		}
		hoverTimeout.current = setTimeout(() => {
			setIsHover(true);
		}, 100);
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
			className={`${isSearchMessage ? 'w-full' : ''} hover:dark:bg-[#2e3035] hover:bg-[#f7f7f7]`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{children}
			{isHover && popup && popup()}
		</div>
	);
};

export default MessageWithUser;
