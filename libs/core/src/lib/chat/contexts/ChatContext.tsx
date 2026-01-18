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
import type { IChannelMessageHeader, IMessageSendPayload, IUserProfileActivity, NotificationCategory } from '@mezon/utils';
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
	ApiClanEmoji,
	ApiCreateEventRequest,
	ApiGiveCoffeeEvent,
	ApiMessageReaction,
	ApiNotification,
	ApiNotificationUserChannel,
	ApiPermissionUpdate,
	ApiTokenSentEvent,
	ApiWebhook
} from 'mezon-js/api.gen';
import type { ChannelCanvas, DeleteAccountEvent, RemoveFriend, SdTopicEvent } from 'mezon-js/socket';
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
				dispatch(voiceActions.voiceEnded(voice?.voice_channel_id.toString()));
			}
		},
		[dispatch]
	);

	const onvoicejoined = useCallback(
		(voice: VoiceJoinedEvent) => {
			if (voice) {
				const store = getStore();
				const state = store.getState();
				const voiceChannel = selectChannelById(state, voice.voice_channel_id.toString());
				const voiceOfMe = selectVoiceInfo(state);
				const currentUserId = selectCurrentUserId(state);
				const hasJoinSoundEffect = voiceOfMe?.channelId === voice.voice_channel_id.toString() || currentUserId === voice.user_id.toString();

				if (voiceChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && hasJoinSoundEffect) {
					const joinSoundElement = document.createElement('audio');
					joinSoundElement.src = '/assets/audio/joincallsound.mp3';
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
						...voice,
						id: voice.id.toString(),
						voice_channel_id: voice.voice_channel_id.toString(),
						user_id: voice.user_id.toString(),
						clan_id: voice.clan_id.toString()
					})
				);
			}
		},
		[dispatch]
	);

	const onvoiceleaved = useCallback(
		(voice: VoiceLeavedEvent) => {
			dispatch(voiceActions.remove(voice));
			if (voice.voice_user_id.toString() === userId) {
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

		const existingMember = streamChannelMember?.find((member) => member?.user_id?.toString() === user?.user_id?.toString());
		if (existingMember) {
			dispatch(usersStreamActions.remove(existingMember?.id));
		}
		dispatch(
			usersStreamActions.add({
				...user,
				id: user.id.toString(),
				user_id: user.user_id.toString(),
				clan_id: user.clan_id?.toString() || '',
				streaming_channel_id: user.streaming_channel_id?.toString() || ''
			})
		);
	}, []);

	const onstreamingchannelleaved = useCallback(
		(user: StreamingLeavedEvent) => {
			dispatch(usersStreamActions.remove(user.streaming_user_id.toString()));
		},
		[dispatch]
	);

	const onactivityupdated = useCallback(
		(activities: ListActivity) => {
			const mappedActivities: ActivitiesEntity[] = activities.acts.map((activity) => ({
				...activity,
				id: activity.user_id?.toString() || '',
				user_id: activity.user_id?.toString(),
				application_id: activity.application_id?.toString()
			}));
			dispatch(acitvitiesActions.updateListActivity(mappedActivities));
		},
		[dispatch]
	);

	const handleBuzz = useCallback((channelId: string, senderId: string, isReset: boolean, mode: ChannelStreamMode | undefined) => {
		const audio = new Audio('/assets/audio/buzz.mp3');

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

			if (!message.id || message.id.toString() === '0') {
				const lastMessage = selectLastMessageByChannelId(store.getState(), message.channel_id.toString());
				if (lastMessage?.id) {
					message.id = BigInt(lastMessage.id) + BigInt(1);
					message.message_id = message.id;
				}
			}

			const msg = {
				...message,
				channelId: message.channel_id.toString(),
				senderId: message.sender_id.toString(),
				clanId: message.clan_id?.toString() || '',
				topicId: message.topic_id?.toString() || '',
				messageId: message.message_id?.toString() || '',
				idStr: message.id.toString()
			};

			if (message.code === TypeMessage.MessageBuzz) {
				handleBuzz(msg.channelId, msg.senderId, true, message.mode);
			}

			if (msg.topicId && msg.topicId !== '0') {
				const lastMsg: IChannelMessageHeader = {
					content: message.content,
					sender_id: message.sender_id.toString(),
					timestamp_seconds: message.create_time_seconds
				};
				dispatch(
					topicsActions.setTopicLastSent({
						clanId: msg.clanId,
						topicId: msg.topicId,
						lastSentMess: lastMsg
					})
				);
			}

			try {
				const timestamp = Date.now() / 1000;
				const mess = await dispatch(mapMessageChannelToEntityAction({ message, lock: true })).unwrap();
				if (msg.topicId && msg.topicId !== '0') {
					mess.channel_id = mess.topic_id?.toString() ?? '';
				}
				mess.isMe = msg.senderId === userId;

				if ((message.content as IMessageSendPayload).callLog?.callLogType === IMessageTypeCallLog.STARTCALL && mess.isMe) {
					dispatch(DMCallActions.setCallMessageId(msg.messageId));
				}
				mess.isCurrentChannel = msg.channelId === currentDirectId || (isMobile && msg.channelId === currentDirectId);

				if ((currentDirectId === undefined && !isMobile) || (isMobile && !currentDirectId)) {
					const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
					const idToCompare = !isMobile ? currentChannelId : currentChannelId;
					mess.isCurrentChannel = msg.channelId === idToCompare;
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
									uploader: msg.senderId
								};
							})
						: [];

				if (attachmentList?.length && message?.code === TypeMessage.Chat) {
					dispatch(attachmentActions.addAttachments({ listAttachments: attachmentList, channelId: msg.channelId }));
				} else if (message?.code === TypeMessage.ChatRemove && message?.attachments) {
					dispatch(
						attachmentActions.removeAttachments({
							messageId: msg.messageId,
							channelId: msg.channelId
						})
					);
				}

				if (
					message.code === TypeMessage.ChatUpdate ||
					message.code === TypeMessage.ChatRemove ||
					message.code === TypeMessage.UpdateEphemeralMsg ||
					message.code === TypeMessage.DeleteEphemeralMsg
				) {
					dispatch(messagesActions.newMessage(mess));

					if (message.code === TypeMessage.ChatRemove && msg.topicId && msg.topicId !== '0' && message?.message_id) {
						dispatch(
							messagesActions.updateTopicRplCount({
								topicId: msg.topicId,
								channelId: msg.channelId,
								increment: false
							})
						);
					}
				} else {
					dispatch(messagesActions.addNewMessage(mess));

					if (msg.topicId && msg.topicId !== '0' && message?.message_id) {
						dispatch(
							messagesActions.updateTopicRplCount({
								topicId: msg.topicId,
								channelId: msg.channelId,
								increment: true,
								timestamp: message.create_time_seconds
							})
						);
					}
				}

				if (mess.mode === ChannelStreamMode.STREAM_MODE_DM || mess.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
					const isContentMutation = message.code === TypeMessage.ChatUpdate || message.code === TypeMessage.ChatRemove;
					if (!isContentMutation && mess.sender_id) {
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
						(currentDirectId && !RegExp(currentDirectId).test(msg.channelId)) ||
						!isFocus;

					if (isNotCurrentDirect) {
						if (
							message.sender_id.toString() !== userId &&
							message.code !== TypeMessage.ChatUpdate &&
							message.code !== TypeMessage.ChatRemove
						) {
							dispatch(directMetaActions.setCountMessUnread({ channelId: msg.channelId, isMention: false }));
						}
					}

					if (mess.isMe && isNotCurrentDirect && !isContentMutation) {
						const directReceiver = selectDirectById(store.getState(), mess?.channel_id);
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
								directMetaActions.setDirectLastSeenTimestamp({
									channelId: msg.channelId,
									timestamp,
									messageId: msg.idStr
								})
							);
						}
					}
				} else {
					if (mess.isMe) {
						dispatch(
							channelsActions.updateChannelBadgeCount({
								channelId: msg.channelId,
								clanId: msg.clanId,
								count: 0,
								isReset: true
							})
						);
						dispatch(
							listChannelsByUserActions.updateChannelBadgeCount({
								channelId: msg.channelId,
								count: 0,
								isReset: true
							})
						);
					} else {
						if (message.clan_id) {
							dispatch(clansActions.setHasUnreadMessage({ clanId: msg.clanId, hasUnread: true }));
						}
					}
					if (message.code !== TypeMessage.ChatUpdate && message.code !== TypeMessage.ChatRemove) {
						dispatch(channelMetaActions.setChannelLastSentTimestamp({ channelId: msg.channelId, timestamp, senderId: msg.senderId }));
					}
					dispatch(listChannelsByUserActions.updateLastSentTime({ channelId: msg.channelId }));
					dispatch(threadsActions.updateLastSentInThread({ channelId: msg.channelId, lastSentTime: timestamp }));
				}
				if (message?.code === TypeMessage.ChatRemove) {
					const replyData = selectDataReferences(store.getState(), msg.channelId);
					if (replyData && replyData.message_ref_id?.toString() === msg.idStr) {
						dispatch(referencesActions.resetAfterReply(msg.channelId));
					}
					if (message.message_id) {
						dispatch(
							pinMessageActions.removePinMessage({
								pinId: msg.messageId,
								channelId: msg.channelId
							})
						);
					}
				}
				if (message?.code === TypeMessage.ChatRemove && msg.senderId !== userId) {
					decreaseChannelBadgeCount(dispatch, {
						message: mess,
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
							userStatusMap.set(join.user_id.toString(), {
								online: true,
								is_mobile: join.is_mobile,
								status: join.status,
								user_status: join.user_status
							});
						});
						event?.leaves?.forEach((leave) => {
							userStatusMap.set(leave.user_id.toString(), {
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
			const canvas = {
				...canvasEvent,
				channelId: canvasEvent.channel_id?.toString() || '',
				canvasId: canvasEvent.id?.toString() || ''
			};

			if (canvasEvent.status === EEventAction.CREATED) {
				dispatch(
					canvasAPIActions.upsertOne({
						channel_id: canvas.channelId,
						canvas: { ...canvasEvent, creator_id: canvasEvent.editor_id }
					})
				);
			} else {
				dispatch(
					canvasAPIActions.removeOneCanvas({
						channelId: canvas.channelId,
						canvasId: canvas.canvasId
					})
				);
			}
		},
		[dispatch]
	);

	const onnotification = useCallback(
		async (notification: ApiNotification) => {
			const notif = {
				...notification,
				channelId: notification.channel_id?.toString() || '',
				topicId: notification.topic_id?.toString() || '',
				clanId: notification.clan_id?.toString() || '',
				senderId: notification.sender_id?.toString() || ''
			};

			if (notif.topicId && notif.topicId !== '0') {
				dispatch(
					topicsActions.setChannelTopic({
						channelId: notif.channelId,
						topicId: notif.topicId
					})
				);
			}
			const path = isElectron() ? window.location.hash : window.location.pathname;
			const isFriendPageView = path.includes('/chat/direct/friends');
			const isDirectViewPage = path.includes('/chat/direct/message/');

			const store = await getStoreAsync();
			const currentChannel = selectCurrentChannel(store.getState() as unknown as RootState);
			const isFocus = !isBackgroundModeActive();

			if ((currentChannel?.channel_id !== notif.channelId && notif.clanId !== '0') || isDirectViewPage || isFriendPageView || !isFocus) {
				dispatch(
					notificationActions.add({
						data: {
							...notification,
							create_time: notification.create_time || new Date().toISOString(),
							id: notification.id?.toString() || '',
							clan_id: notif.clanId,
							channel_id: notif.channelId,
							topic_id: notif.topicId,
							sender_id: notif.senderId,
							content: {
								...notification.content,
								content: safeJSONParse(notification.content?.content || '')?.t
							}
						},
						category: notification.category as NotificationCategory
					})
				);

				if (notification.code === NotificationCode.USER_MENTIONED || notification.code === NotificationCode.USER_REPLIED) {
					dispatch(clansActions.updateClanBadgeCount({ clanId: notif.clanId, count: 1 }));

					if (notification?.channel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
						await dispatch(
							channelsActions.addThreadSocket({
								clanId: notif.clanId,
								channelId: notif.channelId,
								channel: {
									...notification?.channel,
									id: notification?.channel?.channel_id?.toString() || notif.channelId
								}
							})
						);
					}
					dispatch(
						channelsActions.updateChannelBadgeCountAsync({
							clanId: notif.clanId,
							channelId: notif.channelId,
							count: 1
						})
					);
					dispatch(
						listChannelsByUserActions.updateChannelBadgeCount({
							channelId: notif.channelId,
							count: 1
						})
					);
				}
			}

			if (notification.code === NotificationCode.FRIEND_REQUEST || notification.code === NotificationCode.FRIEND_ACCEPT) {
				dispatch(toastActions.addToast({ message: notification.subject, type: 'info', id: 'ACTION_FRIEND' }));
				if (notification.code === NotificationCode.FRIEND_ACCEPT) {
					dispatch(friendsActions.acceptFriend(`${userId}_${notif.senderId}`));
				}
			}

			if (isLinuxDesktop) {
				const notiSoundElement = document.createElement('audio');
				notiSoundElement.src = '/assets/audio/noti-linux.mp3';
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

		const pinData = {
			...pin,
			channelId: pin.channel_id?.toString() || '',
			clanId: pin.clan_id?.toString() || '',
			messageId: pin.message_id?.toString() || '',
			senderId: pin.message_sender_id?.toString() || ''
		};

		if (pin.clan_id) {
			dispatch(channelsActions.setShowPinBadgeOfChannel({ clanId: pinData.clanId, channelId: pinData.channelId, isShow: true }));
		} else {
			dispatch(directActions.setShowPinBadgeOfDM({ dmId: pinData.channelId, isShow: true }));
		}

		if (pin.operation === 1) {
			dispatch(
				pinMessageActions.addPinMessage({
					channelId: pinData.channelId,
					pinMessage: {
						id: pinData.messageId,
						attachment: JSON.parse(pin.message_attachment),
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
		const unpin = {
			...unpin_message_event,
			channelId: unpin_message_event.channel_id?.toString() || '',
			messageId: unpin_message_event.message_id?.toString() || ''
		};
		dispatch(
			pinMessageActions.removePinMessage({
				channelId: unpin.channelId,
				pinId: unpin.messageId
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
			const lastSeen = {
				clanId: clan_id?.toString() || '',
				channelId: channel_id?.toString() || '',
				messageId: message_id?.toString() || ''
			};
			let badge_count = lastSeenMess.badge_count;

			const store = getStore();

			const state = store.getState() as RootState;
			const channelsLoadingStatus = selectLoadingStatus(state);
			const clansLoadingStatus = selectClansLoadingStatus(state);

			if (channelsLoadingStatus === 'loading' || clansLoadingStatus === 'loading') {
				return;
			}

			if (lastSeen.clanId && lastSeen.clanId !== '0') {
				const channel = selectChannelByIdAndClanId(state, lastSeen.clanId, lastSeen.channelId);
				badge_count = channel?.count_mess_unread || 0;
			}

			resetChannelBadgeCount(
				dispatch,
				{
					clanId: lastSeen.clanId,
					channelId: lastSeen.channelId,
					badgeCount: badge_count,
					messageId: lastSeen.messageId
				},
				store
			);
		},
		[dispatch]
	);

	const onuserchannelremoved = useCallback(
		async (user: UserChannelRemovedEvent) => {
			const userData = {
				...user,
				channelId: user.channel_id?.toString() || '',
				clanId: user.clan_id?.toString() || '',
				userIds: user.user_ids?.map((id) => id?.toString() || '') || []
			};

			const store = await getStoreAsync();
			const channelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const directId = selectDmGroupCurrentId(store.getState());
			const clanId = selectCurrentClanId(store.getState());
			const currentState = store.getState() as unknown as RootState;
			const currentChannel = selectCurrentChannel(currentState);

			for (let index = 0; index < user?.user_ids.length; index++) {
				const userID = userData.userIds[index];
				dispatch(clansActions.updateClanBadgeCount({ clanId: userData.clanId, count: -user.badge_counts[index] }));
				if (userID === userId) {
					if (isMobile && (channelId === userData.channelId || directId === userData.channelId)) {
						MobileEventEmitter.emit('@ON_REMOVE_USER_CHANNEL', {
							channelId: userData.channelId,
							channelType: user.channel_type
						});
					}
					if (channelId === userData.channelId && !isMobile) {
						if (user.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
							const parentChannelId = currentChannel?.parent_id;
							if (parentChannelId) {
								navigate(`/chat/clans/${clanId}/channels/${parentChannelId}`, true);
								return;
							}
						}

						const defaultChannelId = selectDefaultChannelIdByClanId(store.getState() as unknown as RootState, clanId as string);
						const clanChannels = selectChannelsByClanId(store.getState() as unknown as RootState, clanId as string);
						const fallbackChannelId = clanChannels.find((ch) => !checkIsThread(ch))?.id;

						const redirectChannelId = defaultChannelId || fallbackChannelId;

						if (redirectChannelId) {
							navigate(`/chat/clans/${clanId}/channels/${redirectChannelId}`, true);
						} else {
							navigate(`/chat/clans/${clanId}/member-safety`, true);
						}
					}
					if (!isMobile && directId === userData.channelId) {
						navigate(`/chat/direct/friends`, true);
					}
					dispatch(directSlice.actions.removeByDirectID(userData.channelId));
					dispatch(channelsSlice.actions.removeByChannelID({ channelId: userData.channelId, clanId: clanId as string }));

					if (user.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
						const currentState = store.getState() as unknown as RootState;
						const thread = selectChannelById(currentState, userData.channelId);

						if (thread && thread.channel_private === ChannelStatusEnum.isPrivate) {
							dispatch(threadsActions.remove(userData.channelId));
							const allChannels = selectAllChannels(currentState);
							const parentChannels = allChannels.filter((ch) => !checkIsThread(ch));
							const removeActions = parentChannels.map((parentChannel) =>
								threadsActions.removeThreadFromCache({
									channelId: parentChannel.channel_id || parentChannel.id,
									threadId: userData.channelId
								})
							);
							removeActions.forEach((action) => dispatch(action));
						}
					}
					dispatch(listChannelsByUserActions.remove(userID));
					dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: userData.channelId, clanId: userData.clanId }));
					dispatch(directMetaActions.remove(userData.channelId));
					dispatch(
						appActions.clearHistoryChannel({
							channelId: userData.channelId
						})
					);
					dispatch(
						channelsActions.removePreviousChannel({
							clanId: userData.clanId,
							channelId: userData.channelId
						})
					);

					dispatch(listChannelsByUserActions.remove(userData.channelId));
				} else {
					if (user.channel_type === ChannelType.CHANNEL_TYPE_GROUP) {
						dispatch(directActions.removeGroupMember({ userId: userID, currentUserId: userId as string, channelId: userData.channelId }));
					}
				}
				dispatch(channelMembers.actions.remove({ userId: userID, channelId: userData.channelId }));
				dispatch(
					userChannelsActions.removeUserChannel({
						channelId: userData.channelId,
						userRemoves: [userID]
					})
				);
			}
		},
		[userId, isMobile]
	);
	const onuserclanremoved = useCallback(
		async (user: UserClanRemovedEvent) => {
			if (!user?.user_ids) return;
			const userData = {
				...user,
				clanId: user.clan_id?.toString() || '',
				userIds: user.user_ids?.map((id) => id?.toString() || '') || []
			};

			const store = await getStoreAsync();
			const channels = selectChannelsByClanId(store.getState() as unknown as RootState, userData.clanId);
			const clanId = selectCurrentClanId(store.getState());
			const currentVoice = selectVoiceInfo(store.getState());
			const currentStream = selectCurrentStreamInfo(store.getState());
			userData.userIds.forEach((id: string) => {
				dispatch(voiceActions.removeFromClanInvoice(id));
				if (id === userId) {
					dispatch(emojiSuggestionActions.invalidateCache());
					dispatch(stickerSettingActions.invalidateCache());

					if (clanId === userData.clanId) {
						if (isMobile) {
							const clanList = selectOrderedClans(store.getState());
							const clanIdToJump = clanList?.filter((item) => item.clan_id !== userData.clanId)?.[0]?.clan_id;
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
					if (userData.clanId === currentVoice?.clanId) {
						dispatch(voiceActions.resetVoiceControl());
						if (document.pictureInPictureElement) {
							document.exitPictureInPicture();
						}
					}
					if (userData.clanId === currentStream?.clanId) {
						dispatch(videoStreamActions.stopStream());
						dispatch(videoStreamActions.setIsJoin(false));
					}
					dispatch(clansSlice.actions.removeByClanID(userData.clanId));
					dispatch(listChannelsByUserActions.remove(id));
					dispatch(listChannelRenderAction.removeListChannelRenderByClanId({ clanId: userData.clanId }));
					dispatch(appActions.cleanHistoryClan(userData.clanId));
					dispatch(channelsActions.removeByClanId(userData.clanId));
				}
				dispatch(
					channelMembersActions.removeUserByUserIdAndClan({
						userId: id,
						channelIds: channels.map((item) => item.id),
						clanId: userData.clanId
					})
				);
				dispatch(usersClanActions.remove({ userId: id, clanId: userData.clanId }));
				dispatch(rolesClanActions.updateRemoveUserRole({ userId: id, clanId: userData.clanId }));
			});
		},
		[userId, isMobile]
	);

	const onuserchanneladded = useCallback(
		async (userAdds: UserChannelAddedEvent) => {
			if (!userAdds?.channel_desc) return;
			const { channel_desc, users, clan_id, create_time_second, caller } = userAdds;

			const channelData = {
				...channel_desc,
				channelId: channel_desc.channel_id?.toString() || '',
				clanId: channel_desc.clan_id?.toString() || '',
				parentId: channel_desc.parent_id?.toString() || '',
				categoryId: (channel_desc as any).category_id?.toString() || '',
				appId: (channel_desc as any).app_id?.toString() || '',
				creatorId: caller?.user_id?.toString() || ''
			};

			const store = await getStoreAsync();
			const clanId = selectCurrentClanId(store.getState());
			const currentClanId = selectCurrentClanId(store.getState());

			const userIds = users.map((u) => u.user_id?.toString() || '');
			const user = users?.find((user) => user.user_id?.toString() === userId);
			if (user) {
				if (
					channel_desc.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
					channel_desc.type === ChannelType.CHANNEL_TYPE_THREAD ||
					channel_desc.type === ChannelType.CHANNEL_TYPE_APP ||
					channel_desc.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
				) {
					const channel: ChannelsEntity = {
						...channel_desc,
						id: channelData.channelId,
						channel_id: channelData.channelId,
						clan_id: channelData.clanId,
						parent_id: channelData.parentId,
						category_id: channelData.categoryId,
						creator_id: channelData.creatorId,
						app_id: channelData.appId
					};
					dispatch(channelsActions.add({ clanId: channelData.clanId, channel: { ...channel, active: 1 } }));
					const { clan_id, channel_id, parent_id, ...channelDescRest } = channel_desc;
					dispatch(
						listChannelsByUserActions.add({
							...channelDescRest,
							id: channelData.channelId,
							clan_id: channelData.clanId,
							channel_id: channelData.channelId,
							parent_id: channelData.parentId
						})
					);

					dispatch(
						channelSettingActions.addChannelFromSocket({
							id: channelData.channelId,
							channel_id: channelData.channelId,
							channel_label: channel_desc.channel_label,
							parent_id: channelData.parentId,
							clan_id: channelData.clanId,
							channel_private: channel_desc.channel_private,
							channel_type: channel_desc.type,
							creator_id: channelData.creatorId
						})
					);

					if (
						channel_desc.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
						channel_desc.type === ChannelType.CHANNEL_TYPE_APP ||
						channel_desc.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
					) {
						dispatch(
							listChannelRenderAction.addChannelToListRender({ type: channel_desc.type, ...channel_desc, id: channelData.channelId })
						);
					}

					if (channel_desc.type === ChannelType.CHANNEL_TYPE_THREAD) {
						dispatch(
							channelMetaActions.updateBulkChannelMetadata([
								{
									id: channel.id,
									lastSentTimestamp: channel.last_sent_message?.timestamp_seconds || Date.now() / 1000,
									clanId: channelData.clanId,
									isMute: false,
									senderId: '',
									lastSeenTimestamp: Date.now() / 1000 - 1000
								}
							])
						);
						dispatch(
							listChannelRenderAction.setActiveThread({
								channelId: channelData.channelId,
								clanId: channelData.clanId
							})
						);
						dispatch(
							listChannelRenderAction.addThreadToListRender({
								channel: {
									...channel,
									active: 1
								},
								clanId: channelData.clanId
							})
						);
						if (channel_desc.channel_private === ChannelStatusEnum.isPrivate) {
							const thread: ThreadsEntity = {
								id: channel.id,
								channel_id: channelData.channelId,
								active: 1,
								channel_label: channel_desc.channel_label,
								clan_id: channelData.clanId || (clanId as string),
								parent_id: channelData.parentId,
								creator_id: channelData.creatorId,
								last_sent_message: {
									timestamp_seconds: userAdds.create_time_second
								},
								type: channel_desc.type
							};

							dispatch(
								threadsActions.addThreadToCached({
									channelId: channelData.parentId,
									thread
								})
							);
						}
					}

					if (channel_desc.parent_id) {
						dispatch(
							threadsActions.updateActiveCodeThread({
								channelId: channelData.channelId,
								activeCode: ThreadStatus.joined
							})
						);
					}
				}
				dispatch(
					channelsActions.joinChat({
						clanId: clan_id?.toString() || '',
						channelId: channelData.channelId,
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
						channel_id: channelData.channelId,
						user_ids: userIds,
						addedByUserId: channelData.creatorId
					})
				);
			}

			if (currentClanId === clan_id?.toString()) {
				const members = users
					.filter((user) => user?.user_id)
					.map((user) => ({
						id: user.user_id?.toString() || '',
						user: {
							id: user.user_id?.toString() || '',
							avatar_url: user.avatar,
							display_name: user.display_name,
							metadata: user.custom_status,
							username: user.username,
							create_time: new Date(user.create_time_second * 1000).toISOString(),
							online: user.online
						}
					}));

				dispatch(usersClanActions.upsertMany({ users: members, clanId: clan_id?.toString() || '' }));

				dispatch(
					channelMembersActions.addNewMember({
						channel_id: channelData.channelId,
						user_ids: userIds,
						addedByUserId: channelData.creatorId
					})
				);
			}
			if (userAdds.status !== ADD_ROLE_CHANNEL_STATUS) {
				dispatch(userChannelsActions.addUserChannel({ channelId: channelData.channelId, userAdds: userIds }));
			}
		},
		[userId, dispatch]
	);

	const onuserclanadded = useCallback(async (userJoinClan: AddClanUserEvent) => {
		const userData = {
			...userJoinClan,
			clanId: userJoinClan.clan_id?.toString() || '',
			userId: userJoinClan.user?.user_id?.toString() || ''
		};

		const store = await getStoreAsync();

		const clanMemberStore = selectClanMemberByClanId(store.getState() as unknown as RootState, userData.clanId);

		if (userJoinClan?.user && clanMemberStore) {
			const accountCreateTime = new Date(userJoinClan?.user?.create_time_second * 1000).toISOString();
			const joinTime = new Date().toISOString();
			dispatch(
				usersClanActions.add({
					user: {
						...userJoinClan,
						id: userData.userId,
						user: {
							...userJoinClan.user,
							avatar_url: userJoinClan.user.avatar,
							id: userData.userId,
							display_name: userJoinClan.user.display_name,
							metadata: userJoinClan.user.custom_status,
							username: userJoinClan.user.username,
							create_time: accountCreateTime,
							join_time: joinTime
						}
					},
					clanId: userData.clanId
				} as any)
			);
		}
	}, []);

	const onremovefriend = useCallback(
		(removeFriend: RemoveFriend) => {
			const remove = {
				...removeFriend,
				userId: removeFriend.user_id?.toString() || ''
			};
			dispatch(friendsActions.remove(remove.userId));
		},
		[dispatch]
	);

	const onstickercreated = useCallback(
		(stickerCreated: StickerCreateEvent) => {
			const sticker = {
				...stickerCreated,
				clanId: stickerCreated.clan_id?.toString() || '',
				creatorId: stickerCreated.creator_id?.toString() || '',
				stickerId: stickerCreated.sticker_id?.toString() || ''
			};
			dispatch(
				stickerSettingActions.add({
					category: stickerCreated.category,
					clan_id: sticker.clanId,
					creator_id: stickerCreated.creator_id,
					id: sticker.stickerId,
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
			const emoji = {
				...eventEmoji,
				clanId: eventEmoji.clan_id?.toString() || '',
				userId: eventEmoji.user_id?.toString() || '',
				emojiId: eventEmoji.id?.toString() || ''
			};

			if (eventEmoji.action === EEventAction.CREATED) {
				const newEmoji: ApiClanEmoji = {
					category: eventEmoji.clan_name,
					clan_id: eventEmoji.clan_id,
					creator_id: eventEmoji.user_id,
					id: eventEmoji.id,
					shortname: eventEmoji.short_name,
					src: emoji.userId === userId || !eventEmoji.is_for_sale ? eventEmoji.source : undefined,
					logo: eventEmoji.logo,
					clan_name: eventEmoji.clan_name
				};

				dispatch(emojiSuggestionActions.add(newEmoji));
			} else if (eventEmoji.action === EEventAction.UPDATE) {
				dispatch(
					emojiSuggestionActions.update({
						id: emoji.emojiId,
						changes: {
							shortname: eventEmoji.short_name
						}
					})
				);
			} else if (eventEmoji.action === EEventAction.DELETE) {
				dispatch(emojiSuggestionActions.remove(emoji.emojiId));
			}
		},
		[dispatch, userId]
	);

	const onstickerdeleted = useCallback(
		(stickerDeleted: StickerDeleteEvent) => {
			const sticker = {
				...stickerDeleted,
				stickerId: stickerDeleted.sticker_id?.toString() || ''
			};
			dispatch(stickerSettingActions.remove(sticker.stickerId));
		},
		[userId, dispatch]
	);

	const onstickerupdated = useCallback(
		(stickerUpdated: StickerUpdateEvent) => {
			const sticker = {
				...stickerUpdated,
				stickerId: stickerUpdated.sticker_id?.toString() || ''
			};
			dispatch(
				stickerSettingActions.update({
					id: sticker.stickerId,
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
			const profile = {
				...ClanProfileUpdates,
				userId: ClanProfileUpdates.user_id?.toString() || '',
				clanId: ClanProfileUpdates.clan_id?.toString() || ''
			};
			dispatch(
				usersClanActions.updateUserChannel({
					userId: profile.userId,
					clanId: profile.clanId,
					clanNick: ClanProfileUpdates.clan_nick,
					clanAvt: ClanProfileUpdates.clan_avatar
				})
			);
			dispatch(
				messagesActions.updateUserMessage({
					userId: profile.userId,
					clanId: profile.clanId,
					clanNick: ClanProfileUpdates.clan_nick,
					clanAvt: ClanProfileUpdates.clan_avatar
				})
			);
			dispatch(
				usersClanActions.updateUserClan({
					userId: profile.userId,
					clanNick: ClanProfileUpdates.clan_nick,
					clanAvt: ClanProfileUpdates.clan_avatar,
					clanId: profile.clanId
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
			const status = {
				...statusEvent,
				userId: statusEvent.user_id?.toString() || ''
			};

			dispatch(
				channelMembersActions.setCustomStatusUser({
					userId: status.userId,
					status: statusEvent.status,
					time_reset: statusEvent.time_reset
				})
			);

			dispatch(
				statusActions.updateMany([
					{
						id: status.userId,
						changes: {
							user_status: statusEvent.status
						}
					}
				])
			);

			dispatch(
				usersClanActions.updateUserStatus({
					userId: status.userId,
					user_status: statusEvent.status
				})
			);

			if (status.userId === userId) {
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
				joinSoundElement.src = '/assets/audio/bankSound.mp3';
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
			const typing = {
				...e,
				topicId: e.topic_id?.toString() || '',
				channelId: e.channel_id?.toString() || '',
				senderId: e.sender_id?.toString() || ''
			};
			dispatch(
				messagesActions.updateTypingUsers({
					channelId: typing.topicId || typing.channelId,
					userId: typing.senderId,
					isTyping: true,
					typingName: e.sender_display_name || e.sender_username
				})
			);
		},
		[dispatch, userId]
	);

	const onmessagereaction = useCallback(
		async (e: ApiMessageReaction) => {
			const reaction = {
				...e,
				senderId: e.sender_id?.toString() || ''
			};

			if (reaction.senderId === userId) {
				dispatch(emojiRecentActions.setLastEmojiRecent({ emoji_recents_id: e.emoji_recent_id, emoji_id: e.emoji_id }));
				dispatch(emojiRecentActions.addFirstEmojiRecent({ emoji_recents_id: e.emoji_recent_id, emoji_id: e.emoji_id }));
			}
			const reactionEntity = mapReactionToEntity(e);
			const store = await getStoreAsync();
			const isFocusTopicBox = selectClickedOnTopicStatus(store.getState());
			const currenTopicId = selectCurrentTopicId(store.getState());
			if (reactionEntity.topic_id && reactionEntity.topic_id?.toString() !== '0' && isFocusTopicBox && currenTopicId) {
				reactionEntity.channel_id = reactionEntity.topic_id?.toString() ?? '';
			}

			dispatch(messagesActions.updateMessageReactions(reactionEntity));
		},
		[userId]
	);

	const onchannelcreated = useCallback(async (channelCreated: ChannelCreatedEvent) => {
		const channel = {
			...channelCreated,
			channelId: channelCreated.channel_id?.toString() || '',
			clanId: channelCreated.clan_id?.toString() || '',
			parentId: channelCreated.parent_id?.toString() || '',
			categoryId: channelCreated.category_id?.toString() || '',
			creatorId: channelCreated.creator_id?.toString() || '',
			appId: channelCreated.app_id?.toString() || ''
		};

		if (channel.parentId && channel.parentId !== '0' && channelCreated.channel_private !== ChannelStatusEnum.isPrivate) {
			const newThread: ThreadsEntity = {
				...channelCreated,
				id: channel.channelId,
				type: channelCreated.channel_type,
				clan_id: channel.clanId,
				channel_id: channel.channelId,
				category_id: channel.categoryId,
				parent_id: channel.parentId,
				creator_id: channel.creatorId,
				last_sent_message: {
					sender_id: channelCreated.creator_id,
					timestamp_seconds: Date.now() / 1000
				},
				active: channel.creatorId === userId ? ThreadStatus.joined : ThreadStatus.activePublic
			};
			dispatch(
				threadsActions.addThreadToCached({
					channelId: channel.parentId,
					thread: newThread
				})
			);
		}

		if (channel.creatorId === userId) {
			if (channel.parentId) {
				const thread: ChannelsEntity = {
					id: channel.channelId,
					active: 1,
					category_id: channel.categoryId,
					creator_id: channel.creatorId,
					parent_id: channel.parentId,
					channel_id: channel.channelId,
					channel_label: channelCreated.channel_label,
					channel_private: channelCreated.channel_private,
					type: channelCreated.channel_type,
					app_id: channel.appId,
					clan_id: channel.clanId
				};
				dispatch(listChannelRenderAction.addThreadToListRender({ clanId: channel.clanId, channel: thread }));
			}

			if (channelCreated.channel_private === 1 && channelCreated.channel_type === ChannelType.CHANNEL_TYPE_CHANNEL) {
				dispatch(listChannelRenderAction.addChannelToListRender({ type: channelCreated.channel_type, ...channelCreated }));
			}
		}
		if (channelCreated && channelCreated.channel_private === 0 && (channel.parentId === '' || channel.parentId === '0')) {
			const store = await getStoreAsync();
			const category = channel.categoryId ? selectCategoryById(store.getState(), channel.categoryId) : null;
			const channelWithCategoryName = {
				...channelCreated,
				category_name: category?.category_name || ''
			};
			dispatch(channelsActions.createChannelSocket(channelWithCategoryName));
			const { clan_id, channel_id, parent_id, category_id, creator_id, app_id, ...channelCreatedRest } = channelCreated;
			dispatch(
				listChannelsByUserActions.addOneChannel({
					...channelCreatedRest,
					id: channel.channelId,
					type: channelCreated.channel_type,
					clan_id: channel.clanId,
					channel_id: channel.channelId,
					parent_id: channel.parentId
				})
			);
			dispatch(listChannelRenderAction.addChannelToListRender({ type: channelCreated.channel_type, ...channelCreated }));

			const now = Math.floor(Date.now() / 1000);
			const extendChannelCreated = {
				...channelCreated,
				last_seen_message: { timestamp_seconds: 0 },
				last_sent_message: { timestamp_seconds: now }
			};

			const isPublic = channel.parentId !== '' && channel.parentId !== '0' ? false : !channelCreated.channel_private;
			dispatch(
				channelsActions.joinChat({
					clanId: channel.clanId,
					channelId: channel.channelId,
					channelType: channelCreated.channel_type,
					isPublic
				})
			);
			dispatch(
				channelMetaActions.updateBulkChannelMetadata([
					{
						id: channel.channelId,
						lastSeenTimestamp: extendChannelCreated.last_seen_message.timestamp_seconds,
						lastSentTimestamp: extendChannelCreated.last_sent_message.timestamp_seconds,
						clanId: channel.clanId,
						isMute: false,
						senderId: ''
					}
				])
			);
		} else if (channel.creatorId === userId) {
			dispatch(listChannelRenderAction.addChannelToListRender({ type: channelCreated.channel_type, ...channelCreated }));
			if (channelCreated.channel_type !== ChannelType.CHANNEL_TYPE_DM && channelCreated.channel_type !== ChannelType.CHANNEL_TYPE_GROUP) {
				const { clan_id, channel_id, parent_id, category_id, creator_id, app_id, ...channelCreatedRest } = channelCreated;
				dispatch(
					listChannelsByUserActions.addOneChannel({
						...channelCreatedRest,
						id: channel.channelId,
						type: channelCreated.channel_type,
						clan_id: channel.clanId,
						channel_id: channel.channelId,
						parent_id: channel.parentId
					})
				);
			}
		}

		if (channelCreated.channel_type !== ChannelType.CHANNEL_TYPE_DM && channelCreated.channel_type !== ChannelType.CHANNEL_TYPE_GROUP) {
			dispatch(
				channelSettingActions.addChannelFromSocket({
					id: channel.channelId,
					channel_id: channel.channelId,
					channel_label: channelCreated.channel_label,
					parent_id: channel.parentId,
					category_id: channel.categoryId,
					clan_id: channel.clanId,
					channel_private: channelCreated.channel_private,
					channel_type: channelCreated.channel_type,
					creator_id: channel.creatorId,
					app_id: channel.appId
				})
			);
		}

		if (channelCreated.channel_type === ChannelType.CHANNEL_TYPE_DM) {
			dispatch(
				directActions.upsertOne({
					id: channel.channelId,
					channel_label: channelCreated.channel_label,
					type: channelCreated.channel_type,
					active: 1
				})
			);
		}
	}, []);
	const oncategoryevent = useCallback(async (categoryEvent: CategoryEvent) => {
		const category = {
			...categoryEvent,
			clanId: categoryEvent.clan_id?.toString() || '',
			categoryId: categoryEvent.id?.toString() || '',
			creatorId: categoryEvent.creator_id?.toString() || '',
			id: categoryEvent.id?.toString() || ''
		};

		if (categoryEvent.status === EEventAction.CREATED) {
			dispatch(
				categoriesActions.insertOne({
					clanId: category.clanId,
					category: {
						id: category.categoryId,
						category_id: category.categoryId,
						category_name: categoryEvent.category_name,
						clan_id: category.clanId,
						creator_id: category.creatorId
					}
				})
			);
			dispatch(
				listChannelRenderAction.addCategoryToListRender({
					clanId: category.clanId,
					cate: {
						id: category.categoryId,
						channels: [],
						category_id: category.categoryId,
						category_name: categoryEvent.category_name,
						creator_id: category.creatorId,
						clan_id: category.clanId
					}
				})
			);
		} else if (categoryEvent.status === EEventAction.DELETE) {
			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const clanId = selectCurrentClanId(store.getState());

			if (categoryEvent) {
				const currentChannel = currentChannelId ? selectChannelById(store.getState(), currentChannelId) : null;
				const isUserInCategoryChannel = currentChannel && currentChannel.category_id === category.categoryId;
				const allChannels = selectAllChannels(store.getState());

				const channelsInCategory = allChannels.filter((ch) => ch.category_id === category.categoryId);

				if (isUserInCategoryChannel) {
					if (!clanId) {
						navigate(`/chat/direct/friends`);
						return;
					}

					const welcomeChannelId = selectWelcomeChannelByClanId(store.getState(), clanId);
					const defaultChannelId = selectDefaultChannelIdByClanId(store.getState(), clanId);
					const fallbackChannelId = allChannels.find((ch) => ch.category_id !== category.categoryId && !checkIsThread(ch))?.id;

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

				dispatch(categoriesActions.deleteOne({ clanId: category.clanId, categoryId: category.categoryId }));
				dispatch(
					listChannelRenderAction.removeCategoryFromListRender({
						clanId: category.clanId,
						categoryId: category.categoryId
					})
				);
			}
		} else {
			dispatch(
				categoriesActions.updateOne({
					clanId: category.clanId,
					category: {
						id: category.categoryId,
						category_id: categoryEvent.id.toString(),
						category_name: categoryEvent.category_name,
						clan_id: category.clanId
					}
				})
			);
			dispatch(
				listChannelRenderAction.updateCategory({
					clanId: category.clanId,
					cate: {
						category_id: category.id,
						category_name: category.category_name,
						clan_id: category.clanId,
						creator_id: category.creatorId
					}
				})
			);
		}
	}, []);

	const onclandeleted = useCallback(
		(clanDelete: ClanDeletedEvent) => {
			if (!clanDelete?.clan_id) return;
			const clan = {
				...clanDelete,
				clanId: clanDelete.clan_id?.toString() || '',
				deletorId: clanDelete.deletor?.toString() || ''
			};

			dispatch(inviteActions.removeByClanId(clan.clanId));
			const store = getStore();
			const currentClanId = selectCurrentClanId(store.getState());
			dispatch(listChannelsByUserActions.removeByClanId({ clanId: clan.clanId }));
			dispatch(stickerSettingActions.removeStickersByClanId(clan.clanId));
			dispatch(emojiSuggestionActions.invalidateCache());
			dispatch(stickerSettingActions.invalidateCache());
			dispatch(channelsActions.removeByClanId(clan.clanId));
			if (clan.deletorId !== userId && currentClanId === clan.clanId) {
				if (isMobile) {
					const isVoiceJoined = selectVoiceInfo(store.getState());
					if (isVoiceJoined?.clanId === clan.clanId) {
						dispatch(voiceActions.resetVoiceControl());
					}
					const currentStreamInfo = selectCurrentStreamInfo(store.getState());
					if (currentStreamInfo?.clanId === clan.clanId) {
						dispatch(videoStreamActions.stopStream());
					}
					const clanList = selectOrderedClans(store.getState());
					const clanIdToJump = clanList?.filter((item) => item.clan_id !== clan.clanId)?.[0]?.clan_id;
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
				dispatch(clansSlice.actions.removeByClanID(clan.clanId));
			}
			dispatch(appActions.cleanHistoryClan(clan.clanId));
		},
		[userId, isMobile]
	);

	const onchanneldeleted = useCallback(
		async (channelDeleted: ChannelDeletedEvent) => {
			const channel = {
				...channelDeleted,
				channelId: channelDeleted.channel_id?.toString() || '',
				clanId: channelDeleted.clan_id?.toString() || '',
				parentId: channelDeleted.parent_id?.toString() || '',
				deletorId: channelDeleted.deletor?.toString() || ''
			};

			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const clanId = selectCurrentClanId(store.getState());

			dispatch(voiceActions.removeInVoiceInChannel(channel.channelId));
			dispatch(appActions.clearHistoryChannel({ channelId: channel.channelId }));
			dispatch(
				threadsActions.setIsShowCreateThread({
					channelId: channel.channelId,
					isShowCreateThread: false
				})
			);
			dispatch(
				channelsActions.removeChannelApp({
					clanId: channel.clanId,
					channelId: channel.channelId
				})
			);

			if (channel.parentId) {
				dispatch(
					threadsActions.setIsShowCreateThread({
						channelId: channel.parentId,
						isShowCreateThread: false
					})
				);
			}

			const isVoiceJoined = selectVoiceInfo(store.getState());
			if (channel.channelId === isVoiceJoined?.channelId) {
				dispatch(voiceActions.resetVoiceControl());
			}

			if (channel.channelId !== '0') {
				dispatch(channelSettingActions.removeChannelFromSocket(channel.channelId));
			}

			if (channel.deletorId === userId) {
				dispatch(channelsActions.deleteChannelSocket(channelDeleted));
				dispatch(listChannelsByUserActions.remove(channel.channelId));
				dispatch(listChannelRenderAction.updateClanBadgeRender({ channelId: channel.channelId, clanId: channel.clanId }));
				dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: channel.channelId, clanId: channel.clanId }));
				dispatch(threadsActions.remove(channel.channelId));
				dispatch(channelsActions.removeChannelApp({ channelId: channel.channelId, clanId: channel.clanId }));

				return;
			}
			if (channelDeleted) {
				const currentChannel = currentChannelId ? selectChannelById(store.getState(), currentChannelId) : null;
				const isUserInDeletedChannel = channel.channelId === currentChannelId;
				const isUserInChildThread = currentChannel && checkIsThread(currentChannel) && currentChannel.parent_id === channel.channelId;

				if (isUserInDeletedChannel || isUserInChildThread) {
					if (isMobile && currentChannel?.channel_id) {
						MobileEventEmitter.emit('@ON_REMOVE_USER_CHANNEL', {
							channelId: currentChannel.channel_id,
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
					const fallbackChannelId = allChannels.find((ch) => ch.id !== channel.channelId && !checkIsThread(ch))?.id;

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
				dispatch(listChannelsByUserActions.remove(channel.channelId));
				dispatch(listChannelRenderAction.updateClanBadgeRender({ channelId: channel.channelId, clanId: channel.clanId }));
				dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: channel.channelId, clanId: channel.clanId }));
				dispatch(channelsActions.removeChannelApp({ channelId: channel.channelId, clanId: channel.clanId }));

				dispatch(
					threadsActions.removeThreadFromCache({
						channelId: channel.parentId || '',
						threadId: channel.channelId
					})
				);
			}
		},
		[userId, isMobile]
	);

	const onuserprofileupdate = useCallback(
		(userUpdated: UserProfileUpdatedEvent) => {
			const user = {
				...userUpdated,
				userId: userUpdated.user_id?.toString() || '',
				channelId: userUpdated.channel_id?.toString() || ''
			};

			if (user.userId === userId) {
				dispatch(accountActions.setUpdateAccount({ encrypt_private_key: userUpdated?.encrypt_private_key }));
			} else {
				if (user.channelId) {
					dispatch(
						directActions.updateMemberDMGroup({
							dmId: user.channelId,
							user_id: user.userId,
							avatar: userUpdated.avatar,
							display_name: userUpdated.display_name,
							about_me: userUpdated.about_me
						})
					);
				}
				dispatch(
					usersClanActions.updateUserProfileAcrossClans({
						userId: user.userId,
						...(userUpdated.avatar && { avatar: userUpdated.avatar }),
						...(userUpdated.display_name && { display_name: userUpdated.display_name }),
						about_me: userUpdated.about_me
					})
				);
				dispatch(
					directActions.updateMemberDMGroup({
						dmId: user.channelId,
						user_id: user.userId,
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

			const channel = {
				...channelUpdated,
				channelId: channelUpdated.channel_id?.toString() || '',
				clanId: channelUpdated.clan_id?.toString() || '',
				parentId: channelUpdated.parent_id?.toString() || '',
				categoryId: channelUpdated.category_id?.toString() || '',
				creatorId: channelUpdated.creator_id?.toString() || '',
				appId: channelUpdated.app_id?.toString() || ''
			};

			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);
			const currentChannel = selectCurrentChannel(store.getState() as unknown as RootState);
			const channelExist = selectChannelByIdAndClanId(store.getState() as unknown as RootState, channel.clanId, channel.channelId);

			if (channel.clanId === '0') {
				if (channelUpdated?.e2ee && channel.creatorId !== userId) {
					dispatch(e2eeActions.setOpenModalE2ee(true));
				}
				if (channelUpdated.channel_label === '') {
					return dispatch(directActions.updateE2EE({ ...channelUpdated, currentUserId: userId }));
				}
				return dispatch(directActions.updateOne({ ...channelUpdated, currentUserId: userId }));
			}
			if (channelUpdated.channel_type !== ChannelType.CHANNEL_TYPE_DM && channelUpdated.channel_type !== ChannelType.CHANNEL_TYPE_GROUP) {
				dispatch(
					channelSettingActions.updateChannelFromSocket({
						id: channel.channelId,
						channel_id: channel.channelId,
						channel_label: channelUpdated.channel_label,
						parent_id: channel.parentId,
						category_id: channel.categoryId,
						clan_id: channel.clanId,
						channel_private: channelUpdated.channel_private,
						channel_type: channelUpdated.channel_type,
						creator_id: channel.creatorId,
						app_id: channel.appId
					})
				);
			}
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
					channel.creatorId !== userId &&
					(currentChannel?.channel_id === channel.channelId || currentChannel?.parent_id === channel.channelId)
				) {
					MobileEventEmitter.emit('@ON_REMOVE_USER_CHANNEL', {
						channelId: currentChannel?.channel_id,
						channelType: currentChannel?.type
					});
					dispatch(channelsActions.setCurrentChannelId({ clanId: channel.clanId, channelId: '' }));
				}
				if (!isMobile && result && currentChannelId === channel.channelId) {
					navigate(`/chat/clans/${channel.clanId}/member-safety`);
				}
			} else if (channelExist) {
				dispatch(
					listChannelRenderAction.updateChannelInListRender({
						channelId: channel.channelId,
						clanId: channel.clanId,
						dataUpdate: {
							channel_id: channel.channelId,
							channel_label: channelUpdated.channel_label,
							category_id: channel.categoryId,
							parent_id: channel.parentId,
							app_id: channel.appId,
							e2ee: channelUpdated.e2ee,
							topic: channelUpdated.topic,
							age_restricted: channelUpdated.age_restricted,
							channel_private: channelUpdated.channel_private,
							channel_avatar: channelUpdated.channel_avatar
						}
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
				const channelEntity: ChannelsEntity = {
					...channelUpdated,
					type: channelUpdated.channel_type,
					id: channel.channelId,
					clan_name: '',
					channel_id: channel.channelId,
					clan_id: channel.clanId,
					parent_id: channel.parentId,
					category_id: channel.categoryId,
					creator_id: channel.creatorId,
					app_id: channel.appId,
					role_ids: channelUpdated.role_ids?.map((id) => id?.toString() || '') || undefined,
					user_ids: channelUpdated.user_ids?.map((id) => id?.toString() || '') || undefined
				};
				const cleanData: Record<string, string | number | boolean | string[]> = {};

				Object.keys(channelUpdated).forEach((key) => {
					const value = channelUpdated[key as keyof ChannelUpdatedEvent];
					if (value !== undefined && value !== '') {
						if (typeof value === 'bigint') {
							cleanData[key as keyof typeof cleanData] = value.toString();
						} else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'bigint') {
							cleanData[key as keyof typeof cleanData] = value.map((v) => v.toString());
						} else if (typeof value !== 'bigint') {
							cleanData[key as keyof typeof cleanData] = value as string | number | boolean | string[];
						}
					}
				});

				dispatch(
					channelsActions.update({
						clanId: channel.clanId,
						update: {
							id: channel.channelId,
							changes: { ...cleanData }
						}
					})
				);
				const {
					clan_id: _clan_id2,
					channel_id: _channel_id2,
					parent_id: _parent_id2,
					category_id: _category_id2,
					creator_id: _creator_id2,
					app_id: _app_id2,
					...channelUpdatedRest2
				} = channelUpdated;
				dispatch(
					listChannelsByUserActions.upsertOne({
						...channelUpdatedRest2,
						id: channel.channelId,
						type: channelUpdated.channel_type,
						clan_id: channel.clanId,
						channel_id: channel.channelId,
						parent_id: channel.parentId
					})
				);

				if (
					(channelEntity.type === ChannelType.CHANNEL_TYPE_CHANNEL || channelEntity.type === ChannelType.CHANNEL_TYPE_THREAD) &&
					channel.parentId
				) {
					dispatch(
						threadsActions.updateActiveCodeThread({
							channelId: channel.channelId,
							activeCode: ThreadStatus.joined
						})
					);
				}
			} else {
				dispatch(channelsActions.updateChannelSocket(channelUpdated));
				const { clan_id, channel_id, parent_id, category_id, creator_id, app_id, ...rest } = channelUpdated;
				dispatch(
					listChannelsByUserActions.upsertOne({
						...rest,
						id: channel.channelId,
						type: channelUpdated.channel_type,
						clan_id: channel.clanId,
						channel_id: channel.channelId,
						parent_id: channel.parentId
					})
				);
			}
			if (channelUpdated.app_id) {
				dispatch(
					channelsActions.updateAppChannel({
						clanId: channel.clanId,
						channelId: channel.channelId,
						changes: { ...channelUpdated }
					})
				);
			}
			if (
				channelUpdated.channel_type === ChannelType.CHANNEL_TYPE_THREAD &&
				channelUpdated.status === ThreadStatus.joined &&
				channel.creatorId !== userId
			) {
				dispatch(
					channelsActions.update({
						clanId: channel.clanId,
						update: {
							id: channel.channelId,
							changes: {
								...channelUpdated,
								category_id: channel.categoryId,
								channel_id: channel.channelId,
								clan_id: channel.clanId,
								creator_id: channel.creatorId,
								parent_id: channel.parentId,
								app_id: channel.appId,
								role_ids: channelUpdated.role_ids?.map((id) => id?.toString() || '') || undefined,
								user_ids: channelUpdated.user_ids?.map((id) => id?.toString() || '') || undefined
							}
						}
					})
				);
				const { clan_id, channel_id, parent_id, category_id, creator_id, app_id, ...rest } = channelUpdated;
				dispatch(
					listChannelsByUserActions.upsertOne({
						...rest,
						id: channel.channelId,
						type: channelUpdated.channel_type,
						clan_id: channel.clanId,
						channel_id: channel.channelId,
						parent_id: channel.parentId
					})
				);
			}
			if (channelUpdated.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
				const cleanDataThread: Record<string, string | number | boolean | string[]> = {};

				Object.keys(channelUpdated).forEach((key) => {
					const value = channelUpdated[key as keyof ChannelUpdatedEvent];
					if (value !== undefined && value !== '') {
						if (typeof value === 'bigint') {
							cleanDataThread[key as keyof typeof cleanDataThread] = value.toString();
						} else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'bigint') {
							cleanDataThread[key as keyof typeof cleanDataThread] = value.map((v) => v.toString());
						} else {
							cleanDataThread[key as keyof typeof cleanDataThread] = value as string | number | boolean | string[];
						}
					}
				});
				dispatch(
					channelsActions.update({
						clanId: channel.clanId,
						update: {
							id: channel.channelId,
							changes: { ...cleanDataThread, active: 1, id: channel.channelId }
						}
					})
				);
			}
		},
		[dispatch, userId, isMobile]
	);

	const onpermissionset = useCallback(
		(setPermission: PermissionSet) => {
			const permission = {
				...setPermission,
				callerId: setPermission.caller?.toString() || '',
				roleId: setPermission.role_id?.toString() || '',
				channelId: setPermission.channel_id?.toString() || ''
			};

			if (userId !== permission.callerId) {
				const permissionRoleChannels: ApiPermissionUpdate[] = setPermission.permission_updates
					.filter((perm: ApiPermissionUpdate) => perm.type !== 0)
					.map((perm: ApiPermissionUpdate) => ({
						permission_id: perm.permission_id,
						active: perm.type === 1 ? true : perm.type === 2 ? false : undefined
					}));

				dispatch(
					permissionRoleChannelActions.updatePermission({
						roleId: permission.roleId,
						channelId: permission.channelId,
						permissionRole: permissionRoleChannels
					})
				);
			}
		},
		[dispatch, userId]
	);

	const onpermissionchanged = useCallback(
		async (userPermission: PermissionChangedEvent) => {
			const permission = {
				...userPermission,
				userId: userPermission.user_id?.toString() || '',
				channelId: userPermission.channel_id?.toString() || ''
			};

			const store = await getStoreAsync();
			const currentChannelId = selectCurrentChannelId(store.getState() as unknown as RootState);

			if (userId === permission.userId && currentChannelId === permission.channelId) {
				const permissions = [
					...(userPermission.add_permissions?.map((perm) => ({
						id: perm.permission_id?.toString() || '',
						slug: perm.slug as EOverriddenPermission,
						active: 1
					})) || []),
					...(userPermission.remove_permissions?.map((perm) => ({
						id: perm.permission_id?.toString() || '',
						slug: perm.slug as EOverriddenPermission,
						active: 0
					})) || []),
					...(userPermission.default_permissions?.map((perm) => ({
						id: perm.permission_id?.toString() || '',
						slug: perm.slug as EOverriddenPermission,
						active: perm.slug === EOverriddenPermission.sendMessage ? 1 : 0
					})) || [])
				];
				dispatch(
					overriddenPoliciesActions.updateChannelPermissions({
						channelId: permission.channelId,
						permissions
					})
				);
			}
		},
		[userId]
	);
	const onunmuteevent = useCallback(async (unmuteEvent: UnmuteEvent) => {
		const unmute = {
			...unmuteEvent,
			channelId: unmuteEvent.channel_id?.toString() || '',
			clanId: unmuteEvent.clan_id?.toString() || '',
			categoryId: unmuteEvent.category_id?.toString() || ''
		};

		dispatch(
			notificationSettingActions.updateNotiState({
				active: EMuteState.UN_MUTE,
				channelId: unmute.channelId
			})
		);
		if (unmute.categoryId && unmute.categoryId !== '0') {
			dispatch(
				defaultNotificationCategoryActions.unmuteCate({
					clanId: unmute.clanId,
					categoryId: unmute.categoryId
				})
			);
		}
		if (unmute.channelId && unmute.channelId !== '0') {
			dispatch(
				defaultNotificationCategoryActions.unmuteCate({
					clanId: unmute.clanId,
					categoryId: unmute.categoryId
				})
			);
		}
	}, []);
	const oneventcreated = useCallback(
		async (eventCreatedEvent: ApiCreateEventRequest) => {
			const event = {
				...eventCreatedEvent,
				channelId: eventCreatedEvent.channel_id?.toString() || '',
				clanId: eventCreatedEvent.clan_id?.toString() || ''
			};

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
					const newChannelId = event.channelId;
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
		const coffee = {
			...coffeeEvent,
			receiverId: coffeeEvent.receiver_id?.toString() || '',
			senderId: coffeeEvent.sender_id?.toString() || ''
		};

		const store = await getStoreAsync();
		const isReceiverGiveCoffee = coffee.receiverId === userId;

		if (isReceiverGiveCoffee && isElectron()) {
			const senderToken = coffee.senderId;
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
			const roleData = {
				...roleEvent,
				userId: roleEvent.user_id?.toString() || '',
				roleId: roleEvent.role?.id?.toString() || '',
				clanId: roleEvent.role?.clan_id?.toString() || '',
				creatorId: roleEvent.role?.creator_id?.toString() || '',
				userAddIds: roleEvent.user_add_ids?.map((id) => id?.toString() || '') || [],
				userRemoveIds: roleEvent.user_remove_ids?.map((id) => id?.toString() || '') || [],
				channelIds: roleEvent.role?.channel_ids?.map((id) => id?.toString() || '') || []
			};

			if (userId === roleData.userId) return;

			const { role, status } = roleEvent;

			if (roleData.userAddIds.length) {
				dispatch(
					usersClanActions.updateManyRoleIds({
						clanId: roleData.clanId,
						updates: roleData.userAddIds.map((id) => ({ userId: id, roleId: roleData.roleId }))
					})
				);
			}

			if (roleData.userRemoveIds.length) {
				dispatch(
					usersClanActions.removeManyRoleIds({
						clanId: roleData.clanId,
						updates: roleData.userRemoveIds.map((id) => ({ userId: id, roleId: roleData.roleId }))
					})
				);
			}

			if (status === EEventAction.CREATED && role) {
				dispatch(
					rolesClanActions.add({
						role: {
							id: roleData.roleId,
							clan_id: roleData.clanId,
							title: role.title,
							color: role.color,
							role_icon: role.role_icon,
							slug: role.slug,
							description: role.description,
							creator_id: roleData.creatorId,
							active: role.active,
							display_online: role.display_online,
							allow_mention: role.allow_mention,
							role_channel_active: role.role_channel_active,
							channel_ids: roleData.channelIds,
							max_level_permission: role.max_level_permission
						},
						clanId: roleData.clanId
					})
				);

				if (userId && roleData.userAddIds.includes(userId)) {
					dispatch(
						policiesActions.addOne({
							id: roleData.roleId,
							title: role.title
						})
					);
				}
				return;
			}

			if (status === EEventAction.UPDATE) {
				if (!userId) return;

				const isUserAffected = roleData.userAddIds.includes(userId) || roleData.userRemoveIds.includes(userId);

				if (isUserAffected) {
					const isUserResult = await dispatch(
						rolesClanActions.updatePermissionUserByRoleId({
							roleId: roleData.roleId,
							userId
						})
					).unwrap();

					if (isUserResult && roleData.userAddIds.includes(userId)) {
						const store = await getStoreAsync();
						const currentClanId = selectCurrentClanId(store.getState() as unknown as RootState);
						if (currentClanId === roleData.clanId) {
							dispatch(policiesActions.addPermissionCurrentClan(role));
						}
					}
				}

				dispatch(rolesClanActions.update({ role, clanId: roleData.clanId }));
				return;
			}

			if (status === EEventAction.DELETE) {
				dispatch(rolesClanActions.remove({ roleId: roleData.roleId, clanId: roleData.clanId }));
			}
		},
		[userId]
	);

	const onwebrtcsignalingfwd = useCallback(async (event: WebrtcSignalingFwd) => {
		const webrtc = {
			...event,
			callerId: event.caller_id?.toString() || '',
			receiverId: event.receiver_id?.toString() || '',
			channelId: event.channel_id?.toString() || ''
		};

		const WEBRTC_CLEAR_CALL = 50;
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
		if (!isInCall && [WebrtcSignalingType.WEBRTC_SDP_ANSWER, WebrtcSignalingType.WEBRTC_ICE_CANDIDATE].includes(signalingType)) {
			return;
		}

		if (userCallId && userCallId !== webrtc.callerId) {
			if (!userId) return;
			socketRef.current?.forwardWebrtcSignaling(
				BigInt(webrtc.callerId),
				WebrtcSignalingType.WEBRTC_SDP_JOINED_OTHER_CALL,
				'',
				BigInt(webrtc.channelId),
				BigInt(userId)
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
				if (!userId) return;
				socketRef.current?.forwardWebrtcSignaling(BigInt(webrtc.callerId), WEBRTC_CLEAR_CALL, '', BigInt(webrtc.channelId), BigInt(userId));
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
					calleeId: webrtc.receiverId,
					signalingData: {
						receiver_id: webrtc.receiverId,
						data_type: event.data_type,
						json_data: event.json_data || '',
						channel_id: webrtc.channelId,
						caller_id: webrtc.callerId
					},
					id: webrtc.callerId,
					callerId: webrtc.callerId
				})
			);
		}
	}, []);

	const onuserstatusevent = useCallback(
		async (userStatusEvent: UserStatusEvent) => {
			const status = {
				...userStatusEvent,
				userId: userStatusEvent.user_id?.toString() || ''
			};

			if (status.userId !== userId) {
				dispatch(friendsActions.updateUserStatus({ userId: status.userId, user_status: userStatusEvent.custom_status }));
			} else {
				dispatch(accountActions.updateUserStatus(userStatusEvent.custom_status));
			}

			dispatch(statusActions.updateStatus(userStatusEvent));

			dispatch(
				friendsActions.updateOnlineFriend({
					id: status.userId,
					online: !(userStatusEvent?.custom_status === EUserStatus.INVISIBLE)
				})
			);
		},
		[userId]
	);

	const oneventwebhook = useCallback(async (webhook_event: ApiWebhook) => {
		const webhook = {
			...webhook_event,
			clanId: webhook_event.clan_id?.toString() || '',
			webhookId: webhook_event.id?.toString() || ''
		};

		if (webhook_event.status === EEventAction.DELETE) {
			dispatch(webhookActions.removeOneWebhook({ clanId: webhook.clanId, webhookId: webhook.webhookId }));
		} else {
			dispatch(webhookActions.upsertWebhook(webhook_event));
		}
	}, []);

	const onclanupdated = useCallback(async (clanUpdatedEvent: ClanUpdatedEvent) => {
		if (!clanUpdatedEvent) return;
		const clan = {
			...clanUpdatedEvent,
			clanId: clanUpdatedEvent.clan_id?.toString() || ''
		};

		dispatch(clansSlice.actions.update({ dataUpdate: clanUpdatedEvent }));
		if (clanUpdatedEvent.prevent_anonymous) {
			const store = getStore();
			const clanIdActive = selectCurrentClanId(store.getState());
			dispatch(accountActions.turnOffAnonymous({ id: clan.clanId, topic: clanIdActive === clan.clanId }));
		}
	}, []);

	const onJoinChannelAppEvent = useCallback(async (joinChannelAppData: JoinChannelAppData) => {
		if (!joinChannelAppData) return;
		dispatch(channelAppSlice.actions.setJoinChannelAppData({ dataUpdate: joinChannelAppData }));
	}, []);

	const onsdtopicevent = useCallback(async (sdTopicEvent: SdTopicEvent) => {
		if (!sdTopicEvent) return;

		const topic = {
			...sdTopicEvent,
			channelId: sdTopicEvent.channel_id?.toString() || '',
			messageId: sdTopicEvent.message_id?.toString() || '',
			topicId: sdTopicEvent.id?.toString() || '',
			creatorId: sdTopicEvent.user_id?.toString() || '',
			clanId: sdTopicEvent.clan_id?.toString() || ''
		};

		const convertedLastSentMessage: IChannelMessageHeader | undefined = sdTopicEvent.last_sent_message
			? {
					...sdTopicEvent.last_sent_message,
					id: sdTopicEvent.last_sent_message.id ? String(sdTopicEvent.last_sent_message.id) : undefined,
					sender_id: sdTopicEvent.last_sent_message.sender_id ? String(sdTopicEvent.last_sent_message.sender_id) : undefined,
					repliers: sdTopicEvent.last_sent_message.repliers?.map((r: bigint) => String(r))
				}
			: undefined;

		dispatch(
			messagesActions.updateToBeTopicMessage({
				channelId: topic.channelId,
				messageId: topic.messageId,
				topicId: topic.topicId,
				creatorId: topic.creatorId
			})
		);
		dispatch(
			topicsActions.addTopic({
				clanId: topic.clanId,
				topic: {
					id: topic.topicId,
					clan_id: topic.clanId,
					channel_id: topic.channelId,
					message_id: topic.messageId,
					last_sent_message: convertedLastSentMessage,
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
			const block = {
				...blockFriend,
				userId: blockFriend.user_id?.toString() || ''
			};
			dispatch(
				friendsActions.updateFriendState({
					userId: block.userId,
					sourceId: block.userId
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
			const unblock = {
				...unblockFriend,
				userId: unblockFriend.user_id?.toString() || ''
			};
			dispatch(
				friendsActions.updateFriendState({
					userId: unblock.userId
				})
			);
		},
		[dispatch]
	);

	const onMarkAsRead = useCallback(async (markAsReadEvent: MarkAsRead) => {
		const markAsRead = {
			...markAsReadEvent,
			clanId: markAsReadEvent.clan_id?.toString() || '',
			categoryId: markAsReadEvent.category_id?.toString() || '',
			channelId: markAsReadEvent.channel_id?.toString() || ''
		};

		const store = getStore();

		const channels = selectChannelThreads(store.getState() as RootState);
		if (!markAsRead.categoryId) {
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
					clanId: markAsRead.clanId,
					channelIds
				})
			);
			dispatch(clansActions.updateClanBadgeCount({ clanId: markAsRead.clanId, count: 0, isReset: true }));
			dispatch(
				listChannelRenderAction.handleMarkAsReadListRender({
					type: EMarkAsReadType.CLAN,
					clanId: markAsRead.clanId
				})
			);
			dispatch(listChannelsByUserActions.markAsReadChannel(channelIds));
			return;
		}
		if (!markAsRead.channelId) {
			const channelsInCategory = channels.filter((channel) => channel.category_id === markAsRead.categoryId);

			const allChannelsAndThreads = channelsInCategory.flatMap((channel) => [channel, ...(channel.threads || [])]);

			const channelIds = allChannelsAndThreads.map((item) => item.id);

			const channelUpdates = channelIds.map((channelId) => ({
				channelId,
				messageId: selectLatestMessageId(store.getState(), channelId) || undefined
			}));
			dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelUpdates));
			dispatch(
				channelsActions.resetChannelsCount({
					clanId: markAsRead.clanId,
					channelIds
				})
			);
			dispatch(
				listChannelRenderAction.handleMarkAsReadListRender({
					type: EMarkAsReadType.CATEGORY,
					clanId: markAsRead.clanId,
					categoryId: markAsRead.categoryId
				})
			);
			dispatch(listChannelsByUserActions.markAsReadChannel(channelIds));
		} else {
			const relatedChannels = channels.filter((channel) => channel.id === markAsRead.channelId || channel.parent_id === markAsRead.channelId);

			const channelIds = relatedChannels.map((channel) => channel.id);

			const channelUpdates = channelIds.map((channelId) => ({
				channelId,
				messageId: selectLatestMessageId(store.getState(), channelId) || undefined
			}));
			dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelUpdates));
			dispatch(
				channelsActions.resetChannelsCount({
					clanId: markAsRead.clanId,
					channelIds
				})
			);
			dispatch(
				clansActions.updateClanBadgeCountFromChannels({
					clanId: markAsRead.clanId,
					channels: relatedChannels.map((channel) => ({
						channelId: channel.id,
						count: (channel.count_mess_unread ?? 0) * -1
					}))
				})
			);
			dispatch(
				listChannelRenderAction.handleMarkAsReadListRender({
					type: EMarkAsReadType.CHANNEL,
					clanId: markAsRead.clanId,
					channelId: markAsRead.channelId
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

			dispatch(listChannelsByUserActions.markAsReadChannel([markAsRead.channelId, ...threadIds]));
		}
	}, []);

	const onaddfriend = useCallback((user: AddFriend) => {
		const friend = {
			...user,
			userId: user.user_id?.toString() || ''
		};

		dispatch(friendsActions.upsertFriendRequest({ user, myId: userId || '' }));
		dispatch(
			listUsersByUserActions.updateUserInList({
				id: friend.userId,
				avatar_url: user?.avatar,
				display_name: user?.display_name,
				username: user?.username
			})
		);
	}, []);

	const onbanneduser = useCallback((user: BannedUserEvent) => {
		const banned = {
			...user,
			clanId: user.clan_id?.toString() || '',
			bannerId: user.banner_id?.toString() || '',
			channelId: user.channel_id?.toString() || '',
			userIds: user.user_ids?.map((id) => id?.toString() || '') || []
		};

		if (user.action === 1) {
			dispatch(
				usersClanActions.addBannedUser({
					clanId: banned.clanId,
					banner_id: banned.bannerId,
					channelId: banned.channelId,
					userIds: banned.userIds,
					ban_time: user?.ban_time
				})
			);
		} else {
			dispatch(usersClanActions.removeBannedUser({ clanId: banned.clanId, channelId: banned.channelId, userIds: banned.userIds }));
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
