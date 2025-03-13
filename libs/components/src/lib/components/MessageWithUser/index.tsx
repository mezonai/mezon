/* eslint-disable @typescript-eslint/no-empty-function */
import { MessagesEntity, selectAllAccount, selectMemberClanByUserId2, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	HEIGHT_PANEL_PROFILE,
	HEIGHT_PANEL_PROFILE_DM,
	ID_MENTION_HERE,
	TypeMessage,
	WIDTH_CHANNEL_LIST_BOX,
	WIDTH_CLAN_SIDE_BAR,
	convertDateString,
	convertTimeHour
} from '@mezon/utils';
import classNames from 'classnames';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { ApiMessageMention } from 'mezon-js/api.gen';
import React, { ReactNode, useCallback, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import CallLogMessage from '../CallLogMessage/CallLogMessage';
import EmbedMessage from '../EmbedMessage/EmbedMessage';
import { MessageActionsPanel } from '../MessageActionsPanel';
import ModalUserProfile from '../ModalUserProfile';
import TokenTransactionMessage from '../TokenTransactionMsg/TokenTransactionMsg';
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
	const checkAnonymousOnReplied = message?.references && message?.references[0]?.message_sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID;
	const showMessageHead = !(message?.references?.length === 0 && isCombine && !isShowFull);

	const modalState = useRef({
		profileItem: false
	});

	const checkReplied = message?.references && message?.references[0]?.message_sender_id === userId;

	const hasIncludeMention = (() => {
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

	const handleOpenShortUser = useCallback(
		(e: React.MouseEvent<HTMLImageElement, MouseEvent>, userId: string, isClickOnReply = false) => {
			setIsAnonymousOnModal(isClickOnReply);
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
		[mode]
	);

	const isDM = mode === ChannelStreamMode.STREAM_MODE_GROUP || mode === ChannelStreamMode.STREAM_MODE_DM;

	const [isAnonymousOnModal, setIsAnonymousOnModal] = useState<boolean>(false);

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
					avatar={message?.clan_avatar || message?.avatar}
					name={message?.clan_nick || message?.display_name || message?.username}
					isDM={isDM}
					checkAnonymous={isAnonymousOnModal}
				/>
			</div>
		);
	}, [message]);

	return (
		<>
			{message && showDivider && <MessageDateDivider message={message} />}
			{message && (
				<HoverStateWrapper
					isSearchMessage={isSearchMessage}
					popup={popup}
					onContextMenu={onContextMenu}
					messageId={message.id}
					className={classNames(
						'fullBoxText relative group',
						{
							'mt-[10px]': !isCombine
						},
						{
							'pt-3': !isCombine || (message.code !== TypeMessage.CreatePin && message.references?.[0]?.message_ref_id)
						},
						{ 'dark:bg-[#383B47]': hasIncludeMention || checkMessageTargetToMoved },
						{
							'dark:bg-[#403D38] bg-[#EAB3081A]':
								(hasIncludeMention || checkReplied) && !messageReplyHighlight && !checkMessageTargetToMoved
						},
						{ 'bg-bgMessageReplyHighline': messageReplyHighlight },
						isHighlight ? 'bg-[#383B47]' : ''
					)}
					create_time={message.create_time}
					showMessageHead={showMessageHead}
				>
					{checkMessageHasReply && (
						<MessageReply
							message={message}
							mode={mode}
							onClick={
								checkAnonymousOnReplied
									? () => {}
									: (e) => handleOpenShortUser(e, message?.references?.[0]?.message_sender_id as string, checkAnonymousOnReplied)
							}
							isAnonymousReplied={checkAnonymousOnReplied}
						/>
					)}
					<div
						className={`pl-[72px] justify-start inline-flex flex-wrap w-full relative h-fit overflow-visible ${isSearchMessage ? '' : 'pr-12'}`}
					>
						{showMessageHead && (
							<>
								<MessageAvatar
									message={message}
									isEditing={isEditing}
									mode={mode}
									onClick={checkAnonymous ? () => {} : (e) => handleOpenShortUser(e, message?.sender_id)}
								/>
								<MessageHead
									message={message}
									mode={mode}
									onClick={checkAnonymous ? () => {} : (e) => handleOpenShortUser(e, message?.sender_id)}
								/>
							</>
						)}
						{!!message?.content?.fwd && (
							<div
								style={{ height: `${!isCombine ? 'calc(100% - 50px)' : '100%'}` }}
								className="border-l-4 dark:border-[#414348] border-[#ebebeb] rounded absolute left-[45px] bottom-0"
							></div>
						)}
						{!!message?.content?.fwd && (
							<div className="flex gap-1 items-center italic text-[#5e6068] dark:text-[#949ba4] font-medium w-full">
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

						{Array.isArray(message?.content?.embed) && (
							<div className="w-full">
								{message?.content?.embed?.map((embed, index) => (
									<EmbedMessage key={index} embed={embed} senderId={message?.sender_id} message_id={message?.id} />
								))}
							</div>
						)}

						{!!message?.content?.callLog?.callLogType && (
							<CallLogMessage
								userId={userId || ''}
								username={user?.user?.display_name || ''}
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
									<MessageActionsPanel actionRow={actionRow} messageId={message?.id} senderId={message?.sender_id} />
								</div>
							))}
					</div>
					<MessageReaction message={message} mode={mode} />
				</HoverStateWrapper>
			)}
		</>
	);
}

const MessageDateDivider = ({ message }: { message: MessagesEntity }) => {
	const messageDate = !message.create_time ? '' : convertDateString(message.create_time as string);
	return (
		<div className="relative text-center p-4">
			<hr className="border-t border-gray-300 dark:border-borderDivider absolute top-1/2 left-0 right-0" />
			<span className="relative inline-block px-3 dark:bg-bgPrimary bg-bgLightPrimary text-zinc-400 text-xs font-semibold">{messageDate}</span>
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
			className={`message-list-item ${isSearchMessage ? 'w-full' : ''} hover:dark:bg-[#2e3035] hover:bg-[#f7f7f7] relative message-container ${className || ''}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onContextMenu={onContextMenu}
			id={`msg-${messageId}`}
		>
			{children}
			{isHover && (
				<>
					{!showMessageHead && create_time && (
						<span className="absolute left-[24px] top-[4px] dark:text-zinc-400 text-colorTextLightMode text-[10px]">
							{convertTimeHour(create_time)}
						</span>
					)}
					{popup?.()}
				</>
			)}
		</div>
	);
};

export default MessageWithUser;
