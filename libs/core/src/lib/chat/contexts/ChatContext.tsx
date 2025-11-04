/* eslint-disable react-hooks/exhaustive-deps */
import { captureSentryError } from '@mezon/logger';
import type { ActivitiesEntity, AttachmentEntity, ChannelsEntity, RootState, ThreadsEntity } from '@mezon/store';
import {
	DMCallActions,
	EMarkAsReadType,
	accountActions,
	acitvitiesActions,
	appActions,
	attachmentActions,
	audioCallActions,
	canvasAPIActions,
	categoriesActions,
	channelAppSlice,
	channelMembers,
	channelMembersActions,
	channelMetaActions,
	channelsActions,
	channelsSlice,
	clansActions,
	clansSlice,
	decreaseChannelBadgeCount,
	defaultNotificationCategoryActions,
	directActions,
	directMetaActions,
	directSlice,
	e2eeActions,
	emojiRecentActions,
	emojiSuggestionActions,
	eventManagementActions,
	friendsActions,
	getStore,
	getStoreAsync,
	giveCoffeeActions,
	listChannelRenderAction,
	listChannelsByUserActions,
	mapMessageChannelToEntityAction,
	mapNotificationToEntity,
	mapReactionToEntity,
	messagesActions,
	notificationActions,
	notificationSettingActions,
	overriddenPoliciesActions,
	permissionRoleChannelActions,
	pinMessageActions,
	policiesActions,
	referencesActions,
	resetChannelBadgeCount,
	rolesClanActions,
	selectAllChannels,
	selectAllTextChannel,
	selectAllThreads,
	selectAllUserClans,
	selectChannelById,
	selectChannelByIdAndClanId,
	selectChannelThreads,
	selectChannelsByClanId,
	selectClanMemberByClanId,
	selectClanView,
	selectClansLoadingStatus,
	selectClickedOnTopicStatus,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentStreamInfo,
	selectCurrentTopicId,
	selectCurrentUserId,
	selectDataReferences,
	selectDefaultChannelIdByClanId,
	selectDirectById,
	selectDmGroupCurrentId,
	selectIsInCall,
	selectLastMessageByChannelId,
	selectLastSentMessageStateByChannelId,
	selectLatestMessageId,
	selectLoadingStatus,
	selectStreamMembersByChannelId,
	selectUserCallId,
	selectVoiceInfo,
	selectWelcomeChannelByClanId,
	statusActions,
	stickerSettingActions,
	threadsActions,
	toastActions,
	topicsActions,
	updateChannelActions,
	useAppDispatch,
	userChannelsActions,
	usersClanActions,
	usersStreamActions,
	videoStreamActions,
	voiceActions,
	walletActions,
	webhookActions
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { EOverriddenPermission, IMessageSendPayload, IUserProfileActivity, NotificationCategory } from '@mezon/utils';
import {
	ADD_ROLE_CHANNEL_STATUS,
	AMOUNT_TOKEN,
	ChannelStatusEnum,
	EEventAction,
	EEventStatus,
	EMuteState,
	ERepeatType,
	EUserStatus,
	IMessageTypeCallLog,
	ITEM_TYPE,
	NotificationCode,
	TOKEN_TO_AMOUNT,
	ThreadStatus,
	TypeMessage,
	addBigInt,
	checkIsThread,
	isBackgroundModeActive,
	isLinuxDesktop,
	subBigInt
} from '@mezon/utils';
import type { Update } from '@reduxjs/toolkit';
import isElectron from 'is-electron';
import type {
	AddClanUserEvent,
	AddFriend,
	BannedUserEvent,
	BlockFriend,
	CategoryEvent,
	ChannelCreatedEvent,
	ChannelDeletedEvent,
	ChannelMessage,
	ChannelPresenceEvent,
	ChannelUpdatedEvent,
	ClanDeletedEvent,
	ClanProfileUpdatedEvent,
	ClanUpdatedEvent,
	CustomStatusEvent,
	EventEmoji,
	JoinChannelAppData,
	LastPinMessageEvent,
	LastSeenMessageEvent,
	ListActivity,
	MarkAsRead,
	MessageButtonClicked,
	MessageTypingEvent,
	PermissionChangedEvent,
	PermissionSet,
	RoleEvent,
	Socket,
	StatusPresenceEvent,
	StickerCreateEvent,
	StickerDeleteEvent,
	StickerUpdateEvent,
	StreamingJoinedEvent,
	StreamingLeavedEvent,
	UnblockFriend,
	UnmuteEvent,
	UnpinMessageEvent,
	UserChannelAddedEvent,
	UserChannelRemovedEvent,
	UserClanRemovedEvent,
	UserProfileUpdatedEvent,
	UserStatusEvent,
	VoiceEndedEvent,
	VoiceJoinedEvent,
	VoiceLeavedEvent,
	WebrtcSignalingFwd
} from 'mezon-js';
import { ChannelStreamMode, ChannelType, WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import type { ApiCreateEventRequest, ApiGiveCoffeeEvent, ApiMessageReaction, ApiNotification } from 'mezon-js/api.gen';
import type {
	ApiChannelMessageHeader,
	ApiClanEmoji,
	ApiNotificationUserChannel,
	ApiPermissionUpdate,
	ApiTokenSentEvent,
	ApiUpdateCategoryDescRequest,
	ApiWebhook
} from 'mezon-js/dist/api.gen';
import type { ChannelCanvas, DeleteAccountEvent, RemoveFriend, SdTopicEvent } from 'mezon-js/socket';
import React, { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCustomNavigate } from '../hooks/useCustomNavigate';
import { handleGroupCallSocketEvent } from './groupCallSocketHandler';

type ChatContextProviderProps = {
	children: React.ReactNode;
};

export type ChatContextValue = {
	setCallbackEventFn: (socket: Socket) => void;
	handleReconnect: (socketType: string) => void;
	onchannelmessage: (message: ChannelMessage) => void;
};

const ChatContext = React.createContext<ChatContextValue>({} as ChatContextValue);

const ChatContextProvider: React.FC<ChatContextProviderProps> = ({ children }) => {
	const { socketRef, mmnRef, reconnectWithTimeout } = useMezon();
	const { userId } = useAuth();
	const dispatch = useAppDispatch();

	const navigate = useCustomNavigate();
	// update later
	const onvoiceended = useCallback(
		(voice: VoiceEndedEvent) => {
			if (voice) {
				dispatch(voiceActions.voiceEnded(voice?.voice_channel_id));
			}
		},
		[dispatch]
	);

	const onvoicejoined = useCallback(
		(voice: VoiceJoinedEvent) => {
			if (voice) {
				const store = getStore();
				const state = store.getState();
				const voiceChannel = selectChannelById(state, voice.voice_channel_id);
				const voiceOfMe = selectVoiceInfo(state);
				const currentUserId = selectCurrentUserId(state);
				const hasJoinSoundEffect = voiceOfMe?.channelId === voice.voice_channel_id || currentUserId === voice.user_id;

				if (voiceChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && hasJoinSoundEffect) {
					const joinSoundElement = document.createElement('audio');
					joinSoundElement.src = 'assets/audio/joincallsound.mp3';
					joinSoundElement.preload = 'auto';
					joinSoundElement.style.display = 'none';

					const cleanup = () => {
						joinSoundElement.removeEventListener('ended', cleanup);
						joinSoundElement.removeEventListener('error', cleanup);
						if (document.body.contains(joinSoundElement)) {
							document.body.removeChild(joinSoundElement);
						}
						joinSoundElement.src = '';
					};

					joinSoundElement.addEventListener('ended', cleanup);
					joinSoundElement.addEventListener('error', cleanup);
					document.body.appendChild(joinSoundElement);

					joinSoundElement.play().catch((error) => {
						console.error('Failed to play join sound:', error);
						cleanup();
					});
				}

				dispatch(
					voiceActions.add({
						...voice
					})
				);
			}
		},
		[dispatch]
	);

	const onvoiceleaved = useCallback(
		(voice: VoiceLeavedEvent) => {
			dispatch(voiceActions.remove(voice));
			if (voice.voice_user_id === userId) {
				if (document.pictureInPictureElement) {
					document.exitPictureInPicture();
				}
			}
		},
		[dispatch]
	);

	const onstreamingchanneljoined = useCallback(async (user: StreamingJoinedEvent) => {
		const store = await getStoreAsync();
		const currentStreamInfo = selectCurrentStreamInfo(store.getState());
		const streamChannelMember = selectStreamMembersByChannelId(store.getState(), currentStreamInfo?.streamId || '');

		const existingMember = streamChannelMember?.find((member) => member?.user_id === user?.user_id);
		if (existingMember) {
			dispatch(usersStreamActions.remove(existingMember?.id));
		}
		dispatch(usersStreamActions.add(user));
	}, []);

	const onstreamingchannelleaved = useCallback(
		(user: StreamingLeavedEvent) => {
			dispatch(usersStreamActions.remove(user.streaming_user_id));
		},
		[dispatch]
	);

	const onactivityupdated = useCallback(
		(activities: ListActivity) => {
			const mappedActivities: ActivitiesEntity[] = activities.acts.map((activity) => ({
				...activity,
				id: activity.user_id || ''
			}));
			dispatch(acitvitiesActions.updateListActivity(mappedActivities));
		},
		[dispatch]
	);

	const handleBuzz = useCallback((channelId: string, senderId: string, isReset: boolean, mode: ChannelStreamMode | undefined) => {
		const audio = new Audio('assets/audio/buzz.mp3');

		const cleanup = () => {
			audio.removeEventListener('ended', cleanup);
			audio.removeEventListener('error', cleanup);
			audio.src = '';
		};

		audio.addEventListener('ended', cleanup);
		audio.addEventListener('error', cleanup);

		audio.play().catch((error) => {
			console.error('Failed to play buzz sound:', error);
			cleanup();
		});

		const timestamp = Math.round(Date.now() / 1000);

		if (mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL) {
			const store = getStore();
			const currentClanId = selectCurrentClanId(store.getState());
			dispatch(
				channelsActions.setBuzzState({
					clanId: currentClanId as string,
					channelId,
					buzzState: { isReset: true, senderId, timestamp }
				})
			);
		} else if (mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP) {
			dispatch(
				directActions.setBuzzStateDirect({
					channelId,
					buzzState: { isReset: true, senderId, timestamp }
				})
			);
		}
	}, []);

	const onchannelmessage = useCallback(
		async (message: ChannelMessage) => {
			const store = getStore();
			const isMobile = false;
			const currentDirectId = selectDmGroupCurrentId(store.getState());

			if (message.id === '0') {
				const lastMessage = selectLastMessageByChannelId(store.getState(), message.channel_id);
				if (lastMessage?.id) {
					message.id = (BigInt(lastMessage.id) + BigInt(1)).toString();
					message.message_id = message.id;
				}
			}

			if (message.code === TypeMessage.MessageBuzz) {
				handleBuzz(message.channel_id, message.sender_id, true, message.mode);
			}

			if (message.topic_id && message.topic_id !== '0') {
				const lastMsg: ApiChannelMessageHeader = {
					content: message.content,
					sender_id: message.sender_id,
					timestamp_seconds: message.create_time_seconds
				};
				dispatch(topicsActions.setTopicLastSent({ clanId: message.clan_id || '', topicId: message.topic_id || '', lastSentMess: lastMsg }));
			}

			try {
				const senderId = message.sender_id;
				const timestamp = Date.now() / 1000;
				const mess = await dispatch(mapMessageChannelToEntityAction({ message, lock: true })).unwrap();
				if (message.topic_id && message.topic_id !== '0') {
					mess.channel_id = mess.topic_id ?? '';
				}
				mess.isMe = senderId === userId;

				if ((message.content as IMessageSendPayload).callLog?.callLogType === IMessageTypeCallLog.STARTCALL && mess.isMe) {
					dispatch(DMCallActions.setCallMessageId(message?.message_id));
				}
				mess.isCurrentChannel = message.channel_id === currentDirectId || (isMobile && message.channel_id === currentDirectId);

				if ((currentDirectId === undefined && !isMobile) || (isMobile && !currentDirectId)) {
					const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
					const idToCompare = !isMobile ? currentChannelId : currentChannelId;
					mess.isCurrentChannel = message.channel_id === idToCompare;
				}

				const attachmentList: AttachmentEntity[] =
					message.attachments && message.attachments.length > 0
						? message.attachments.map((attachment) => {
								const dateTime = new Date();
								return {
									...attachment,
									id: attachment.url as string,
									message_id: message?.message_id,
									create_time: dateTime.toISOString(),
									uploader: message?.sender_id
								};
							})
						: [];

				if (attachmentList?.length && message?.code === TypeMessage.Chat) {
					dispatch(attachmentActions.addAttachments({ listAttachments: attachmentList, channelId: message.channel_id }));
				} else if (message?.code === TypeMessage.ChatRemove && message?.attachments) {
					dispatch(attachmentActions.removeAttachments({ messageId: message?.message_id as string, channelId: message.channel_id }));
				}

				if (message.code === TypeMessage.ChatUpdate || message.code === TypeMessage.ChatRemove) {
					dispatch(messagesActions.newMessage(mess));

					if (message.code === TypeMessage.ChatRemove && message.topic_id && message.topic_id !== '0' && message?.message_id) {
						dispatch(
							messagesActions.updateTopicRplCount({
								topicId: message?.topic_id,
								channelId: message?.channel_id,
								increment: false
							})
						);
					}
				} else {
					dispatch(messagesActions.addNewMessage(mess));

					if (message.topic_id && message.topic_id !== '0' && message?.message_id) {
						dispatch(
							messagesActions.updateTopicRplCount({
								topicId: message?.topic_id,
								channelId: message?.channel_id,
								increment: true
							})
						);
					}
				}
				if (mess.mode === ChannelStreamMode.STREAM_MODE_DM || mess.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
					const newDm = await dispatch(directActions.addDirectByMessageWS(mess)).unwrap();
					!newDm && dispatch(directMetaActions.updateDMSocket(message));
					const isClanView = selectClanView(store.getState());

					const path = isElectron() ? window.location.hash : window.location.pathname;
					const isFriendPageView = path.includes('/chat/direct/friends');
					const isFocus = !isBackgroundModeActive();

					const isNotCurrentDirect =
						isFriendPageView ||
						isClanView ||
						!currentDirectId ||
						(currentDirectId && !RegExp(currentDirectId).test(message?.channel_id)) ||
						!isFocus;

					if (isNotCurrentDirect) {
						dispatch(directMetaActions.setDirectLastSentTimestamp({ channelId: message.channel_id, timestamp }));
						if (
							((Array.isArray(message.mentions) && message.mentions.length === 0) ||
								message.mentions?.some((listUser) => listUser.user_id !== userId)) &&
							message.references?.at(0)?.message_sender_id !== userId
						) {
							dispatch(directMetaActions.setCountMessUnread({ channelId: message.channel_id, isMention: false }));
							if (!mess.isMe) {
								dispatch(directActions.addBadgeDirect({ channelId: message.channel_id as string }));
							}
						}
					}

					if (mess.isMe && isNotCurrentDirect) {
						const directReceiver = selectDirectById(store.getState(), mess?.channel_id);
						// Mark as read if isMe send token
						if (
							directReceiver &&
							(directReceiver.type === ChannelType.CHANNEL_TYPE_DM || directReceiver.type === ChannelType.CHANNEL_TYPE_GROUP) &&
							!directReceiver.count_mess_unread
						) {
							dispatch(
								messagesActions.updateLastSeenMessage({
									clanId: mess?.clan_id || '',
									channelId: mess?.channel_id,
									messageId: mess?.id,
									mode: mess.mode,
									badge_count: 0,
									updateLast: true
								})
							);
							dispatch(
								directMetaActions.setDirectLastSeenTimestamp({ channelId: message.channel_id, timestamp, messageId: message.id })
							);
						}
					}
				} else {
					if (mess.isMe) {
						dispatch(
							channelsActions.updateChannelBadgeCount({
								channelId: message.channel_id,
								clanId: message.clan_id || '',
								count: 0,
								isReset: true
							})
						);
						dispatch(
							listChannelsByUserActions.updateChannelBadgeCount({
								channelId: message.channel_id,
								count: 0,
								isReset: true
							})
						);
					} else {
						if (message.clan_id) {
							dispatch(clansActions.setHasUnreadMessage({ clanId: message.clan_id, hasUnread: true }));
						}
					}
					if (message.code !== TypeMessage.ChatUpdate && message.code !== TypeMessage.ChatRemove) {
						dispatch(
							channelMetaActions.setChannelLastSentTimestamp({ channelId: message.channel_id, timestamp, senderId: message.sender_id })
						);
					}
					dispatch(listChannelsByUserActions.updateLastSentTime({ channelId: message.channel_id }));
					dispatch(threadsActions.updateLastSentInThread({ channelId: message.channel_id, lastSentTime: timestamp }));
				}
				if (message?.code === TypeMessage.ChatRemove) {
					const replyData = selectDataReferences(store.getState(), message.channel_id);
					if (replyData && replyData.message_ref_id === message.id) {
						dispatch(referencesActions.resetAfterReply(message.channel_id));
					}
					if (message.message_id) {
						dispatch(
							pinMessageActions.removePinMessage({
								pinId: message.message_id,
								channelId: message.channel_id
							})
						);
					}
				}
				if (message?.code === TypeMessage.ChatRemove && message.sender_id !== userId) {
					decreaseChannelBadgeCount(dispatch, {
						message,
						userId: userId as string,
						store
					});
				}
				// check
			} catch (error) {
				captureSentryError(message, 'onchannelmessage');
			}
		},
		[userId]
	);

	const onchannelpresence = useCallback(
		(channelPresence: ChannelPresenceEvent) => {
			dispatch(channelMembersActions.fetchChannelMembersPresence(channelPresence));
		},
		[dispatch]
	);

	const statusPresenceQueue = useRef<StatusPresenceEvent[]>([]);
	const statusPresenceTimerRef = useRef<NodeJS.Timeout | null>(null);

	const onstatuspresence = useCallback(
		(statusPresence: StatusPresenceEvent) => {
			statusPresenceQueue.current.push(statusPresence);
			if (!statusPresenceTimerRef.current) {
				statusPresenceTimerRef.current = setTimeout(() => {
					const userStatusMap = new Map<string, { online: boolean; is_mobile: boolean; status?: string; user_status?: string }>();

					statusPresenceQueue.current.forEach((event) => {
						event?.joins?.forEach((join) => {
							userStatusMap.set(join.user_id, {
								online: true,
								is_mobile: join.is_mobile,
								status: join.status,
								user_status: join.user_status
							});
						});
						event?.leaves?.forEach((leave) => {
							userStatusMap.set(leave.user_id, {
								online: false,
								is_mobile: false,
								status: leave.status,
								user_status: leave.user_status
							});
						});
					});

					const combinedStatus: Update<IUserProfileActivity, string>[] = Array.from(userStatusMap.entries()).map(([userId, status]) => ({
						id: userId,
						changes: {
							online: status.online,
							is_mobile: status.is_mobile,
							id: userId,
							user_status: status.user_status,
							status: status.status
						}
					}));

					if (combinedStatus.length) {
						dispatch(statusActions.updateMany(combinedStatus));
					}
					statusPresenceQueue.current = [];
					statusPresenceTimerRef.current = null;
				}, 5000);
			}
		},
		[dispatch]
	);

	const oncanvasevent = useCallback(
		(canvasEvent: ChannelCanvas) => {
			if (canvasEvent.status === EEventAction.CREATED) {
				dispatch(
					canvasAPIActions.upsertOne({
						channel_id: canvasEvent.channel_id || '',
						canvas: { ...canvasEvent, creator_id: canvasEvent.editor_id }
					})
				);
			} else {
				dispatch(canvasAPIActions.removeOneCanvas({ channelId: canvasEvent.channel_id || '', canvasId: canvasEvent.id || '' }));
			}
		},
		[dispatch]
	);

	const onnotification = useCallback(
		async (notification: ApiNotification) => {
			if (notification.topic_id !== '0') {
				dispatch(topicsActions.setChannelTopic({ channelId: notification.channel_id || '', topicId: notification.topic_id || '' }));
			}
			const path = isElectron() ? window.location.hash : window.location.pathname;
			const isFriendPageView = path.includes('/chat/direct/friends');
			const isDirectViewPage = path.includes('/chat/direct/message/');

			const store = await getStoreAsync();
			const currentChannel = selectCurrentChannel(store.getState() as unknown as RootState);
			const isClanView = selectClanView(store.getState());
			const currentDirectId = selectDmGroupCurrentId(store.getState());
			const isFocus = !isBackgroundModeActive();

			if (
				(currentChannel?.channel_id !== notification?.channel_id && notification?.clan_id !== '0') ||
				isDirectViewPage ||
				isFriendPageView ||
				!isFocus
			) {
				dispatch(
					notificationActions.add({ data: mapNotificationToEntity(notification), category: notification.category as NotificationCategory })
				);
				const isFriendPageView = path.includes('/chat/direct/friends');
				const isNotCurrentDirect =
					isFriendPageView ||
					isClanView ||
					!currentDirectId ||
					(currentDirectId && !RegExp(currentDirectId).test(notification?.channel_id || '')) ||
					!isFocus;
				if (notification.code === NotificationCode.USER_MENTIONED || notification.code === NotificationCode.USER_REPLIED) {
					dispatch(clansActions.updateClanBadgeCount({ clanId: notification?.clan_id || '', count: 1 }));

					if (notification?.channel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
						await dispatch(
							channelsActions.addThreadSocket({
								clanId: notification?.clan_id || '',
								channelId: notification?.channel_id ?? '',
								channel: {
									...notification?.channel,
									id: notification?.channel?.channel_id || notification?.channel_id
								}
							})
						);
					}
					dispatch(
						channelsActions.updateChannelBadgeCountAsync({
							clanId: notification?.clan_id || '',
							channelId: notification?.channel_id ?? '',
							count: 1
						})
					);
					dispatch(
						listChannelsByUserActions.updateChannelBadgeCount({
							channelId: notification?.channel_id || '',
							count: 1
						})
					);

					if (isNotCurrentDirect) {
						dispatch(directMetaActions.setCountMessUnread({ channelId: notification?.channel_id ?? '', isMention: true }));
					}
				}
			}

			if (notification.code === NotificationCode.FRIEND_REQUEST || notification.code === NotificationCode.FRIEND_ACCEPT) {
				dispatch(toastActions.addToast({ message: notification.subject, type: 'info', id: 'ACTION_FRIEND' }));
				if (notification.code === NotificationCode.FRIEND_ACCEPT) {
					dispatch(friendsActions.acceptFriend(`${userId}_${notification.sender_id}`));
				}
			}

			if (isLinuxDesktop) {
				const notiSoundElement = document.createElement('audio');
				notiSoundElement.src = 'assets/audio/noti-linux.mp3';
				notiSoundElement.preload = 'auto';
				notiSoundElement.style.display = 'none';
				document.body.appendChild(notiSoundElement);
				notiSoundElement.addEventListener('ended', () => {
					document.body.removeChild(notiSoundElement);
				});
				notiSoundElement.play().catch((err) => {
					console.warn('cant play sound noti:', err.message || err);
				});
			}
		},
		[userId]
	);

	const onpinmessage = useCallback((pin: LastPinMessageEvent) => {
		if (!pin?.channel_id) return;

		if (pin.clan_id) {
			dispatch(channelsActions.setShowPinBadgeOfChannel({ clanId: pin.clan_id, channelId: pin.channel_id, isShow: true }));
		} else {
			dispatch(directActions.setShowPinBadgeOfDM({ dmId: pin?.channel_id, isShow: true }));
		}

		if (pin.operation === 1) {
			dispatch(
				pinMessageActions.addPinMessage({
					channelId: pin.channel_id,
					pinMessage: {
						id: pin.message_id,
						attachment: pin.message_attachment,
						avatar: pin.message_sender_avatar,
						channel_id: pin.channel_id,
						content: pin.message_content,
						create_time: pin.message_created_time,
						message_id: pin.message_id,
						username: pin.message_sender_username,
						sender_id: pin.message_sender_id
					}
				})
			);
		}
	}, []);

	const onUnpinMessageEvent = useCallback((unpin_message_event: UnpinMessageEvent) => {
		if (!unpin_message_event?.channel_id) return;
		dispatch(
			pinMessageActions.removePinMessage({
				channelId: unpin_message_event.channel_id,
				pinId: unpin_message_event.message_id
			})
		);
	}, []);

	const oneventnotiuserchannel = useCallback(
		(notiUserChannel: ApiNotificationUserChannel) => {
			dispatch(notificationSettingActions.upsertNotiSetting(notiUserChannel));
		},
		[dispatch]
	);

	const onlastseenupdated = useCallback(
		async (lastSeenMess: LastSeenMessageEvent) => {
			const { clan_id, channel_id, message_id } = lastSeenMess;
			let badge_count = lastSeenMess.badge_count;

			const store = getStore();

			const state = store.getState() as RootState;
			const channelsLoadingStatus = selectLoadingStatus(state);
			const clansLoadingStatus = selectClansLoadingStatus(state);

			if (channelsLoadingStatus === 'loading' || clansLoadingStatus === 'loading') {
				return;
			}

			if (clan_id && clan_id !== '0') {
				const channel = selectChannelByIdAndClanId(state, clan_id, channel_id);
				badge_count = channel?.count_mess_unread || 0;
			}

			resetChannelBadgeCount(
				dispatch,
				{
					clanId: clan_id,
					channelId: channel_id,
					badgeCount: badge_count,
					messageId: message_id
				},
				store
			);
		},
		[dispatch]
	);

	const onuserchannelremoved = useCallback(
		async (user: UserChannelRemovedEvent) => {
			const store = await getStoreAsync();
			const channelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const directId = selectDmGroupCurrentId(store.getState());
			const clanId = selectCurrentClanId(store.getState());
			const currentState = store.getState() as unknown as RootState;
			const currentChannel = selectCurrentChannel(currentState);

			for (let index = 0; index < user?.user_ids.length; index++) {
				const userID = user.user_ids[index];
				dispatch(clansActions.updateClanBadgeCount({ clanId: user?.clan_id || '', count: -user.badge_counts[index] }));
				if (userID === userId) {
					if (channelId === user.channel_id) {
						if (user.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
							const parentChannelId = currentChannel?.parent_id;
							if (parentChannelId) {
								navigate(`/chat/clans/${clanId}/channels/${parentChannelId}`);
								return;
							}
						}
						const defaultChannelId = selectDefaultChannelIdByClanId(store.getState() as unknown as RootState, clanId as string);
						const allChannels = selectAllChannels(store.getState() as unknown as RootState);
						const fallbackChannelId = allChannels.find((ch) => ch.clan_id === clanId && !checkIsThread(ch))?.id;

						const redirectChannelId = defaultChannelId || fallbackChannelId;

						if (redirectChannelId) {
							navigate(`/chat/clans/${clanId}/channels/${redirectChannelId}`);
						} else {
							navigate(`/chat/clans/${clanId}/member-safety`);
						}
					}
					if (directId === user.channel_id) {
						navigate(`/chat/direct/friends`);
					}
					dispatch(directSlice.actions.removeByDirectID(user.channel_id));
					// TODO:  backend send clan_id
					dispatch(channelsSlice.actions.removeByChannelID({ channelId: user.channel_id, clanId: clanId as string }));

					if (user.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
						dispatch(threadsActions.remove(user.channel_id));

						const allChannels = selectAllChannels(store.getState() as unknown as RootState);
						const parentChannels = allChannels.filter((ch) => !checkIsThread(ch));

						const removeActions = parentChannels.map((parentChannel) =>
							threadsActions.removeThreadFromCache({
								channelId: parentChannel.channel_id || parentChannel.id,
								threadId: user.channel_id
							})
						);

						removeActions.forEach((action) => dispatch(action));
					}
					dispatch(listChannelsByUserActions.remove(userID));
					dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: user.channel_id, clanId: user.clan_id }));
					dispatch(directMetaActions.remove(user.channel_id));
					dispatch(
						appActions.clearHistoryChannel({
							channelId: user.channel_id,
							clanId: clanId as string
						})
					);
				} else {
					if (user.channel_type === ChannelType.CHANNEL_TYPE_GROUP) {
						dispatch(directActions.removeGroupMember({ userId: userID, currentUserId: userId as string, channelId: user.channel_id }));
						// TODO: remove member group
					}
				}
				dispatch(channelMembers.actions.remove({ userId: userID, channelId: user.channel_id }));
				dispatch(
					userChannelsActions.removeUserChannel({
						channelId: user.channel_id,
						userRemoves: [userID]
					})
				);
			}
		},
		[userId]
	);
	const onuserclanremoved = useCallback(
		async (user: UserClanRemovedEvent) => {
			if (!user?.user_ids) return;
			const store = await getStoreAsync();
			const channels = selectChannelsByClanId(store.getState() as unknown as RootState, user.clan_id as string);
			const clanId = selectCurrentClanId(store.getState());
			const currentVoice = selectVoiceInfo(store.getState());
			const currentStream = selectCurrentStreamInfo(store.getState());
			user?.user_ids.forEach((id: string) => {
				dispatch(voiceActions.removeFromClanInvoice(id));
				if (id === userId) {
					if (clanId === user.clan_id) {
						navigate(`/chat/direct/friends`);
					}
					if (user.clan_id === currentVoice?.clanId) {
						dispatch(voiceActions.resetVoiceControl());
						if (document.pictureInPictureElement) {
							document.exitPictureInPicture();
						}
					}
					if (user.clan_id === currentStream?.clanId) {
						dispatch(videoStreamActions.stopStream());
						dispatch(videoStreamActions.setIsJoin(false));
					}
					dispatch(clansSlice.actions.removeByClanID(user.clan_id));
					dispatch(listChannelsByUserActions.remove(id));
					dispatch(appActions.cleanHistoryClan(user.clan_id));
				} else {
					dispatch(
						channelMembersActions.removeUserByUserIdAndClan({
							userId: id,
							channelIds: channels.map((item) => item.id),
							clanId: user.clan_id
						})
					);
					dispatch(usersClanActions.remove({ userId: id, clanId: user.clan_id }));
					dispatch(rolesClanActions.updateRemoveUserRole({ userId: id, clanId: user.clan_id }));
				}
			});
		},
		[userId]
	);

	const onuserchanneladded = useCallback(
		async (userAdds: UserChannelAddedEvent) => {
			if (!userAdds?.channel_desc) return;
			const { channel_desc, users, clan_id, create_time_second, caller } = userAdds;

			const store = await getStoreAsync();
			const clanId = selectCurrentClanId(store.getState());
			const currentClanId = selectCurrentClanId(store.getState());

			const userIds = users.map((u) => u.user_id);
			const user = users?.find((user) => user.user_id === userId);
			if (user) {
				if (
					channel_desc.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
					channel_desc.type === ChannelType.CHANNEL_TYPE_THREAD ||
					channel_desc.type === ChannelType.CHANNEL_TYPE_APP ||
					channel_desc.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
				) {
					const channel = { ...channel_desc, id: channel_desc.channel_id as string };
					dispatch(channelsActions.add({ clanId: channel_desc.clan_id as string, channel: { ...channel, active: 1 } }));
					dispatch(listChannelsByUserActions.add(channel));

					if (
						channel_desc.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
						channel_desc.type === ChannelType.CHANNEL_TYPE_APP ||
						channel_desc.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
					) {
						dispatch(listChannelRenderAction.addChannelToListRender({ type: channel_desc.type, ...channel }));
					}

					if (channel_desc.type === ChannelType.CHANNEL_TYPE_THREAD) {
						dispatch(
							channelMetaActions.updateBulkChannelMetadata([
								{
									id: channel.id,
									lastSentTimestamp: channel.last_sent_message?.timestamp_seconds || Date.now() / 1000,
									clanId: channel.clan_id ?? '',
									isMute: false,
									senderId: '',
									lastSeenTimestamp: Date.now() / 1000 - 1000
								}
							])
						);
						dispatch(
							listChannelRenderAction.setActiveThread({
								channelId: channel_desc.channel_id as string,
								clanId: channel_desc.clan_id as string
							})
						);
						dispatch(
							listChannelRenderAction.addThreadToListRender({
								channel,
								clanId: channel.clan_id || ''
							})
						);
						if (channel_desc.channel_private === ChannelStatusEnum.isPrivate) {
							const thread: ThreadsEntity = {
								id: channel.id,
								channel_id: channel_desc.channel_id,
								active: 1,
								channel_label: channel_desc.channel_label,
								clan_id: channel_desc.clan_id || (clanId as string),
								parent_id: channel_desc.parent_id,
								last_sent_message: {
									timestamp_seconds: userAdds.create_time_second
								},
								type: channel_desc.type
							};

							dispatch(
								threadsActions.addThreadToCached({
									channelId: channel.parent_id || '',
									thread
								})
							);
						}
					}

					if (channel_desc.parent_id) {
						dispatch(
							threadsActions.updateActiveCodeThread({
								channelId: channel_desc.channel_id || '',
								activeCode: ThreadStatus.joined
							})
						);
					}
				}
				dispatch(
					channelsActions.joinChat({
						clanId: clan_id,
						channelId: channel_desc.channel_id as string,
						channelType: channel_desc.type as number,
						isPublic: !channel_desc.channel_private
					})
				);
			}

			if (channel_desc.type === ChannelType.CHANNEL_TYPE_GROUP) {
				dispatch(
					directActions.addGroupUserWS({
						channel_desc: { ...channel_desc, create_time_seconds: create_time_second },
						users
					})
				);
				dispatch(
					channelMembersActions.addNewMember({
						channel_id: channel_desc.channel_id as string,
						user_ids: userIds,
						addedByUserId: caller?.user_id
					})
				);
			}

			if (currentClanId === clan_id) {
				const members = users
					.filter((user) => user?.user_id)
					.map((user) => ({
						id: user.user_id,
						user: {
							id: user.user_id,
							avatar_url: user.avatar,
							about_me: user.about_me,
							display_name: user.display_name,
							metadata: user.custom_status,
							username: user.username,
							create_time: new Date(user.create_time_second * 1000).toISOString(),
							online: user.online
						}
					}));

				dispatch(usersClanActions.upsertMany({ users: members, clanId: clan_id }));

				dispatch(
					channelMembersActions.addNewMember({
						channel_id: channel_desc.channel_id as string,
						user_ids: userIds,
						addedByUserId: caller?.user_id
					})
				);
			}
			if (userAdds.status !== ADD_ROLE_CHANNEL_STATUS) {
				dispatch(userChannelsActions.addUserChannel({ channelId: channel_desc.channel_id as string, userAdds: userIds }));
			}
		},
		[userId, dispatch]
	);

	const onuserclanadded = useCallback(async (userJoinClan: AddClanUserEvent) => {
		const store = await getStoreAsync();

		const clanMemberStore = selectClanMemberByClanId(store.getState() as unknown as RootState, userJoinClan.clan_id);

		if (userJoinClan?.user && clanMemberStore) {
			const accountCreateTime = new Date(userJoinClan?.user?.create_time_second * 1000).toISOString();
			const joinTime = new Date().toISOString();
			dispatch(
				usersClanActions.add({
					user: {
						...userJoinClan,
						id: userJoinClan.user.user_id,
						user: {
							...userJoinClan.user,
							avatar_url: userJoinClan.user.avatar,
							id: userJoinClan.user.user_id,
							about_me: userJoinClan.user.about_me,
							display_name: userJoinClan.user.display_name,
							metadata: userJoinClan.user.custom_status,
							username: userJoinClan.user.username,
							create_time: accountCreateTime,
							join_time: joinTime
						}
					},
					clanId: userJoinClan.clan_id
				} as any)
			);
		}
	}, []);

	const onremovefriend = useCallback(
		(removeFriend: RemoveFriend) => {
			dispatch(friendsActions.remove(removeFriend.user_id));
		},
		[dispatch]
	);

	const onstickercreated = useCallback(
		(stickerCreated: StickerCreateEvent) => {
			dispatch(
				stickerSettingActions.add({
					category: stickerCreated.category,
					clan_id: stickerCreated.clan_id,
					creator_id: stickerCreated.creator_id,
					id: stickerCreated.sticker_id,
					shortname: stickerCreated.shortname,
					source: stickerCreated.source,
					logo: stickerCreated.logo,
					clan_name: stickerCreated.clan_name
				})
			);
		},
		[dispatch, userId]
	);

	const oneventemoji = useCallback(
		async (eventEmoji: EventEmoji) => {
			if (eventEmoji.action === EEventAction.CREATED) {
				const newEmoji: ApiClanEmoji = {
					category: eventEmoji.clan_name,
					clan_id: eventEmoji.clan_id,
					creator_id: eventEmoji.user_id,
					id: eventEmoji.id,
					shortname: eventEmoji.short_name,
					src: eventEmoji.user_id === userId || !eventEmoji.is_for_sale ? eventEmoji.source : undefined,
					logo: eventEmoji.logo,
					clan_name: eventEmoji.clan_name
				};

				dispatch(emojiSuggestionActions.add(newEmoji));
			} else if (eventEmoji.action === EEventAction.UPDATE) {
				dispatch(
					emojiSuggestionActions.update({
						id: eventEmoji.id,
						changes: {
							shortname: eventEmoji.short_name
						}
					})
				);
			} else if (eventEmoji.action === EEventAction.DELETE) {
				dispatch(emojiSuggestionActions.remove(eventEmoji.id));
			}
		},
		[dispatch, userId]
	);

	const onstickerdeleted = useCallback(
		(stickerDeleted: StickerDeleteEvent) => {
			dispatch(stickerSettingActions.remove(stickerDeleted.sticker_id));
		},
		[userId, dispatch]
	);

	const onstickerupdated = useCallback(
		(stickerUpdated: StickerUpdateEvent) => {
			dispatch(
				stickerSettingActions.update({
					id: stickerUpdated.sticker_id,
					changes: {
						shortname: stickerUpdated.shortname
					}
				})
			);
		},
		[userId, dispatch]
	);

	const onclanprofileupdated = useCallback(
		(ClanProfileUpdates: ClanProfileUpdatedEvent) => {
			dispatch(
				usersClanActions.updateUserChannel({
					userId: ClanProfileUpdates.user_id,
					clanId: ClanProfileUpdates.clan_id,
					clanNick: ClanProfileUpdates.clan_nick,
					clanAvt: ClanProfileUpdates.clan_avatar
				})
			);
			dispatch(
				messagesActions.updateUserMessage({
					userId: ClanProfileUpdates.user_id,
					clanId: ClanProfileUpdates.clan_id,
					clanNick: ClanProfileUpdates.clan_nick,
					clanAvt: ClanProfileUpdates.clan_avatar
				})
			);
			dispatch(
				usersClanActions.updateUserClan({
					userId: ClanProfileUpdates.user_id,
					clanNick: ClanProfileUpdates.clan_nick,
					clanAvt: ClanProfileUpdates.clan_avatar,
					clanId: ClanProfileUpdates.clan_id
				})
			);
		},
		[dispatch]
	);

	const oncustomstatus = useCallback(
		(statusEvent: CustomStatusEvent) => {
			if (!statusEvent || !statusEvent.user_id) {
				return;
			}

			dispatch(
				channelMembersActions.setCustomStatusUser({
					userId: statusEvent.user_id,
					status: statusEvent.status
				})
			);

			dispatch(
				statusActions.updateMany([
					{
						id: statusEvent.user_id,
						changes: {
							user_status: statusEvent.status
						}
					}
				])
			);

			dispatch(
				usersClanActions.updateUserStatus({
					userId: statusEvent.user_id,
					user_status: statusEvent.status
				})
			);

			if (statusEvent.user_id === userId) {
				dispatch(accountActions.setCustomStatus(statusEvent.status));
			}
		},
		[dispatch, userId]
	);

	const ontokensent = useCallback(
		(tokenEvent: ApiTokenSentEvent) => {
			dispatch(giveCoffeeActions.handleSocketToken({ currentUserId: userId as string, tokenEvent }));
			const isReceiverGiveCoffee = tokenEvent.receiver_id === userId;
			const isSenderGiveCoffee = tokenEvent.sender_id === userId;

			if (tokenEvent.extra_attribute) {
				try {
					const parsedExtraAttribute = JSON.parse(tokenEvent.extra_attribute);
					if (
						'item_id' in parsedExtraAttribute &&
						'item_type' in parsedExtraAttribute &&
						'source' in parsedExtraAttribute &&
						parsedExtraAttribute.item_id &&
						parsedExtraAttribute.source
					) {
						if (parsedExtraAttribute.item_type === ITEM_TYPE.EMOJI) {
							dispatch(
								emojiSuggestionActions.update({
									id: parsedExtraAttribute.item_id,
									changes: {
										src: parsedExtraAttribute.source
									}
								})
							);
						} else {
							dispatch(
								stickerSettingActions.update({
									id: parsedExtraAttribute.item_id,
									changes: {
										source: parsedExtraAttribute.source
									}
								})
							);
						}
						dispatch(emojiRecentActions.removePendingUnlock({ emojiId: parsedExtraAttribute.item_id }));
					}
				} catch (error) {
					console.error('Error parsing extra attribute', error);
				}
			}
			if (tokenEvent.amount) {
				const updateAmount = mmnRef.current?.scaleAmountToDecimals(tokenEvent.amount) || '0';
				dispatch(
					walletActions.updateWalletByAction((currentValue) => {
						if (isReceiverGiveCoffee) {
							return addBigInt(currentValue, updateAmount);
						} else if (isSenderGiveCoffee) {
							return subBigInt(currentValue, updateAmount);
						}
						return currentValue;
					})
				);
			}
			if (isReceiverGiveCoffee) {
				const joinSoundElement = document.createElement('audio');
				joinSoundElement.src = 'assets/audio/bankSound.mp3';
				joinSoundElement.preload = 'auto';
				joinSoundElement.style.display = 'none';
				document.body.appendChild(joinSoundElement);
				joinSoundElement.addEventListener('ended', () => {
					document.body.removeChild(joinSoundElement);
				});
				joinSoundElement.play();
			}
		},
		[dispatch, userId]
	);

	const onmessagebuttonclicked = useCallback((event: MessageButtonClicked) => {
		//console.error('event', event);
	}, []);

	const onerror = useCallback(
		(event: unknown) => {
			dispatch(toastActions.addToast({ message: 'Socket connection failed', type: 'error', id: 'SOCKET_CONNECTION_ERROR' }));
		},
		[dispatch]
	);

	const onmessagetyping = useCallback(
		(e: MessageTypingEvent) => {
			dispatch(
				messagesActions.updateTypingUsers({
					channelId: e?.topic_id || e.channel_id,
					userId: e.sender_id,
					isTyping: true,
					typingName: e.sender_display_name || e.sender_username
				})
			);
		},
		[dispatch, userId]
	);

	const onmessagereaction = useCallback(
		async (e: ApiMessageReaction) => {
			if (e.sender_id === userId) {
				dispatch(emojiRecentActions.setLastEmojiRecent({ emoji_recents_id: e.emoji_recent_id, emoji_id: e.emoji_id }));
				dispatch(emojiRecentActions.addFirstEmojiRecent({ emoji_recents_id: e.emoji_recent_id, emoji_id: e.emoji_id }));
			}
			const reactionEntity = mapReactionToEntity(e);
			const store = await getStoreAsync();
			const isFocusTopicBox = selectClickedOnTopicStatus(store.getState());
			const currenTopicId = selectCurrentTopicId(store.getState());
			if (reactionEntity.topic_id && reactionEntity.topic_id !== '0' && isFocusTopicBox && currenTopicId) {
				reactionEntity.channel_id = reactionEntity.topic_id ?? '';
			}

			dispatch(messagesActions.updateMessageReactions(reactionEntity));
		},
		[userId]
	);

	const onchannelcreated = useCallback(async (channelCreated: ChannelCreatedEvent) => {
		if (channelCreated.parent_id && channelCreated.parent_id !== '0' && channelCreated.channel_private !== ChannelStatusEnum.isPrivate) {
			const newThread: ThreadsEntity = {
				...channelCreated,
				id: channelCreated.channel_id,
				type: channelCreated.channel_type,
				last_sent_message: {
					sender_id: channelCreated.creator_id,
					timestamp_seconds: Date.now() / 1000
				},
				active: channelCreated.creator_id === userId ? ThreadStatus.joined : ThreadStatus.activePublic
			};
			dispatch(
				threadsActions.addThreadToCached({
					channelId: channelCreated.parent_id,
					thread: newThread
				})
			);
		}

		if (channelCreated.creator_id === userId) {
			if (channelCreated.parent_id) {
				const thread: ChannelsEntity = {
					id: channelCreated.channel_id as string,
					active: 1,
					category_id: channelCreated.category_id,
					creator_id: channelCreated.creator_id,
					parent_id: channelCreated.parent_id,
					channel_id: channelCreated.channel_id,
					channel_label: channelCreated.channel_label,
					channel_private: channelCreated.channel_private,
					type: channelCreated.channel_type,
					//status: channelCreated.status,
					app_id: channelCreated.app_id,
					clan_id: channelCreated.clan_id
				};
				dispatch(listChannelRenderAction.addThreadToListRender({ clanId: channelCreated?.clan_id as string, channel: thread }));
			}

			if (channelCreated.channel_private === 1 && !channelCreated.parent_id) {
				dispatch(listChannelRenderAction.addChannelToListRender({ type: channelCreated.channel_type, ...channelCreated }));
			}
		}
		if (channelCreated && channelCreated.channel_private === 0 && (channelCreated.parent_id === '' || channelCreated.parent_id === '0')) {
			dispatch(channelsActions.createChannelSocket(channelCreated));
			dispatch(
				listChannelsByUserActions.addOneChannel({ id: channelCreated.channel_id, type: channelCreated.channel_type, ...channelCreated })
			);
			dispatch(listChannelRenderAction.addChannelToListRender({ type: channelCreated.channel_type, ...channelCreated }));

			const now = Math.floor(Date.now() / 1000);
			const extendChannelCreated = {
				...channelCreated,
				last_seen_message: { timestamp_seconds: 0 },
				last_sent_message: { timestamp_seconds: now }
			};

			const isPublic = channelCreated.parent_id !== '' && channelCreated.parent_id !== '0' ? false : !channelCreated.channel_private;
			dispatch(
				channelsActions.joinChat({
					clanId: channelCreated.clan_id,
					channelId: channelCreated.channel_id,
					channelType: channelCreated.channel_type,
					isPublic
				})
			);
			dispatch(
				channelMetaActions.updateBulkChannelMetadata([
					{
						id: extendChannelCreated.channel_id,
						lastSeenTimestamp: extendChannelCreated.last_seen_message.timestamp_seconds,
						lastSentTimestamp: extendChannelCreated.last_sent_message.timestamp_seconds,
						clanId: extendChannelCreated.clan_id ?? '',
						isMute: false,
						senderId: ''
					}
				])
			);
		} else if (channelCreated.creator_id === userId) {
			dispatch(listChannelRenderAction.addChannelToListRender({ type: channelCreated.channel_type, ...channelCreated }));
			if (channelCreated.channel_type !== ChannelType.CHANNEL_TYPE_DM && channelCreated.channel_type !== ChannelType.CHANNEL_TYPE_GROUP) {
				dispatch(
					listChannelsByUserActions.addOneChannel({
						id: channelCreated.channel_id,
						type: channelCreated.channel_type,
						...channelCreated
					})
				);
			}
		}
	}, []);

	const oncategoryevent = useCallback(async (categoryEvent: CategoryEvent) => {
		if (categoryEvent.status === EEventAction.CREATED) {
			dispatch(
				categoriesActions.insertOne({
					clanId: categoryEvent.clan_id as string,
					category: {
						id: categoryEvent.id,
						category_id: categoryEvent.id,
						category_name: categoryEvent.category_name,
						clan_id: categoryEvent.clan_id,
						creator_id: categoryEvent.creator_id
					}
				})
			);
			dispatch(
				listChannelRenderAction.addCategoryToListRender({
					clanId: categoryEvent.clan_id as string,
					cate: {
						id: categoryEvent.id as string,
						channels: [],
						category_id: categoryEvent.id,
						category_name: categoryEvent.category_name,
						creator_id: categoryEvent.creator_id,
						clan_id: categoryEvent.clan_id as string
					}
				})
			);
		} else if (categoryEvent.status === EEventAction.DELETE) {
			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const clanId = selectCurrentClanId(store.getState());

			if (categoryEvent) {
				const currentChannel = currentChannelId ? selectChannelById(store.getState(), currentChannelId) : null;
				const isUserInCategoryChannel = currentChannel && currentChannel.category_id === categoryEvent.id;
				const allChannels = selectAllChannels(store.getState());
				const allThreads = selectAllThreads(store.getState());

				const channelsInCategory = allChannels.filter((ch) => ch.category_id === categoryEvent.id);

				if (isUserInCategoryChannel) {
					if (!clanId) {
						navigate(`/chat/direct/friends`);
						return;
					}

					const welcomeChannelId = selectWelcomeChannelByClanId(store.getState(), clanId);
					const defaultChannelId = selectDefaultChannelIdByClanId(store.getState(), clanId);
					const fallbackChannelId = allChannels.find((ch) => ch.category_id !== categoryEvent.id && !checkIsThread(ch))?.id;

					const redirectChannelId = welcomeChannelId || defaultChannelId || fallbackChannelId;

					if (redirectChannelId) {
						navigate(`/chat/clans/${clanId}/channels/${redirectChannelId}`);
					} else {
						navigate(`/chat/clans/${clanId}/member-safety`);
					}
				}

				if (channelsInCategory.length > 0) {
					dispatch(
						channelsActions.bulkDeleteChannelSocket({
							channels: channelsInCategory,
							clanId: clanId as string
						})
					);
				}

				dispatch(categoriesActions.deleteOne({ clanId: categoryEvent.clan_id, categoryId: categoryEvent.id }));
				dispatch(
					listChannelRenderAction.removeCategoryFromListRender({
						clanId: categoryEvent?.clan_id || '',
						categoryId: categoryEvent.id
					})
				);
			}
		} else {
			const request: ApiUpdateCategoryDescRequest = {
				category_id: categoryEvent.id || '',
				category_name: categoryEvent.category_name,
				ClanId: categoryEvent.clan_id
			};
			dispatch(
				categoriesActions.updateOne({
					clanId: categoryEvent.clan_id,
					category: {
						id: categoryEvent.id as string,
						...request
					}
				})
			);
			dispatch(
				listChannelRenderAction.updateCategory({
					clanId: categoryEvent.clan_id,
					cate: request
				})
			);
		}
	}, []);

	const onclandeleted = useCallback(
		(clanDelete: ClanDeletedEvent) => {
			if (!clanDelete?.clan_id) return;
			const store = getStore();
			const currentClanId = selectCurrentClanId(store.getState());
			dispatch(listChannelsByUserActions.removeByClanId({ clanId: clanDelete.clan_id }));
			dispatch(stickerSettingActions.removeStickersByClanId(clanDelete.clan_id));
			if (clanDelete.deletor !== userId && currentClanId === clanDelete.clan_id) {
				navigate(`/chat/direct/friends`);
				dispatch(clansSlice.actions.removeByClanID(clanDelete.clan_id));
			}
			dispatch(appActions.cleanHistoryClan(clanDelete.clan_id));
		},
		[userId]
	);

	const onchanneldeleted = useCallback(
		async (channelDeleted: ChannelDeletedEvent) => {
			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const clanId = selectCurrentClanId(store.getState());

			dispatch(voiceActions.removeInVoiceInChannel(channelDeleted?.channel_id));
			dispatch(appActions.clearHistoryChannel({ channelId: channelDeleted.channel_id, clanId: channelDeleted.clan_id }));
			const isVoiceJoined = selectVoiceInfo(store.getState());
			if (channelDeleted?.channel_id === isVoiceJoined?.channelId) {
				//Leave Room If It's been deleted
				dispatch(voiceActions.resetVoiceControl());
			}

			if (channelDeleted?.deletor === userId) {
				dispatch(channelsActions.deleteChannelSocket(channelDeleted));
				dispatch(listChannelsByUserActions.remove(channelDeleted.channel_id));
				dispatch(listChannelRenderAction.updateClanBadgeRender({ channelId: channelDeleted.channel_id, clanId: channelDeleted.clan_id }));
				dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: channelDeleted.channel_id, clanId: channelDeleted.clan_id }));
				dispatch(threadsActions.remove(channelDeleted.channel_id));

				return;
			}
			if (channelDeleted) {
				const currentChannel = currentChannelId ? selectChannelById(store.getState(), currentChannelId) : null;
				const isUserInDeletedChannel = channelDeleted.channel_id === currentChannelId;
				const isUserInChildThread = currentChannel && checkIsThread(currentChannel) && currentChannel.parent_id === channelDeleted.channel_id;

				if (isUserInDeletedChannel || isUserInChildThread) {
					if (!clanId) {
						navigate(`/chat/direct/friends`);
						return;
					}

					const welcomeChannelId = selectWelcomeChannelByClanId(store.getState(), clanId);
					const defaultChannelId = selectDefaultChannelIdByClanId(store.getState(), clanId);
					const allChannels = selectAllChannels(store.getState());
					const fallbackChannelId = allChannels.find((ch) => ch.id !== channelDeleted.channel_id && !checkIsThread(ch))?.id;

					const redirectChannelId = welcomeChannelId || defaultChannelId || fallbackChannelId;

					if (redirectChannelId) {
						navigate(`/chat/clans/${clanId}/channels/${redirectChannelId}`);
					} else {
						navigate(`/chat/clans/${clanId}/member-safety`);
					}
				}

				dispatch(channelsActions.deleteChannelSocket(channelDeleted));
				dispatch(listChannelsByUserActions.remove(channelDeleted.channel_id));
				dispatch(listChannelRenderAction.updateClanBadgeRender({ channelId: channelDeleted.channel_id, clanId: channelDeleted.clan_id }));
				dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: channelDeleted.channel_id, clanId: channelDeleted.clan_id }));

				dispatch(
					threadsActions.removeThreadFromCache({
						channelId: channelDeleted?.parent_id || '',
						threadId: channelDeleted.channel_id
					})
				);
			}
		},
		[userId]
	);

	const onuserprofileupdate = useCallback(
		(userUpdated: UserProfileUpdatedEvent) => {
			if (userUpdated.user_id === userId) {
				dispatch(accountActions.setUpdateAccount({ encrypt_private_key: userUpdated?.encrypt_private_key }));
			} else {
				if (userUpdated.channel_id) {
					dispatch(
						directActions.updateMemberDMGroup({
							dmId: userUpdated.channel_id,
							user_id: userUpdated.user_id,
							avatar: userUpdated.avatar,
							display_name: userUpdated.display_name,
							about_me: userUpdated.about_me
						})
					);
				}
				dispatch(
					usersClanActions.updateUserProfileAcrossClans({
						userId: userUpdated.user_id,
						avatar: userUpdated.avatar,
						display_name: userUpdated.display_name,
						about_me: userUpdated.about_me
					})
				);
				dispatch(
					directActions.updateMemberDMGroup({
						dmId: userUpdated.channel_id,
						user_id: userUpdated.user_id,
						avatar: userUpdated.avatar,
						display_name: userUpdated.display_name,
						about_me: userUpdated.about_me
					})
				);
			}
		},
		[dispatch, userId]
	);

	//TODO: delete account
	const ondeleteaccount = useCallback(
		(deleteAccountEvent: DeleteAccountEvent) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		},
		[dispatch, userId]
	);

	const onchannelupdated = useCallback(
		async (channelUpdated: ChannelUpdatedEvent) => {
			channelUpdated.channel_private = channelUpdated.channel_private ? 1 : 0;
			if (!channelUpdated) return;
			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const channelExist = selectChannelByIdAndClanId(
				store.getState() as unknown as RootState,
				channelUpdated.clan_id as string,
				channelUpdated.channel_id
			);

			if (channelUpdated.clan_id === '0') {
				if (channelUpdated?.e2ee && channelUpdated.creator_id !== userId) {
					dispatch(e2eeActions.setOpenModalE2ee(true));
				}
				if (channelUpdated.channel_label === '') {
					return dispatch(directActions.updateE2EE({ ...channelUpdated, currentUserId: userId }));
				}
				return dispatch(directActions.updateOne({ ...channelUpdated, currentUserId: userId }));
			}

			// Switch public to private
			if (channelUpdated.channel_private && channelExist && channelExist.channel_private !== channelUpdated.channel_private) {
				const result = await dispatch(
					updateChannelActions.switchPublicToPrivate({
						channel: channelUpdated,
						userId: userId as string
					})
				).unwrap();
				if (result && currentChannelId === channelUpdated.channel_id) {
					navigate(`/chat/clans/${channelUpdated.clan_id}/member-safety`);
				}
			} else if (channelExist) {
				dispatch(
					listChannelRenderAction.updateChannelInListRender({
						channelId: channelUpdated.channel_id,
						clanId: channelUpdated.clan_id as string,
						dataUpdate: { ...channelUpdated }
					})
				);
			}

			// Switch private to public
			if (!channelUpdated.channel_private && channelExist && channelExist.channel_private !== channelUpdated.channel_private) {
				dispatch(
					updateChannelActions.switchPrivateToPublic({
						channel: channelUpdated
					})
				);
			}

			// Add new public channel
			if (!channelUpdated.channel_private && !channelExist && channelUpdated.channel_type === ChannelType.CHANNEL_TYPE_CHANNEL) {
				dispatch(
					updateChannelActions.addChannelNotExist({
						channel: channelUpdated
					})
				);
			}

			// Add new public thread
			if (!channelUpdated.channel_private && !channelExist && channelUpdated.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
				dispatch(
					updateChannelActions.addThreadNotExist({
						thread: channelUpdated
					})
				);
			}

			if (channelUpdated.channel_private !== undefined && channelUpdated.channel_private !== 0) {
				const channel = { ...channelUpdated, type: channelUpdated.channel_type, id: channelUpdated.channel_id as string, clan_name: '' };
				const cleanData: Record<string, string | number | boolean | string[]> = {};

				Object.keys(channelUpdated).forEach((key) => {
					const value = channelUpdated[key as keyof ChannelUpdatedEvent];
					if (value !== undefined && value !== '') {
						cleanData[key as keyof typeof cleanData] = value;
					}
				});

				dispatch(
					channelsActions.update({
						clanId: channelUpdated.clan_id,
						update: {
							id: channelUpdated.channel_id,
							changes: { ...cleanData }
						}
					})
				);
				dispatch(listChannelsByUserActions.upsertOne({ ...channel }));

				if ((channel.type === ChannelType.CHANNEL_TYPE_CHANNEL || channel.type === ChannelType.CHANNEL_TYPE_THREAD) && channel.parent_id) {
					dispatch(
						threadsActions.updateActiveCodeThread({
							channelId: channel.channel_id || '',
							activeCode: ThreadStatus.joined
						})
					);
				}
			} else {
				dispatch(channelsActions.updateChannelSocket(channelUpdated));
				dispatch(listChannelsByUserActions.upsertOne({ id: channelUpdated.channel_id, ...channelUpdated }));
			}
			if (channelUpdated.app_id) {
				dispatch(
					channelsActions.updateAppChannel({
						clanId: channelUpdated.clan_id,
						channelId: channelUpdated.channel_id,
						changes: { ...channelUpdated }
					})
				);
			}
			if (
				channelUpdated.channel_type === ChannelType.CHANNEL_TYPE_THREAD &&
				channelUpdated.status === ThreadStatus.joined &&
				channelUpdated.creator_id !== userId
			) {
				dispatch(
					channelsActions.update({
						clanId: channelUpdated.clan_id,
						update: { id: channelUpdated.channel_id, changes: { ...channelUpdated } }
					})
				);
				dispatch(listChannelsByUserActions.upsertOne({ id: channelUpdated.channel_id, ...channelUpdated }));
			}
			if (channelUpdated.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
				dispatch(
					channelsActions.upsertOne({
						clanId: channelUpdated.clan_id as string,
						channel: { ...channelUpdated, active: 1, id: channelUpdated.channel_id } as ChannelsEntity
					})
				);
			}
		},
		[dispatch, userId]
	);

	const onpermissionset = useCallback(
		(setPermission: PermissionSet) => {
			if (userId !== setPermission.caller) {
				const permissionRoleChannels: ApiPermissionUpdate[] = setPermission.permission_updates
					.filter((permission: ApiPermissionUpdate) => permission.type !== 0)
					.map((permission: ApiPermissionUpdate) => ({
						permission_id: permission.permission_id,
						active: permission.type === 1 ? true : permission.type === 2 ? false : undefined
					}));

				dispatch(
					permissionRoleChannelActions.updatePermission({
						roleId: setPermission.role_id,
						channelId: setPermission.channel_id,
						permissionRole: permissionRoleChannels
					})
				);
			}
		},
		[dispatch, userId]
	);

	const onpermissionchanged = useCallback(
		async (userPermission: PermissionChangedEvent) => {
			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);

			if (userId === userPermission.user_id && currentChannelId === userPermission.channel_id) {
				const permissions = [
					...(userPermission.add_permissions?.map((perm) => ({
						id: perm.permission_id as string,
						slug: perm.slug as EOverriddenPermission,
						active: 1
					})) || []),
					...(userPermission.remove_permissions?.map((perm) => ({
						id: perm.permission_id as string,
						slug: perm.slug as EOverriddenPermission,
						active: 0
					})) || []),
					...(userPermission.default_permissions?.map((perm) => ({
						id: perm.permission_id as string,
						slug: perm.slug as EOverriddenPermission,
						active: perm.type || 0
					})) || [])
				];
				dispatch(
					overriddenPoliciesActions.updateChannelPermissions({
						channelId: userPermission.channel_id,
						permissions
					})
				);
			}
		},
		[userId]
	);
	const onunmuteevent = useCallback(async (unmuteEvent: UnmuteEvent) => {
		if (unmuteEvent.category_id !== '0') {
			dispatch(
				defaultNotificationCategoryActions.setMuteCategory({
					category_id: unmuteEvent.category_id,
					active: 1,
					clan_id: unmuteEvent.clan_id
				})
			);
		} else {
			dispatch(
				notificationSettingActions.updateNotiState({
					active: EMuteState.UN_MUTE,
					channelId: unmuteEvent.channel_id
				})
			);
		}
	}, []);
	const oneventcreated = useCallback(
		async (eventCreatedEvent: ApiCreateEventRequest) => {
			// eslint-disable-next-line no-console
			// Check actions
			const isActionCreating = eventCreatedEvent.action === EEventAction.CREATED;
			const isActionUpdating = eventCreatedEvent.action === EEventAction.UPDATE;
			const isActionDeleting = eventCreatedEvent.action === EEventAction.DELETE;
			const isActionUpdateUser = eventCreatedEvent.action === EEventAction.INTERESTED || eventCreatedEvent.action === EEventAction.UNINTERESTED;

			// Check repeat
			const isEventNotRepeat = eventCreatedEvent.repeat_type === ERepeatType.DOES_NOT_REPEAT;

			// Check status
			const isEventUpcoming = eventCreatedEvent.event_status === EEventStatus.UPCOMING;
			const isEventOngoing = eventCreatedEvent.event_status === EEventStatus.ONGOING;
			const isEventCompleted = eventCreatedEvent.event_status === EEventStatus.COMPLETED;

			// Check action remove
			const shouldRemoveEvent = isEventNotRepeat && isEventCompleted;
			const onlyHidingEvent = !isEventNotRepeat && isEventCompleted;
			const onlyUpdateStatus = isEventUpcoming || isEventOngoing;

			try {
				if (isActionCreating) {
					dispatch(eventManagementActions.addOneEvent(eventCreatedEvent));
					return;
				}

				if (onlyUpdateStatus) {
					dispatch(eventManagementActions.updateEventStatus(eventCreatedEvent));
					return;
				}

				if (onlyHidingEvent) {
					// hide schedule event icon
					dispatch(eventManagementActions.updateEventStatus(eventCreatedEvent));
					dispatch(eventManagementActions.updateNewStartTime(eventCreatedEvent));
					return;
				}

				if (isActionUpdating) {
					const store = await getStoreAsync();
					const allThreadChannelPrivate = selectAllTextChannel(store.getState() as unknown as RootState);
					const allThreadChannelPrivateIds = allThreadChannelPrivate.map((channel) => channel.channel_id);
					const newChannelId = eventCreatedEvent.channel_id;
					const notUpdateChannelId = !newChannelId || newChannelId === '0';
					const userHasChannel = allThreadChannelPrivateIds.includes(newChannelId);

					if (notUpdateChannelId || userHasChannel) {
						dispatch(eventManagementActions.upsertEvent(eventCreatedEvent));
						return;
					} else {
						dispatch(eventManagementActions.removeOneEvent(eventCreatedEvent));
						return;
					}
				}

				if (shouldRemoveEvent || isActionDeleting) {
					dispatch(eventManagementActions.removeOneEvent(eventCreatedEvent));
					return;
				}

				if (isActionUpdateUser) {
					dispatch(eventManagementActions.updateUserEvent(eventCreatedEvent));
				}
			} catch (error) {
				console.error('Error handling eventCreatedEvent:', error);
			}
		},
		[dispatch]
	);

	const oncoffeegiven = useCallback(async (coffeeEvent: ApiGiveCoffeeEvent) => {
		const store = await getStoreAsync();
		const isReceiverGiveCoffee = coffeeEvent.receiver_id === userId;

		if (isReceiverGiveCoffee && isElectron()) {
			const senderToken = coffeeEvent.sender_id;
			const allMembersClan = selectAllUserClans(store.getState() as unknown as RootState);
			let member = null;
			for (const m of allMembersClan) {
				if (m.id === senderToken) {
					member = m;
					break;
				}
			}
			if (!member) return;
			const prioritizedName = member.clan_nick || member.user?.display_name || member.user?.username;
			const prioritizedAvatar = member.clan_avatar || member.user?.avatar_url;

			const title = 'Funds Transferred:';
			const body = `+${(AMOUNT_TOKEN.TEN_TOKENS * TOKEN_TO_AMOUNT.ONE_THOUNSAND).toLocaleString('vi-VN')}vnđ from ${prioritizedName}`;

			return new Notification(title, {
				body,
				icon: prioritizedAvatar ?? ''
			});
		}
	}, []);

	const onroleevent = useCallback(
		async (roleEvent: RoleEvent) => {
			if (userId === roleEvent.user_id) return;

			const { role, status, user_add_ids = [], user_remove_ids = [] } = roleEvent;

			// Handle role assignments/removals
			if (user_add_ids.length) {
				dispatch(
					usersClanActions.updateManyRoleIds({
						clanId: role.clan_id as string,
						updates: user_add_ids.map((id) => ({ userId: id, roleId: role.id as string }))
					})
				);
			}

			if (user_remove_ids.length) {
				dispatch(
					usersClanActions.removeManyRoleIds({
						clanId: role.clan_id as string,
						updates: user_remove_ids.map((id) => ({ userId: id, roleId: role.id as string }))
					})
				);
			}

			// Handle new role creation
			if (status === EEventAction.CREATED && role) {
				dispatch(
					rolesClanActions.add({
						role: {
							id: role.id as string,
							clan_id: role.clan_id,
							title: role.title,
							color: role.color,
							role_icon: role.role_icon,
							slug: role.slug,
							description: role.description,
							creator_id: role.creator_id,
							active: role.active,
							display_online: role.display_online,
							allow_mention: role.allow_mention,
							role_channel_active: role.role_channel_active,
							channel_ids: role.channel_ids,
							max_level_permission: role.max_level_permission
						},
						clanId: role.clan_id as string
					})
				);

				if (user_add_ids.includes(userId as string)) {
					dispatch(
						policiesActions.addOne({
							id: role.id as string,
							title: role.title
						})
					);
				}
				return;
			}

			// Handle role update
			if (status === EEventAction.UPDATE) {
				const isUserAffected = user_add_ids.includes(userId as string) || user_remove_ids.includes(userId as string);

				if (isUserAffected) {
					const isUserResult = await dispatch(
						rolesClanActions.updatePermissionUserByRoleId({
							roleId: role.id as string,
							userId: userId as string
						})
					).unwrap();

					if (isUserResult && user_add_ids.includes(userId as string)) {
						const store = await getStoreAsync();
						const currentClanId = selectCurrentClanId(store.getState() as unknown as RootState);
						if (currentClanId === role.clan_id) {
							dispatch(policiesActions.addPermissionCurrentClan(role));
						}
					}
				}

				dispatch(rolesClanActions.update({ role, clanId: role.clan_id as string }));
				return;
			}

			// Handle role deletion
			if (status === EEventAction.DELETE) {
				dispatch(rolesClanActions.remove({ roleId: role.id as string, clanId: role.clan_id as string }));
			}
		},
		[userId]
	);

	const onwebrtcsignalingfwd = useCallback(async (event: WebrtcSignalingFwd) => {
		// Handle Group Call Events (>= 9)
		if (event.data_type >= 9) {
			const store = await getStoreAsync();
			const state = store.getState() as unknown as RootState;

			const handled = await handleGroupCallSocketEvent(event, state, {
				dispatch,
				socketRef,
				userId
			});

			if (handled) {
				return;
			}
		}

		const store = await getStoreAsync();
		const userCallId = selectUserCallId(store.getState() as unknown as RootState);
		const isInCall = selectIsInCall(store.getState() as unknown as RootState);
		const signalingType = event?.data_type;
		// Skip processing if not in a call and the signaling type is not relevant
		if (!isInCall && [WebrtcSignalingType.WEBRTC_SDP_ANSWER, WebrtcSignalingType.WEBRTC_ICE_CANDIDATE].includes(signalingType)) {
			return;
		}

		if (userCallId && userCallId !== event?.caller_id) {
			socketRef.current?.forwardWebrtcSignaling(
				event?.caller_id,
				WebrtcSignalingType.WEBRTC_SDP_JOINED_OTHER_CALL,
				'',
				event?.channel_id,
				userId || ''
			);
			return;
		}
		if (signalingType === WebrtcSignalingType.WEBRTC_SDP_QUIT) {
			dispatch(DMCallActions.removeAll());
			dispatch(audioCallActions.reset());
			dispatch(DMCallActions.cancelCall({}));
			dispatch(audioCallActions.startDmCall(null));
			dispatch(audioCallActions.setUserCallId(''));
			dispatch(audioCallActions.setIsJoinedCall(false));
			dispatch(DMCallActions.setOtherCall({}));
		}
		if (signalingType === WebrtcSignalingType.WEBRTC_SDP_INIT) {
			dispatch(audioCallActions.setIsJoinedCall(true));
		}
		if (signalingType === WebrtcSignalingType.WEBRTC_SDP_JOINED_OTHER_CALL) {
			dispatch(audioCallActions.setIsBusyTone(true));
		}
		if (signalingType === WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA) {
			const dataJSON = safeJSONParse((event?.json_data as string) || '{}');
			if (dataJSON?.micEnabled !== undefined) {
				dispatch(audioCallActions.setIsRemoteAudio(dataJSON?.micEnabled));
			}
			if (dataJSON?.cameraEnabled !== undefined) {
				dispatch(audioCallActions.setIsRemoteVideo(dataJSON?.cameraEnabled));
			}
			return;
		}

		if (signalingType <= 8) {
			dispatch(
				DMCallActions.addOrUpdate({
					calleeId: event?.receiver_id,
					signalingData: event,
					id: event?.caller_id,
					callerId: event?.caller_id
				})
			);
		}
	}, []);

	const onuserstatusevent = useCallback(
		async (userStatusEvent: UserStatusEvent) => {
			if (userStatusEvent.user_id !== userId) {
				dispatch(friendsActions.updateUserStatus({ userId: userStatusEvent.user_id, user_status: userStatusEvent.custom_status }));
			} else {
				dispatch(accountActions.updateUserStatus(userStatusEvent.custom_status));
			}

			dispatch(statusActions.updateStatus(userStatusEvent));

			dispatch(
				friendsActions.updateOnlineFriend({
					id: userStatusEvent.user_id,
					online: !(userStatusEvent?.custom_status === EUserStatus.INVISIBLE)
				})
			);
		},
		[userId]
	);

	const oneventwebhook = useCallback(async (webhook_event: ApiWebhook) => {
		if (webhook_event.status === EEventAction.DELETE) {
			dispatch(webhookActions.removeOneWebhook({ clanId: webhook_event.clan_id || '', webhookId: webhook_event.id || '' }));
		} else {
			dispatch(webhookActions.upsertWebhook(webhook_event));
		}
	}, []);

	const onclanupdated = useCallback(async (clanUpdatedEvent: ClanUpdatedEvent) => {
		if (!clanUpdatedEvent) return;
		dispatch(clansSlice.actions.update({ dataUpdate: clanUpdatedEvent }));
	}, []);

	const onJoinChannelAppEvent = useCallback(async (joinChannelAppData: JoinChannelAppData) => {
		if (!joinChannelAppData) return;
		dispatch(channelAppSlice.actions.setJoinChannelAppData({ dataUpdate: joinChannelAppData }));
	}, []);

	const onsdtopicevent = useCallback(async (sdTopicEvent: SdTopicEvent) => {
		if (!sdTopicEvent) return;

		dispatch(
			messagesActions.updateToBeTopicMessage({
				channelId: sdTopicEvent?.channel_id as string,
				messageId: sdTopicEvent?.message_id as string,
				topicId: sdTopicEvent?.id as string,
				creatorId: sdTopicEvent?.user_id as string
			})
		);
		dispatch(
			topicsActions.addTopic({
				clanId: sdTopicEvent.clan_id,
				topic: {
					id: sdTopicEvent.id,
					clan_id: sdTopicEvent.clan_id,
					channel_id: sdTopicEvent.channel_id,
					message_id: sdTopicEvent.message_id,
					last_sent_message: sdTopicEvent.last_sent_message,
					message: sdTopicEvent.message
				}
			})
		);
	}, []);

	const onblockfriend = useCallback(
		(blockFriend: BlockFriend) => {
			if (!blockFriend?.user_id) {
				return;
			}
			dispatch(
				friendsActions.updateFriendState({
					userId: blockFriend.user_id,
					sourceId: blockFriend.user_id
				})
			);
		},
		[dispatch, userId]
	);

	const onunblockfriend = useCallback(
		(unblockFriend: UnblockFriend) => {
			if (!unblockFriend?.user_id) {
				return;
			}
			dispatch(
				friendsActions.updateFriendState({
					userId: unblockFriend.user_id
				})
			);
		},
		[dispatch]
	);

	const onMarkAsRead = useCallback(async (markAsReadEvent: MarkAsRead) => {
		const store = getStore();

		const channels = selectChannelThreads(store.getState() as RootState);
		if (!markAsReadEvent.category_id) {
			const channelIds = channels.map((item) => item.id);
			const channelUpdates = channelIds.map((channelId) => {
				let messageId = selectLatestMessageId(store.getState(), channelId);
				if (!messageId) {
					const lastSentMsg = selectLastSentMessageStateByChannelId(store.getState(), channelId);
					messageId = lastSentMsg?.id || '';
				}
				return { channelId, messageId: messageId || undefined };
			});
			dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelUpdates));
			dispatch(
				channelsActions.resetChannelsCount({
					clanId: markAsReadEvent.clan_id,
					channelIds
				})
			);
			dispatch(clansActions.updateClanBadgeCount({ clanId: markAsReadEvent.clan_id ?? '', count: 0, isReset: true }));
			dispatch(
				listChannelRenderAction.handleMarkAsReadListRender({
					type: EMarkAsReadType.CLAN,
					clanId: markAsReadEvent.clan_id
				})
			);
			dispatch(listChannelsByUserActions.markAsReadChannel(channelIds));
			return;
		}
		if (!markAsReadEvent.channel_id) {
			const channelsInCategory = channels.filter((channel) => channel.category_id === markAsReadEvent.category_id);

			const allChannelsAndThreads = channelsInCategory.flatMap((channel) => [channel, ...(channel.threads || [])]);

			const channelIds = allChannelsAndThreads.map((item) => item.id);

			const channelUpdates = channelIds.map((channelId) => ({
				channelId,
				messageId: selectLatestMessageId(store.getState(), channelId) || undefined
			}));
			dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelUpdates));
			dispatch(
				channelsActions.resetChannelsCount({
					clanId: markAsReadEvent.clan_id as string,
					channelIds
				})
			);
			dispatch(
				listChannelRenderAction.handleMarkAsReadListRender({
					type: EMarkAsReadType.CATEGORY,
					clanId: markAsReadEvent.clan_id as string,
					categoryId: markAsReadEvent.category_id
				})
			);
			dispatch(listChannelsByUserActions.markAsReadChannel(channelIds));
		} else {
			const relatedChannels = channels.filter(
				(channel) => channel.id === markAsReadEvent.channel_id || channel.parent_id === markAsReadEvent.channel_id
			);

			const channelIds = relatedChannels.map((channel) => channel.id);

			const channelUpdates = channelIds.map((channelId) => ({
				channelId,
				messageId: selectLatestMessageId(store.getState(), channelId) || undefined
			}));
			dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelUpdates));
			dispatch(
				channelsActions.resetChannelsCount({
					clanId: markAsReadEvent.clan_id as string,
					channelIds
				})
			);
			dispatch(
				clansActions.updateClanBadgeCount2({
					clanId: markAsReadEvent.clan_id as string,
					channels: relatedChannels.map((channel) => ({
						channelId: channel.id,
						count: (channel.count_mess_unread ?? 0) * -1
					}))
				})
			);
			dispatch(
				listChannelRenderAction.handleMarkAsReadListRender({
					type: EMarkAsReadType.CHANNEL,
					clanId: markAsReadEvent.clan_id as string,
					channelId: markAsReadEvent.channel_id
				})
			);

			const threadIds = relatedChannels.flatMap((channel) => channel.threadIds || []);
			if (threadIds.length) {
				const threadUpdates = threadIds.map((channelId) => ({
					channelId,
					messageId: selectLatestMessageId(store.getState(), channelId) || undefined
				}));
				dispatch(channelMetaActions.setChannelsLastSeenTimestamp(threadUpdates));
			}

			dispatch(listChannelsByUserActions.markAsReadChannel([markAsReadEvent.channel_id, ...threadIds]));
		}
	}, []);

	const onaddfriend = useCallback((user: AddFriend) => {
		dispatch(friendsActions.upsertFriendRequest({ user, myId: userId || '' }));
	}, []);

	const onbanneduser = useCallback((user: BannedUserEvent) => {
		console.warn('user: ', user);
	}, []);

	const setCallbackEventFn = React.useCallback(
		(socket: Socket) => {
			socket.onvoicejoined = onvoicejoined;

			socket.onvoiceended = onvoiceended;

			socket.onvoiceleaved = onvoiceleaved;

			socket.onstreamingchanneljoined = onstreamingchanneljoined;

			socket.onactivityupdated = onactivityupdated;

			socket.onstreamingchannelleaved = onstreamingchannelleaved;

			socket.onchannelmessage = onchannelmessage;

			socket.onchannelpresence = onchannelpresence;

			socket.ondisconnect = ondisconnect;

			socket.onerror = onerror;

			socket.onmessagetyping = onmessagetyping;

			socket.onmessagereaction = onmessagereaction;

			socket.onnotification = onnotification;

			socket.onpinmessage = onpinmessage;

			socket.oneventnotiuserchannel = oneventnotiuserchannel;

			socket.onlastseenupdated = onlastseenupdated;

			socket.onuserchannelremoved = onuserchannelremoved;

			socket.onuserclanremoved = onuserclanremoved;

			socket.onclandeleted = onclandeleted;

			socket.onuserchanneladded = onuserchanneladded;

			socket.onstickercreated = onstickercreated;

			socket.oneventemoji = oneventemoji;

			socket.onstickerdeleted = onstickerdeleted;

			socket.onstickerupdated = onstickerupdated;

			socket.onuserclanadded = onuserclanadded;

			socket.onremovefriend = onremovefriend;

			socket.onclanprofileupdated = onclanprofileupdated;

			socket.oncustomstatus = oncustomstatus;

			socket.onstatuspresence = onstatuspresence;

			socket.oncanvasevent = oncanvasevent;

			socket.onchannelcreated = onchannelcreated;

			socket.oncategoryevent = oncategoryevent;

			socket.onchanneldeleted = onchanneldeleted;

			socket.onchannelupdated = onchannelupdated;

			socket.onuserprofileupdate = onuserprofileupdate;

			socket.ondeleteaccount = ondeleteaccount;

			socket.onpermissionset = onpermissionset;

			socket.onpermissionchanged = onpermissionchanged;

			socket.onunmuteevent = onunmuteevent;

			socket.oneventcreated = oneventcreated;

			socket.onheartbeattimeout = onHeartbeatTimeout;

			socket.oncoffeegiven = oncoffeegiven;

			socket.onroleevent = onroleevent;

			socket.onuserstatusevent = onuserstatusevent;

			socket.oneventwebhook = oneventwebhook;

			socket.ontokensent = ontokensent;

			socket.onmessagebuttonclicked = onmessagebuttonclicked;

			socket.onwebrtcsignalingfwd = onwebrtcsignalingfwd;

			socket.onclanupdated = onclanupdated;

			socket.onjoinchannelappevent = onJoinChannelAppEvent;

			socket.onsdtopicevent = onsdtopicevent;

			socket.onunpinmessageevent = onUnpinMessageEvent;

			socket.onblockfriend = onblockfriend;

			socket.onunblockfriend = onunblockfriend;

			socket.onmarkasread = onMarkAsRead;

			socket.onaddfriend = onaddfriend;

			socket.onbanneduser = onbanneduser;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			onchannelcreated,
			oncategoryevent,
			onchanneldeleted,
			onchannelmessage,
			onchannelpresence,
			onchannelupdated,
			onuserprofileupdate,
			ondeleteaccount,
			onpermissionset,
			onpermissionchanged,
			onunmuteevent,
			onerror,
			onmessagereaction,
			onmessagetyping,
			onnotification,
			onpinmessage,
			oneventnotiuserchannel,
			onlastseenupdated,
			onuserchannelremoved,
			onuserclanremoved,
			onclandeleted,
			onuserchanneladded,
			onuserclanadded,
			onremovefriend,
			onstickercreated,
			oneventemoji,
			onstickerdeleted,
			onstickerupdated,
			onclanprofileupdated,
			oncustomstatus,
			onstatuspresence,
			oncanvasevent,
			onvoiceended,
			onvoicejoined,
			onvoiceleaved,
			onstreamingchanneljoined,
			onstreamingchannelleaved,
			oneventcreated,
			oncoffeegiven,
			onroleevent,
			onuserstatusevent,
			oneventwebhook,
			ontokensent,
			onmessagebuttonclicked,
			onwebrtcsignalingfwd,
			onclanupdated,
			onJoinChannelAppEvent,
			onsdtopicevent,
			onUnpinMessageEvent,
			onblockfriend,
			onunblockfriend
		]
	);

	const handleReconnect = useCallback(
		async (socketType: string) => {
			if (socketRef.current?.isOpen()) {
				return;
			}

			try {
				const store = getStore();
				const clanIdActive = selectCurrentClanId(store.getState());
				const socket = await reconnectWithTimeout(clanIdActive ?? '');

				if (socket === 'RECONNECTING') {
					return;
				}

				if (!socket) {
					dispatch(
						toastActions.addToast({
							message: 'Socket reconnecting...',
							type: 'info',
							autoClose: 3000,
							id: 'SOCKET_RECONNECTING'
						})
					);
					return;
				}

				const id = Date.now().toString();
				dispatch(appActions.refreshApp({ id }));
				setCallbackEventFn(socket as Socket);
				dispatch(toastActions.removeToast('SOCKET_RECONNECTING'));
				dispatch(toastActions.removeToast('SOCKET_RECONNECTING_ERROR'));
				dispatch(toastActions.removeToast('SOCKET_CONNECTION_ERROR'));
			} catch (error) {
				dispatch(
					toastActions.addToast({
						message: 'Socket reconnecting...',
						type: 'info',
						autoClose: 3000,
						id: 'SOCKET_RECONNECTING_ERROR'
					})
				);
				captureSentryError(error, 'SOCKET_RECONNECT');
			}
		},
		[reconnectWithTimeout, setCallbackEventFn, dispatch]
	);

	const ondisconnect = useCallback(() => {
		handleReconnect('Socket disconnected, attempting to reconnect...');
	}, [handleReconnect]);

	const onHeartbeatTimeout = useCallback(() => {
		handleReconnect('Socket hearbeat timeout, attempting to reconnect...');
	}, [handleReconnect]);

	useEffect(() => {
		const socket = socketRef.current;
		if (!socket) return;
		setCallbackEventFn(socket);

		return () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onvoicereactionmessage = () => {};

			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onchannelmessage = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onchannelpresence = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onnotification = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onpinmessage = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.oneventnotiuserchannel = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onlastseenupdated = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.oncustomstatus = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onstatuspresence = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.oncanvasevent = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.ondisconnect = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onuserchannelremoved = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onuserclanremoved = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onclandeleted = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onuserchanneladded = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onuserclanadded = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onremovefriend = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onstickercreated = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.oneventemoji = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onstickerdeleted = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onstickerupdated = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onclanprofileupdated = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.oncoffeegiven = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onroleevent = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onuserstatusevent = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.oneventwebhook = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.ontokensent = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onjoinchannelappevent = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onsdtopicevent = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onunpinmessageevent = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onblockfriend = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onunblockfriend = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onbanneduser = () => {};
		};
	}, [
		onchannelmessage,
		onchannelpresence,
		ondisconnect,
		onmessagetyping,
		onmessagereaction,
		onnotification,
		onpinmessage,
		oneventnotiuserchannel,
		onlastseenupdated,
		onuserchannelremoved,
		onuserclanremoved,
		onclandeleted,
		onuserchanneladded,
		onuserclanadded,
		onremovefriend,
		onstickerupdated,
		onstickerdeleted,
		onstickercreated,
		oneventemoji,
		onclanprofileupdated,
		oncustomstatus,
		onstatuspresence,
		oncanvasevent,
		socketRef,
		onvoiceended,
		onvoicejoined,
		onvoiceleaved,
		onstreamingchanneljoined,
		onstreamingchannelleaved,
		onerror,
		onchannelcreated,
		oncategoryevent,
		onchanneldeleted,
		onchannelupdated,
		onuserprofileupdate,
		ondeleteaccount,
		onpermissionset,
		onpermissionchanged,
		onunmuteevent,
		onHeartbeatTimeout,
		oneventcreated,
		setCallbackEventFn,
		oncoffeegiven,
		onroleevent,
		onuserstatusevent,
		oneventwebhook,
		ontokensent,
		onJoinChannelAppEvent,
		onsdtopicevent,
		onUnpinMessageEvent,
		onblockfriend,
		onunblockfriend
	]);

	const value = React.useMemo<ChatContextValue>(
		() => ({
			// add logic code
			setCallbackEventFn,
			handleReconnect,
			onchannelmessage
		}),
		[setCallbackEventFn]
	);

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

const ChatContextConsumer = ChatContext.Consumer;

ChatContextProvider.displayName = 'ChatContextProvider';

export { ChatContext, ChatContextConsumer, ChatContextProvider };
