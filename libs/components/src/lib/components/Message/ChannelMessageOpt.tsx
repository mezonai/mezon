import { useAuth, useChatReaction, useDirect, useEmojiConverted, useGifs, usePermissionChecker, useSendInviteMessage } from '@mezon/core';
import {
	getStore,
	gifsStickerEmojiActions,
	giveCoffeeActions,
	messagesActions,
	reactionActions,
	referencesActions,
	selectClickedOnTopicStatus,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentChannelParentId,
	selectCurrentChannelType,
	selectCurrentClanId,
	selectIsMessageChannelIdMatched,
	selectMessageByMessageId,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IMessageWithUser, MenuBuilder } from '@mezon/utils';
import {
	EMOJI_GIVE_COFFEE,
	EOverriddenPermission,
	SYSTEM_NAME,
	SYSTEM_SENDER_ID,
	SubPanelName,
	TOKEN_TO_AMOUNT,
	TypeMessage,
	findParentByClass,
	formatMoney,
	generateE2eId,
	isPublicChannel,
	useMenuBuilder,
	useMenuBuilderPlugin
} from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import clx from 'classnames';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
	canSendMessage: boolean;
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
	isTopic,
	canSendMessage
}: ChannelMessageOptProps) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const isAppChannel = currentChannelType === ChannelType.CHANNEL_TYPE_APP;
	const refOpt = useRef<HTMLDivElement>(null);
	const [canManageThread] = usePermissionChecker([EOverriddenPermission.manageThread], currentChannelId ?? '');
	const isShowIconThread = !!(currentChannelId && !Snowflake.isValid(currentChannelParentId ?? '') && canManageThread);
	const replyMenu = useReplyMenuBuilder(message, hasPermission);
	const editMenu = useEditMenuBuilder(message);
	const reactMenu = useReactMenuBuilder(message);
	const threadMenu = useThreadMenuBuilder(message, isShowIconThread, hasPermission, isAppChannel);
	const optionMenu = useOptionMenuBuilder(handleContextMenu);
	const giveACoffeeMenu = useGiveACoffeeMenuBuilder(message, isTopic);
	const checkMessageOnTopic = useAppSelector((state) => selectIsMessageChannelIdMatched(state, message?.channel_id ?? ''));
	const checkMessageHasTopic = useAppSelector((state) => selectIsMessageChannelIdMatched(state, message?.topic_id ?? ''));
	const doNotAllowCreateTopic = (isTopic && checkMessageOnTopic) || (isTopic && checkMessageHasTopic) || !hasPermission || !canSendMessage;
	const createTopicMenu = useTopicMenuBuilder(message, doNotAllowCreateTopic);
	const items = useMenuBuilder([createTopicMenu, reactMenu, replyMenu, editMenu, threadMenu, giveACoffeeMenu, optionMenu]);

	if (message?.isError) {
		return null;
	}
	return (
		<div
			className={`chooseForText z-[1] absolute min-h-[34px] p-0.5 bg-theme-contexify rounded-lg block ${!isCombine ? (message?.references ? '-top-5' : 'top-0') : '-top-5'} ${isDifferentDay ? '-top-12 mt-1' : ''} right-6 w-fit`}
			data-e2e={generateE2eId('chat.hover_message_actions')}
		>
			<div className="flex justify-between bg-theme-contexify rounded select-none">
				<div className="w-fit h-full flex items-center justify-between" ref={refOpt}>
					<RecentEmoji message={message} isTopic={isTopic} />
					{items
						.filter((item) => {
							if (currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING && item.id === EMessageOpt.THREAD) {
								return false;
							}
							if (message?.content?.tp && item.id === 'edit') {
								return false;
							}
							return true;
						})
						.map((item, index) => (
							<button
								title={item.label}
								key={index}
								onClick={(e) => (item?.handleItemClick ? item?.handleItemClick(e) : undefined)}
								className={clx(
									'h-full p-1 rounded-lg cursor-pointer popup-btn text-theme-primary text-theme-primary-hover bg-item-hover',
									item.classNames
								)}
								data-e2e={generateE2eId('chat.hover_message_actions.button.base')}
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
	const { t } = useTranslation('contextMenu');
	const currentChannelId = useSelector(selectCurrentChannelId);
	const realTimeMessage = useAppSelector((state) => selectMessageByMessageId(state, currentChannelId, message?.id || ''));
	const dispatch = useAppDispatch();
	const clanId = useSelector(selectCurrentClanId);
	const notAllowedType =
		message?.code !== TypeMessage.CreateThread &&
		message?.code !== TypeMessage.CreatePin &&
		message?.code !== TypeMessage.MessageBuzz &&
		message?.code !== TypeMessage.AuditLog &&
		message?.code !== TypeMessage.Welcome &&
		message?.code !== TypeMessage.UpcomingEvent;

	const setIsShowCreateTopic = useCallback(
		(isShowCreateTopic: boolean, channelId?: string) => {
			dispatch(topicsActions.setIsShowCreateTopic(isShowCreateTopic));
			dispatch(
				threadsActions.setIsShowCreateThread({ channelId: channelId ? channelId : (currentChannelId as string), isShowCreateThread: false })
			);
		},
		[currentChannelId, dispatch]
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
		dispatch(topicsActions.setInitTopicMessageId(message.id));
	}, [dispatch, message, realTimeMessage, setIsShowCreateTopic, setCurrentTopicInitMessage]);

	const menuPlugin = useMemo(() => {
		const plugin = {
			setup: (builder: MenuBuilder) => {
				builder.when(
					clanId && clanId !== '0' && realTimeMessage?.code !== TypeMessage.Topic && !doNotAllowCreateTopic && notAllowedType,
					(builder: MenuBuilder) => {
						builder.addMenuItem('topic', t('topic'), handleCreateTopic, <Icons.TopicIconOption className="w-5 h-5 " />);
					}
				);
			}
		};
		return plugin;
	}, [doNotAllowCreateTopic, clanId, handleCreateTopic, realTimeMessage?.code, notAllowedType]);

	return menuPlugin;
}

interface RecentEmojiProps {
	message: IMessageWithUser;
	isTopic: boolean;
}

const RecentEmoji: React.FC<RecentEmojiProps> = ({ message, isTopic }) => {
	const emojiConverted = useEmojiConverted();

	const firstThreeElements = useMemo(() => {
		return emojiConverted.slice(0, 3);
	}, [emojiConverted]);

	return (
		<div className="flex items-center">
			<ReactionPart emojiList={firstThreeElements} messageId={message.id} isOption={true} message={message} isTopic={isTopic} />
			{firstThreeElements.length > 0 && (
				<span className="opacity-50 px-1 ml-2 border-l dark:border-borderDividerLight border-borderDivider h-6 inline-flex "></span>
			)}
		</div>
	);
};

function useGiveACoffeeMenuBuilder(message: IMessageWithUser, isTopic: boolean) {
	const { t } = useTranslation(['token', 'contextMenu']);
	const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const { reactionMessageDispatch } = useChatReaction();
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();

	const sendNotificationMessage = useCallback(
		async (userId: string, username?: string, avatar?: string, display_names?: string) => {
			const response = await createDirectMessageWithUser(userId, display_names, username, avatar);
			if (response.channel_id) {
				const channelMode = ChannelStreamMode.STREAM_MODE_DM;
				sendInviteMessage(
					`${t('tokensSent')} ${formatMoney(TOKEN_TO_AMOUNT.ONE_THOUNSAND * 10)}₫ | ${t('giveCoffeeAction')}`,
					response.channel_id,
					channelMode,
					TypeMessage.SendToken
				);
			}
		},
		[createDirectMessageWithUser, sendInviteMessage, t]
	);

	const handleItemClick = useCallback(async () => {
		const store = getStore();
		const currentChannel = selectCurrentChannel(store.getState());
		try {
			const checkSendCoffee = await dispatch(
				giveCoffeeActions.updateGiveCoffee({
					channel_id: message.channel_id,
					clan_id: message.clan_id ?? '',
					message_ref_id: message.id,
					receiver_id: message.sender_id,
					sender_id: userId
				})
			).unwrap();
			if (checkSendCoffee === true) {
				await reactionMessageDispatch({
					id: EMOJI_GIVE_COFFEE.emoji_id,
					messageId: message.id ?? '',
					emoji_id: EMOJI_GIVE_COFFEE.emoji_id,
					emoji: EMOJI_GIVE_COFFEE.emoji,
					count: 1,
					message_sender_id: message?.sender_id ?? '',
					action_delete: false,
					is_public: isPublicChannel(currentChannel),
					clanId: message.clan_id ?? '',
					channelId: isTopic ? currentChannel?.id || '' : (message?.channel_id ?? ''),
					isFocusTopicBox,
					channelIdOnMessage: message?.channel_id
				});

				await sendNotificationMessage(
					message.sender_id || '',
					message.user?.username,
					message.avatar,
					message.user?.name || message.user?.username
				);
			}
		} catch (error) {
			console.error('Failed to give cofffee message', error);
		}
	}, [isFocusTopicBox]);

	return useMenuBuilderPlugin((builder) => {
		builder.when(
			userId !== message?.sender_id &&
				message?.sender_id !== NX_CHAT_APP_ANNONYMOUS_USER_ID &&
				message?.sender_id !== SYSTEM_SENDER_ID &&
				message.username !== SYSTEM_NAME,
			(builder) => {
				builder.addMenuItem(
					'giveacoffee',
					t('giveACoffee', { ns: 'contextMenu' }),
					handleItemClick,
					<Icons.DollarIcon defaultSize="w-5 h-5" />
				);
			}
		);
	});
}

// Menu items plugins
// maybe should be moved to separate files
function useReplyMenuBuilder(message: IMessageWithUser, hasPermission: boolean) {
	const { t } = useTranslation('contextMenu');
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
			builder.addMenuItem('reply', t('reply'), handleItemClick, <Icons.Reply />, null, false, false, 'rotate-180');
		});
	});
}

