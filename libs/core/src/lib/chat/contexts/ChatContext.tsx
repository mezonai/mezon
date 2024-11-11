/* eslint-disable react-hooks/exhaustive-deps */
import {
	AttachmentEntity,
	appActions,
	attachmentActions,
	channelMembers,
	channelMembersActions,
	channelMetaActions,
	channelsActions,
	channelsSlice,
	channelsStreamActions,
	clanMembersMetaActions,
	clansActions,
	clansSlice,
	directActions,
	directMetaActions,
	directSlice,
	emojiSuggestionActions,
	eventManagementActions,
	fetchChannelMembers,
	fetchDirectMessage,
	fetchListFriends,
	fetchMessages,
	friendsActions,
	giveCoffeeActions,
	listChannelsByUserActions,
	mapMessageChannelToEntity,
	mapNotificationToEntity,
	mapReactionToEntity,
	messagesActions,
	notificationActions,
	overriddenPoliciesActions,
	permissionRoleChannelActions,
	pinMessageActions,
	policiesActions,
	reactionActions,
	rolesClanActions,
	selectChannelsByClanId,
	selectClanView,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentStreamInfo,
	selectDmGroupCurrentId,
	selectModeResponsive,
	selectStreamMembersByChannelId,
	stickerSettingActions,
	toastActions,
	useAppDispatch,
	useAppSelector,
	userChannelsActions,
	usersClanActions,
	usersStreamActions,
	voiceActions
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { ETypeLinkMedia, ModeResponsive, NotificationCode, TIME_OFFSET, sleep } from '@mezon/utils';
import * as Sentry from '@sentry/browser';
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
	MessageTypingEvent,
	Notification,
	PermissionChangedEvent,
	PermissionSet,
	RoleEvent,
	Socket,
	StatusPresenceEvent,
	StickerCreateEvent,
	StickerDeleteEvent,
	StickerUpdateEvent,
	StreamingEndedEvent,
	StreamingJoinedEvent,
	StreamingLeavedEvent,
	StreamingStartedEvent,
	TokenSentEvent,
	UserChannelAddedEvent,
	UserChannelRemovedEvent,
	UserClanRemovedEvent,
	VoiceEndedEvent,
	VoiceJoinedEvent,
	VoiceLeavedEvent
} from 'mezon-js';
import { ApiCreateEventRequest, ApiGiveCoffeeEvent, ApiMessageReaction } from 'mezon-js/api.gen';
import { ApiPermissionUpdate } from 'mezon-js/dist/api.gen';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAppParams } from '../../app/hooks/useAppParams';
import { useAuth } from '../../auth/hooks/useAuth';
import { useSeenMessagePool } from '../hooks/useSeenMessagePool';
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
	const currentChannel = useSelector(selectCurrentChannel);
	const { directId, channelId, clanId } = useAppParams();
	const { initWorker, unInitWorker } = useSeenMessagePool();
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentDirectId = useSelector(selectDmGroupCurrentId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const modeResponsive = useSelector(selectModeResponsive);
	const channels = useAppSelector(selectChannelsByClanId(clanId as string));
	const navigate = useNavigate();
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const streamChannelMember = useSelector(selectStreamMembersByChannelId(currentStreamInfo?.streamId || ''));
	const { isFocusDesktop, isTabVisible } = useWindowFocusState();

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
			dispatch(usersStreamActions.remove(user.id));
		},
		[dispatch]
	);

	const onstreamingchannelstarted = useCallback(
		(channel: StreamingStartedEvent) => {
			if (channel) {
				dispatch(
					channelsStreamActions.add({
						id: channel.channel_id,
						channel_id: channel.channel_id,
						clan_id: channel.clan_id,
						is_streaming: channel.is_streaming,
						streaming_url: channel.streaming_url !== '' ? `${channel.streaming_url}&user_id=${userId}` : channel.streaming_url
					})
				);
			}
		},
		[dispatch]
	);

	const onstreamingchannelended = useCallback(
		(channel: StreamingEndedEvent) => {
			dispatch(channelsStreamActions.remove(channel.channel_id));
			dispatch(usersStreamActions.streamEnded(channel?.channel_id));
		},
		[dispatch]
	);

	const onchannelmessage = useCallback(
		async (message: ChannelMessage) => {
			try {
				const senderId = message.sender_id;
				const timestamp = Date.now() / 1000;
				const mess = mapMessageChannelToEntity(message);
				mess.isMe = senderId === userId;
				const isMobile = directId === undefined && channelId === undefined;

				mess.isCurrentChannel = message.channel_id === directId || (isMobile && message.channel_id === currentDirectId);

				if ((directId === undefined && !isMobile) || (isMobile && !currentDirectId)) {
					const idToCompare = !isMobile ? channelId : currentChannelId;
					mess.isCurrentChannel = message.channel_id === idToCompare;
				}

				if (mess.attachments?.some((att) => att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX))) {
					const attachmentList: AttachmentEntity[] = mess.attachments?.map((attachment) => {
						const dateTime = new Date();

						return {
							...attachment,
							id: attachment.url as string,
							create_time: dateTime.toISOString()
						};
					});
					dispatch(attachmentActions.addAttachments({ listAttachments: attachmentList, channelId: message.channel_id }));
				}

				dispatch(messagesActions.addNewMessage(mess));
				if (mess.mode === ChannelStreamMode.STREAM_MODE_DM || mess.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
					dispatch(directMetaActions.updateDMSocket(message));
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
					dispatch(channelMetaActions.setChannelLastSentTimestamp({ channelId: message.channel_id, timestamp }));
				}
				dispatch(listChannelsByUserActions.updateLastSentTime({ channelId: message.channel_id }));
			} catch (error) {
				console.error(error);
				Sentry.captureException({
					eventType: 'NEW_MESSAGE',
					error
				});
			}
		},
		[userId, directId, currentDirectId, dispatch, channelId, currentChannelId, currentClanId, isFocusDesktop, isTabVisible]
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
				}, 10000);
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
					dispatch(channelsActions.updateChannelBadgeCount({ channelId: (notification as any).channel_id ?? '', count: 1 }));
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
				dispatch(friendsActions.fetchListFriends({ noCache: true }));
			}
		},
		[userId, directId, currentDirectId, dispatch, channelId, currentChannelId, currentClanId, isFocusDesktop, isTabVisible]
	);

	const onpinmessage = useCallback(
		(pin: LastPinMessageEvent) => {
			if (pin.operation === 1) {
				dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentChannel?.channel_id ?? '', noCache: true }));
			}
			if (pin.operation === 0) {
				dispatch(channelMetaActions.setChannelLastSeenPinMessage({ channelId: pin.channel_id, lastSeenPinMess: pin.message_id }));
			}
		},
		[currentChannel?.channel_id, dispatch]
	);

	const onlastseenupdated = useCallback(async (lastSeenMess: LastSeenMessageEvent) => {
		const timestamp = Date.now() / 1000;
		dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId: lastSeenMess.channel_id, timestamp: timestamp + TIME_OFFSET }));
		await dispatch(clansActions.updateBageClanWS({ channel_id: lastSeenMess.channel_id ?? '' }));
		dispatch(channelsActions.updateChannelBadgeCount({ channelId: lastSeenMess.channel_id, count: 0, isReset: true }));
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: lastSeenMess.channel_id, timestamp: timestamp }));
	}, []);

	const onuserchannelremoved = useCallback(
		(user: UserChannelRemovedEvent) => {
			user?.user_ids.forEach((userID: any) => {
				if (userID === userId) {
					if (channelId === user.channel_id) {
						navigate(`/chat/clans/${clanId}`);
					}
					if (directId === user.channel_id) {
						navigate(`/chat/direct/friends`);
					}
					dispatch(directSlice.actions.removeByDirectID(user.channel_id));
					dispatch(channelsSlice.actions.removeByChannelID(user.channel_id));
					dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true }));
				} else {
					dispatch(channelMembers.actions.remove({ userId: userID, channelId: user.channel_id }));
					if (user.channel_type === ChannelType.CHANNEL_TYPE_GROUP) {
						dispatch(fetchDirectMessage({ noCache: true }));
						dispatch(
							fetchChannelMembers({
								clanId: '',
								channelId: directId || '',
								noCache: true,
								channelType: ChannelType.CHANNEL_TYPE_GROUP
							})
						);
					}
				}
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
					dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true }));
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
			const user = userAdds.users.find((user: any) => user.user_id === userId);
			if (user) {
				if (userAdds.channel_type === ChannelType.CHANNEL_TYPE_DM || userAdds.channel_type === ChannelType.CHANNEL_TYPE_GROUP) {
					dispatch(fetchDirectMessage({ noCache: true }));
					dispatch(
						fetchMessages({ clanId: userAdds.clan_id, channelId: userAdds?.channel_id, noCache: true, isFetchingLatestMessages: false })
					);
				}
				if (userAdds.channel_type === ChannelType.CHANNEL_TYPE_TEXT || userAdds.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
					dispatch(channelsActions.fetchChannels({ clanId: userAdds.clan_id, noCache: true }));
					dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true }));
					dispatch(
						channelMembersActions.fetchChannelMembers({
							clanId: userAdds.clan_id || '',
							channelId: userAdds.channel_id,
							noCache: true,
							channelType: userAdds.channel_type
						})
					);
				}
				if (userAdds.channel_type !== ChannelType.CHANNEL_TYPE_VOICE) {
					dispatch(
						channelsActions.joinChat({
							clanId: userAdds.clan_id,
							channelId: userAdds.channel_id,
							channelType: userAdds.channel_type,
							isPublic: userAdds.is_public
						})
					);
				}
			} else {
				if (clanIdActive === userAdds.clan_id) {
					const members = userAdds?.users
						.filter((user) => user?.user_id)
						.map((user) => ({
							id: user.user_id,
							user: {
								...user,
								avatar_url: user.avatar,
								id: user.user_id,
								about_me: user.about_me,
								display_name: user.display_name,
								metadata: user.custom_status,
								username: user.username,
								create_time: new Date(user.create_time_second * 1000).toISOString(),
								online: user.online
							}
						}));
					dispatch(usersClanActions.upsertMany(members));
				}
				await sleep(500);
				dispatch(
					channelMembersActions.fetchChannelMembers({
						clanId: userAdds.clan_id || '',
						channelId: userAdds.channel_id,
						noCache: true,
						channelType: userAdds.channel_type
					})
				);
				dispatch(userChannelsActions.fetchUserChannels({ channelId: userAdds.channel_id, noCache: true }));

				if (userAdds.channel_type === ChannelType.CHANNEL_TYPE_GROUP || userAdds.channel_type === ChannelType.CHANNEL_TYPE_GROUP) {
					dispatch(fetchDirectMessage({ noCache: true }));
					dispatch(fetchListFriends({ noCache: true }));
				}
			}
		},
		[userId, dispatch]
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

	const onstickercreated = useCallback(
		(stickerCreated: StickerCreateEvent) => {
			if (userId !== stickerCreated.creator_id) {
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
			}
		},
		[dispatch, userId]
	);

	const oneventemoji = useCallback(
		(eventEmoji: EventEmoji) => {
			if (userId !== eventEmoji.user_id) {
				if (eventEmoji.action === 0) {
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
				} else if (eventEmoji.action === 1) {
					dispatch(
						emojiSuggestionActions.update({
							id: eventEmoji.id,
							changes: {
								shortname: eventEmoji.short_name
							}
						})
					);
				} else if (eventEmoji.action === 2) {
					dispatch(emojiSuggestionActions.remove(eventEmoji.id));
				}
			}
		},
		[dispatch, userId]
	);

	const onstickerdeleted = useCallback(
		(stickerDeleted: StickerDeleteEvent) => {
			if (userId !== stickerDeleted.user_id) {
				dispatch(stickerSettingActions.remove(stickerDeleted.sticker_id));
			}
		},
		[userId, dispatch]
	);

	const onstickerupdated = useCallback(
		(stickerUpdated: StickerUpdateEvent) => {
			if (userId !== stickerUpdated.user_id) {
				dispatch(
					stickerSettingActions.update({
						id: stickerUpdated.sticker_id,
						changes: {
							shortname: stickerUpdated.shortname
						}
					})
				);
			}
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
		(tokenEvent: TokenSentEvent) => {
			dispatch(giveCoffeeActions.handleSocketToken({ currentUserId: userId as string, tokenEvent }));
		},
		[dispatch, userId]
	);

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
				dispatch(reactionActions.setReactionDataSocket(mapReactionToEntity(e)));
			}
		},
		[dispatch]
	);

	const onchannelcreated = useCallback(
		(channelCreated: ChannelCreatedEvent) => {
			if (channelCreated && channelCreated.channel_private === 0 && (channelCreated.parrent_id === '' || channelCreated.parrent_id === '0')) {
				dispatch(channelsActions.createChannelSocket(channelCreated));
				dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true }));

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
								lastSeenPinMessage: '',
								clanId: extendChannelCreated.clan_id ?? ''
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
			dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true }));
			dispatch(stickerSettingActions.removeStickersByClanId(clanDelete.clan_id));
			if (clanDelete.deletor !== userId && currentClanId === clanDelete.clan_id) {
				navigate(`/chat/direct/friends`);
				dispatch(clansSlice.actions.removeByClanID(clanDelete.clan_id));
				dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true }));
			}
		},
		[currentClanId, dispatch, navigate, userId]
	);

	const onchanneldeleted = useCallback(
		(channelDeleted: ChannelDeletedEvent) => {
			if (channelDeleted) {
				dispatch(channelsActions.deleteChannelSocket(channelDeleted));
				dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true }));
			}
		},
		[dispatch]
	);

	const onchannelupdated = useCallback(
		(channelUpdated: ChannelUpdatedEvent) => {
			if (channelUpdated.is_error) {
				return dispatch(channelsActions.deleteChannel({ channelId: channelUpdated.channel_id, clanId: channelUpdated.clan_id as string }));
			}
			if (channelUpdated) {
				if (channelUpdated.channel_label === '') {
					dispatch(channelsActions.updateChannelPrivateSocket(channelUpdated));
					if (channelUpdated.creator_id !== userId) {
						dispatch(channelsActions.fetchChannels({ clanId: channelUpdated.clan_id, noCache: true }));
						dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true }));
					}
				} else {
					dispatch(channelsActions.updateChannelSocket(channelUpdated));
				}
				if (channelUpdated.app_url) {
					dispatch(channelsActions.fetchAppChannels({ clanId: channelUpdated.clan_id, noCache: true }));
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
				dispatch(overriddenPoliciesActions.fetchMaxChannelPermission({ clanId: clanId || '', channelId, noCache: true }));
			}
		},
		[dispatch, userId, channelId, clanId]
	);

	const oneventcreated = useCallback(
		(eventCreatedEvent: ApiCreateEventRequest) => {
			dispatch(eventManagementActions.updateStatusEvent(eventCreatedEvent));
		},
		[dispatch]
	);

	const isClanView = useSelector(selectClanView);

	const oncoffeegiven = useCallback((coffeeEvent: ApiGiveCoffeeEvent) => {
		dispatch(giveCoffeeActions.setTokenFromSocket({ userId, coffeeEvent }));
	}, []);

	const onroleevent = useCallback((roleEvent: RoleEvent) => {
		const handleRoleEvent = async () => {
			if (roleEvent?.status === 0) {
				if (userId !== roleEvent.user_id) {
					dispatch(
						rolesClanActions.add({
							id: roleEvent.role.id || '',
							clan_id: roleEvent.role.clan_id,
							creator_id: roleEvent.role.creator_id,
							title: roleEvent.role.title,
							permission_list: roleEvent.role.permission_list,
							role_user_list: roleEvent.role.role_user_list,
							active: roleEvent.role.active
						})
					);
					if (roleEvent?.role?.role_user_list?.role_users) {
						const userExists = roleEvent.role.role_user_list.role_users.some((user) => user.id === userId);
						if (userExists) {
							dispatch(policiesActions.fetchPermissionsUser({ clanId: roleEvent.role.clan_id || '' }));
						}
						dispatch(usersClanActions.fetchUsersClan({ clanId: roleEvent.role.clan_id || '' }));
					}
				}
			} else if (roleEvent?.status === 1) {
				if (userId !== roleEvent.user_id) {
					if (roleEvent?.role?.role_user_list?.role_users) {
						dispatch(usersClanActions.fetchUsersClan({ clanId: roleEvent.role.clan_id || '' }));
					}
					if (roleEvent.role.permission_list?.permissions || roleEvent.role.role_user_list?.role_users) {
						const isUserResult = await dispatch(
							rolesClanActions.updatePermissionUserByRoleId({ roleId: roleEvent.role.id || '', userId: userId || '' })
						).unwrap();
						if (isUserResult) {
							dispatch(policiesActions.fetchPermissionsUser({ clanId: roleEvent.role.clan_id || '' }));
						}
					}
					dispatch(rolesClanActions.update(roleEvent.role));
				}
			} else if (roleEvent?.status === 2) {
				if (userId !== roleEvent.user_id) {
					const isUserResult = await dispatch(
						rolesClanActions.updatePermissionUserByRoleId({ roleId: roleEvent.role.id || '', userId: userId || '' })
					).unwrap();
					if (isUserResult) {
						dispatch(policiesActions.fetchPermissionsUser({ clanId: roleEvent.role.clan_id || '' }));
					}
					dispatch(rolesClanActions.remove(roleEvent.role.id || ''));
				}
			}
		};
		handleRoleEvent();
	}, []);
	const setCallbackEventFn = React.useCallback(
		(socket: Socket) => {
			socket.onvoicejoined = onvoicejoined;

			socket.onvoiceended = onvoiceended;

			socket.onvoiceleaved = onvoiceleaved;

			socket.onstreamingchanneljoined = onstreamingchanneljoined;

			socket.onstreamingchannelleaved = onstreamingchannelleaved;

			socket.onstreamingchannelstarted = onstreamingchannelstarted;

			socket.onstreamingchannelended = onstreamingchannelended;

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

			socket.onclanprofileupdated = onclanprofileupdated;

			socket.oncustomstatus = oncustomstatus;

			socket.onstatuspresence = onstatuspresence;

			socket.onchannelcreated = onchannelcreated;

			socket.onchanneldeleted = onchanneldeleted;

			socket.onchannelupdated = onchannelupdated;

			socket.onpermissionset = onpermissionset;

			socket.onpermissionchanged = onpermissionchanged;

			socket.oneventcreated = oneventcreated;

			socket.onheartbeattimeout = onHeartbeatTimeout;

			socket.oncoffeegiven = oncoffeegiven;

			socket.onroleevent = onroleevent;

			socket.ontokensent = ontokensent;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			onchannelcreated,
			onchanneldeleted,
			onchannelmessage,
			onchannelpresence,
			onchannelupdated,
			onpermissionset,
			onpermissionchanged,
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
			onstreamingchannelstarted,
			onstreamingchannelended,
			oneventcreated,
			oncoffeegiven,
			onroleevent,
			ontokensent
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
					Sentry.captureException({
						eventType: 'SOCKET_RECONNECT',
						error
					});
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
		onstreamingchannelstarted,
		onstreamingchannelended,
		onerror,
		onchannelcreated,
		onchanneldeleted,
		onchannelupdated,
		onpermissionset,
		onpermissionchanged,
		onHeartbeatTimeout,
		oneventcreated,
		setCallbackEventFn,
		oncoffeegiven,
		onroleevent
	]);

	useEffect(() => {
		initWorker();
		return () => {
			unInitWorker();
		};
	}, [initWorker, unInitWorker]);

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

export { ChatContext, ChatContextConsumer, ChatContextProvider };
