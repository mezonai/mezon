import { captureSentryError } from '@mezon/logger';
import { Direction_Mode, INotification, LoadingStatus, NotificationCode, NotificationEntity } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import memoizee from 'memoizee';
import { Notification } from 'mezon-js';
import { ChannelMetaEntity } from '../channels/channelmeta.slice';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
export const NOTIFICATION_FEATURE_KEY = 'notification';
const LIST_NOTIFICATION_CACHED_TIME = 1000 * 60 * 3;
const LIMIT_NOTIFICATION = 50;

export const mapNotificationToEntity = (notifyRes: Notification): INotification => {
	return { ...notifyRes, id: notifyRes.id || '', content: notifyRes.content ? { ...notifyRes.content, create_time: notifyRes.create_time } : null };
};

export interface FetchNotificationArgs {
	clanId: string;
	notificationId?: string;
	noCache?: boolean;
}

export interface NotificationState extends EntityState<NotificationEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	messageNotifiedId: string;
	isShowInbox: boolean;
	lastNotificationId: string;
}

export type LastSeenTimeStampChannelArgs = {
	channelId: string;
	lastSeenTimeStamp: number;
	clanId: string;
};

export const notificationAdapter = createEntityAdapter<NotificationEntity>();

const fetchListNotificationCached = memoizee(
	async (mezon: MezonValueContext, clanId: string, notificationId: string) => {
		const response = await mezon.client.listNotifications(
			mezon.session,
			clanId,
			LIMIT_NOTIFICATION,
			notificationId || '',
			undefined, // code
			Direction_Mode.BEFORE_TIMESTAMP
		);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: LIST_NOTIFICATION_CACHED_TIME,
		normalizer: (args) => {
			if (args[2] === undefined) {
				args[2] = '';
			}
			return args[1] + args[2] + args[0].session.username;
		}
	}
);

export const fetchListNotification = createAsyncThunk(
	'notification/fetchListNotification',
	async ({ clanId, notificationId, noCache }: FetchNotificationArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchListNotificationCached.delete(mezon, clanId, notificationId as string);
			}
			const response = await fetchListNotificationCached(mezon, clanId, notificationId as string);
			if (!response.notifications) {
				return [];
			}
			if (Date.now() - response.time < 100) {
				const notifications = response.notifications.map(mapNotificationToEntity);
				return notifications;
			}
			return null;
		} catch (error) {
			captureSentryError(error, 'notification/fetchListNotification');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteNotify = createAsyncThunk('notification/deleteNotify', async ({ ids, clanId }: { ids: string[]; clanId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.deleteNotifications(mezon.session, ids);
		if (!response) {
			return thunkAPI.rejectWithValue([]);
		}
		return { ids };
	} catch (error) {
		captureSentryError(error, 'notification/deleteNotify');
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
	lastNotificationId: ''
});

export const notificationSlice = createSlice({
	name: NOTIFICATION_FEATURE_KEY,
	initialState: initialNotificationState,
	reducers: {
		add(state, action) {
			notificationAdapter.addOne(state, action.payload);
		},

		remove: notificationAdapter.removeOne,
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
			.addCase(fetchListNotification.fulfilled, (state: NotificationState, action: PayloadAction<INotification[] | null>) => {
				if (action.payload && Array.isArray(action.payload) && action.payload.length > 0) {
					notificationAdapter.setMany(state, action.payload);
					state.loadingStatus = 'loaded';
					if (action.payload.length >= LIMIT_NOTIFICATION) {
						state.lastNotificationId = action.payload[action.payload.length - 1].id;
					}
				} else {
					state.loadingStatus = 'not loaded';
				}
			})
			.addCase(fetchListNotification.rejected, (state: NotificationState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(deleteNotify.fulfilled, (state: NotificationState, action: PayloadAction<{ ids: string[] }>) => {
				notificationAdapter.removeMany(state, action.payload.ids);
			});
	}
});

export const notificationReducer = notificationSlice.reducer;

export const notificationActions = {
	...notificationSlice.actions,
	fetchListNotification,
	deleteNotify
};

const { selectAll, selectEntities } = notificationAdapter.getSelectors();

export const getNotificationState = (rootState: { [NOTIFICATION_FEATURE_KEY]: NotificationState }): NotificationState =>
	rootState[NOTIFICATION_FEATURE_KEY];

export const selectLastNotificationId = createSelector(getNotificationState, (state) => state.lastNotificationId);

export const selectAllNotification = createSelector(getNotificationState, selectAll);

export const selectNotificationEntities = createSelector(getNotificationState, selectEntities);

export const selectNotificationMentions = createSelector(selectAllNotification, (notifications) =>
	notifications.filter(
		(notification) => notification.code === NotificationCode.USER_MENTIONED || notification.code === NotificationCode.USER_REPLIED
	)
);

export const selectNotificationMessages = createSelector(selectAllNotification, (notifications) => {
	return notifications.filter((notification) => notification.code !== -2 && notification.code !== -3);
});

export const selectMessageNotified = createSelector(getNotificationState, (state: NotificationState) => state.messageNotifiedId);

export const selectIsShowInbox = createSelector(getNotificationState, (state: NotificationState) => state.isShowInbox);

export const selectAllNotificationExcludeMentionAndReply = createSelector(selectAllNotification, (notifications) =>
	notifications.filter(
		(notification) =>
			notification.code !== NotificationCode.USER_REPLIED &&
			notification.code !== NotificationCode.USER_MENTIONED &&
			notification.code !== NotificationCode.NOTIFICATION_CLAN
	)
);
export const selectAllNotificationMentionAndReply = createSelector(selectAllNotification, (notifications) =>
	notifications.filter(
		(notification) => notification.code === NotificationCode.USER_REPLIED || notification.code === NotificationCode.USER_MENTIONED
	)
);

export const selectAllNotificationClan = createSelector(selectAllNotification, (notifications) =>
	notifications.filter((notification) => notification.code === NotificationCode.NOTIFICATION_CLAN)
);

export const selectMentionAndReplyUnreadByChanneld = (channelId: string, lastSeenStamp: number) =>
	createSelector(selectAllNotificationMentionAndReply, (notifications) => {
		const result = notifications.filter((notification) => {
			if (!notification.create_time) {
				return false;
			}
			const timeCreate = new Date(notification.create_time).getTime() / 1000;

			return notification.content.channel_id === channelId && lastSeenStamp < timeCreate;
		});

		return result;
	});

export const selectMentionAndReplyUnreadByClanId = (listLastSeen: ChannelMetaEntity[]) =>
	createSelector(selectAllNotificationMentionAndReply, (notifications) => {
		const lastSeenMap = new Map<string, number>();
		listLastSeen.forEach((channel) => {
			lastSeenMap.set(channel.id, channel.lastSeenTimestamp ?? 0);
		});

		return notifications.filter((notification) => {
			if (!notification.create_time) {
				return false;
			}

			const notificationTimestamp = new Date(notification.create_time).getTime() / 1000;
			const channelId = notification.content.channel_id;

			const lastSeen = lastSeenMap.get(channelId) ?? 0;

			return notificationTimestamp > lastSeen;
		});
	});
