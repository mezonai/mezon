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
	channelSettingActions,
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
	inviteActions,
	listChannelRenderAction,
	listChannelsByUserActions,
	listUsersByUserActions,
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
	selectAllUserClans,
	selectCategoryById,
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
	selectOrderedClans,
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
import type { IMessageSendPayload, IUserProfileActivity, NotificationCategory } from '@mezon/utils';
import {
	ADD_ROLE_CHANNEL_STATUS,
	AMOUNT_TOKEN,
	ChannelStatusEnum,
	EEventAction,
	EEventStatus,
	EMuteState,
	EOverriddenPermission,
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
import EventEmitter from 'events';
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
import type { ApiCreateEventRequest, ApiGiveCoffeeEvent, ApiMessageReaction, ApiNotification } from 'mezon-js/types';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCustomNavigate } from '../hooks/useCustomNavigate';
import { handleGroupCallSocketEvent } from './groupCallSocketHandler';

const MobileEventEmitter = new EventEmitter();

type ChatContextProviderProps = {
	children: React.ReactNode;
	isMobile?: boolean;
};

export type ChatContextValue = {
	setCallbackEventFn: (socket: Socket) => void;
	handleReconnect: (socketType: string) => void;
	onchannelmessage: (message: ChannelMessage) => void;
};

const ChatContext = React.createContext<ChatContextValue>({} as ChatContextValue);

