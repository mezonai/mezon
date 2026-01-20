import { captureSentryError } from '@mezon/logger';
import type { INotification, LoadingStatus, NotificationEntity } from '@mezon/utils';
import { Direction_Mode, NotificationCategory } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { Notification } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import type { ApiChannelMessageHeader, ApiMessageMention } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';
import type { MessagesEntity } from '../messages/messages.slice';
import type { RootState } from '../store';

export const NOTIFICATION_FEATURE_KEY = 'notification';
const LIMIT_NOTIFICATION = 50;

export const mapNotificationToEntity = (notifyRes: INotification): Notification => {
	return {
		...notifyRes,
		id: notifyRes.id || '',
		create_time: notifyRes.create_time
	};
};

export interface FetchNotificationArgs {
	clanId: string;
	category: NotificationCategory;
	notificationId?: string;
	noCache?: boolean;
}

export interface NotificationState extends EntityState<NotificationEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	messageNotifiedId: string;
	isShowInbox: boolean;
	notifications: Record<
		NotificationCategory,
		{
			data: NotificationEntity[];
			lastId: string;
			cache?: CacheMetadata;
		}
	>;
}

export type LastSeenTimeStampChannelArgs = {
	channelId: string;
	lastSeenTimeStamp: number;
	clanId: string;
};

export const notificationAdapter = createEntityAdapter<NotificationEntity>();

