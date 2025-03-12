import { captureSentryError } from '@mezon/logger';
import { Direction_Mode, INotification, LoadingStatus, NotificationCategory, NotificationEntity } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import memoizee from 'memoizee';
import { ApiNotification } from 'mezon-js/api.gen';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
export const NOTIFICATION_FEATURE_KEY = 'notification';
const LIST_NOTIFICATION_CACHED_TIME = 1000 * 60 * 60;
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
	notifications: Record<NotificationCategory, { data: NotificationEntity[]; lastId: string }>;
}

export type LastSeenTimeStampChannelArgs = {
	channelId: string;
	lastSeenTimeStamp: number;
	clanId: string;
};

export const notificationAdapter = createEntityAdapter<NotificationEntity>();

const fetchListNotificationCached = memoizee(
	async (mezon: MezonValueContext, clanId: string, category: NotificationCategory | undefined, notificationId: string) => {
		const response = await mezon.client.listNotifications(
			mezon.session,
			clanId,
			LIMIT_NOTIFICATION,
			notificationId || '',
			category, // category
			Direction_Mode.BEFORE_TIMESTAMP
		);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: LIST_NOTIFICATION_CACHED_TIME,
		normalizer: (args) => {
			if (args[3] === undefined) {
				args[3] = '';
			}
			return args[1] + args[2] + args[3] + args[0].session.username;
		}
	}
);

export const fetchListNotification = createAsyncThunk(
	'notification/fetchListNotification',
	async ({ clanId, category, notificationId, noCache }: FetchNotificationArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchListNotificationCached.delete(mezon, clanId, category, notificationId as string);
			}
			const response = await fetchListNotificationCached(mezon, clanId, category, notificationId as string);
			if (!response.notifications) {
				return {
					category,
					data: [] as INotification[]
				};
			}
			if (Date.now() - response.time < 100) {
				const notifications = response.notifications.map(mapNotificationToEntity);
				return {
					data: notifications,
					category: category
				};
			}
			return {
				category,
				data: [] as INotification[]
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

			if (state.notifications[category]) {
				state.notifications[category].data = [data, ...state.notifications[category].data];
			} else {
				state.notifications[category] = { data: [data], lastId: '' };
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
		}
	},

	extraReducers: (builder) => {
		builder
			.addCase(fetchListNotification.pending, (state: NotificationState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchListNotification.fulfilled,
				(state: NotificationState, action: PayloadAction<{ data: INotification[]; category: NotificationCategory }>) => {
					if (action.payload && Array.isArray(action.payload.data) && action.payload.data.length > 0) {
						notificationAdapter.setMany(state, action.payload.data);

						const { data, category } = action.payload;

						if (state.notifications[category]) {
							state.notifications[category].data = [...state.notifications[category].data, ...data];
						} else {
							state.notifications[category] = { data: [...data], lastId: '' };
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
			});
	}
});

export const notificationReducer = notificationSlice.reducer;

export const notificationActions = {
	...notificationSlice.actions,
	fetchListNotification,
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
