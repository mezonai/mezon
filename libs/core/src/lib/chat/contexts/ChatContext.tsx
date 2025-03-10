/* eslint-disable react-hooks/exhaustive-deps */
import { captureSentryError } from '@mezon/logger';
import {
	ActivitiesEntity,
	AttachmentEntity,
	ChannelsEntity,
	DMCallActions,
	RootState,
	ThreadsEntity,
	accountActions,
	acitvitiesActions,
	appActions,
	attachmentActions,
	audioCallActions,
	canvasAPIActions,
	channelAppSlice,
	channelMembers,
	channelMembersActions,
	channelMetaActions,
	channelsActions,
	channelsSlice,
	clanMembersMetaActions,
	clansActions,
	clansSlice,
	defaultNotificationCategoryActions,
	directActions,
	directMembersMetaActions,
	directMetaActions,
	directSlice,
	e2eeActions,
	emojiSuggestionActions,
	eventManagementActions,
	friendsActions,
	getDmEntityByChannelId,
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
	reactionActions,
	rolesClanActions,
	selectAllTextChannel,
	selectAllThreads,
	selectAllUserClans,
	selectChannelsByClanId,
	selectClanView,
	selectClickedOnTopicStatus,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentStreamInfo,
	selectCurrentTopicId,
	selectDmGroupCurrentId,
	selectModeResponsive,
	selectStreamMembersByChannelId,
	selectUserCallId,
	stickerSettingActions,
	threadsActions,
	toastActions,
	topicsActions,
	useAppDispatch,
	userChannelsActions,
	usersClanActions,
	usersStreamActions,
	voiceActions,
	webhookActions
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import {
	ADD_ROLE_CHANNEL_STATUS,
	AMOUNT_TOKEN,
	EEventAction,
	EEventStatus,
	EOverriddenPermission,
	ERepeatType,
	IMessageSendPayload,
	IMessageTypeCallLog,
	LIMIT,
	ModeResponsive,
	NotificationCode,
	TIME_OFFSET,
	TOKEN_TO_AMOUNT,
	ThreadStatus,
	TypeMessage,
	electronBridge
} from '@mezon/utils';
import isElectron from 'is-electron';
import {
	AddClanUserEvent,
	ChannelCreatedEvent,
	ChannelDeletedEvent,
	ChannelMessage,
	ChannelPresenceEvent,
	ChannelStreamMode,
	ChannelType,
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
	MessageButtonClicked,
	MessageTypingEvent,
	NotificationInfo,
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
	UnmuteEvent,
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
import { ApiChannelDescription, ApiCreateEventRequest, ApiGiveCoffeeEvent, ApiMessageReaction } from 'mezon-js/api.gen';
import { ApiChannelMessageHeader, ApiNotificationUserChannel, ApiPermissionUpdate, ApiTokenSentEvent, ApiWebhook } from 'mezon-js/dist/api.gen';
import { ChannelCanvas, RemoveFriend, SdTopicEvent } from 'mezon-js/socket';
import React, { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCustomNavigate } from '../hooks/useCustomNavigate';
import { useDirect } from '../hooks/useDirect';
import { useWindowFocusState } from '../hooks/useWindowFocusState';

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
	const { socketRef, reconnectWithTimeout } = useMezon();
	const { userId } = useAuth();
	const dispatch = useAppDispatch();
	const { createDirectMessageWithUser } = useDirect();

	const navigate = useCustomNavigate();
	// update later
	const { isFocusDesktop, isTabVisible } = useWindowFocusState();
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
			dispatch(voiceActions.remove(voice.id));
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
		audio.play().catch((error) => {
			console.error('Failed to play buzz sound:', error);
		});

		const timestamp = Math.round(Date.now() / 1000);

		if (mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL) {
			const store = getStore();
			const currentClanId = selectCurrentClanId(store.getState());
			dispatch(
				channelsActions.setBuzzState({
					clanId: currentClanId as string,
					channelId: channelId,
					buzzState: { isReset: true, senderId, timestamp }
				})
			);
		} else if (mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP) {
			dispatch(
				directActions.setBuzzStateDirect({
					channelId: channelId,
					buzzState: { isReset: true, senderId, timestamp }
				})
			);
		}
	}, []);

	const onchannelmessage = useCallback(
		async (message: ChannelMessage) => {
			const store = await getStoreAsync();
			// check mobile
			const isMobile = false;
			const currentDirectId = selectDmGroupCurrentId(store.getState());
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

				dispatch(messagesActions.addNewMessage(mess));
				if (mess.mode === ChannelStreamMode.STREAM_MODE_DM || mess.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
					const senderIsMe = userId === mess.sender_id;
					const newDm = await dispatch(directActions.addDirectByMessageWS(mess)).unwrap();
					const dmItemInChannelState = await dispatch(getDmEntityByChannelId({ channelId: mess.channel_id })).unwrap();
					if (!dmItemInChannelState.active) {
						if (senderIsMe) {
							const partnerId = dmItemInChannelState?.user_id?.[0] || '';
							await createDirectMessageWithUser(partnerId);
						} else {
							await createDirectMessageWithUser(mess.sender_id);
						}
					}
					!newDm && dispatch(directMetaActions.updateDMSocket(message));
					const isClanView = selectClanView(store.getState());

					const path = isElectron() ? window.location.hash : window.location.pathname;
					const isFriendPageView = path.includes('/chat/direct/friends');
					const isNotCurrentDirect =
						isFriendPageView ||
						isClanView ||
						!currentDirectId ||
						(currentDirectId && !RegExp(currentDirectId).test(message?.channel_id)) ||
						(isElectron() && isFocusDesktop === false) ||
						isTabVisible === false;

					if (isNotCurrentDirect) {
						dispatch(directActions.openDirectMessage({ channelId: message.channel_id, clanId: message.clan_id || '' }));
						dispatch(directMetaActions.setDirectLastSentTimestamp({ channelId: message.channel_id, timestamp }));
						if (
							((Array.isArray(message.mentions) && message.mentions.length === 0) ||
								message.mentions?.some((listUser) => listUser.user_id !== userId)) &&
							message.references?.at(0)?.message_sender_id !== userId
						) {
							dispatch(directMetaActions.setCountMessUnread({ channelId: message.channel_id, isMention: false }));
						}
					}

					if (mess.isMe) {
						dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: message.channel_id, timestamp }));
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
					}
					dispatch(
						channelMetaActions.setChannelLastSentTimestamp({ channelId: message.channel_id, timestamp, senderId: message.sender_id })
					);
					dispatch(listChannelsByUserActions.updateLastSentTime({ channelId: message.channel_id }));
					dispatch(threadsActions.updateLastSentInThread({ channelId: message.channel_id, lastSentTime: timestamp }));
				}
				// check
			} catch (error) {
				captureSentryError(message, 'onchannelmessage');
			}
		},
		[userId, isFocusDesktop, isTabVisible]
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
					const userStatusMap = new Map<string, { online: boolean; isMobile: boolean }>();

					statusPresenceQueue.current.forEach((event) => {
						event?.joins?.forEach((join) => {
							userStatusMap.set(join.user_id, { online: true, isMobile: join.is_mobile });
						});
						event?.leaves?.forEach((leave) => {
							userStatusMap.set(leave.user_id, { online: false, isMobile: false });
						});
					});

					const combinedStatus = Array.from(userStatusMap.entries()).map(([userId, status]) => ({
						userId,
						online: status.online,
						isMobile: status.isMobile
					}));

					if (combinedStatus.length) {
						dispatch(clanMembersMetaActions.setManyStatusUser(combinedStatus));
						dispatch(directActions.updateStatusByUserId(combinedStatus));
						dispatch(friendsActions.setManyStatusUser(combinedStatus));
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
		async (notification: NotificationInfo) => {
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

			if (
				(currentChannel?.channel_id !== notification?.channel_id && notification?.clan_id !== '0') ||
				isDirectViewPage ||
				isFriendPageView ||
				(isElectron() && isFocusDesktop === false) ||
				isTabVisible === false
			) {
				dispatch(notificationActions.add(mapNotificationToEntity(notification)));
				const isFriendPageView = path.includes('/chat/direct/friends');
				const isNotCurrentDirect =
					isFriendPageView ||
					isClanView ||
					!currentDirectId ||
					(currentDirectId && !RegExp(currentDirectId).test(notification?.channel_id || '')) ||
					(isElectron() && isFocusDesktop === false) ||
					isTabVisible === false;
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

			if (currentChannel?.channel_id === (notification as any).channel_id) {
				const timestamp = Date.now() / 1000;
				dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId: (notification as any).channel_id, timestamp: timestamp }));
			}

			if (notification.code === NotificationCode.FRIEND_REQUEST || notification.code === NotificationCode.FRIEND_ACCEPT) {
				dispatch(toastActions.addToast({ message: notification.subject, type: 'info', id: 'ACTION_FRIEND' }));
				// Fecth 2 API
				dispatch(friendsActions.fetchListFriends({ noCache: true }));
			}
		},
		[userId, isFocusDesktop, isTabVisible]
	);

	const onpinmessage = useCallback((pin: LastPinMessageEvent) => {
		if (!pin?.channel_id) return;

		if (pin.clan_id) {
			dispatch(channelsActions.setShowPinBadgeOfChannel({ clanId: pin.clan_id, channelId: pin.channel_id, isShow: true }));
		} else {
			dispatch(directActions.setShowPinBadgeOfDM({ dmId: pin?.channel_id, isShow: true }));
		}

		if (pin.operation === 1) {
			dispatch(pinMessageActions.clearPinMessagesCacheThunk(pin.channel_id));
		}
	}, []);

	const oneventnotiuserchannel = useCallback(
		(notiUserChannel: ApiNotificationUserChannel) => {
			dispatch(notificationSettingActions.upsertNotiSetting(notiUserChannel));
		},
		[dispatch]
	);

	const onlastseenupdated = useCallback(async (lastSeenMess: LastSeenMessageEvent) => {
		const timestamp = Date.now() / 1000;
		dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId: lastSeenMess.channel_id, timestamp: timestamp + TIME_OFFSET }));
		await dispatch(clansActions.updateBageClanWS({ channel_id: lastSeenMess.channel_id ?? '' }));
		dispatch(
			channelsActions.updateChannelBadgeCount({ clanId: lastSeenMess.clan_id, channelId: lastSeenMess.channel_id, count: 0, isReset: true })
		);
		dispatch(
			listChannelsByUserActions.updateChannelBadgeCount({
				channelId: lastSeenMess.channel_id,
				count: 0,
				isReset: true
			})
		);
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: lastSeenMess.channel_id, timestamp: timestamp }));
	}, []);

	const onuserchannelremoved = useCallback(
		async (user: UserChannelRemovedEvent) => {
			const store = await getStoreAsync();
			const channelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const directId = selectDmGroupCurrentId(store.getState());
			const clanId = selectCurrentClanId(store.getState());
			user?.user_ids.forEach((userID: string) => {
				if (userID === userId) {
					if (channelId === user.channel_id) {
						navigate(`/chat/clans/${clanId}`);
					}
					if (directId === user.channel_id) {
						navigate(`/chat/direct/friends`);
					}
					dispatch(directSlice.actions.removeByDirectID(user.channel_id));
					// TODO:  backend send clan_id
					dispatch(channelsSlice.actions.removeByChannelID({ channelId: user.channel_id, clanId: clanId as string }));
					dispatch(listChannelsByUserActions.remove(userID));
					dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: user.channel_id, clanId: user.clan_id }));
					dispatch(directMetaActions.remove(user.channel_id));
				} else {
					if (user.channel_type === ChannelType.CHANNEL_TYPE_GROUP) {
						dispatch(directActions.removeByUserId({ userId: userID, currentUserId: userId as string, channelId: user.channel_id }));
						// TODO: remove member group
					}
				}
				dispatch(channelMembers.actions.remove({ userId: userID, channelId: user.channel_id }));
				dispatch(userChannelsActions.remove(userID));
			});
		},
		[userId]
	);
	const onuserclanremoved = useCallback(
		async (user: UserClanRemovedEvent) => {
			const store = await getStoreAsync();
			const channels = selectChannelsByClanId(store.getState() as unknown as RootState, user.clan_id as string);
			const clanId = selectCurrentClanId(store.getState());
			user?.user_ids.forEach((id: any) => {
				if (id === userId) {
					if (clanId === user.clan_id) {
						navigate(`/chat/direct/friends`);
					}
					dispatch(clansSlice.actions.removeByClanID(user.clan_id));
					dispatch(listChannelsByUserActions.remove(id));
				} else {
					dispatch(
						channelMembers.actions.removeUserByUserIdAndClan({
							userId: id,
							channelIds: channels.map((item) => item.id),
							clanId: user.clan_id
						})
					);
					dispatch(usersClanActions.remove(id));
					dispatch(rolesClanActions.updateRemoveUserRole(id));
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
			const channelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const currentClanId = selectCurrentClanId(store.getState());

			const userIds = users.map((u) => u.user_id);
			const user = users?.find((user) => user.user_id === userId);
			if (user) {
				if (channel_desc.type === ChannelType.CHANNEL_TYPE_CHANNEL || channel_desc.type === ChannelType.CHANNEL_TYPE_THREAD) {
					const channel = { ...channel_desc, id: channel_desc.channel_id as string };
					dispatch(channelsActions.add({ clanId: channel_desc.clan_id as string, channel: { ...channel, active: 1 } }));
					dispatch(listChannelsByUserActions.add(channel));

					if (channel_desc.type === ChannelType.CHANNEL_TYPE_CHANNEL) {
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

						if (channel.parent_id === channelId) {
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

							const store = await getStoreAsync();
							const allThreads = selectAllThreads(store.getState());
							const defaultThreadList: ApiChannelDescription[] = [
								thread as ApiChannelDescription,
								...((allThreads || []) as ApiChannelDescription[])
							];
							dispatch(
								threadsActions.updateCacheOnThreadCreation({
									clanId: channel.clan_id || '',
									channelId: channel.parent_id || '',
									defaultThreadList: defaultThreadList.length > LIMIT ? defaultThreadList.slice(0, -1) : defaultThreadList
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
				if (channel_desc.type !== ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
					dispatch(
						channelsActions.joinChat({
							clanId: clan_id,
							channelId: channel_desc.channel_id as string,
							channelType: channel_desc.type as number,
							isPublic: !channel_desc.channel_private
						})
					);
				}
			}

			if (channel_desc.type === ChannelType.CHANNEL_TYPE_GROUP) {
				dispatch(
					directActions.addGroupUserWS({
						channel_desc: { ...channel_desc, create_time_seconds: create_time_second },
						users: [...users].filter((item) => item.user_id !== userId)
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

				dispatch(usersClanActions.upsertMany(members));

				dispatch(
					channelMembersActions.addNewMember({
						channel_id: channel_desc.channel_id as string,
						user_ids: userIds
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
		const currentChannel = selectCurrentChannel(store.getState() as unknown as RootState);
		const modeResponsive = selectModeResponsive(store.getState() as unknown as RootState);

		if (modeResponsive === ModeResponsive.MODE_DM || currentChannel?.channel_private) {
			return;
		}

		const currentClanId = selectCurrentClanId(store.getState());
		if (userJoinClan?.user && currentClanId === userJoinClan.clan_id) {
			const createTime = new Date(userJoinClan.user.create_time_second * 1000).toISOString();
			dispatch(
				usersClanActions.add({
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
						create_time: createTime
					}
				})
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
		(eventEmoji: EventEmoji) => {
			if (eventEmoji.action === EEventAction.CREATED) {
				dispatch(
					emojiSuggestionActions.add({
						category: eventEmoji.clan_name,
						clan_id: eventEmoji.clan_id,
						creator_id: eventEmoji.user_id,
						id: eventEmoji.id,
						shortname: eventEmoji.short_name,
						src: eventEmoji.source,
						logo: eventEmoji.logo,
						clan_name: eventEmoji.clan_name
					})
				);
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
					clanAvt: ClanProfileUpdates.clan_avatar
				})
			);
		},
		[dispatch]
	);

	const oncustomstatus = useCallback(
		(statusEvent: CustomStatusEvent) => {
			dispatch(channelMembersActions.setCustomStatusUser({ userId: statusEvent?.user_id, customStatus: statusEvent?.status }));
		},
		[dispatch]
	);

	const ontokensent = useCallback(
		(tokenEvent: ApiTokenSentEvent) => {
			dispatch(giveCoffeeActions.handleSocketToken({ currentUserId: userId as string, tokenEvent }));
			const isReceiverGiveCoffee = tokenEvent.receiver_id === userId;
			const isSenderGiveCoffee = tokenEvent.sender_id === userId;

			const updateAmount =
				tokenEvent.amount !== undefined ? (isReceiverGiveCoffee ? tokenEvent.amount : isSenderGiveCoffee ? -tokenEvent.amount : 0) : 0;

			dispatch(accountActions.updateWalletByAction((currentValue) => currentValue + updateAmount));
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
					channelId: e.channel_id,
					userId: e.sender_id,
					isTyping: true
				})
			);
		},
		[dispatch, userId]
	);

	const onmessagereaction = useCallback(async (e: ApiMessageReaction) => {
		const reactionEntity = mapReactionToEntity(e);
		const store = await getStoreAsync();
		const isFocusTopicBox = selectClickedOnTopicStatus(store.getState());
		const currenTopicId = selectCurrentTopicId(store.getState());
		if (reactionEntity.topic_id && reactionEntity.topic_id !== '0' && isFocusTopicBox && currenTopicId) {
			reactionEntity.channel_id = reactionEntity.topic_id ?? '';
		}

		dispatch(reactionActions.setReactionDataSocket(reactionEntity));
		dispatch(messagesActions.updateMessageReactions(reactionEntity));
	}, []);

	const onchannelcreated = useCallback(async (channelCreated: ChannelCreatedEvent) => {
		if (channelCreated.parent_id) {
			const store = await getStoreAsync();
			const allThreads = selectAllThreads(store.getState());

			const now = Date.now() / 1000;
			const newThread = {
				...channelCreated,
				type: channelCreated.channel_type,
				last_sent_message: {
					sender_id: channelCreated.creator_id,
					timestamp_seconds: now
				},
				active: channelCreated.creator_id === userId ? ThreadStatus.joined : ThreadStatus.activePublic
			};
			const defaultThreadList: ApiChannelDescription[] = [newThread, ...((allThreads || []) as ApiChannelDescription[])];

			dispatch(
				threadsActions.updateCacheOnThreadCreation({
					clanId: channelCreated.clan_id,
					channelId: channelCreated.parent_id,
					defaultThreadList: defaultThreadList.length > LIMIT ? defaultThreadList.slice(0, -1) : defaultThreadList
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
					status: channelCreated.status,
					app_url: channelCreated.app_url,
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

			if (channelCreated.channel_type !== ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
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
						isPublic: isPublic
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
			}
		} else if (channelCreated.creator_id === userId) {
			dispatch(
				listChannelsByUserActions.addOneChannel({
					id: channelCreated.channel_id,
					type: channelCreated.channel_type,
					...channelCreated
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
		},
		[userId]
	);

	const onchanneldeleted = useCallback(
		async (channelDeleted: ChannelDeletedEvent) => {
			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const clanId = selectCurrentClanId(store.getState());
			const allThreads = selectAllThreads(store.getState());

			const newAllThreads = allThreads.filter((thread) => thread.id !== channelDeleted.channel_id);

			if (channelDeleted?.deletor === userId) {
				dispatch(channelsActions.deleteChannelSocket(channelDeleted));
				dispatch(listChannelsByUserActions.remove(channelDeleted.channel_id));
				dispatch(listChannelRenderAction.updateClanBadgeRender({ channelId: channelDeleted.channel_id, clanId: channelDeleted.clan_id }));
				dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: channelDeleted.channel_id, clanId: channelDeleted.clan_id }));
				dispatch(threadsActions.remove(channelDeleted.channel_id));

				dispatch(
					threadsActions.updateCacheOnThreadCreation({
						clanId: channelDeleted.clan_id,
						channelId: channelDeleted?.parent_id || '',
						defaultThreadList: newAllThreads as ApiChannelDescription[]
					})
				);

				return;
			}
			if (channelDeleted) {
				if (channelDeleted.channel_id === currentChannelId) {
					navigate(`/chat/clans/${clanId}`);
				}
				dispatch(channelsActions.deleteChannelSocket(channelDeleted));
				dispatch(listChannelsByUserActions.remove(channelDeleted.channel_id));
				dispatch(listChannelRenderAction.updateClanBadgeRender({ channelId: channelDeleted.channel_id, clanId: channelDeleted.clan_id }));
				dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: channelDeleted.channel_id, clanId: channelDeleted.clan_id }));

				dispatch(
					threadsActions.updateCacheOnThreadCreation({
						clanId: channelDeleted.clan_id,
						channelId: channelDeleted?.parent_id || '',
						defaultThreadList: newAllThreads as ApiChannelDescription[]
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
			}
		},
		[dispatch, userId]
	);

	const onchannelupdated = useCallback(
		(channelUpdated: ChannelUpdatedEvent) => {
			channelUpdated.channel_private = channelUpdated.channel_private ? 1 : 0;
			if (channelUpdated.is_error) {
				return dispatch(channelsActions.deleteChannel({ channelId: channelUpdated.channel_id, clanId: channelUpdated.clan_id as string }));
			}

			if (channelUpdated.clan_id === '0') {
				if (channelUpdated?.e2ee && channelUpdated.creator_id !== userId) {
					dispatch(e2eeActions.setOpenModalE2ee(true));
				}
				return dispatch(directActions.updateOne({ ...channelUpdated, currentUserId: userId }));
			}

			if (channelUpdated) {
				//TODO: improve update once item
				if (channelUpdated.channel_private !== undefined) {
					dispatch(channelsActions.updateChannelPrivateSocket(channelUpdated));
					const channel = { ...channelUpdated, type: channelUpdated.channel_type, id: channelUpdated.channel_id as string, clan_name: '' };

					if (channelUpdated.creator_id === userId) {
						dispatch(
							channelsActions.update({
								clanId: channelUpdated.clan_id,
								update: {
									id: channelUpdated.channel_id,
									changes: { ...channelUpdated }
								}
							})
						);
						dispatch(listChannelsByUserActions.upsertOne({ id: channelUpdated.channel_id, ...channelUpdated }));
						dispatch(
							listChannelRenderAction.updateChannelInListRender({
								channelId: channelUpdated.channel_id,
								clanId: channelUpdated.clan_id as string,
								dataUpdate: { ...channelUpdated }
							})
						);
					} else {
						if (channelUpdated.channel_private) {
							dispatch(channelsActions.remove({ channelId: channelUpdated.channel_id, clanId: channelUpdated.clan_id as string }));
							dispatch(listChannelsByUserActions.remove(channelUpdated.channel_id));
							dispatch(
								listChannelRenderAction.deleteChannelInListRender({
									channelId: channelUpdated.channel_id,
									clanId: channelUpdated.clan_id as string
								})
							);
						} else {
							dispatch(
								channelsActions.add({
									clanId: channelUpdated.clan_id as string,
									channel: { ...channel, active: 1, id: channel.channel_id }
								})
							);
							dispatch(
								channelsActions.createChannelSocket({
									...channel
								})
							);
							dispatch(listChannelsByUserActions.upsertOne({ ...channel }));
							if (channel.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
								dispatch(
									listChannelRenderAction.addThreadToListRender({
										clanId: channel.clan_id,
										channel: { id: channelUpdated.channel_id, ...channelUpdated }
									})
								);
							} else {
								dispatch(
									listChannelRenderAction.addChannelToListRender({
										type: channel.type,
										...channelUpdated
									})
								);
							}

							if (channel.type === ChannelType.CHANNEL_TYPE_CHANNEL || channel.type === ChannelType.CHANNEL_TYPE_THREAD) {
								if (channel.parent_id) {
									dispatch(
										threadsActions.updateActiveCodeThread({
											channelId: channel.channel_id || '',
											activeCode: ThreadStatus.joined
										})
									);
								}
							}
						}
					}
				} else {
					dispatch(channelsActions.updateChannelSocket(channelUpdated));
				}
				if (channelUpdated.app_url) {
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
					dispatch(channelsActions.addThreadToChannels({ clanId: channelUpdated.clan_id, channelId: channelUpdated.channel_id }));
				}
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
		const store = await getStoreAsync();
		const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);

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
				notificationSettingActions.setMuteNotificationSetting({
					channel_id: unmuteEvent.channel_id,
					active: 1,
					clan_id: unmuteEvent.clan_id,
					is_current_channel: unmuteEvent.channel_id === currentChannelId
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

			// Check repeat
			const isEventNotRepeat =
				eventCreatedEvent.repeat_type === ERepeatType.DOES_NOT_REPEAT || eventCreatedEvent.repeat_type === ERepeatType.DEFAULT;

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

			const title = 'Balance notifications:';
			const body = `+${(AMOUNT_TOKEN.TEN_TOKENS * TOKEN_TO_AMOUNT.ONE_THOUNSAND).toLocaleString('vi-VN')}vnđ from ${prioritizedName}`;

			electronBridge.pushNotification(title, {
				body: body,
				icon: prioritizedAvatar,
				data: {
					link: ''
				}
			});
		}
	}, []);

	const onroleevent = useCallback(
		async (roleEvent: RoleEvent) => {
			if (userId === roleEvent.user_id) return;

			const { role, status, user_add_ids = [], user_remove_ids = [] } = roleEvent;

			// Handle role assignments/removals
			if (user_add_ids.length) {
				dispatch(usersClanActions.updateManyRoleIds(user_add_ids.map((id) => ({ userId: id, roleId: role.id as string }))));
			}

			if (user_remove_ids.length) {
				dispatch(usersClanActions.removeManyRoleIds(user_remove_ids.map((id) => ({ userId: id, roleId: role.id as string }))));
			}

			// Handle new role creation
			if (status === EEventAction.CREATED && role) {
				dispatch(
					rolesClanActions.add({
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

					if (isUserResult) {
						if (user_add_ids.includes(userId as string)) {
							dispatch(
								policiesActions.updateOne({
									id: role.id as string,
									changes: { title: role.title }
								})
							);
						} else {
							dispatch(policiesActions.removeOne(role.id as string));
						}
					}
				}

				dispatch(rolesClanActions.update(role));
				return;
			}

			// Handle role deletion
			if (status === EEventAction.DELETE) {
				const isUserResult = await dispatch(
					rolesClanActions.updatePermissionUserByRoleId({
						roleId: role.id as string,
						userId: userId as string
					})
				).unwrap();

				if (isUserResult) {
					dispatch(policiesActions.removeOne(role.id as string));
				}
				dispatch(rolesClanActions.remove(role.id as string));
			}
		},
		[userId]
	);

	const onwebrtcsignalingfwd = useCallback(async (event: WebrtcSignalingFwd) => {
		// TODO: AND TYPE IN BE
		// TYPE = 4: USER CANCEL CALL
		// TYPE = 0: USER JOINED CALL
		// TYPE = 5: OTHER CALL
		const store = await getStoreAsync();
		const userCallId = selectUserCallId(store.getState() as unknown as RootState);

		if (userCallId && userCallId !== event?.caller_id) {
			socketRef.current?.forwardWebrtcSignaling(event?.caller_id, 5, '', event?.channel_id, userId || '');
			return;
		}
		if (event?.data_type === 4) {
			dispatch(DMCallActions.cancelCall({}));
			dispatch(audioCallActions.startDmCall({}));
			dispatch(audioCallActions.setUserCallId(''));
			dispatch(audioCallActions.setIsJoinedCall(false));
			dispatch(DMCallActions.setOtherCall({}));
		}
		if (event?.data_type === 0) {
			dispatch(audioCallActions.setIsJoinedCall(true));
		}
		if (event?.data_type === 5) {
			dispatch(audioCallActions.setIsBusyTone(true));
		}
		dispatch(
			DMCallActions.addOrUpdate({
				calleeId: event?.receiver_id,
				signalingData: event,
				id: event?.caller_id,
				callerId: event?.caller_id
			})
		);
	}, []);

	const onuserstatusevent = useCallback(
		async (userStatusEvent: UserStatusEvent) => {
			if (userStatusEvent.user_id !== userId) {
				dispatch(clanMembersMetaActions.updateUserStatus({ userId: userStatusEvent.user_id, user_status: userStatusEvent.custom_status }));
				dispatch(directMembersMetaActions.updateUserStatus({ userId: userStatusEvent.user_id, user_status: userStatusEvent.custom_status }));
				dispatch(friendsActions.updateUserStatus({ userId: userStatusEvent.user_id, user_status: userStatusEvent.custom_status }));
			}
		},
		[userId]
	);

	const oneventwebhook = useCallback(async (webhook_event: ApiWebhook) => {
		if (webhook_event.status === EEventAction.DELETE) {
			dispatch(webhookActions.removeOneWebhook({ channelId: webhook_event.channel_id || '', webhookId: webhook_event.id || '' }));
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

			socket.onchanneldeleted = onchanneldeleted;

			socket.onchannelupdated = onchannelupdated;

			socket.onuserprofileupdate = onuserprofileupdate;

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

			socket.onJoinChannelAppEvent = onJoinChannelAppEvent;

			socket.onsdtopicevent = onsdtopicevent;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			onchannelcreated,
			onchanneldeleted,
			onchannelmessage,
			onchannelpresence,
			onchannelupdated,
			onuserprofileupdate,
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
			onsdtopicevent
		]
	);

	const timerIdRef = useRef<NodeJS.Timeout | null>(null);

	const handleReconnect = useCallback(
		async (socketType: string) => {
			if (timerIdRef.current) {
				clearTimeout(timerIdRef.current);
			}
			timerIdRef.current = setTimeout(async () => {
				if (socketRef.current?.isOpen()) return;
				const id = Date.now().toString();
				const errorMessage = 'Cannot reconnect to the socket. Please restart the app.';
				try {
					const store = getStore();
					const clanIdActive = selectCurrentClanId(store.getState());
					const socket = await reconnectWithTimeout(clanIdActive ?? '');

					if (socket === 'RECONNECTING') return;

					if (!socket) {
						dispatch(toastActions.addToast({ message: errorMessage, type: 'warning', autoClose: false }));
						throw Error('socket not init');
					}
					dispatch(appActions.refreshApp({ id }));
					setCallbackEventFn(socket as Socket);
				} catch (error) {
					// eslint-disable-next-line no-console
					dispatch(toastActions.addToast({ message: errorMessage, type: 'warning', autoClose: false }));
					captureSentryError(error, 'SOCKET_RECONNECT');
				}
			}, 5000);
		},
		[reconnectWithTimeout, setCallbackEventFn]
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
			socket.onJoinChannelAppEvent = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onsdtopicevent = () => {};
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
		onchanneldeleted,
		onchannelupdated,
		onuserprofileupdate,
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
		onsdtopicevent
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
