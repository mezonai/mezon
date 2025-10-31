import { captureSentryError } from '@mezon/logger';
import type { INotification, LoadingStatus, NotificationEntity } from '@mezon/utils';
import { Direction_Mode, NotificationCategory } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
import type { ApiChannelMessageHeader, ApiNotification } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx } from '../helpers';
import type { MessagesEntity } from '../messages/messages.slice';
import type { RootState } from '../store';

export const NOTIFICATION_FEATURE_KEY = 'notification';
const LIMIT_NOTIFICATION = 50;

export const mapNotificationToEntity = (notifyRes: ApiNotification): INotification => {
	return { ...notifyRes, id: notifyRes.id || '', content: notifyRes.content };
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

	const response = await ensuredMezon.client.listNotifications(
		ensuredMezon.session,
		clanId,
		LIMIT_NOTIFICATION,
		notificationId || '',
		category,
		Direction_Mode.BEFORE_TIMESTAMP
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
				clanId,
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

			const notifications = response.notifications.map(mapNotificationToEntity);
			return {
				data: notifications,
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
			avatar: message.avatar,
			clan_id: message.clan_id,
			channel_id: message.channel_id,
			attachments: JSON.stringify(message.attachments),
			mentions: JSON.stringify(message.mentions),
			reactions: JSON.stringify(message.reactions),
			references: JSON.stringify(message.references)
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

						if (state.notifications[category]) {
							state.notifications[category].data = [...state.notifications[category].data, ...data];
						} else {
							state.notifications[category] = { data: [...data], lastId: '', cache: undefined };
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
					if (state.notifications[NotificationCategory.MESSAGES].data.length) {
						const { noti, message } = action.payload;
						const notiMark: INotification = {
							...message,
							id: noti.id || '',
							...noti,
							create_time: safeJSONParse(noti.content || '').create_time,
							content: safeJSONParse(noti.content || ''),
							category: NotificationCategory.MESSAGES
						};
						state.notifications[NotificationCategory.MESSAGES].data = [
							...state.notifications[NotificationCategory.MESSAGES].data,
							notiMark
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