export const fetchListNotificationCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	clanId: string,
	category: NotificationCategory | undefined,
	notificationId: string,
	noCache = false
) => {
	const state = getState();
	const notificationData = state[NOTIFICATION_FEATURE_KEY].notifications[category as NotificationCategory];
	const apiKey = createApiKey('fetchListNotification', clanId, category || '', notificationId || '');
	const shouldForceCall = shouldForceApiCall(apiKey, notificationData?.cache, noCache);

	if (!shouldForceCall) {
		return {
			notifications: notificationData.data,
			fromCache: true
		};
	}

	const response = await withRetry(
		(session) =>
			ensuredMezon.client.listNotifications(
				session,
				clanId,
				LIMIT_NOTIFICATION,
				notificationId || '0',
				category,
				Direction_Mode.BEFORE_TIMESTAMP
			),
		{
			maxRetries: 3,
			initialDelay: 1000,
			scope: 'notifications',
			mezon: ensuredMezon
		}
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

export const fetchListNotification = createAsyncThunk(
	'notification/fetchListNotification',
	async ({ clanId, category, notificationId, noCache }: FetchNotificationArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchListNotificationCached(
				thunkAPI.getState as () => RootState,
				mezon,
				clanId || '0',
				category,
				notificationId as string,
				noCache
			);

			const fromCache = response.fromCache || false;

			if (!response.notifications) {
				return {
					category,
					data: [] as INotification[],
					fromCache
				};
			}

			return {
				data: response.notifications as INotification[],
				category,
				fromCache
			};
		} catch (error) {
			captureSentryError(error, 'notification/fetchListNotification');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteNotify = createAsyncThunk(
	'notification/deleteNotify',
	async ({ ids, category }: { ids: string[]; category: NotificationCategory }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteNotifications(mezon.session, ids, category);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			return { ids, category };
		} catch (error) {
			captureSentryError(error, 'notification/deleteNotify');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const markMessageNotify = createAsyncThunk('notification/markMessageNotify', async (message: MessagesEntity, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.createMessage2Inbox(mezon.session, {
			message_id: message.id,
			content: JSON.stringify(message.content),
			avatar: message.avatar || '',
			clan_id: message.clan_id || '',
			channel_id: message.channel_id
		});
		if (!response) {
			return thunkAPI.rejectWithValue([]);
		}
		return {
			noti: response,
			message
		};
	} catch (error) {
		captureSentryError(error, 'notification/markMessageNotify');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialNotificationState: NotificationState = notificationAdapter.getInitialState({
	loadingStatus: 'not loaded',
	notificationMentions: [],
	error: null,
	messageNotifiedId: '',
	quantityNotifyChannels: {},
	lastSeenTimeStampChannels: {},
	quantityNotifyClans: {},
	isShowInbox: false,
	notifications: {
		[NotificationCategory.FOR_YOU]: { data: [], lastId: '' },
		[NotificationCategory.MESSAGES]: { data: [], lastId: '' },
		[NotificationCategory.MENTIONS]: { data: [], lastId: '' }
	}
});

export const notificationSlice = createSlice({
	name: NOTIFICATION_FEATURE_KEY,
	initialState: initialNotificationState,
	reducers: {
		removeAll: notificationAdapter.removeAll,
		add(state, action: PayloadAction<{ data: INotification; category: NotificationCategory }>) {
			const { data, category } = action.payload;

			if (state.notifications[category]?.data?.length) {
				state.notifications[category].data = [data, ...state.notifications[category].data];
			}
		},

		remove(state, action: PayloadAction<{ id: string; category: NotificationCategory }>) {
			const { id, category } = action.payload;

			if (state.notifications[category]) {
				state.notifications[category].data = state.notifications[category].data.filter((item) => item.id !== id);
			}
		},

		setMessageNotifiedId(state, action) {
			state.messageNotifiedId = action.payload;
		},

		setIsShowInbox(state, action: PayloadAction<boolean>) {
			state.isShowInbox = action.payload;
		},
		refreshStatus(state) {
			state.loadingStatus = 'not loaded';
		},
		invalidateCache: (state, action: PayloadAction<{ category: NotificationCategory }>) => {
			const { category } = action.payload;
			if (state.notifications[category]?.cache) {
				state.notifications[category].cache = undefined;
			}
		},
		updateCache: (state, action: PayloadAction<{ category: NotificationCategory }>) => {
			const { category } = action.payload;
			if (!state.notifications[category]) {
				state.notifications[category] = { data: [], lastId: '', cache: undefined };
			}
			state.notifications[category].cache = createCacheMetadata();
		},
		resetAllState() {
			return initialNotificationState;
		}
	},

	extraReducers: (builder) => {
		builder
			.addCase(fetchListNotification.pending, (state: NotificationState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchListNotification.fulfilled,
				(state: NotificationState, action: PayloadAction<{ data: INotification[]; category: NotificationCategory; fromCache?: boolean }>) => {
					if (action.payload && Array.isArray(action.payload.data) && action.payload.data.length > 0) {
						notificationAdapter.setMany(state, action.payload.data);

						const { data, category, fromCache } = action.payload;
						const dataParse = data.map((item) => {
							return {
								...item,
								content: {
									...item.content,
									content:
										typeof item.content?.content === 'string' ? safeJSONParse(item.content?.content)?.t : item.content?.content
								}
							};
						});
						if (state.notifications[category]) {
							state.notifications[category].data = [...state.notifications[category].data, ...dataParse];
						} else {
							state.notifications[category] = { data: [...dataParse], lastId: '', cache: undefined };
						}

						if (!fromCache) {
							state.notifications[category].cache = createCacheMetadata();
						}

						state.loadingStatus = 'loaded';

						if (data.length >= LIMIT_NOTIFICATION) {
							state.notifications[category].lastId = data[data.length - 1].id;
						}
					} else {
						state.loadingStatus = 'not loaded';
					}
				}
			)

			.addCase(fetchListNotification.rejected, (state: NotificationState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(deleteNotify.fulfilled, (state: NotificationState, action: PayloadAction<{ ids: string[]; category: NotificationCategory }>) => {
				const { ids, category } = action.payload;

				if (state.notifications[category]) {
					state.notifications[category].data = state.notifications[category].data.filter((item) => !ids.includes(item.id));
				}
			})
			.addCase(
				markMessageNotify.fulfilled,
				(state: NotificationState, action: PayloadAction<{ noti: ApiChannelMessageHeader; message: MessagesEntity }>) => {
					if (state.notifications[NotificationCategory.MESSAGES].data && state.notifications[NotificationCategory.MESSAGES].data?.[0]?.id) {
						const { noti, message } = action.payload;
						const mention_ids: string[] = [];
						const position_s: number[] = [];
						const position_e: number[] = [];
						const is_mention_role: boolean[] = [];
						(message.mentions || []).map((item: ApiMessageMention) => {
							if (item.user_id && item.s && item.e) {
								mention_ids.push(item.user_id);
								is_mention_role.push(false);
								position_s.push(item.s);
								position_e.push(item.e);
							}
							if (item.role_id && item.s && item.e) {
								mention_ids.push(item.role_id);
								is_mention_role.push(true);
								position_s.push(item.s);
								position_e.push(item.e);
							}
						});
						const notiMark: INotification = {
							...message,
							id: noti.id || '',
							...noti,
							content: {
								title: '',
								link: '',
								content: message.content.t,
								channel_id: message.channel_id,
								sender_id: message.sender_id,
								avatar: message.clan_avatar || message.avatar,
								clan_id: message.clan_id,
								attachment_link: message.attachments?.[0]?.url || '',
								display_name: message.clan_nick || message.display_name || message.username,
								create_time_seconds: message.create_time_seconds,
								update_time_seconds: message.update_time_seconds,
								username: message.username,
								mention_ids,
								position_s,
								position_e,
								attachment_type: '',
								has_more_attachment: (message.attachments?.length || 0) > 2,
								is_mention_role,
								message_id: message.message_id
							},
							category: NotificationCategory.MESSAGES,
							avatar_url: message?.avatar?.[0] || '',
							clan_id: message.clan_id || '',
							topic_id: message.topic_id || ''
						};

						state.notifications[NotificationCategory.MESSAGES].data = [
							notiMark,
							...state.notifications[NotificationCategory.MESSAGES].data
						];
					}
				}
			);
	}
});

export const notificationReducer = notificationSlice.reducer;

export const notificationActions = {
	...notificationSlice.actions,
	fetchListNotification,
	markMessageNotify,
	deleteNotify
};

export const getNotificationState = (rootState: { [NOTIFICATION_FEATURE_KEY]: NotificationState }): NotificationState =>
	rootState[NOTIFICATION_FEATURE_KEY];

export const selectNotifications = createSelector(getNotificationState, (state) => state.notifications);

export const selectNotificationForYou = createSelector(selectNotifications, (notifications) => notifications[NotificationCategory.FOR_YOU]);
export const selectNotificationMentions = createSelector(selectNotifications, (notifications) => notifications[NotificationCategory.MENTIONS]);
export const selectNotificationClan = createSelector(selectNotifications, (notifications) => notifications[NotificationCategory.MESSAGES]);

export const selectMessageNotified = createSelector(getNotificationState, (state: NotificationState) => state.messageNotifiedId);

export const selectIsShowInbox = createSelector(getNotificationState, (state: NotificationState) => state.isShowInbox);