const ChatContextProvider: React.FC<ChatContextProviderProps> = ({ children, isMobile = false }) => {
	const { t } = useTranslation('token');
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
				const hasJoinSoundEffect = voiceOfMe?.channelId === voice.voice_channel_id || currentUserId === voice.userId;

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

		const existingMember = streamChannelMember?.find((member) => member?.userId === user?.userId);
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
				id: activity.userId || ''
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

			if (!message.id || message.id === '0') {
				const lastMessage = selectLastMessageByChannelId(store.getState(), message.channelId);
				if (lastMessage?.id) {
					message.id = (BigInt(lastMessage.id) + BigInt(1)).toString();
					message.messageId = message.id;
				}
			}

			if (message.code === TypeMessage.MessageBuzz) {
				handleBuzz(message.channelId, message.senderId, true, message.mode);
			}

			if (message.topicId && message.topicId !== '0') {
				const lastMsg: ApiChannelMessageHeader = {
					content: message.content,
					senderId: message.senderId,
					timestampSeconds: message.createTimeSeconds
				};
				dispatch(topicsActions.setTopicLastSent({ clanId: message.clanId || '', topicId: message.topicId || '', lastSentMess: lastMsg }));
			}

			try {
				const senderId = message.senderId;
				const timestamp = Date.now() / 1000;
				const mess = await dispatch(mapMessageChannelToEntityAction({ message, lock: true })).unwrap();
				if (message.topicId && message.topicId !== '0') {
					mess.channelId = mess.topicId ?? '';
				}
				mess.isMe = senderId === userId;

				if ((message.content as IMessageSendPayload).callLog?.callLogType === IMessageTypeCallLog.STARTCALL && mess.isMe) {
					dispatch(DMCallActions.setCallMessageId(message?.messageId));
				}
				mess.isCurrentChannel = message.channelId === currentDirectId || (isMobile && message.channelId === currentDirectId);

				if ((currentDirectId === undefined && !isMobile) || (isMobile && !currentDirectId)) {
					const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
					const idToCompare = !isMobile ? currentChannelId : currentChannelId;
					mess.isCurrentChannel = message.channelId === idToCompare;
				}

				const attachmentList: AttachmentEntity[] =
					message.attachments && message.attachments.length > 0
						? message.attachments.map((attachment) => {
								const dateTime = new Date();
								return {
									...attachment,
									id: attachment.url as string,
									messageId: message?.messageId,
									createTime: dateTime.toISOString(),
									uploader: message?.senderId
								};
							})
						: [];

				if (attachmentList?.length && message?.code === TypeMessage.Chat) {
					dispatch(attachmentActions.addAttachments({ listAttachments: attachmentList, channelId: message.channelId }));
				} else if (message?.code === TypeMessage.ChatRemove && message?.attachments) {
					dispatch(attachmentActions.removeAttachments({ messageId: message?.messageId as string, channelId: message.channelId }));
				}

				if (
					message.code === TypeMessage.ChatUpdate ||
					message.code === TypeMessage.ChatRemove ||
					message.code === TypeMessage.UpdateEphemeralMsg ||
					message.code === TypeMessage.DeleteEphemeralMsg
				) {
					dispatch(messagesActions.newMessage(mess));

					if (message.code === TypeMessage.ChatRemove && message.topicId && message.topicId !== '0' && message?.messageId) {
						dispatch(
							messagesActions.updateTopicRplCount({
								topicId: message?.topicId,
								channelId: message?.channelId,
								increment: false
							})
						);
					}
				} else {
					dispatch(messagesActions.addNewMessage(mess));

					if (message.topicId && message.topicId !== '0' && message?.messageId) {
						dispatch(
							messagesActions.updateTopicRplCount({
								topicId: message?.topicId,
								channelId: message?.channelId,
								increment: true,
								timestamp: message.createTimeSeconds
							})
						);
					}
				}

				if (mess.mode === ChannelStreamMode.STREAM_MODE_DM || mess.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
					const isContentMutation = message.code === TypeMessage.ChatUpdate || message.code === TypeMessage.ChatRemove;
					if (!isContentMutation) {
						await dispatch(directActions.addDirectByMessageWS(mess)).unwrap();
					}

					const isClanView = selectClanView(store.getState());

					const path = isElectron() ? window.location.hash : window.location.pathname;
					const isFriendPageView = path.includes('/chat/direct/friends');
					const isFocus = !isBackgroundModeActive();

					const isNotCurrentDirect =
						isFriendPageView ||
						isClanView ||
						!currentDirectId ||
						(currentDirectId && !RegExp(currentDirectId).test(message?.channelId)) ||
						!isFocus;

					if (isNotCurrentDirect) {
						if (message.senderId !== userId && message.code !== TypeMessage.ChatUpdate && message.code !== TypeMessage.ChatRemove) {
							dispatch(directMetaActions.setCountMessUnread({ channelId: message.channelId, isMention: false }));
						}
					}

					if (mess.isMe && isNotCurrentDirect && !isContentMutation) {
						const directReceiver = selectDirectById(store.getState(), mess?.channelId);
						// Mark as read if isMe send token
						if (
							directReceiver &&
							(directReceiver.type === ChannelType.CHANNEL_TYPE_DM || directReceiver.type === ChannelType.CHANNEL_TYPE_GROUP) &&
							!directReceiver.count_mess_unread
						) {
							dispatch(
								messagesActions.updateLastSeenMessage({
									clanId: mess?.clanId || '',
									channelId: mess?.channelId,
									messageId: mess?.id,
									mode: mess.mode,
									badge_count: 0,
									updateLast: true
								})
							);
							dispatch(
								directMetaActions.setDirectLastSeenTimestamp({ channelId: message.channelId, timestamp, messageId: message.id })
							);
						}
					}
				} else {
					if (mess.isMe) {
						dispatch(
							channelsActions.updateChannelBadgeCount({
								channelId: message.channelId,
								clanId: message.clanId || '',
								count: 0,
								isReset: true
							})
						);
						dispatch(
							listChannelsByUserActions.updateChannelBadgeCount({
								channelId: message.channelId,
								count: 0,
								isReset: true
							})
						);
					} else {
						if (message.clanId) {
							dispatch(clansActions.setHasUnreadMessage({ clanId: message.clanId, hasUnread: true }));
						}
					}
					if (message.code !== TypeMessage.ChatUpdate && message.code !== TypeMessage.ChatRemove) {
						dispatch(
							channelMetaActions.setChannelLastSentTimestamp({ channelId: message.channelId, timestamp, senderId: message.senderId })
						);
					}
					dispatch(listChannelsByUserActions.updateLastSentTime({ channelId: message.channelId }));
					dispatch(threadsActions.updateLastSentInThread({ channelId: message.channelId, lastSentTime: timestamp }));
				}
				if (message?.code === TypeMessage.ChatRemove) {
					const replyData = selectDataReferences(store.getState(), message.channelId);
					if (replyData && replyData.messageRefId === message.id) {
						dispatch(referencesActions.resetAfterReply(message.channelId));
					}
					if (message.messageId) {
						dispatch(
							pinMessageActions.removePinMessage({
								pinId: message.messageId,
								channelId: message.channelId
							})
						);
					}
				}
				if (message?.code === TypeMessage.ChatRemove && message.senderId !== userId) {
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
					const userStatusMap = new Map<string, { online: boolean; isMobile: boolean; status?: string; userStatus?: string }>();

					statusPresenceQueue.current.forEach((event) => {
						event?.joins?.forEach((join) => {
							userStatusMap.set(join.userId, {
								online: true,
								isMobile: join.isMobile,
								status: join.status,
								userStatus: join.userStatus
							});
						});
						event?.leaves?.forEach((leave) => {
							userStatusMap.set(leave.userId, {
								online: false,
								isMobile: false,
								status: leave.status,
								userStatus: leave.userStatus
							});
						});
					});

					const combinedStatus: Update<IUserProfileActivity, string>[] = Array.from(userStatusMap.entries()).map(([userId, status]) => ({
						id: userId,
						changes: {
							online: status.online,
							isMobile: status.isMobile,
							id: userId,
							userStatus: status.userStatus,
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
						channelId: canvasEvent.channelId || '',
						canvas: { ...canvasEvent, creatorId: canvasEvent.editor_id }
					})
				);
			} else {
				dispatch(canvasAPIActions.removeOneCanvas({ channelId: canvasEvent.channelId || '', canvasId: canvasEvent.id || '' }));
			}
		},
		[dispatch]
	);

	const onnotification = useCallback(
		async (notification: ApiNotification) => {
			if (notification.topicId !== '0') {
				dispatch(topicsActions.setChannelTopic({ channelId: notification.channelId || '', topicId: notification.topicId || '' }));
			}
			const path = isElectron() ? window.location.hash : window.location.pathname;
			const isFriendPageView = path.includes('/chat/direct/friends');
			const isDirectViewPage = path.includes('/chat/direct/message/');

			const store = await getStoreAsync();
			const currentChannel = selectCurrentChannel(store.getState() as unknown as RootState);
			const isFocus = !isBackgroundModeActive();

			if (
				(currentChannel?.channelId !== notification?.channelId && notification?.clanId !== '0') ||
				isDirectViewPage ||
				isFriendPageView ||
				!isFocus
			) {
				dispatch(
					notificationActions.add({ data: mapNotificationToEntity(notification), category: notification.category as NotificationCategory })
				);

				if (notification.code === NotificationCode.USER_MENTIONED || notification.code === NotificationCode.USER_REPLIED) {
					dispatch(clansActions.updateClanBadgeCount({ clanId: notification?.clanId || '', count: 1 }));

					if (notification?.channel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
						await dispatch(
							channelsActions.addThreadSocket({
								clanId: notification?.clanId || '',
								channelId: notification?.channelId ?? '',
								channel: {
									...notification?.channel,
									id: notification?.channel?.channelId || notification?.channelId
								}
							})
						);
					}
					dispatch(
						channelsActions.updateChannelBadgeCountAsync({
							clanId: notification?.clanId || '',
							channelId: notification?.channelId ?? '',
							count: 1
						})
					);
					dispatch(
						listChannelsByUserActions.updateChannelBadgeCount({
							channelId: notification?.channelId || '',
							count: 1
						})
					);
				}
			}

			if (notification.code === NotificationCode.FRIEND_REQUEST || notification.code === NotificationCode.FRIEND_ACCEPT) {
				dispatch(toastActions.addToast({ message: notification.subject, type: 'info', id: 'ACTION_FRIEND' }));
				if (notification.code === NotificationCode.FRIEND_ACCEPT) {
					dispatch(friendsActions.acceptFriend(`${userId}_${notification.senderId}`));
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
		if (!pin?.channelId) return;

		if (pin.clanId) {
			dispatch(channelsActions.setShowPinBadgeOfChannel({ clanId: pin.clanId, channelId: pin.channelId, isShow: true }));
		} else {
			dispatch(directActions.setShowPinBadgeOfDM({ dmId: pin?.channelId, isShow: true }));
		}

		if (pin.operation === 1) {
			dispatch(
				pinMessageActions.addPinMessage({
					channelId: pin.channelId,
					pinMessage: {
						id: pin.messageId,
						attachment: pin.message_attachment,
						avatar: pin.message_sender_avatar,
						channelId: pin.channelId,
						content: pin.message_content,
						createTime: pin.message_created_time,
						messageId: pin.messageId,
						username: pin.messageSenderUsername,
						senderId: pin.messageSenderId
					}
				})
			);
		}
	}, []);

	const onUnpinMessageEvent = useCallback((unpin_message_event: UnpinMessageEvent) => {
		if (!unpin_message_event?.channelId) return;
		dispatch(
			pinMessageActions.removePinMessage({
				channelId: unpin_message_event.channelId,
				pinId: unpin_message_event.messageId
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
			const { clanId, channelId, messageId } = lastSeenMess;
			let badge_count = lastSeenMess.badge_count;

			const store = getStore();

			const state = store.getState() as RootState;
			const channelsLoadingStatus = selectLoadingStatus(state);
			const clansLoadingStatus = selectClansLoadingStatus(state);

			if (channelsLoadingStatus === 'loading' || clansLoadingStatus === 'loading') {
				return;
			}

			if (clanId && clanId !== '0') {
				const channel = selectChannelByIdAndClanId(state, clanId, channelId);
				badge_count = channel?.count_mess_unread || 0;
			}

			resetChannelBadgeCount(
				dispatch,
				{
					clanId: clanId,
					channelId: channelId,
					badgeCount: badge_count,
					messageId: messageId
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

			for (let index = 0; index < user?.userIds.length; index++) {
				const userID = user.userIds[index];
				dispatch(clansActions.updateClanBadgeCount({ clanId: user?.clanId || '', count: -user.badge_counts[index] }));
				if (userID === userId) {
					if (isMobile && (channelId === user.channelId || directId === user.channelId)) {
						MobileEventEmitter.emit('@ON_REMOVE_USER_CHANNEL', {
							channelId: user.channelId,
							channelType: user.channelType
						});
					}
					if (channelId === user.channelId && !isMobile) {
						if (user.channelType === ChannelType.CHANNEL_TYPE_THREAD) {
							const parentChannelId = currentChannel?.parent_id;
							if (parentChannelId) {
								navigate(`/chat/clans/${clanId}/channels/${parentChannelId}`);
								return;
							}
						}

						const defaultChannelId = selectDefaultChannelIdByClanId(store.getState() as unknown as RootState, clanId as string);
						const clanChannels = selectChannelsByClanId(store.getState() as unknown as RootState, clanId as string);
						const fallbackChannelId = clanChannels.find((ch) => !checkIsThread(ch))?.id;

						const redirectChannelId = defaultChannelId || fallbackChannelId;

						if (redirectChannelId) {
							navigate(`/chat/clans/${clanId}/channels/${redirectChannelId}`);
						} else {
							navigate(`/chat/clans/${clanId}/member-safety`);
						}
					}
					if (!isMobile && directId === user.channelId) {
						navigate(`/chat/direct/friends`);
					}
					dispatch(directSlice.actions.removeByDirectID(user.channelId));
					dispatch(channelsSlice.actions.removeByChannelID({ channelId: user.channelId, clanId: clanId as string }));

					if (user.channelType === ChannelType.CHANNEL_TYPE_THREAD) {
						const currentState = store.getState() as unknown as RootState;
						const thread = selectChannelById(currentState, user.channelId);

						if (thread && thread.channel_private === ChannelStatusEnum.isPrivate) {
							dispatch(threadsActions.remove(user.channelId));
							const allChannels = selectAllChannels(currentState);
							const parentChannels = allChannels.filter((ch) => !checkIsThread(ch));
							const removeActions = parentChannels.map((parentChannel) =>
								threadsActions.removeThreadFromCache({
									channelId: parentChannel.channelId || parentChannel.id,
									threadId: user.channelId
								})
							);
							removeActions.forEach((action) => dispatch(action));
						}
					}
					dispatch(listChannelsByUserActions.remove(userID));
					dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: user.channelId, clanId: user.clanId }));
					dispatch(directMetaActions.remove(user.channelId));
					dispatch(
						appActions.clearHistoryChannel({
							channelId: user.channelId
						})
					);
					dispatch(
						channelsActions.removePreviousChannel({
							clanId: user.clanId,
							channelId: user.channelId
						})
					);

					dispatch(listChannelsByUserActions.remove(user.channelId));
				} else {
					if (user.channelType === ChannelType.CHANNEL_TYPE_GROUP) {
						dispatch(directActions.removeGroupMember({ userId: userID, currentUserId: userId as string, channelId: user.channelId }));
						// TODO: remove member group
					}
				}
				dispatch(channelMembers.actions.remove({ userId: userID, channelId: user.channelId }));
				dispatch(
					userChannelsActions.removeUserChannel({
						channelId: user.channelId,
						userRemoves: [userID]
					})
				);
			}
		},
		[userId, isMobile]
	);
	const onuserclanremoved = useCallback(
		async (user: UserClanRemovedEvent) => {
			if (!user?.userIds) return;
			const store = await getStoreAsync();
			const channels = selectChannelsByClanId(store.getState() as unknown as RootState, user.clanId as string);
			const clanId = selectCurrentClanId(store.getState());
			const currentVoice = selectVoiceInfo(store.getState());
			const currentStream = selectCurrentStreamInfo(store.getState());
			user?.userIds.forEach((id: string) => {
				dispatch(voiceActions.removeFromClanInvoice(id));
				if (id === userId) {
					dispatch(emojiSuggestionActions.invalidateCache());
					dispatch(stickerSettingActions.invalidateCache());

					if (clanId === user.clanId) {
						if (isMobile) {
							const clanList = selectOrderedClans(store.getState());
							const clanIdToJump = clanList?.filter((item) => item.clanId !== user.clanId)?.[0]?.clanId;
							if (clanIdToJump) {
								dispatch(clansActions.setCurrentClanId(clanIdToJump));
								dispatch(clansActions.joinClan({ clanId: clanIdToJump }));
								dispatch(
									clansActions.changeCurrentClan({
										clanId: clanIdToJump
									})
								);
							}
							MobileEventEmitter.emit('@ON_REMOVE_USER_CHANNEL', {
								channelId: '',
								channelType: 0,
								isRemoveClan: true
							});
						} else {
							navigate(`/chat/direct/friends`);
						}
					}
					if (user.clanId === currentVoice?.clanId) {
						dispatch(voiceActions.resetVoiceControl());
						if (document.pictureInPictureElement) {
							document.exitPictureInPicture();
						}
					}
					if (user.clanId === currentStream?.clanId) {
						dispatch(videoStreamActions.stopStream());
						dispatch(videoStreamActions.setIsJoin(false));
					}
					dispatch(clansSlice.actions.removeByClanID(user.clanId));
					dispatch(listChannelsByUserActions.remove(id));
					dispatch(appActions.cleanHistoryClan(user.clanId));
					dispatch(channelsActions.removeByClanId(user.clanId));
				}
				dispatch(
					channelMembersActions.removeUserByUserIdAndClan({
						userId: id,
						channelIds: channels.map((item) => item.id),
						clanId: user.clanId
					})
				);
				dispatch(usersClanActions.remove({ userId: id, clanId: user.clanId }));
				dispatch(rolesClanActions.updateRemoveUserRole({ userId: id, clanId: user.clanId }));
			});
		},
		[userId, isMobile]
	);

	const onuserchanneladded = useCallback(
		async (userAdds: UserChannelAddedEvent) => {
			if (!userAdds?.channel_desc) return;
			const { channel_desc, users, clanId, create_time_second, caller } = userAdds;

			const store = await getStoreAsync();
			const clanId = selectCurrentClanId(store.getState());
			const currentClanId = selectCurrentClanId(store.getState());

			const userIds = users.map((u) => u.userId);
			const user = users?.find((user) => user.userId === userId);
			if (user) {
				if (
					channel_desc.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
					channel_desc.type === ChannelType.CHANNEL_TYPE_THREAD ||
					channel_desc.type === ChannelType.CHANNEL_TYPE_APP ||
					channel_desc.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
				) {
					const channel = { ...channel_desc, id: channel_desc.channelId as string };
					dispatch(channelsActions.add({ clanId: channel_desc.clanId as string, channel: { ...channel, active: 1 } }));
					dispatch(listChannelsByUserActions.add(channel));

					dispatch(
						channelSettingActions.addChannelFromSocket({
							id: channel_desc.channelId,
							channelId: channel_desc.channelId,
							channelLabel: channel_desc.channelLabel,
							parent_id: channel_desc.parent_id,
							clanId: channel_desc.clanId,
							channel_private: channel_desc.channel_private,
							channelType: channel_desc.type,
							creatorId: caller?.userId || ''
						})
					);

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
									lastSentTimestamp: channel.lastSentMessage?.timestampSeconds || Date.now() / 1000,
									clanId: channel.clanId ?? '',
									isMute: false,
									senderId: '',
									lastSeenTimestamp: Date.now() / 1000 - 1000
								}
							])
						);
						dispatch(
							listChannelRenderAction.setActiveThread({
								channelId: channel_desc.channelId as string,
								clanId: channel_desc.clanId as string
							})
						);
						dispatch(
							listChannelRenderAction.addThreadToListRender({
								channel: {
									...channel,
									active: 1
								},
								clanId: channel.clanId || ''
							})
						);
						if (channel_desc.channel_private === ChannelStatusEnum.isPrivate) {
							const thread: ThreadsEntity = {
								id: channel.id,
								channelId: channel_desc.channelId,
								active: 1,
								channelLabel: channel_desc.channelLabel,
								clanId: channel_desc.clanId || (clanId as string),
								parent_id: channel_desc.parent_id,
								creatorId: caller?.userId || '',
								lastSentMessage: {
									timestampSeconds: userAdds.create_time_second
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
								channelId: channel_desc.channelId || '',
								activeCode: ThreadStatus.joined
							})
						);
					}
				}
				dispatch(
					channelsActions.joinChat({
						clanId: clanId,
						channelId: channel_desc.channelId as string,
						channelType: channel_desc.type as number,
						isPublic: !channel_desc.channel_private
					})
				);
			}

			if (channel_desc.type === ChannelType.CHANNEL_TYPE_GROUP) {
				dispatch(
					directActions.addGroupUserWS({
						channel_desc: { ...channel_desc, createTimeSeconds: create_time_second },
						users
					})
				);
				dispatch(
					channelMembersActions.addNewMember({
						channelId: channel_desc.channelId as string,
						userIds: userIds,
						addedByUserId: caller?.userId
					})
				);
			}

			if (currentClanId === clanId) {
				const members = users
					.filter((user) => user?.userId)
					.map((user) => ({
						id: user.userId,
						user: {
							id: user.userId,
							avatarUrl: user.avatar,
							//about_me: user.about_me,
							displayName: user.displayName,
							metadata: user.custom_status,
							username: user.username,
							createTime: new Date(user.create_time_second * 1000).toISOString(),
							online: user.online
						}
					}));

				dispatch(usersClanActions.upsertMany({ users: members, clanId: clanId }));

				dispatch(
					channelMembersActions.addNewMember({
						channelId: channel_desc.channelId as string,
						userIds: userIds,
						addedByUserId: caller?.userId
					})
				);
			}
			if (userAdds.status !== ADD_ROLE_CHANNEL_STATUS) {
				dispatch(userChannelsActions.addUserChannel({ channelId: channel_desc.channelId as string, userAdds: userIds }));
			}
		},
		[userId, dispatch]
	);

	const onuserclanadded = useCallback(async (userJoinClan: AddClanUserEvent) => {
		const store = await getStoreAsync();

		const clanMemberStore = selectClanMemberByClanId(store.getState() as unknown as RootState, userJoinClan.clanId);

		if (userJoinClan?.user && clanMemberStore) {
			const accountCreateTime = new Date(userJoinClan?.user?.create_time_second * 1000).toISOString();
			const joinTime = new Date().toISOString();
			dispatch(
				usersClanActions.add({
					user: {
						...userJoinClan,
						id: userJoinClan.user.userId,
						user: {
							...userJoinClan.user,
							avatarUrl: userJoinClan.user.avatar,
							id: userJoinClan.user.userId,
							//about_me: userJoinClan.user.about_me,
							displayName: userJoinClan.user.displayName,
							metadata: userJoinClan.user.custom_status,
							username: userJoinClan.user.username,
							createTime: accountCreateTime,
							joinTime: joinTime
						}
					},
					clanId: userJoinClan.clanId
				} as any)
			);
		}
	}, []);

	const onremovefriend = useCallback(
		(removeFriend: RemoveFriend) => {
			dispatch(friendsActions.remove(removeFriend.userId));
		},
		[dispatch]
	);

	const onstickercreated = useCallback(
		(stickerCreated: StickerCreateEvent) => {
			dispatch(
				stickerSettingActions.add({
					category: stickerCreated.category,
					clanId: stickerCreated.clanId,
					creatorId: stickerCreated.creatorId,
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
					clanId: eventEmoji.clanId,
					creatorId: eventEmoji.userId,
					id: eventEmoji.id,
					shortname: eventEmoji.short_name,
					src: eventEmoji.userId === userId || !eventEmoji.is_for_sale ? eventEmoji.source : undefined,
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
					userId: ClanProfileUpdates.userId,
					clanId: ClanProfileUpdates.clanId,
					clanNick: ClanProfileUpdates.clanNick,
					clanAvt: ClanProfileUpdates.clanAvatar
				})
			);
			dispatch(
				messagesActions.updateUserMessage({
					userId: ClanProfileUpdates.userId,
					clanId: ClanProfileUpdates.clanId,
					clanNick: ClanProfileUpdates.clanNick,
					clanAvt: ClanProfileUpdates.clanAvatar
				})
			);
			dispatch(
				usersClanActions.updateUserClan({
					userId: ClanProfileUpdates.userId,
					clanNick: ClanProfileUpdates.clanNick,
					clanAvt: ClanProfileUpdates.clanAvatar,
					clanId: ClanProfileUpdates.clanId
				})
			);
		},
		[dispatch]
	);

	const oncustomstatus = useCallback(
		(statusEvent: CustomStatusEvent) => {
			if (!statusEvent || !statusEvent.userId) {
				return;
			}

			dispatch(
				channelMembersActions.setCustomStatusUser({
					userId: statusEvent.userId,
					status: statusEvent.status,
					time_reset: statusEvent.time_reset
				})
			);

			dispatch(
				statusActions.updateMany([
					{
						id: statusEvent.userId,
						changes: {
							userStatus: statusEvent.status
						}
					}
				])
			);

			dispatch(
				usersClanActions.updateUserStatus({
					userId: statusEvent.userId,
					userStatus: statusEvent.status
				})
			);

			if (statusEvent.userId === userId) {
				dispatch(accountActions.setCustomStatus(statusEvent.status));
			}
		},
		[dispatch, userId]
	);

	const ontokensent = useCallback(
		(tokenEvent: ApiTokenSentEvent) => {
			dispatch(giveCoffeeActions.handleSocketToken({ currentUserId: userId as string, tokenEvent }));
			const isReceiverGiveCoffee = tokenEvent.receiver_id === userId;
			const isSenderGiveCoffee = tokenEvent.senderId === userId;

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
					channelId: e?.topicId || e.channelId,
					userId: e.senderId,
					isTyping: true,
					typingName: e.sender_display_name || e.sender_username
				})
			);
		},
		[dispatch, userId]
	);

	const onmessagereaction = useCallback(
		async (e: ApiMessageReaction) => {
			if (e.senderId === userId) {
				dispatch(emojiRecentActions.setLastEmojiRecent({ emojiRecentsId: e.emojiRecentId, emojiId: e.emojiId }));
				dispatch(emojiRecentActions.addFirstEmojiRecent({ emojiRecentsId: e.emojiRecentId, emojiId: e.emojiId }));
			}
			const reactionEntity = mapReactionToEntity(e);
			const store = await getStoreAsync();
			const isFocusTopicBox = selectClickedOnTopicStatus(store.getState());
			const currenTopicId = selectCurrentTopicId(store.getState());
			if (reactionEntity.topicId && reactionEntity.topicId !== '0' && isFocusTopicBox && currenTopicId) {
				reactionEntity.channelId = reactionEntity.topicId ?? '';
			}

			dispatch(messagesActions.updateMessageReactions(reactionEntity));
		},
		[userId]
	);

	const onchannelcreated = useCallback(async (channelCreated: ChannelCreatedEvent) => {
		if (channelCreated.parent_id && channelCreated.parent_id !== '0' && channelCreated.channel_private !== ChannelStatusEnum.isPrivate) {
			const newThread: ThreadsEntity = {
				...channelCreated,
				id: channelCreated.channelId,
				type: channelCreated.channelType,
				lastSentMessage: {
					senderId: channelCreated.creatorId,
					timestampSeconds: Date.now() / 1000
				},
				active: channelCreated.creatorId === userId ? ThreadStatus.joined : ThreadStatus.activePublic
			};
			dispatch(
				threadsActions.addThreadToCached({
					channelId: channelCreated.parent_id,
					thread: newThread
				})
			);
		}

		if (channelCreated.creatorId === userId) {
			if (channelCreated.parent_id) {
				const thread: ChannelsEntity = {
					id: channelCreated.channelId as string,
					active: 1,
					categoryId: channelCreated.categoryId,
					creatorId: channelCreated.creatorId,
					parent_id: channelCreated.parent_id,
					channelId: channelCreated.channelId,
					channelLabel: channelCreated.channelLabel,
					channel_private: channelCreated.channel_private,
					type: channelCreated.channelType,
					appId: channelCreated.appId,
					clanId: channelCreated.clanId
				};
				dispatch(listChannelRenderAction.addThreadToListRender({ clanId: channelCreated?.clanId as string, channel: thread }));
			}

			if (channelCreated.channel_private === 1 && channelCreated.channelType === ChannelType.CHANNEL_TYPE_CHANNEL) {
				dispatch(listChannelRenderAction.addChannelToListRender({ type: channelCreated.channelType, ...channelCreated }));
			}
		}
		if (channelCreated && channelCreated.channel_private === 0 && (channelCreated.parent_id === '' || channelCreated.parent_id === '0')) {
			const store = await getStoreAsync();
			const category = channelCreated.categoryId ? selectCategoryById(store.getState(), channelCreated.categoryId) : null;
			const channelWithCategoryName = {
				...channelCreated,
				categoryName: category?.categoryName || ''
			};
			dispatch(channelsActions.createChannelSocket(channelWithCategoryName));
			dispatch(listChannelsByUserActions.addOneChannel({ id: channelCreated.channelId, type: channelCreated.channelType, ...channelCreated }));
			dispatch(listChannelRenderAction.addChannelToListRender({ type: channelCreated.channelType, ...channelCreated }));

			const now = Math.floor(Date.now() / 1000);
			const extendChannelCreated = {
				...channelCreated,
				lastSeenMessage: { timestampSeconds: 0 },
				lastSentMessage: { timestampSeconds: now }
			};

			const isPublic = channelCreated.parent_id !== '' && channelCreated.parent_id !== '0' ? false : !channelCreated.channel_private;
			dispatch(
				channelsActions.joinChat({
					clanId: channelCreated.clanId,
					channelId: channelCreated.channelId,
					channelType: channelCreated.channelType,
					isPublic
				})
			);
			dispatch(
				channelMetaActions.updateBulkChannelMetadata([
					{
						id: extendChannelCreated.channelId,
						lastSeenTimestamp: extendChannelCreated.lastSeenMessage.timestampSeconds,
						lastSentTimestamp: extendChannelCreated.lastSentMessage.timestampSeconds,
						clanId: extendChannelCreated.clanId ?? '',
						isMute: false,
						senderId: ''
					}
				])
			);
		} else if (channelCreated.creatorId === userId) {
			dispatch(listChannelRenderAction.addChannelToListRender({ type: channelCreated.channelType, ...channelCreated }));
			if (channelCreated.channelType !== ChannelType.CHANNEL_TYPE_DM && channelCreated.channelType !== ChannelType.CHANNEL_TYPE_GROUP) {
				dispatch(
					listChannelsByUserActions.addOneChannel({
						id: channelCreated.channelId,
						type: channelCreated.channelType,
						...channelCreated
					})
				);
			}
		}

		if (channelCreated.channelType !== ChannelType.CHANNEL_TYPE_DM && channelCreated.channelType !== ChannelType.CHANNEL_TYPE_GROUP) {
			dispatch(
				channelSettingActions.addChannelFromSocket({
					id: channelCreated.channelId,
					channelId: channelCreated.channelId,
					channelLabel: channelCreated.channelLabel,
					parent_id: channelCreated.parent_id,
					categoryId: channelCreated.categoryId,
					clanId: channelCreated.clanId,
					channel_private: channelCreated.channel_private,
					channelType: channelCreated.channelType,
					creatorId: channelCreated.creatorId,
					appId: channelCreated.appId
				})
			);
		}

		if (channelCreated.channelType === ChannelType.CHANNEL_TYPE_DM) {
			dispatch(
				directActions.upsertOne({
					id: channelCreated.channelId,
					channelLabel: channelCreated.channelLabel,
					type: channelCreated.channelType,
					active: 1
				})
			);
		}
	}, []);
	const oncategoryevent = useCallback(async (categoryEvent: CategoryEvent) => {
		if (categoryEvent.status === EEventAction.CREATED) {
			dispatch(
				categoriesActions.insertOne({
					clanId: categoryEvent.clanId as string,
					category: {
						id: categoryEvent.id,
						categoryId: categoryEvent.id,
						categoryName: categoryEvent.categoryName,
						clanId: categoryEvent.clanId,
						creatorId: categoryEvent.creatorId
					}
				})
			);
			dispatch(
				listChannelRenderAction.addCategoryToListRender({
					clanId: categoryEvent.clanId as string,
					cate: {
						id: categoryEvent.id as string,
						channels: [],
						categoryId: categoryEvent.id,
						categoryName: categoryEvent.categoryName,
						creatorId: categoryEvent.creatorId,
						clanId: categoryEvent.clanId as string
					}
				})
			);
		} else if (categoryEvent.status === EEventAction.DELETE) {
			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const clanId = selectCurrentClanId(store.getState());

			if (categoryEvent) {
				const currentChannel = currentChannelId ? selectChannelById(store.getState(), currentChannelId) : null;
				const isUserInCategoryChannel = currentChannel && currentChannel.categoryId === categoryEvent.id;
				const allChannels = selectAllChannels(store.getState());

				const channelsInCategory = allChannels.filter((ch) => ch.categoryId === categoryEvent.id);

				if (isUserInCategoryChannel) {
					if (!clanId) {
						navigate(`/chat/direct/friends`);
						return;
					}

					const welcomeChannelId = selectWelcomeChannelByClanId(store.getState(), clanId);
					const defaultChannelId = selectDefaultChannelIdByClanId(store.getState(), clanId);
					const fallbackChannelId = allChannels.find((ch) => ch.categoryId !== categoryEvent.id && !checkIsThread(ch))?.id;

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

				dispatch(categoriesActions.deleteOne({ clanId: categoryEvent.clanId, categoryId: categoryEvent.id }));
				dispatch(
					listChannelRenderAction.removeCategoryFromListRender({
						clanId: categoryEvent?.clanId || '',
						categoryId: categoryEvent.id
					})
				);
			}
		} else {
			const request: ApiUpdateCategoryDescRequest = {
				categoryId: categoryEvent.id || '',
				categoryName: categoryEvent.categoryName,
				ClanId: categoryEvent.clanId
			};
			dispatch(
				categoriesActions.updateOne({
					clanId: categoryEvent.clanId,
					category: {
						id: categoryEvent.id as string,
						...request
					}
				})
			);
			dispatch(
				listChannelRenderAction.updateCategory({
					clanId: categoryEvent.clanId,
					cate: request
				})
			);
		}
	}, []);

	const onclandeleted = useCallback(
		(clanDelete: ClanDeletedEvent) => {
			if (!clanDelete?.clanId) return;
			dispatch(inviteActions.removeByClanId(clanDelete.clanId));
			const store = getStore();
			const currentClanId = selectCurrentClanId(store.getState());
			dispatch(listChannelsByUserActions.removeByClanId({ clanId: clanDelete.clanId }));
			dispatch(stickerSettingActions.removeStickersByClanId(clanDelete.clanId));
			dispatch(emojiSuggestionActions.invalidateCache());
			dispatch(stickerSettingActions.invalidateCache());
			dispatch(channelsActions.removeByClanId(clanDelete.clanId));
			if (clanDelete.deletor !== userId && currentClanId === clanDelete.clanId) {
				if (isMobile) {
					const isVoiceJoined = selectVoiceInfo(store.getState());
					if (isVoiceJoined?.clanId === clanDelete.clanId) {
						dispatch(voiceActions.resetVoiceControl());
					}
					const currentStreamInfo = selectCurrentStreamInfo(store.getState());
					if (currentStreamInfo?.clanId === clanDelete.clanId) {
						dispatch(videoStreamActions.stopStream());
					}
					const clanList = selectOrderedClans(store.getState());
					const clanIdToJump = clanList?.filter((item) => item.clanId !== clanDelete.clanId)?.[0]?.clanId;
					if (clanIdToJump) {
						dispatch(clansActions.setCurrentClanId(clanIdToJump));
						dispatch(clansActions.joinClan({ clanId: clanIdToJump }));
						dispatch(
							clansActions.changeCurrentClan({
								clanId: clanIdToJump
							})
						);
					}
					MobileEventEmitter.emit('@ON_REMOVE_USER_CHANNEL', {
						channelId: '',
						channelType: 0,
						isRemoveClan: true
					});
				} else {
					navigate(`/chat/direct/friends`);
				}
				dispatch(clansSlice.actions.removeByClanID(clanDelete.clanId));
			}
			dispatch(appActions.cleanHistoryClan(clanDelete.clanId));
		},
		[userId, isMobile]
	);

	const onchanneldeleted = useCallback(
		async (channelDeleted: ChannelDeletedEvent) => {
			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const clanId = selectCurrentClanId(store.getState());

			dispatch(voiceActions.removeInVoiceInChannel(channelDeleted?.channelId));
			dispatch(appActions.clearHistoryChannel({ channelId: channelDeleted.channelId }));
			dispatch(
				threadsActions.setIsShowCreateThread({
					channelId: channelDeleted.channelId as string,
					isShowCreateThread: false
				})
			);
			dispatch(
				channelsActions.removeChannelApp({
					clanId: channelDeleted.clanId,
					channelId: channelDeleted.channelId
				})
			);

			if (channelDeleted?.parent_id) {
				dispatch(
					threadsActions.setIsShowCreateThread({
						channelId: channelDeleted.parent_id as string,
						isShowCreateThread: false
					})
				);
			}

			const isVoiceJoined = selectVoiceInfo(store.getState());
			if (channelDeleted?.channelId === isVoiceJoined?.channelId) {
				//Leave Room If It's been deleted
				dispatch(voiceActions.resetVoiceControl());
			}

			if (channelDeleted.channelId !== '0') {
				dispatch(channelSettingActions.removeChannelFromSocket(channelDeleted.channelId));
			}

			if (channelDeleted?.deletor === userId) {
				dispatch(channelsActions.deleteChannelSocket(channelDeleted));
				dispatch(listChannelsByUserActions.remove(channelDeleted.channelId));
				dispatch(listChannelRenderAction.updateClanBadgeRender({ channelId: channelDeleted.channelId, clanId: channelDeleted.clanId }));
				dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: channelDeleted.channelId, clanId: channelDeleted.clanId }));
				dispatch(threadsActions.remove(channelDeleted.channelId));
				dispatch(channelsActions.removeChannelApp({ channelId: channelDeleted.channelId, clanId: channelDeleted.clanId }));

				return;
			}
			if (channelDeleted) {
				const currentChannel = currentChannelId ? selectChannelById(store.getState(), currentChannelId) : null;
				const isUserInDeletedChannel = channelDeleted.channelId === currentChannelId;
				const isUserInChildThread = currentChannel && checkIsThread(currentChannel) && currentChannel.parent_id === channelDeleted.channelId;

				if (isUserInDeletedChannel || isUserInChildThread) {
					if (isMobile && currentChannel?.channelId) {
						MobileEventEmitter.emit('@ON_REMOVE_USER_CHANNEL', {
							channelId: currentChannel.channelId,
							channelType: currentChannel.type
						});
					}

					if (!clanId) {
						if (!isMobile) navigate(`/chat/direct/friends`);
						return;
					}

					const welcomeChannelId = selectWelcomeChannelByClanId(store.getState(), clanId);
					const defaultChannelId = selectDefaultChannelIdByClanId(store.getState(), clanId);
					const allChannels = selectAllChannels(store.getState());
					const fallbackChannelId = allChannels.find((ch) => ch.id !== channelDeleted.channelId && !checkIsThread(ch))?.id;

					const redirectChannelId = welcomeChannelId || defaultChannelId || fallbackChannelId;

					if (!isMobile) {
						if (redirectChannelId) {
							navigate(`/chat/clans/${clanId}/channels/${redirectChannelId}`);
						} else {
							navigate(`/chat/clans/${clanId}/member-safety`);
						}
					}
				}

				dispatch(channelsActions.deleteChannelSocket(channelDeleted));
				dispatch(listChannelsByUserActions.remove(channelDeleted.channelId));
				dispatch(listChannelRenderAction.updateClanBadgeRender({ channelId: channelDeleted.channelId, clanId: channelDeleted.clanId }));
				dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: channelDeleted.channelId, clanId: channelDeleted.clanId }));
				dispatch(channelsActions.removeChannelApp({ channelId: channelDeleted.channelId, clanId: channelDeleted.clanId }));

				dispatch(
					threadsActions.removeThreadFromCache({
						channelId: channelDeleted?.parent_id || '',
						threadId: channelDeleted.channelId
					})
				);
			}
		},
		[userId, isMobile]
	);

	const onuserprofileupdate = useCallback(
		(userUpdated: UserProfileUpdatedEvent) => {
			if (userUpdated.userId === userId) {
				dispatch(accountActions.setUpdateAccount({ encryptPrivateKey: userUpdated?.encryptPrivateKey }));
			} else {
				if (userUpdated.channelId) {
					dispatch(
						directActions.updateMemberDMGroup({
							dmId: userUpdated.channelId,
							userId: userUpdated.userId,
							avatar: userUpdated.avatar,
							displayName: userUpdated.displayName,
							about_me: userUpdated.about_me
						})
					);
				}
				dispatch(
					usersClanActions.updateUserProfileAcrossClans({
						userId: userUpdated.userId,
						...(userUpdated.avatar && { avatar: userUpdated.avatar }),
						...(userUpdated.displayName && { displayName: userUpdated.displayName }),
						about_me: userUpdated.about_me
					})
				);
				dispatch(
					directActions.updateMemberDMGroup({
						dmId: userUpdated.channelId,
						userId: userUpdated.userId,
						avatar: userUpdated.avatar,
						displayName: userUpdated.displayName,
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
			const currentChannel = selectCurrentChannel(store.getState() as unknown as RootState);
			const channelExist = selectChannelByIdAndClanId(
				store.getState() as unknown as RootState,
				channelUpdated.clanId as string,
				channelUpdated.channelId
			);

			if (channelUpdated.clanId === '0') {
				if (channelUpdated?.e2ee && channelUpdated.creatorId !== userId) {
					dispatch(e2eeActions.setOpenModalE2ee(true));
				}
				if (channelUpdated.channelLabel === '') {
					return dispatch(directActions.updateE2EE({ ...channelUpdated, currentUserId: userId }));
				}
				return dispatch(directActions.updateOne({ ...channelUpdated, currentUserId: userId }));
			}
			if (channelUpdated.channelType !== ChannelType.CHANNEL_TYPE_DM && channelUpdated.channelType !== ChannelType.CHANNEL_TYPE_GROUP) {
				dispatch(
					channelSettingActions.updateChannelFromSocket({
						id: channelUpdated.channelId,
						channelId: channelUpdated.channelId,
						channelLabel: channelUpdated.channelLabel,
						parent_id: channelUpdated.parent_id,
						categoryId: channelUpdated.categoryId,
						clanId: channelUpdated.clanId,
						channel_private: channelUpdated.channel_private,
						channelType: channelUpdated.channelType,
						creatorId: channelUpdated.creatorId,
						appId: channelUpdated.appId
					})
				);
			}
			// Switch public to private
			if (channelUpdated.channel_private && channelExist && channelExist.channel_private !== channelUpdated.channel_private) {
				const result = await dispatch(
					updateChannelActions.switchPublicToPrivate({
						channel: channelUpdated,
						userId: userId as string
					})
				).unwrap();
				if (
					isMobile &&
					result &&
					channelUpdated.creatorId !== userId &&
					(currentChannel?.channelId === channelUpdated.channelId || currentChannel?.parent_id === channelUpdated.channelId)
				) {
					MobileEventEmitter.emit('@ON_REMOVE_USER_CHANNEL', {
						channelId: currentChannel?.channelId,
						channelType: currentChannel?.type
					});
					dispatch(channelsActions.setCurrentChannelId({ clanId: channelUpdated.clanId as string, channelId: '' }));
				}
				if (!isMobile && result && currentChannelId === channelUpdated.channelId) {
					navigate(`/chat/clans/${channelUpdated.clanId}/member-safety`);
				}
			} else if (channelExist) {
				dispatch(
					listChannelRenderAction.updateChannelInListRender({
						channelId: channelUpdated.channelId,
						clanId: channelUpdated.clanId as string,
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
			if (!channelUpdated.channel_private && !channelExist && channelUpdated.channelType === ChannelType.CHANNEL_TYPE_CHANNEL) {
				dispatch(
					updateChannelActions.addChannelNotExist({
						channel: channelUpdated
					})
				);
			}

			// Add new public thread
			if (!channelUpdated.channel_private && !channelExist && channelUpdated.channelType === ChannelType.CHANNEL_TYPE_THREAD) {
				dispatch(
					updateChannelActions.addThreadNotExist({
						thread: channelUpdated
					})
				);
			}

			if (channelUpdated.channel_private !== undefined && channelUpdated.channel_private !== 0) {
				const channel = { ...channelUpdated, type: channelUpdated.channelType, id: channelUpdated.channelId as string, clan_name: '' };
				const cleanData: Record<string, string | number | boolean | string[]> = {};

				Object.keys(channelUpdated).forEach((key) => {
					const value = channelUpdated[key as keyof ChannelUpdatedEvent];
					if (value !== undefined && value !== '') {
						cleanData[key as keyof typeof cleanData] = value;
					}
				});

				dispatch(
					channelsActions.update({
						clanId: channelUpdated.clanId,
						update: {
							id: channelUpdated.channelId,
							changes: { ...cleanData }
						}
					})
				);
				dispatch(listChannelsByUserActions.upsertOne({ ...channel }));

				if ((channel.type === ChannelType.CHANNEL_TYPE_CHANNEL || channel.type === ChannelType.CHANNEL_TYPE_THREAD) && channel.parent_id) {
					dispatch(
						threadsActions.updateActiveCodeThread({
							channelId: channel.channelId || '',
							activeCode: ThreadStatus.joined
						})
					);
				}
			} else {
				dispatch(channelsActions.updateChannelSocket(channelUpdated));
				dispatch(listChannelsByUserActions.upsertOne({ id: channelUpdated.channelId, ...channelUpdated }));
			}
			if (channelUpdated.appId) {
				dispatch(
					channelsActions.updateAppChannel({
						clanId: channelUpdated.clanId,
						channelId: channelUpdated.channelId,
						changes: { ...channelUpdated }
					})
				);
			}
			if (
				channelUpdated.channelType === ChannelType.CHANNEL_TYPE_THREAD &&
				channelUpdated.status === ThreadStatus.joined &&
				channelUpdated.creatorId !== userId
			) {
				dispatch(
					channelsActions.update({
						clanId: channelUpdated.clanId,
						update: { id: channelUpdated.channelId, changes: { ...channelUpdated } }
					})
				);
				dispatch(listChannelsByUserActions.upsertOne({ id: channelUpdated.channelId, ...channelUpdated }));
			}
			if (channelUpdated.channelType === ChannelType.CHANNEL_TYPE_THREAD) {
				const cleanDataThread: Record<string, string | number | boolean | string[]> = {};

				Object.keys(channelUpdated).forEach((key) => {
					const value = channelUpdated[key as keyof ChannelUpdatedEvent];
					if (value !== undefined && value !== '') {
						cleanDataThread[key as keyof typeof cleanDataThread] = value;
					}
				});
				dispatch(
					channelsActions.update({
						clanId: channelUpdated.clanId as string,
						update: {
							id: channelUpdated.channelId,
							changes: { ...cleanDataThread, active: 1, id: channelUpdated.channelId }
						}
					})
				);
			}
		},
		[dispatch, userId, isMobile]
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
						roleId: setPermission.roleId,
						channelId: setPermission.channelId,
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

			if (userId === userPermission.userId && currentChannelId === userPermission.channelId) {
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
						active: perm.slug === EOverriddenPermission.sendMessage ? 1 : 0
					})) || [])
				];
				dispatch(
					overriddenPoliciesActions.updateChannelPermissions({
						channelId: userPermission.channelId,
						permissions
					})
				);
			}
		},
		[userId]
	);
	const onunmuteevent = useCallback(async (unmuteEvent: UnmuteEvent) => {
		dispatch(
			notificationSettingActions.updateNotiState({
				active: EMuteState.UN_MUTE,
				channelId: unmuteEvent.channelId
			})
		);
		if (unmuteEvent.categoryId && unmuteEvent.categoryId !== '0') {
			dispatch(
				defaultNotificationCategoryActions.unmuteCate({
					clanId: unmuteEvent.clanId,
					categoryId: unmuteEvent.categoryId
				})
			);
		}
		if (unmuteEvent.channelId && unmuteEvent.channelId !== '0') {
			dispatch(
				defaultNotificationCategoryActions.unmuteCate({
					clanId: unmuteEvent.clanId,
					categoryId: unmuteEvent.categoryId
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
					const allThreadChannelPrivateIds = allThreadChannelPrivate.map((channel) => channel.channelId);
					const newChannelId = eventCreatedEvent.channelId;
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
			const senderToken = coffeeEvent.senderId;
			const allMembersClan = selectAllUserClans(store.getState() as unknown as RootState);
			let member = null;
			for (const m of allMembersClan) {
				if (m.id === senderToken) {
					member = m;
					break;
				}
			}
			if (!member) return;
			const prioritizedName = member.clanNick || member.user?.displayName || member.user?.username;
			const prioritizedAvatar = member.clanAvatar || member.user?.avatarUrl;

			const title = t('tokensSent');
			const body = `+${(AMOUNT_TOKEN.TEN_TOKENS * TOKEN_TO_AMOUNT.ONE_THOUNSAND).toLocaleString('vi-VN')}vnđ from ${prioritizedName}`;

			return new Notification(title, {
				body,
				icon: prioritizedAvatar ?? ''
			});
		}
	}, []);

	const onroleevent = useCallback(
		async (roleEvent: RoleEvent) => {
			if (userId === roleEvent.userId) return;

			const { role, status, user_add_ids = [], user_remove_ids = [] } = roleEvent;

			// Handle role assignments/removals
			if (user_add_ids.length) {
				dispatch(
					usersClanActions.updateManyRoleIds({
						clanId: role.clanId as string,
						updates: user_add_ids.map((id) => ({ userId: id, roleId: role.id as string }))
					})
				);
			}

			if (user_remove_ids.length) {
				dispatch(
					usersClanActions.removeManyRoleIds({
						clanId: role.clanId as string,
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
							clanId: role.clanId,
							title: role.title,
							color: role.color,
							roleIcon: role.roleIcon,
							slug: role.slug,
							description: role.description,
							creatorId: role.creatorId,
							active: role.active,
							displayOnline: role.displayOnline,
							allowMention: role.allowMention,
							role_channel_active: role.role_channel_active,
							channel_ids: role.channel_ids,
							max_level_permission: role.max_level_permission
						},
						clanId: role.clanId as string
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
						if (currentClanId === role.clanId) {
							dispatch(policiesActions.addPermissionCurrentClan(role));
						}
					}
				}

				dispatch(rolesClanActions.update({ role, clanId: role.clanId as string }));
				return;
			}

			// Handle role deletion
			if (status === EEventAction.DELETE) {
				dispatch(rolesClanActions.remove({ roleId: role.id as string, clanId: role.clanId as string }));
			}
		},
		[userId]
	);

	const onwebrtcsignalingfwd = useCallback(async (event: WebrtcSignalingFwd) => {
		// Define type 50 for clear call on all platforms
		const WEBRTC_CLEAR_CALL = 50;
		// Handle Group Call Events (>= 9)
		if (event.data_type >= 9 && event.data_type !== WEBRTC_CLEAR_CALL) {
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
				event?.channelId,
				userId || ''
			);
			return;
		}
		if (signalingType === WebrtcSignalingType.WEBRTC_SDP_QUIT || event.data_type === WEBRTC_CLEAR_CALL) {
			dispatch(DMCallActions.removeAll());
			dispatch(audioCallActions.reset());
			dispatch(DMCallActions.cancelCall({}));
			dispatch(audioCallActions.startDmCall(null));
			dispatch(audioCallActions.setUserCallId(''));
			dispatch(audioCallActions.setIsJoinedCall(false));
			dispatch(DMCallActions.setOtherCall({}));
			if (event.data_type !== WEBRTC_CLEAR_CALL) {
				socketRef.current?.forwardWebrtcSignaling(event?.caller_id, WEBRTC_CLEAR_CALL, '', event?.channelId, userId || '');
			} else if (event.data_type === WEBRTC_CLEAR_CALL) {
				// Force quit call for android
				dispatch(DMCallActions.setIsForceQuitCallNative(true));
			}
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

		if (signalingType <= 8 || event.data_type === WEBRTC_CLEAR_CALL) {
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
			if (userStatusEvent.userId !== userId) {
				dispatch(friendsActions.updateUserStatus({ userId: userStatusEvent.userId, userStatus: userStatusEvent.custom_status }));
			} else {
				dispatch(accountActions.updateUserStatus(userStatusEvent.custom_status));
			}

			dispatch(statusActions.updateStatus(userStatusEvent));

			dispatch(
				friendsActions.updateOnlineFriend({
					id: userStatusEvent.userId,
					online: !(userStatusEvent?.custom_status === EUserStatus.INVISIBLE)
				})
			);
		},
		[userId]
	);

	const oneventwebhook = useCallback(async (webhook_event: ApiWebhook) => {
		if (webhook_event.status === EEventAction.DELETE) {
			dispatch(webhookActions.removeOneWebhook({ clanId: webhook_event.clanId || '', webhookId: webhook_event.id || '' }));
		} else {
			dispatch(webhookActions.upsertWebhook(webhook_event));
		}
	}, []);

	const onclanupdated = useCallback(async (clanUpdatedEvent: ClanUpdatedEvent) => {
		if (!clanUpdatedEvent) return;
		dispatch(clansSlice.actions.update({ dataUpdate: clanUpdatedEvent }));
		if (clanUpdatedEvent.preventAnonymous) {
			const store = getStore();
			const clanIdActive = selectCurrentClanId(store.getState());
			dispatch(accountActions.turnOffAnonymous({ id: clanUpdatedEvent.clanId, topic: clanIdActive === clanUpdatedEvent.clanId }));
		}
	}, []);

	const onJoinChannelAppEvent = useCallback(async (joinChannelAppData: JoinChannelAppData) => {
		if (!joinChannelAppData) return;
		dispatch(channelAppSlice.actions.setJoinChannelAppData({ dataUpdate: joinChannelAppData }));
	}, []);

	const onsdtopicevent = useCallback(async (sdTopicEvent: SdTopicEvent) => {
		if (!sdTopicEvent) return;

		dispatch(
			messagesActions.updateToBeTopicMessage({
				channelId: sdTopicEvent?.channelId as string,
				messageId: sdTopicEvent?.messageId as string,
				topicId: sdTopicEvent?.id as string,
				creatorId: sdTopicEvent?.userId as string
			})
		);
		dispatch(
			topicsActions.addTopic({
				clanId: sdTopicEvent.clanId,
				topic: {
					id: sdTopicEvent.id,
					clanId: sdTopicEvent.clanId,
					channelId: sdTopicEvent.channelId,
					messageId: sdTopicEvent.messageId,
					lastSentMessage: sdTopicEvent.lastSentMessage,
					message: sdTopicEvent.message
				}
			})
		);
	}, []);

	const onblockfriend = useCallback(
		(blockFriend: BlockFriend) => {
			if (!blockFriend?.userId) {
				return;
			}
			dispatch(
				friendsActions.updateFriendState({
					userId: blockFriend.userId,
					sourceId: blockFriend.userId
				})
			);
		},
		[dispatch, userId]
	);

	const onunblockfriend = useCallback(
		(unblockFriend: UnblockFriend) => {
			if (!unblockFriend?.userId) {
				return;
			}
			dispatch(
				friendsActions.updateFriendState({
					userId: unblockFriend.userId
				})
			);
		},
		[dispatch]
	);

	const onMarkAsRead = useCallback(async (markAsReadEvent: MarkAsRead) => {
		const store = getStore();

		const channels = selectChannelThreads(store.getState() as RootState);
		if (!markAsReadEvent.categoryId) {
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
					clanId: markAsReadEvent.clanId,
					channelIds
				})
			);
			dispatch(clansActions.updateClanBadgeCount({ clanId: markAsReadEvent.clanId ?? '', count: 0, isReset: true }));
			dispatch(
				listChannelRenderAction.handleMarkAsReadListRender({
					type: EMarkAsReadType.CLAN,
					clanId: markAsReadEvent.clanId
				})
			);
			dispatch(listChannelsByUserActions.markAsReadChannel(channelIds));
			return;
		}
		if (!markAsReadEvent.channelId) {
			const channelsInCategory = channels.filter((channel) => channel.categoryId === markAsReadEvent.categoryId);

			const allChannelsAndThreads = channelsInCategory.flatMap((channel) => [channel, ...(channel.threads || [])]);

			const channelIds = allChannelsAndThreads.map((item) => item.id);

			const channelUpdates = channelIds.map((channelId) => ({
				channelId,
				messageId: selectLatestMessageId(store.getState(), channelId) || undefined
			}));
			dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelUpdates));
			dispatch(
				channelsActions.resetChannelsCount({
					clanId: markAsReadEvent.clanId as string,
					channelIds
				})
			);
			dispatch(
				listChannelRenderAction.handleMarkAsReadListRender({
					type: EMarkAsReadType.CATEGORY,
					clanId: markAsReadEvent.clanId as string,
					categoryId: markAsReadEvent.categoryId
				})
			);
			dispatch(listChannelsByUserActions.markAsReadChannel(channelIds));
		} else {
			const relatedChannels = channels.filter(
				(channel) => channel.id === markAsReadEvent.channelId || channel.parent_id === markAsReadEvent.channelId
			);

			const channelIds = relatedChannels.map((channel) => channel.id);

			const channelUpdates = channelIds.map((channelId) => ({
				channelId,
				messageId: selectLatestMessageId(store.getState(), channelId) || undefined
			}));
			dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelUpdates));
			dispatch(
				channelsActions.resetChannelsCount({
					clanId: markAsReadEvent.clanId as string,
					channelIds
				})
			);
			dispatch(
				clansActions.updateClanBadgeCountFromChannels({
					clanId: markAsReadEvent.clanId as string,
					channels: relatedChannels.map((channel) => ({
						channelId: channel.id,
						count: (channel.count_mess_unread ?? 0) * -1
					}))
				})
			);
			dispatch(
				listChannelRenderAction.handleMarkAsReadListRender({
					type: EMarkAsReadType.CHANNEL,
					clanId: markAsReadEvent.clanId as string,
					channelId: markAsReadEvent.channelId
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

			dispatch(listChannelsByUserActions.markAsReadChannel([markAsReadEvent.channelId, ...threadIds]));
		}
	}, []);

	const onaddfriend = useCallback((user: AddFriend) => {
		dispatch(friendsActions.upsertFriendRequest({ user, myId: userId || '' }));
		dispatch(
			listUsersByUserActions.updateUserInList({
				id: user?.userId,
				avatarUrl: user?.avatar,
				displayName: user?.displayName,
				username: user?.username
			})
		);
	}, []);

	const onbanneduser = useCallback((user: BannedUserEvent) => {
		if (user.action === 1) {
			dispatch(
				usersClanActions.addBannedUser({
					clanId: user.clanId,
					banner_id: user.banner_id,
					channelId: user.channelId,
					userIds: user?.userIds,
					ban_time: user?.ban_time
				})
			);
		} else {
			dispatch(usersClanActions.removeBannedUser({ clanId: user.clanId, channelId: user.channelId, userIds: user?.userIds }));
		}
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

export { ChatContext, ChatContextConsumer, ChatContextProvider, MobileEventEmitter };
