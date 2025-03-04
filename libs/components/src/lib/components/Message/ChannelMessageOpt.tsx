import { useAuth, useChatReaction, useDirect, useEmojiConverted, useGifs, usePermissionChecker, useSendInviteMessage } from '@mezon/core';
import {
	CanvasAPIEntity,
	ChannelsEntity,
	createEditCanvas,
	gifsStickerEmojiActions,
	giveCoffeeActions,
	messagesActions,
	reactionActions,
	referencesActions,
	selectClickedOnTopicStatus,
	selectCurrentChannel,
	selectCurrentClanId,
	selectDefaultCanvasByChannelId,
	selectIsMessageChannelIdMatched,
	selectMessageByMessageId,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	AMOUNT_TOKEN,
	EEventAction,
	EMOJI_GIVE_COFFEE,
	EOverriddenPermission,
	IMessageWithUser,
	MenuBuilder,
	SubPanelName,
	TOKEN_TO_AMOUNT,
	TypeMessage,
	findParentByClass,
	formatMoney,
	isPublicChannel,
	useMenuBuilder,
	useMenuBuilderPlugin
} from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import clx from 'classnames';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactionPart from '../ContextMenu/ReactionPart';

type ChannelMessageOptProps = {
	message: IMessageWithUser;
	handleContextMenu: (event: React.MouseEvent<HTMLElement>, props: any) => void;
	isCombine: boolean;
	mode: number;
	isDifferentDay: boolean;
	hasPermission: boolean;
	isTopic: boolean;
};

type JsonObject = {
	ops: Array<{
		insert: string | { image: string };
		attributes?: { list: string };
	}>;
};

enum EMessageOpt {
	GIVE_A_COFFEE = 'giveacoffee',
	ADD_TO_NOTE = 'addtonote',
	REACT = 'react',
	REPLY = 'reply',
	THREAD = 'thread',
	OPTION = 'option'
}