function useEditMenuBuilder(message: IMessageWithUser) {
	const { t } = useTranslation('contextMenu');
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const messageId = message.id;
	const isForwardedMessage = Boolean(message?.content?.fwd);

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
			userId === message.sender_id &&
				!message?.content?.callLog?.callLogType &&
				!(message.code === TypeMessage.SendToken) &&
				!isForwardedMessage,
			(builder) => {
				builder.addMenuItem('edit', t('editMessage'), handleItemClick, <Icons.PenEdit className={`w-5 h-5`} />);
			}
		);
	});
}

function useReactMenuBuilder(message: IMessageWithUser) {
	const { t } = useTranslation('contextMenu');
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
		builder.addMenuItem('react', t('reactions'), handleItemClick, <Icons.Smile defaultSize="w-5 h-5" />);
	});
}

function useThreadMenuBuilder(message: IMessageWithUser, isShowIconThread: boolean, hasPermission: boolean, isAppChannel: boolean) {
	const { t } = useTranslation('contextMenu');
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
		setValueThread({ ...message, references: [] });
	}, [dispatch, message, setIsShowCreateThread, setOpenThreadMessageState, setThread, thread, setValueThread]);

	return useMenuBuilderPlugin((builder) => {
		builder.when(isShowIconThread && hasPermission && !isAppChannel, (builder) => {
			builder.addMenuItem('thread', t('createThread'), handleItemClick, <Icons.ThreadIcon isWhite={thread} />);
		});
	});
}

function useOptionMenuBuilder(handleContextMenu: any) {
	const { t } = useTranslation('contextMenu');

	const useHandleClickOption = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			const target = event.target as HTMLElement;
			const btn = target.classList.contains('popup-btn') ? target : findParentByClass(target, 'popup-btn');
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
		builder.addMenuItem(
			'option',
			t('option'),
			useHandleClickOption,
			<Icons.ThreeDot defaultSize={'w-5 h-5 text-theme-primary text-theme-primary-hover'} />
		);
	});
}
