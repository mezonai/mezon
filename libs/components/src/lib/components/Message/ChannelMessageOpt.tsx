import { useAuth, useEmojiSuggestion } from '@mezon/core';
import {
	gifsStickerEmojiActions,
	giveCoffeeActions,
	messagesActions,
	reactionActions,
	referencesActions,
	selectCurrentChannel,
	selectTheme,
	threadsActions,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IMessageWithUser, SubPanelName, findParentByClass, useMenuBuilder, useMenuBuilderPlugin } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import clx from 'classnames';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactionPart from '../ContextMenu/ReactionPart';

type ChannelMessageOptProps = {
	message: IMessageWithUser;
	handleContextMenu: (event: React.MouseEvent<HTMLElement>, props: any) => void;
	isCombine: boolean;
};

enum EMessageOpt {
	GIVE_A_COFFEE = 'giveacoffee',
	REACT = 'react',
	REPLY = 'reply',
	THREAD = 'thread',
	OPTION = 'option'
}

const ChannelMessageOpt = ({ message, handleContextMenu, isCombine }: ChannelMessageOptProps) => {
	const currentChannel = useSelector(selectCurrentChannel);
	const refOpt = useRef<HTMLDivElement>(null);
	const checkHiddenIconThread = !currentChannel || Snowflake.isValid(currentChannel.parrent_id ?? '');
	const replyMenu = useMenuReplyMenuBuilder(message);
	const editMenu = useEditMenuBuilder(message);
	const reactMenu = useReactMenuBuilder(message);
	const threadMenu = useThreadMenuBuilder(message, checkHiddenIconThread);
	const optionMenu = useOptionMenuBuilder(handleContextMenu);
	const giveACoffeeMenu = useGiveACoffeeMenuBuilder(message);
	const items = useMenuBuilder([giveACoffeeMenu, reactMenu, replyMenu, editMenu, threadMenu, optionMenu]);

	return (
		<div className={`chooseForText z-[1] absolute h-8 p-0.5 rounded block ${!isCombine ? 'top-0' : '-top-7'}  right-6 w-fit`}>
			<div className="flex justify-between dark:bg-bgDarkPopover bg-bgLightMode border border-bgSecondary rounded">
				<div className="w-fit h-full flex items-center justify-between" ref={refOpt}>
					<RecentEmoji message={message} />
					{items
						.filter((item) => {
							return currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING || item.id !== EMessageOpt.THREAD;
						})
						.map((item, index) => (
							<button
								key={index}
								onClick={(e) => (item?.handleItemClick ? item?.handleItemClick(e) : undefined)}
								className={clx('h-full p-1 cursor-pointer popup-btn', item.classNames)}
							>
								{item.icon}
							</button>
						))}
				</div>
			</div>
		</div>
	);
};

export default memo(ChannelMessageOpt);

interface RecentEmojiProps {
	message: IMessageWithUser;
}

const RecentEmoji: React.FC<RecentEmojiProps> = ({ message }) => {
	const { emojiConverted } = useEmojiSuggestion();

	const emojiRecentData = useMemo(() => {
		return localStorage.getItem('recentEmojis');
	}, [localStorage.getItem('recentEmojis')]);

	const firstThreeElements = useMemo(() => {
		return emojiConverted.slice(0, 3);
	}, [emojiConverted, emojiRecentData]);

	return (
		<div className="flex items-center">
			<ReactionPart emojiList={firstThreeElements} activeMode={undefined} messageId={message.id} isOption={true} />
			{firstThreeElements.length > 0 && (
				<span className="opacity-50 px-1 ml-2 border-l dark:border-borderDividerLight border-borderDivider h-6 inline-flex"></span>
			)}
		</div>
	);
};

function useGiveACoffeeMenuBuilder(message: IMessageWithUser) {
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const appearanceTheme = useSelector(selectTheme);

	const handleItemClick = useCallback(async () => {
		try {
			dispatch(
				giveCoffeeActions.updateGiveCoffee({
					channel_id: message.channel_id,
					clan_id: message.clan_id,
					message_ref_id: message.id,
					receiver_id: message.sender_id,
					sender_id: userId,
					token_count: 1
				})
			);
		} catch (error) {
			console.error('Failed to give cofffee message', error);
		}
	}, []);

	return useMenuBuilderPlugin((builder) => {
		builder.when(userId !== message.sender_id, (builder) => {
			builder.addMenuItem(
				'giveacoffee',
				'Give a coffee',
				handleItemClick,
				<Icons.DollarIcon className="w-5 h-5" fill={`${appearanceTheme === 'dark' ? '#B5BAC1' : '#060607'}`} />
			);
		});
	});
}