const ChannelMessageOpt = ({
	message,
	handleContextMenu,
	isCombine,
	mode,
	isDifferentDay,
	hasPermission = true,
	isTopic
}: ChannelMessageOptProps) => {
	const currentChannel = useSelector(selectCurrentChannel);
	const refOpt = useRef<HTMLDivElement>(null);
	const [canManageThread] = usePermissionChecker([EOverriddenPermission.manageThread], currentChannel?.id ?? '');
	const isShowIconThread = !!(currentChannel && !Snowflake.isValid(currentChannel.parent_id ?? '') && canManageThread);
	const defaultCanvas = useAppSelector((state) => selectDefaultCanvasByChannelId(state, currentChannel?.channel_id ?? ''));
	const replyMenu = useMenuReplyMenuBuilder(message, hasPermission);
	const editMenu = useEditMenuBuilder(message);
	const reactMenu = useReactMenuBuilder(message);
	const threadMenu = useThreadMenuBuilder(message, isShowIconThread, hasPermission);
	const optionMenu = useOptionMenuBuilder(handleContextMenu);
	const addToNote = useAddToNoteBuilder(message, defaultCanvas, currentChannel, mode);
	const giveACoffeeMenu = useGiveACoffeeMenuBuilder(message);
	const checkMessageOnTopic = useAppSelector((state) => selectIsMessageChannelIdMatched(state, message?.channel_id ?? ''));
	const checkMessageHasTopic = useAppSelector((state) => selectIsMessageChannelIdMatched(state, message?.topic_id ?? ''));
	const doNotAllowCreateTopic = (isTopic && checkMessageOnTopic) || (isTopic && checkMessageHasTopic) || !hasPermission;
	const createTopicMenu = useTopicMenuBuilder(message, doNotAllowCreateTopic);
	const items = useMenuBuilder([createTopicMenu, reactMenu, replyMenu, editMenu, threadMenu, addToNote, giveACoffeeMenu, optionMenu]);
	const { createDirectMessageWithUser } = useDirect();
	return (
		<div
			className={`chooseForText z-[1] absolute h-8 p-0.5 rounded block ${!isCombine ? (message?.references ? '-top-5' : 'top-0') : '-top-5'} ${isDifferentDay ? 'top-4' : ''} right-6 w-fit`}
		>
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

function useTopicMenuBuilder(message: IMessageWithUser, doNotAllowCreateTopic: boolean) {
	const currentChannel = useSelector(selectCurrentChannel);
	const realTimeMessage = useAppSelector((state) => selectMessageByMessageId(state, currentChannel?.channel_id, message?.id || ''));
	const dispatch = useAppDispatch();
	const clanId = useSelector(selectCurrentClanId);
	const notAllowedType =
		message?.code !== TypeMessage.CreateThread &&
		message?.code !== TypeMessage.CreatePin &&
		message?.code !== TypeMessage.MessageBuzz &&
		message?.code !== TypeMessage.AuditLog &&
		message?.code !== TypeMessage.Welcome;

	const setIsShowCreateTopic = useCallback(
		(isShowCreateTopic: boolean, channelId?: string) => {
			dispatch(topicsActions.setIsShowCreateTopic(isShowCreateTopic));
			dispatch(
				threadsActions.setIsShowCreateThread({ channelId: channelId ? channelId : (currentChannel?.id as string), isShowCreateThread: false })
			);
		},
		[currentChannel?.id, dispatch]
	);

	const setCurrentTopicInitMessage = useCallback(
		(value: IMessageWithUser | null) => {
			dispatch(topicsActions.setCurrentTopicInitMessage(value));
		},
		[dispatch]
	);

	const handleCreateTopic = useCallback(() => {
		setIsShowCreateTopic(true);
		dispatch(topicsActions.setOpenTopicMessageState(true));
		setCurrentTopicInitMessage(realTimeMessage);
		dispatch(topicsActions.setCurrentTopicId(''));
		dispatch(topicsActions.setFirstMessageOfCurrentTopic(message));
	}, [dispatch, message, realTimeMessage, setIsShowCreateTopic, setCurrentTopicInitMessage]);

	const menuPlugin = useMemo(() => {
		const plugin = {
			setup: (builder: MenuBuilder) => {
				builder.when(
					clanId && clanId !== '0' && realTimeMessage?.code !== TypeMessage.Topic && !doNotAllowCreateTopic && notAllowedType,
					(builder: MenuBuilder) => {
						builder.addMenuItem(
							'topic',
							'topic',
							handleCreateTopic,
							<Icons.TopicIcon2 className="w-5 h-5 dark:hover:text-white hover:text-black dark:text-textSecondary text-colorTextLightMode" />
						);
					}
				);
			}
		};
		return plugin;
	}, [doNotAllowCreateTopic, clanId, handleCreateTopic, realTimeMessage?.code]);

	return menuPlugin;
}

interface RecentEmojiProps {
	message: IMessageWithUser;
}

const RecentEmoji: React.FC<RecentEmojiProps> = ({ message }) => {
	const emojiConverted = useEmojiConverted();

	const firstThreeElements = useMemo(() => {
		return emojiConverted.slice(0, 3);
	}, [emojiConverted]);

	return (
		<div className="flex items-center">
			<ReactionPart emojiList={firstThreeElements} activeMode={undefined} messageId={message.id} isOption={true} />
			{firstThreeElements.length > 0 && (
				<span className="opacity-50 px-1 ml-2 border-l dark:border-borderDividerLight border-borderDivider h-6 inline-flex "></span>
			)}
		</div>
	);
};

function useGiveACoffeeMenuBuilder(message: IMessageWithUser) {
	const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const { reactionMessageDispatch } = useChatReaction();
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const channel = useSelector(selectCurrentChannel);
	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();

	const sendNotificationMessage = useCallback(
		async (userId: string) => {
			const response = await createDirectMessageWithUser(userId);
			if (response.channel_id) {
				const channelMode = ChannelStreamMode.STREAM_MODE_DM;
				sendInviteMessage(
					`Tokens sent: ${formatMoney(TOKEN_TO_AMOUNT.ONE_THOUNSAND * 10)}₫ | Give coffee action`,
					response.channel_id,
					channelMode,
					TypeMessage.SendToken
				);
			}
		},
		[createDirectMessageWithUser, sendInviteMessage]
	);

	const handleItemClick = useCallback(async () => {
		try {
			await dispatch(
				giveCoffeeActions.updateGiveCoffee({
					channel_id: message.channel_id,
					clan_id: message.clan_id,
					message_ref_id: message.id,
					receiver_id: message.sender_id,
					sender_id: userId,
					token_count: AMOUNT_TOKEN.TEN_TOKENS
				})
			).unwrap();

			await reactionMessageDispatch(
				'',
				message.id ?? '',
				EMOJI_GIVE_COFFEE.emoji_id,
				EMOJI_GIVE_COFFEE.emoji,
				1,
				message?.sender_id ?? '',
				false,
				isPublicChannel(channel),
				isFocusTopicBox,
				message?.channel_id
			);

			await sendNotificationMessage(message.sender_id || '');
		} catch (error) {
			console.error('Failed to give cofffee message', error);
		}
	}, [isFocusTopicBox, channel]);

	return useMenuBuilderPlugin((builder) => {
		builder.when(userId !== message.sender_id && message.sender_id !== NX_CHAT_APP_ANNONYMOUS_USER_ID, (builder) => {
			builder.addMenuItem('giveacoffee', 'Give a coffee', handleItemClick, <Icons.DollarIcon defaultSize="w-5 h-5" />);
		});
	});
}

function useAddToNoteBuilder(message: IMessageWithUser, defaultCanvas: CanvasAPIEntity | null, currentChannel: ChannelsEntity | null, mode: number) {
	const dispatch = useAppDispatch();
	const { userId } = useAuth();

	const handleItemClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.currentTarget.classList.add('animate-wiggle');
			if (!message) return;

			const createCanvasBody = (content?: string, id?: string) => ({
				channel_id: message.channel_id,
				clan_id: message.clan_id,
				content,
				is_default: true,
				...(id && { id }),
				title: defaultCanvas?.title || 'Note',
				status: defaultCanvas ? 0 : EEventAction.CREATED
			});

			const insertImageToJson = (jsonObject: JsonObject, imageUrl?: string) => {
				if (!imageUrl) return;
				const imageInsert = { insert: { image: imageUrl } };
				jsonObject.ops.push(imageInsert);
				jsonObject.ops.push({ attributes: { list: 'ordered' }, insert: '\n' });
			};

			const updateJsonWithInsert = (jsonObject: JsonObject, newInsert: string) => {
				jsonObject.ops.push({ insert: newInsert });
				jsonObject.ops.push({ attributes: { list: 'ordered' }, insert: '\n' });
			};

			const isContentExists = (jsonObject: JsonObject, newInsert: string) => {
				return jsonObject.ops.some((op) => op.insert === newInsert);
			};

			const isImageExists = (jsonObject: JsonObject, imageUrl?: string) => {
				return jsonObject.ops.some((op) => {
					return typeof op.insert === 'object' && op.insert !== null && op.insert.image === imageUrl;
				});
			};

			let formattedString;

			if (!defaultCanvas || (defaultCanvas && !defaultCanvas.content)) {
				const messageContent = message.content.t;
				const jsonObject: JsonObject = { ops: [] };
				if (message.attachments?.length) {
					const newImageUrl = message.attachments[0].url;
					insertImageToJson(jsonObject, newImageUrl);
				}
				if (messageContent) {
					jsonObject.ops.push({ insert: messageContent });
					jsonObject.ops.push({ attributes: { list: 'ordered' }, insert: '\n' });
				}
				formattedString = JSON.stringify(jsonObject);
			} else {
				const jsonObject: JsonObject = safeJSONParse(defaultCanvas.content as string);

				if (message.attachments?.length) {
					const newImageUrl = message.attachments[0].url;
					if (!isImageExists(jsonObject, newImageUrl)) {
						insertImageToJson(jsonObject, newImageUrl);
					} else {
						return;
					}
				} else {
					const newInsert = message.content.t;
					if (newInsert && !isContentExists(jsonObject, newInsert)) {
						updateJsonWithInsert(jsonObject, newInsert);
					} else {
						return;
					}
				}

				formattedString = JSON.stringify(jsonObject);
			}

			dispatch(createEditCanvas(createCanvasBody(formattedString, defaultCanvas?.id)));
		},
		[dispatch, message, defaultCanvas]
	);

	return useMenuBuilderPlugin((builder) => {
		builder.when(
			userId === currentChannel?.creator_id && mode !== ChannelStreamMode.STREAM_MODE_DM && mode !== ChannelStreamMode.STREAM_MODE_GROUP,
			(builder) => {
				builder.addMenuItem('addtonote', 'Add To Note', handleItemClick, <Icons.CanvasIcon defaultSize="w-5 h-5" />);
			}
		);
	});
}

