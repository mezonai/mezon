/* eslint-disable react-hooks/exhaustive-deps */
import { captureSentryError } from '@mezon/logger';
import {
	ActivitiesEntity,
	AttachmentEntity,
	DMCallActions,
	RootState,
	accountActions,
	acitvitiesActions,
	appActions,
	attachmentActions,
	audioCallActions,
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
	giveCoffeeActions,
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
	selectAllUserClans,
	selectChannelsByClanId,
	selectClanView,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentStreamInfo,
	selectDmGroupCurrentId,
	selectModeResponsive,
	selectSFUMembersByChannelId,
	selectStreamMembersByChannelId,
	selectUserCallId,
	sfuMembersActions,
	stickerSettingActions,
	toastActions,
	topicsActions,
	useAppDispatch,
	useAppSelector,
	userChannelsActions,
	usersClanActions,
	usersStreamActions,
	voiceActions
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
	CustomStatusEvent,
	EventEmoji,
	LastPinMessageEvent,
	LastSeenMessageEvent,
	ListActivity,
	MessageButtonClicked,
	MessageTypingEvent,
	Notification,
	PermissionChangedEvent,
	PermissionSet,
	RoleEvent,
	SFUSignalingFwd,
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
import { ApiCreateEventRequest, ApiGiveCoffeeEvent, ApiMessageReaction } from 'mezon-js/api.gen';
import { ApiChannelMessageHeader, ApiPermissionUpdate, ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { RemoveFriend } from 'mezon-js/socket';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector, useStore } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAppParams } from '../../app/hooks/useAppParams';
import { useAuth } from '../../auth/hooks/useAuth';
import { useWindowFocusState } from '../hooks/useWindowFocusState';

type ChatContextProviderProps = {
	children: React.ReactNode;
};

export type ChatContextValue = {
	setCallbackEventFn: (socket: Socket) => void;
	handleReconnect: (socketType: string) => void;
};

const ChatContext = React.createContext<ChatContextValue>({} as ChatContextValue);