// Menu items plugins
// maybe should be moved to separate files
function useMenuReplyMenuBuilder(message: IMessageWithUser) {
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const messageId = message.id;

	const handleItemClick = useCallback(() => {
		dispatch(
			referencesActions.setDataReferences({
				channelId: message.channel_id,
				dataReferences: {
					message_ref_id: message.id,
					ref_type: 0,
					message_sender_id: message.sender_id,
					content: JSON.stringify(message.content),
					message_sender_username: message.username,
					mesages_sender_avatar: message.clan_avatar ? message.clan_avatar : message.avatar,
					message_sender_clan_nick: message.clan_nick,
					message_sender_display_name: message.display_name,
					has_attachment: (message.attachments && message.attachments?.length > 0) ?? false,
					channel_id: message.channel_id ?? '',
					mode: message.mode ?? 0,
					channel_label: message.channel_label
				}
			})
		);
		dispatch(messagesActions.setIdMessageToJump(''));
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [dispatch, messageId]);

	return useMenuBuilderPlugin((builder) => {
		builder.when(userId !== message.sender_id, (builder) => {
			builder.addMenuItem('reply', 'reply', handleItemClick, <Icons.Reply />, null, false, false, 'rotate-180');
		});
	});
}

function useEditMenuBuilder(message: IMessageWithUser) {
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const messageId = message.id;

	const handleItemClick = useCallback(() => {
		dispatch(reactionActions.setReactionRightState(false));
		dispatch(referencesActions.setOpenEditMessageState(true));
		dispatch(referencesActions.setIdReferenceMessageEdit(messageId));
		dispatch(
			messagesActions.setChannelDraftMessage({
				channelId: message.channel_id,
				channelDraftMessage: {
					message_id: messageId,
					draftContent: message.content,
					draftMention: message.mentions ?? [],
					draftAttachment: message.attachments ?? []
				}
			})
		);
		dispatch(messagesActions.setIdMessageToJump(''));
	}, [dispatch, message, messageId]);

	return useMenuBuilderPlugin((builder) => {
		builder.when(userId === message.sender_id, (builder) => {
			builder.addMenuItem(
				'edit',
				'edit',
				handleItemClick,
				<Icons.PenEdit className={`w-5 h-5 dark:hover:text-white hover:text-black dark:text-textSecondary text-colorTextLightMode`} />
			);
		});
	});
}

function useReactMenuBuilder(message: IMessageWithUser) {
	const dispatch = useAppDispatch();

	const handleItemClick = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			dispatch(referencesActions.setIdReferenceMessageReaction(message.id));
			dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.EMOJI_REACTION_RIGHT));
			event.stopPropagation();
			const rect = (event.target as HTMLElement).getBoundingClientRect();
			const distanceToBottom = window.innerHeight - rect.bottom;

			if (distanceToBottom > 550) {
				dispatch(reactionActions.setReactionTopState(true));
			} else {
				dispatch(reactionActions.setReactionTopState(false));
			}
		},
		[dispatch]
	);

	return useMenuBuilderPlugin((builder) => {
		builder.addMenuItem('react', 'react', handleItemClick, <Icons.Smile defaultSize="w-5 h-5" />);
	});
}

function useThreadMenuBuilder(message: IMessageWithUser, isThread: boolean) {
	const [thread, setThread] = useState(false);
	const dispatch = useAppDispatch();

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: message.channel_id as string, isShowCreateThread }));
		},
		[message.channel_id, dispatch]
	);

	const setOpenThreadMessageState = useCallback(
		(value: boolean) => {
			dispatch(threadsActions.setOpenThreadMessageState(value));
		},
		[dispatch]
	);

	const setValueThread = useCallback(
		(value: IMessageWithUser | null) => {
			dispatch(threadsActions.setValueThread(value));
		},
		[dispatch]
	);

	const handleItemClick = useCallback(() => {
		setThread(!thread);
		setIsShowCreateThread(true);
		setOpenThreadMessageState(true);
		dispatch(threadsActions.setOpenThreadMessageState(true));
		setValueThread(message);
	}, [dispatch, message, setIsShowCreateThread, setOpenThreadMessageState, setThread, thread, setValueThread]);

	return useMenuBuilderPlugin((builder) => {
		builder.when(!isThread, (builder) => {
			builder.addMenuItem('thread', 'thread', handleItemClick, <Icons.ThreadIcon isWhite={thread} />);
		});
	});
}

function useOptionMenuBuilder(handleContextMenu: any) {
	const useHandleClickOption = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			const target = event.target as HTMLElement;
			const btn = findParentByClass(target, 'popup-btn');
			const btnX = btn?.getBoundingClientRect()?.left ?? 0;
			const btnY = btn?.getBoundingClientRect()?.top ?? 0;
			const y = btnY;
			const x = btnX - 220;
			const position = { x, y };
			const props = { position };
			handleContextMenu(event, props);
		},
		[handleContextMenu]
	);

	return useMenuBuilderPlugin((builder) => {
		builder.addMenuItem('option', 'option', useHandleClickOption, <Icons.ThreeDot />);
	});
}