// Menu items plugins
// maybe should be moved to separate files
function useMenuReplyMenuBuilder(message: IMessageWithUser, hasPermission: boolean) {
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const messageId = message.id;

	const handleItemClick = useCallback(() => {
		dispatch(
			referencesActions.setDataReferences({
				channelId: message.topic_id && message.topic_id !== '0' ? message.topic_id : message.channel_id,
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
					channel_id: message.topic_id && message.topic_id !== '0' ? message.topic_id : message.channel_id,
					mode: message.mode ?? 0,
					channel_label: message.channel_label
				}
			})
		);
		dispatch(messagesActions.setIdMessageToJump(null));
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [dispatch, messageId]);

	return useMenuBuilderPlugin((builder) => {
		builder.when(userId !== message.sender_id && hasPermission, (builder) => {
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
					draftAttachment: message.attachments ?? [],
					draftTopicId: message.content.tp as string
				}
			})
		);
		dispatch(messagesActions.setIdMessageToJump(null));
	}, [dispatch, message, messageId]);

	return useMenuBuilderPlugin((builder) => {
		builder.when(
			userId === message.sender_id && !message?.content?.callLog?.callLogType && !(message.code === TypeMessage.SendToken),
			(builder) => {
				builder.addMenuItem(
					'edit',
					'edit',
					handleItemClick,
					<Icons.PenEdit className={`w-5 h-5 dark:hover:text-white hover:text-black dark:text-textSecondary text-colorTextLightMode`} />
				);
			}
		);
	});
}

function useReactMenuBuilder(message: IMessageWithUser) {
	const dispatch = useAppDispatch();
	const { setClickedTrendingGif, setButtonArrowBack } = useGifs();

	const handleItemClick = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			setClickedTrendingGif(false);
			setButtonArrowBack(false);
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

function useThreadMenuBuilder(message: IMessageWithUser, isShowIconThread: boolean, hasPermission: boolean) {
	const [thread, setThread] = useState(false);
	const dispatch = useAppDispatch();

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: message.channel_id as string, isShowCreateThread }));
			dispatch(topicsActions.setIsShowCreateTopic(false));
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
		builder.when(isShowIconThread && hasPermission, (builder) => {
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
