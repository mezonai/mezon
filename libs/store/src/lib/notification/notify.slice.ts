import { LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { Notification } from 'mezon-js';
import { ensureSession, getMezonCtx } from '../helpers';
export const NOTIFICATION_FEATURE_KEY = 'notification';

export interface INotification extends Notification {
	id: string;
	content?: any;
}
export interface NotificationEntity extends INotification {
	id: string;
}

export const mapNotificationToEntity = (notifyRes: Notification): INotification => {
	return { ...notifyRes, id: notifyRes.id || '', content: notifyRes.content ? { ...notifyRes.content, create_time: notifyRes.create_time } : null };
};

export interface NotificationState extends EntityState<NotificationEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	messageNotifedId: string;
	isMessageRead: boolean;
	newNotificationStatus: boolean;
}

export const notificationAdapter = createEntityAdapter<NotificationEntity>();

export const fetchListNotification = createAsyncThunk('notification/fetchListNotification', async (_, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response = await mezon.client.listNotifications(mezon.session, 50);
	if (!response.notifications) {
		return [];
	}
	const notifications = response.notifications.map(mapNotificationToEntity);
	return notifications;
});

export const deleteNotify = createAsyncThunk('notification/deleteNotify', async (ids: string[], thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response = await mezon.client.deleteNotifications(mezon.session, ids);
	if (!response) {
		return thunkAPI.rejectWithValue([]);
	}
	thunkAPI.dispatch(notificationActions.fetchListNotification());
	return response;
});

export const initialNotificationState: NotificationState = notificationAdapter.getInitialState({
	loadingStatus: 'not loaded',
	notificationMentions: [],
	error: null,
	messageNotifedId: '',
	isMessageRead: false,
	newNotificationStatus: false,
});
const NOTIFICATION_CODE = -9;

export const notificationSlice = createSlice({
	name: NOTIFICATION_FEATURE_KEY,
	initialState: initialNotificationState,
	reducers: {
		add: notificationAdapter.addOne,
		remove: notificationAdapter.removeOne,
		setMessageNotifedId(state, action) {
			state.messageNotifedId = action.payload;
		},
		setIsMessageRead(state, action) {
			state.isMessageRead = action.payload;
		},

		setNotiListUnread(state, action) {
			let storedIds = localStorage.getItem('notiUnread');
			let ids = storedIds ? JSON.parse(storedIds) : [];
			ids.push(action.payload.id);
			localStorage.setItem('notiUnread', JSON.stringify(ids));
		},

		setStatusNoti(state) {
			const ids = localStorage.getItem('notiUnread');
			state.newNotificationStatus = !state.newNotificationStatus
		},

		setReadNotiStatus(state, action) {
			let storedIds = localStorage.getItem('notiUnread');
			let ids = storedIds ? JSON.parse(storedIds) : [];
			
			if(ids && ids?.length > 0){
				const updatedIdsList = ids.filter((id:string) =>  id !== action.payload)
				localStorage.setItem('notiUnread', JSON.stringify(updatedIdsList))
			} else {}
		},
	},

	extraReducers: (builder) => {
		builder
			.addCase(fetchListNotification.pending, (state: NotificationState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchListNotification.fulfilled, (state: NotificationState, action: PayloadAction<INotification[]>) => {
				notificationAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchListNotification.rejected, (state: NotificationState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	},
});

export const notificationReducer = notificationSlice.reducer;

export const notificationActions = {
	...notificationSlice.actions,
	fetchListNotification,
	deleteNotify,
};

const { selectAll } = notificationAdapter.getSelectors();

export const getNotificationState = (rootState: { [NOTIFICATION_FEATURE_KEY]: NotificationState }): NotificationState =>
	rootState[NOTIFICATION_FEATURE_KEY];

export const selectAllNotification = createSelector(getNotificationState, selectAll);

export const selectNotificationByCode = (code: number) =>
	createSelector(selectAllNotification, (notifications) => notifications.filter((notification) => notification.code === code));

export const selectNotificationMentions = createSelector(selectAllNotification, (notifications) =>
	notifications.filter((notification) => notification.code === NOTIFICATION_CODE),
);

export const selectNotificationMentionsByChannelId = (channelId: string, after = 0) =>
	createSelector(selectNotificationMentions, (notifications) =>
		notifications.filter(
			(notification) => notification?.content?.channel_id === channelId && notification?.content?.update_time?.seconds > after,
		),
	);

export const selectNotificationMentionCountByChannelId = (channelId: string, after = 0) =>
	createSelector(
		selectNotificationMentions,
		(notifications) =>
			notifications.filter(
				(notification) => notification?.content?.channel_id === channelId && notification?.content?.update_time?.seconds > after,
			).length,
	);

export const selectNotificationMessages = createSelector(selectAllNotification, (notifications) => {
	return notifications.filter((notification) => notification.code !== -2 && notification.code !== -3);
});

export const selectNotificationMessageCountByChannelId = (channelId: string, after = 0) =>
	createSelector(selectNotificationMessages, (notifications) => {
		return notifications.filter(
			(notification) => notification?.content?.channel_id === channelId && notification?.content?.update_time?.seconds > after,
		).length;
	});

export const selectMessageNotifed = createSelector(getNotificationState, (state: NotificationState) => state.messageNotifedId);

export const selectIsMessageRead = createSelector(getNotificationState, (state: NotificationState) => state.isMessageRead);

export const selectNewNotificationStatus = createSelector(getNotificationState, (state: NotificationState) => state.newNotificationStatus);