const ChatContextProvider: React.FC<ChatContextProviderProps> = ({ children }) => {
	const { socketRef, reconnectWithTimeout } = useMezon();
	const { userId } = useAuth();
	const store = useStore();
	const currentChannel = useSelector(selectCurrentChannel);
	const { directId, channelId, clanId } = useAppParams();
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentDirectId = useSelector(selectDmGroupCurrentId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const modeResponsive = useSelector(selectModeResponsive);
	const channels = useAppSelector((state) => selectChannelsByClanId(state, currentClanId ?? ''));

	const navigate = useNavigate();
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const streamChannelMember = useSelector(selectStreamMembersByChannelId(currentStreamInfo?.streamId || ''));
	const pttMembers = useSelector(selectSFUMembersByChannelId(channelId || ''));
	const { isFocusDesktop, isTabVisible } = useWindowFocusState();
	const userCallId = useSelector(selectUserCallId);
	const isClanView = useSelector(selectClanView);

	const clanIdActive = useMemo(() => {
		if (clanId !== undefined || currentClanId) {
			return currentClanId;
		} else {
			return '0';
		}
	}, [clanId, currentClanId]);

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

	const onstreamingchanneljoined = useCallback(
		(user: StreamingJoinedEvent) => {
			const existingMember = streamChannelMember?.find((member) => member?.user_id === user?.user_id);
			if (existingMember) {
				dispatch(usersStreamActions.remove(existingMember?.id));
			}
			dispatch(usersStreamActions.add(user));
		},
		[dispatch, streamChannelMember]
	);

	const onstreamingchannelleaved = useCallback(
		(user: StreamingLeavedEvent) => {
			dispatch(usersStreamActions.remove(user.streaming_user_id));
		},
		[dispatch]
	);

	const onsfusignalingfwd = useCallback(
		(user: SFUSignalingFwd) => {
			const existingMember = pttMembers?.find((member) => member?.user_id === user?.user_id);
			if (existingMember) {
				dispatch(sfuMembersActions.remove(existingMember?.id));
			}
			// TODO:
			//dispatch(sfuMembersActions.add(user));
		},
		[dispatch, pttMembers]
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

	const handleBuzz = useCallback(
		(channelId: string, senderId: string, isReset: boolean, mode: ChannelStreamMode | undefined) => {
			const audio = new Audio('assets/audio/buzz.mp3');
			audio.play().catch((error) => {
				console.error('Failed to play buzz sound:', error);
			});

			const timestamp = Math.round(Date.now() / 1000);

			if (mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL) {
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
		},
		[currentClanId]
	);

	const onchannelmessage = useCallback(
		async (message: ChannelMessage) => {
			if (message.code === TypeMessage.MessageBuzz) {
				handleBuzz(message.channel_id, message.sender_id, true, message.mode);
			}
			if (message.topic_id && message.topic_id !== '0') {
				const lastMsg: ApiChannelMessageHeader = {
					content: message.content,
					sender_id: message.sender_id,
					timestamp_seconds: message.create_time_seconds
				};
				dispatch(topicsActions.setTopicLastSent({ topicId: message.topic_id || '', lastSentMess: lastMsg }));
			}

			try {
				const senderId = message.sender_id;
				const timestamp = Date.now() / 1000;
				const mess = await dispatch(mapMessageChannelToEntityAction({ message, lock: true })).unwrap();
				mess.isMe = senderId === userId;

				if ((message.content as IMessageSendPayload).callLog?.callLogType === IMessageTypeCallLog.STARTCALL && mess.isMe) {
					dispatch(DMCallActions.setCallMessageId(message?.message_id));
				}

				const isMobile = directId === undefined && channelId === undefined;
				mess.isCurrentChannel = message.channel_id === directId || (isMobile && message.channel_id === currentDirectId);

				if ((directId === undefined && !isMobile) || (isMobile && !currentDirectId)) {
					const idToCompare = !isMobile ? channelId : currentChannelId;
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
					const newDm = await dispatch(directActions.addDirectByMessageWS(mess)).unwrap();
					!newDm && dispatch(directMetaActions.updateDMSocket(message));

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
					}
					dispatch(channelMetaActions.setChannelLastSentTimestamp({ channelId: message.channel_id, timestamp }));
					dispatch(listChannelsByUserActions.updateLastSentTime({ channelId: message.channel_id }));
				}
				// check
			} catch (error) {
				captureSentryError(message, 'onchannelmessage');
			}
		},
		[userId, directId, currentDirectId, isClanView, channelId, currentChannelId, currentClanId, isFocusDesktop, isTabVisible]
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
	const onnotification = useCallback(
		async (notification: Notification) => {
			const path = isElectron() ? window.location.hash : window.location.pathname;
			const isFriendPageView = path.includes('/chat/direct/friends');
			const isDirectViewPage = path.includes('/chat/direct/message/');

			if (
				(currentChannel?.channel_id !== (notification as any).channel_id && (notification as any).clan_id !== '0') ||
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
					(currentDirectId && !RegExp(currentDirectId).test((notification as any).channel_id)) ||
					(isElectron() && isFocusDesktop === false) ||
					isTabVisible === false;
				if (notification.code === NotificationCode.USER_MENTIONED || notification.code === NotificationCode.USER_REPLIED) {
					dispatch(clansActions.updateClanBadgeCount({ clanId: (notification as any).clan_id, count: 1 }));
					dispatch(
						channelsActions.updateChannelBadgeCount({
							clanId: (notification as any).clan_id,
							channelId: (notification as any).channel_id ?? '',
							count: 1
						})
					);

					if (isNotCurrentDirect) {
						dispatch(directMetaActions.setCountMessUnread({ channelId: (notification as any).channel_id ?? '', isMention: true }));
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
		[userId, isClanView, directId, currentDirectId, channelId, currentChannelId, currentClanId, isFocusDesktop, isTabVisible]
	);

	const onpinmessage = useCallback(
		(pin: LastPinMessageEvent) => {
			if (!pin?.channel_id) return;

			if (pin.clan_id) {
				dispatch(channelsActions.setShowPinBadgeOfChannel({ clanId: pin.clan_id, channelId: pin.channel_id, isShow: true }));
			} else {
				dispatch(directActions.setShowPinBadgeOfDM({ dmId: pin?.channel_id, isShow: true }));
			}

			if (pin.operation === 1) {
				dispatch(pinMessageActions.clearPinMessagesCacheThunk(pin.channel_id));
			}
		},
		[currentChannel?.channel_id, dispatch]
	);

	const onlastseenupdated = useCallback(async (lastSeenMess: LastSeenMessageEvent) => {
		const timestamp = Date.now() / 1000;
		dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId: lastSeenMess.channel_id, timestamp: timestamp + TIME_OFFSET }));
		await dispatch(clansActions.updateBageClanWS({ channel_id: lastSeenMess.channel_id ?? '' }));
		dispatch(
			channelsActions.updateChannelBadgeCount({ clanId: lastSeenMess.clan_id, channelId: lastSeenMess.channel_id, count: 0, isReset: true })
		);
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: lastSeenMess.channel_id, timestamp: timestamp }));
	}, []);

	const onuserchannelremoved = useCallback(
		(user: UserChannelRemovedEvent) => {
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
				} else {
					if (user.channel_type === ChannelType.CHANNEL_TYPE_GROUP) {
						dispatch(directActions.removeByUserId({ userId: userID, currentUserId: userId as string }));
						// TODO: remove member group
					}
				}
				dispatch(channelMembers.actions.remove({ userId: userID, channelId: user.channel_id }));
				dispatch(userChannelsActions.remove(userID));
			});
		},
		[channelId, clanId, dispatch, navigate, userId, directId]
	);
	const onuserclanremoved = useCallback(
		(user: UserClanRemovedEvent) => {
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
		[userId, clanId, navigate, dispatch]
	);

	const onuserchanneladded = useCallback(
		async (userAdds: UserChannelAddedEvent) => {
			if (!userAdds?.channel_desc) return;
			const { channel_desc, users, clan_id, create_time_second, caller } = userAdds;

			const userIds = users.map((u) => u.user_id);
			const user = users?.find((user) => user.user_id === userId);
			if (user) {
				if (channel_desc.type === ChannelType.CHANNEL_TYPE_CHANNEL || channel_desc.type === ChannelType.CHANNEL_TYPE_THREAD) {
					const channel = { ...channel_desc, id: channel_desc.channel_id as string };
					dispatch(channelsActions.add({ clanId: channel_desc.clan_id as string, channel: { ...channel, active: 1 } }));
					dispatch(listChannelsByUserActions.add(channel));
				}
				if (channel_desc.type !== ChannelType.CHANNEL_TYPE_VOICE) {
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

			if (channel_desc.type == ChannelType.CHANNEL_TYPE_GROUP) {
				dispatch(
					directActions.addGroupUserWS({
						channel_desc: { ...channel_desc, create_time_seconds: create_time_second },
						users: [...users].filter((item) => item.user_id !== userId)
					})
				);
			}

			if (clanIdActive === clan_id) {
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
				dispatch(userChannelsActions.upsertMany(userIds));
			}
		},
		[userId, clanIdActive, dispatch]
	);

	const onuserclanadded = useCallback(
		(userJoinClan: AddClanUserEvent) => {
			if (modeResponsive === ModeResponsive.MODE_DM || currentChannel?.channel_private) {
				return;
			}
			if (userJoinClan?.user && clanIdActive === userJoinClan.clan_id) {
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
		},
		[clanIdActive, currentChannel?.channel_private, dispatch]
	);

	const onremovefriend = useCallback((userId: RemoveFriend) => {
		//TODO: thanh.levan
		// eslint-disable-next-line no-console
		console.log('userId: ', userId);
	}, []);

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

	const onmessagereaction = useCallback(
		(e: ApiMessageReaction) => {
			if (e.count > 0) {
				const reactionEntity = mapReactionToEntity(e);
				dispatch(reactionActions.setReactionDataSocket(reactionEntity));
				dispatch(messagesActions.updateMessageReactions(reactionEntity));
			}
		},
		[dispatch]
	);

	const onchannelcreated = useCallback(
		(channelCreated: ChannelCreatedEvent) => {
			if (channelCreated.creator_id === userId) return;
			if (channelCreated && channelCreated.channel_private === 0 && (channelCreated.parrent_id === '' || channelCreated.parrent_id === '0')) {
				dispatch(channelsActions.createChannelSocket(channelCreated));
				dispatch(listChannelsByUserActions.upsertOne({ id: channelCreated.channel_id, ...channelCreated }));

				if (channelCreated.channel_type !== ChannelType.CHANNEL_TYPE_VOICE) {
					const now = Math.floor(Date.now() / 1000);
					const extendChannelCreated = {
						...channelCreated,
						last_seen_message: { timestamp_seconds: 0 },
						last_sent_message: { timestamp_seconds: now }
					};

					const isPublic = channelCreated.parrent_id !== '' && channelCreated.parrent_id !== '0' ? false : !channelCreated.channel_private;
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
								isMute: false
							}
						])
					);
				}
			}
		},
		[dispatch]
	);

	const onclandeleted = useCallback(
		(clanDelete: ClanDeletedEvent) => {
			if (!clanDelete?.clan_id) return;
			dispatch(listChannelsByUserActions.removeByClanId({ clanId: clanDelete.clan_id }));
			dispatch(stickerSettingActions.removeStickersByClanId(clanDelete.clan_id));
			if (clanDelete.deletor !== userId && currentClanId === clanDelete.clan_id) {
				navigate(`/chat/direct/friends`);
				dispatch(clansSlice.actions.removeByClanID(clanDelete.clan_id));
			}
		},
		[currentClanId, dispatch, navigate, userId]
	);

	const onchanneldeleted = useCallback(
		(channelDeleted: ChannelDeletedEvent) => {
			if (channelDeleted?.deletor === userId) {
				dispatch(listChannelsByUserActions.remove(channelDeleted.channel_id));
				return;
			}
			if (channelDeleted) {
				if (channelDeleted.channel_id === currentChannelId) {
					navigate(`/chat/clans/${clanId}`);
				}
				dispatch(channelsActions.deleteChannelSocket(channelDeleted));
				dispatch(listChannelsByUserActions.remove(channelDeleted.channel_id));
			}
		},
		[dispatch, currentChannelId, clanId, userId]
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
				if (channelUpdated.channel_label === '') {
					dispatch(channelsActions.updateChannelPrivateSocket(channelUpdated));
					if (channelUpdated.creator_id !== userId) {
						dispatch(
							channelsActions.update({
								clanId: channelUpdated.clan_id,
								update: { id: channelUpdated.channel_id, changes: { ...channelUpdated } }
							})
						);
						dispatch(listChannelsByUserActions.upsertOne({ id: channelUpdated.channel_id, ...channelUpdated }));
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
		(userPermission: PermissionChangedEvent) => {
			if (userId === userPermission.user_id && channelId === userPermission.channel_id) {
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
		[dispatch, userId, channelId]
	);
	const onunmuteevent = useCallback(
		(unmuteEvent: UnmuteEvent) => {
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
						is_current_channel: unmuteEvent.channel_id === channelId
					})
				);
			}
		},
		[channelId]
	);
	const oneventcreated = useCallback(
		(eventCreatedEvent: ApiCreateEventRequest) => {
			// eslint-disable-next-line no-console
			console.log('eventCreatedEvent: ', eventCreatedEvent);
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
					const allThreadChannelPrivate = selectAllTextChannel(store.getState() as RootState);
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

	const oncoffeegiven = useCallback((coffeeEvent: ApiGiveCoffeeEvent) => {
		const isReceiverGiveCoffee = coffeeEvent.receiver_id === userId;
		const isSenderGiveCoffee = coffeeEvent.sender_id === userId;

		const updateAmount = isReceiverGiveCoffee
			? AMOUNT_TOKEN.TEN_TOKENS * TOKEN_TO_AMOUNT.ONE_THOUNSAND
			: isSenderGiveCoffee
				? -AMOUNT_TOKEN.TEN_TOKENS * TOKEN_TO_AMOUNT.ONE_THOUNSAND
				: 0;
		dispatch(accountActions.updateWalletByAction((currentValue) => currentValue + updateAmount));
		if (isReceiverGiveCoffee && isElectron()) {
			const senderToken = coffeeEvent.sender_id;
			const allMembersClan = selectAllUserClans(store.getState() as RootState);
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

			const title = 'Token Received:';
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
		[userId, dispatch]
	);

	const onwebrtcsignalingfwd = useCallback(
		(event: WebrtcSignalingFwd) => {
			// TODO: AND TYPE IN BE
			// TYPE = 4: USER CANCEL CALL
			// TYPE = 0: USER JOINED CALL
			// TYPE = 5: OTHER CALL
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
		},
		[userCallId]
	);

	const onuserstatusevent = useCallback(
		async (userStatusEvent: UserStatusEvent) => {
			if (userStatusEvent.user_id !== userId) {
				dispatch(clanMembersMetaActions.updateUserStatus({ userId: userStatusEvent.user_id, user_status: userStatusEvent.custom_status }));
				dispatch(directMembersMetaActions.updateUserStatus({ userId: userStatusEvent.user_id, user_status: userStatusEvent.custom_status }));
				dispatch(friendsActions.updateUserStatus({ userId: userStatusEvent.user_id, user_status: userStatusEvent.custom_status }));
			}
		},
		[userId, dispatch]
	);

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

			socket.ontokensent = ontokensent;

			socket.onmessagebuttonclicked = onmessagebuttonclicked;

			socket.onwebrtcsignalingfwd = onwebrtcsignalingfwd;

			socket.onsfusignalingfwd = onsfusignalingfwd;
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
			onvoiceended,
			onvoicejoined,
			onvoiceleaved,
			onstreamingchanneljoined,
			onstreamingchannelleaved,
			oneventcreated,
			oncoffeegiven,
			onroleevent,
			onuserstatusevent,
			ontokensent,
			onmessagebuttonclicked,
			onwebrtcsignalingfwd,
			onsfusignalingfwd
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
		[dispatch, clanIdActive, reconnectWithTimeout, setCallbackEventFn]
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
			socket.onlastseenupdated = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.oncustomstatus = () => {};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			socket.onstatuspresence = () => {};
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
			socket.ontokensent = () => {};
		};
	}, [
		onchannelmessage,
		onchannelpresence,
		ondisconnect,
		onmessagetyping,
		onmessagereaction,
		onnotification,
		onpinmessage,
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
		ontokensent
	]);

	const value = React.useMemo<ChatContextValue>(
		() => ({
			// add logic code
			setCallbackEventFn,
			handleReconnect
		}),
		[setCallbackEventFn]
	);

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

const ChatContextConsumer = ChatContext.Consumer;

ChatContextProvider.displayName = 'ChatContextProvider';

export { ChatContext, ChatContextConsumer, ChatContextProvider };
