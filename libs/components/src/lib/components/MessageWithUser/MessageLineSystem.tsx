import { channelsActions, messagesActions, pinMessageActions, threadsActions, useAppDispatch } from '@mezon/store';
import {
	ChannelMembersEntity,
	ETokenMessage,
	IExtendedMessage,
	IMessageWithUser,
	TypeMessage,
	convertTimeString,
	parseThreadInfo
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MentionUser, PlainText, useMessageContextMenu } from '../../components';

type MessageLineSystemProps = {
	message: IMessageWithUser;
	mode?: number;
	content?: IExtendedMessage;
	isSearchMessage?: boolean;
	isHideLinkOneImage?: boolean;
	isJumMessageEnabled: boolean;
	isTokenClickAble: boolean;
};

const MessageLineSystemComponent = ({ message, mode, content, isJumMessageEnabled, isSearchMessage, isTokenClickAble }: MessageLineSystemProps) => {
	return (
		<RenderContentSystem
			message={message}
			isTokenClickAble={isTokenClickAble}
			isJumMessageEnabled={isJumMessageEnabled}
			data={content as IExtendedMessage}
			mode={mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL}
			isSearchMessage={isSearchMessage}
		/>
	);
};

export const MessageLineSystem = MessageLineSystemComponent;

interface RenderContentProps {
	message: IMessageWithUser;
	data: IExtendedMessage;
	mode: number;
	isSearchMessage?: boolean;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
}

const RenderContentSystem = ({ message, data, mode, isSearchMessage, isJumMessageEnabled, isTokenClickAble }: RenderContentProps) => {
	const { t, mentions = [] } = data;
	const elements = useMemo(() => {
		return [...mentions.map((item) => ({ ...item, kindOf: ETokenMessage.MENTIONS }))].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));
	}, [mentions]);
	const { allUserIdsInChannel } = useMessageContextMenu();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const getIdMessageToJump = useCallback(
		(e: React.MouseEvent<HTMLDivElement | HTMLSpanElement>) => {
			e.stopPropagation();
			if (message?.references && message?.references[0]?.message_ref_id) {
				dispatch(
					messagesActions.jumpToMessage({
						clanId: message?.clan_id || '',
						messageId: message?.references[0]?.message_ref_id,
						channelId: message?.channel_id
					})
				);
			}
		},
		[dispatch, message?.channel_id, message?.clan_id, message?.references]
	);

	const isCustom = message.code === TypeMessage.CreateThread || message.code === TypeMessage.CreatePin;

	let lastindex = 0;
	const content = useMemo(() => {
		const formattedContent: React.ReactNode[] = [];

		elements.forEach((element, index) => {
			const s = element.s ?? 0;
			const e = element.e ?? 0;

			const contentInElement = t?.substring(s, e);

			if (lastindex < s) {
				formattedContent.push(<PlainText isSearchMessage={isSearchMessage} key={`plain-${lastindex}`} text={t?.slice(lastindex, s) ?? ''} />);
			}

			if (element.kindOf === ETokenMessage.MENTIONS && element.user_id) {
				let isValidMention = false;
				if (typeof allUserIdsInChannel?.[0] === 'string') {
					isValidMention = (allUserIdsInChannel as string[])?.includes(element.user_id) || contentInElement === '@here';
				} else {
					isValidMention =
						(allUserIdsInChannel as ChannelMembersEntity[])?.some((member) => member.id === element.user_id) ||
						contentInElement === '@here';
				}

				if (isValidMention) {
					formattedContent.push(
						<MentionUser
							isTokenClickAble={isTokenClickAble}
							isJumMessageEnabled={isJumMessageEnabled}
							key={`mentionUser-${index}-${s}-${contentInElement}-${element.user_id}-${element.role_id}`}
							tagUserName={contentInElement ?? ''}
							tagUserId={element.user_id}
							mode={mode}
						/>
					);
				} else {
					formattedContent.push(
						<PlainText
							isSearchMessage={false}
							key={`userDeleted-${index}-${s}-${contentInElement}-${element.user_id}-${element.role_id}`}
							text={contentInElement ?? ''}
						/>
					);
				}
			}

			lastindex = e;
		});

		if (!isCustom && t && lastindex < t?.length) {
			formattedContent.push(
				<PlainText isSearchMessage={isSearchMessage} key={`plain-${lastindex}-end-${message.id}`} text={t.slice(lastindex)} />
			);
		}

		return formattedContent;
	}, [elements, t, mode, allUserIdsInChannel]);

	const { threadLabel, threadId, threadContent } = useMemo(() => {
		if (message.code === TypeMessage.CreateThread && message.content?.t) {
			return parseThreadInfo(message.content.t);
		}
		return { threadLabel: '', threadId: '', threadContent: '' };
	}, [message.code, message.content?.t]);

	const handelJumpToChannel = async () => {
		if (threadId) {
			await dispatch(channelsActions.addThreadToChannels({ channelId: threadId, clanId: message?.clan_id as string }));
			navigate(`/chat/clans/${message?.clan_id}/channels/${threadId}`);
		}
	};

	const handleShowThreads = () => {
		dispatch(threadsActions.toggleThreadModal());
	};

	const handleShowPinMessage = async () => {
		await dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: message?.channel_id }));
		dispatch(pinMessageActions.togglePinModal());
	};

	return (
		<div className={`flex flex-row ${isCustom ? 'pl-7' : 'pl-5'} max-2xl:flex-col max-2xl:gap-0`}>
			<div
				style={
					isJumMessageEnabled
						? {
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								textOverflow: 'ellipsis'
							}
						: {
								whiteSpace: 'pre-line'
							}
				}
				className={` ${isJumMessageEnabled ? 'whitespace-pre-line gap-1 hover:text-[#060607] hover:dark:text-[#E6F3F5] text-[#4E5057] dark:text-[#B4BAC0] flex items-center  cursor-pointer' : 'text-[#4E5057] dark:text-[#DFDFE0]'}`}
			>
				{content}{' '}
				{message.code === TypeMessage.CreatePin && (
					<>
						pinned{' '}
						<span onClick={getIdMessageToJump} className="font-semibold cursor-pointer hover:underline">
							a message
						</span>{' '}
						to this channel. See{' '}
						<span onClick={handleShowPinMessage} className="font-semibold cursor-pointer hover:underline">
							all pinned
						</span>{' '}
						messages.
					</>
				)}
				{message.code === TypeMessage.CreateThread &&
					(threadId ? (
						<>
							started a thread:{' '}
							<span onClick={handelJumpToChannel} className="font-semibold cursor-pointer hover:underline">
								{threadLabel}
							</span>{' '}
							. See{' '}
							<span onClick={handleShowThreads} className="font-semibold cursor-pointer hover:underline">
								all threads
							</span>{' '}
						</>
					) : (
						<>{threadContent}</>
					))}
			</div>
			<div className="ml-1 max-2xl:ml-0 pt-[5px]  max-2xl:pt-0 dark:text-zinc-400 text-colorTextLightMode text-[10px] cursor-default">
				{convertTimeString(message?.create_time as string)}
			</div>
		</div>
	);
};
