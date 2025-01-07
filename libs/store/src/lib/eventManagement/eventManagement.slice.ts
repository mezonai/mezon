import { captureSentryError } from '@mezon/logger';
import { EEventStatus, ERepeatType, IEventManagement, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { convertTime } from 'libs/components/src/lib/components/ChannelList/EventChannelModal/timeFomatEvent';
import { ApiEventManagement } from 'mezon-js/api.gen';
import { ApiCreateEventRequest, MezonUpdateEventBody } from 'mezon-js/dist/api.gen';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';

export const EVENT_MANAGEMENT_FEATURE_KEY = 'eventmanagement';

export interface EventManagementEntity extends IEventManagement {
	id: string;
}

export const eventManagementAdapter = createEntityAdapter<EventManagementEntity>();

const EVENT_MANAGEMENT_CACHED_TIME = 1000 * 60 * 60;
const fetchEventManagementCached = memoizeAndTrack((mezon: MezonValueContext, clanId: string) => mezon.client.listEvents(mezon.session, clanId), {
	promise: true,
	maxAge: EVENT_MANAGEMENT_CACHED_TIME,
	normalizer: (args) => {
		return args[1] + args[0].session.username;
	}
});

export const mapEventManagementToEntity = (eventRes: ApiEventManagement, clanId?: string) => {
	return {
		...eventRes,
		id: eventRes.id || '',
		channel_id: eventRes.channel_id === '0' || eventRes.channel_id === '' ? '' : eventRes.channel_id,
		channel_voice_id: eventRes.channel_voice_id === '0' || eventRes.channel_voice_id === '' ? '' : eventRes.channel_voice_id
	};
};

type fetchEventManagementPayload = {
	clanId: string;
	noCache?: boolean;
};

export const fetchEventManagement = createAsyncThunk(
	'eventManagement/fetchEventManagement',
	async ({ clanId, noCache }: fetchEventManagementPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			if (noCache) {
				fetchEventManagementCached.clear(mezon, clanId);
			}

			const response = await fetchEventManagementCached(mezon, clanId);

			if (!response.events) {
				return [];
			}

			const events = response.events.map((eventRes) => mapEventManagementToEntity(eventRes, clanId));
			return events;
		} catch (error) {
			captureSentryError(error, 'eventManagement/fetchEventManagement');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type UpdateEventManagementPayload = {
	event_id: string;
	clan_id: string;
	channel_voice_id: string;
	address: string;
	title: string;
	start_time: string;
	end_time: string;
	description: string;
	logo: string;
	creator_id: string;
	channel_id: string;
};

export type EventManagementOnGogoing = {
	address: string;
	channel_voice_id: string;
	clan_id: string;
	description: string;
	end_time: Date;
	event_id: string;
	event_status: string;
	logo: string;
	start_time: Date;
	title: string;
	channel_id: string;
};

export const fetchCreateEventManagement = createAsyncThunk(
	'CreatEventManagement/fetchCreateEventManagement',
	async (
		{ clan_id, channel_voice_id, address, title, start_time, end_time, description, logo, channel_id, repeat_type }: ApiCreateEventRequest,
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				clan_id: clan_id,
				channel_voice_id: channel_voice_id || '',
				address: address || '',
				title: title,
				start_time: start_time,
				end_time: end_time,
				description: description || '',
				logo: logo || '',
				channel_id: channel_id,
				repeat_type: repeat_type || ERepeatType.DOES_NOT_REPEAT
			};
			const response = await mezon.client.createEvent(mezon.session, body);

			return response;
		} catch (error) {
			captureSentryError(error, 'CreatEventManagement/fetchCreateEventManagement');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type fetchDeleteEventManagementPayload = {
	eventID: string;
	clanId: string;
	creatorId: string;
	eventLabel: string;
};

export const updateEventManagement = createAsyncThunk(
	'updateEventManagement/updateEventManagement',
	async (
		{
			event_id,
			clan_id,
			channel_voice_id,
			address,
			title,
			start_time,
			end_time,
			description,
			logo,
			creator_id,
			channel_id,
			channel_id_old,
			repeat_type
		}: MezonUpdateEventBody,
		thunkAPI
	) => {
		try {
			const body: MezonUpdateEventBody = {
				address: address,
				channel_voice_id: channel_voice_id,
				event_id: event_id,
				description: description,
				end_time: end_time,
				logo: logo,
				start_time: start_time,
				title: title,
				clan_id: clan_id,
				creator_id: creator_id,
				channel_id: channel_id,
				channel_id_old: channel_id_old,
				repeat_type: repeat_type
			};
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateEvent(mezon.session, event_id ?? '', body);
		} catch (error) {
			captureSentryError(error, 'updateEventManagement/updateEventManagement');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const fetchDeleteEventManagement = createAsyncThunk(
	'deleteEventManagement/fetchDeleteEventManagement',
	async (body: fetchDeleteEventManagementPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteEvent(mezon.session, body.eventID, body.clanId, body.creatorId, body.eventLabel);
		} catch (error) {
			captureSentryError(error, 'deleteEventManagement/fetchDeleteEventManagement');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export interface EventManagementState extends EntityState<EventManagementEntity, string> {
	loadingStatus: LoadingStatus;
	creatingStatus: LoadingStatus;
	error?: string | null;
	chooseEvent: EventManagementEntity | null;
	ongoingEvent: EventManagementOnGogoing | null;
}

export const initialEventManagementState: EventManagementState = eventManagementAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	chooseEvent: null,
	ongoingEvent: null,
	creatingStatus: 'not loaded'
});

export const eventManagementSlice = createSlice({
	name: EVENT_MANAGEMENT_FEATURE_KEY,
	initialState: initialEventManagementState,
	reducers: {
		add: eventManagementAdapter.addOne,
		addMany: eventManagementAdapter.addMany,
		remove: eventManagementAdapter.removeOne,
		clearEntities: (state) => {
			eventManagementAdapter.removeAll(state);
		},
		setChooseEvent: (state, action) => {
			state.chooseEvent = action.payload;
		},

		removeOneEvent: (state, action) => {
			const { event_id } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state, event_id);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.removeOne(state, event_id);
		},
		updateEventStatus: (state, action) => {
			const { event_id, event_status } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state, event_id);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.updateOne(state, {
				id: event_id,
				changes: {
					event_status
				}
			});
		},
		updateNewStartTime: (state, action) => {
			const { event_id, start_time } = action.payload;
			// console.log('start_time :', start_time);
			const newStartTimeFormat = convertTime(start_time);
			// console.log('newStartTimeFormat :', newStartTimeFormat);
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state, event_id);
			// console.log('existingEvent :', existingEvent);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.updateOne(state, {
				id: event_id,
				changes: {
					start_time
				}
			});
		},
		addOneEvent: (state, action) => {
			const { event_id, channel_id, event_status, channel_voice_id, ...restPayload } = action.payload;
			const normalizedChannelId = channel_id === '0' || channel_id === '' ? '' : channel_id;
			const normalizedVoiceChannelId = channel_voice_id === '0' || channel_voice_id === '' ? '' : channel_voice_id;

			eventManagementAdapter.addOne(state, {
				id: event_id,
				channel_id: normalizedChannelId,
				channel_voice_id: normalizedVoiceChannelId,
				event_status,
				...restPayload
			});
		},
		upsertEvent: (state, action) => {
			const { event_id, channel_id, channel_voice_id, event_status, ...restPayload } = action.payload;

			const normalizedChannelId = channel_id === '0' || channel_id === '' ? '' : channel_id;
			const normalizedVoiceChannelId = channel_voice_id === '0' || channel_voice_id === '' ? '' : channel_voice_id;

			const { event_status: _, ...restWithoutEventStatus } = restPayload;

			eventManagementAdapter.upsertOne(state, {
				id: event_id,
				channel_id: normalizedChannelId,
				channel_voice_id: normalizedVoiceChannelId,
				...restWithoutEventStatus
			});
		},

		clearOngoingEvent: (state, action) => {
			state.ongoingEvent = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchEventManagement.pending, (state: EventManagementState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchEventManagement.fulfilled, (state: EventManagementState, action: PayloadAction<any>) => {
				eventManagementAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchEventManagement.rejected, (state: EventManagementState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(fetchCreateEventManagement.pending, (state) => {
				state.creatingStatus = 'loading';
				state.error = null;
			})
			.addCase(fetchCreateEventManagement.fulfilled, (state) => {
				state.creatingStatus = 'loaded';
				state.error = null;
			})
			.addCase(fetchCreateEventManagement.rejected, (state, action) => {
				state.creatingStatus = 'error';
				state.error = action.payload as string;
			});
	}
});

export const eventManagementReducer = eventManagementSlice.reducer;

export const eventManagementActions = {
	...eventManagementSlice.actions,
	fetchEventManagement,
	fetchCreateEventManagement,
	fetchDeleteEventManagement,
	updateEventManagement
};

const { selectAll, selectEntities } = eventManagementAdapter.getSelectors();

export const getEventManagementState = (rootState: { [EVENT_MANAGEMENT_FEATURE_KEY]: EventManagementState }): EventManagementState =>
	rootState[EVENT_MANAGEMENT_FEATURE_KEY];

export const selectAllEventManagement = createSelector(getEventManagementState, selectAll);

export const selectEventManagementEntities = createSelector(getEventManagementState, selectEntities);

export const selectNumberEvent = createSelector(selectAllEventManagement, (events) => events.length);

export const selectChooseEvent = createSelector(getEventManagementState, (state) => state.chooseEvent);

export const selectOngoingEvent = createSelector(getEventManagementState, (state) => state.ongoingEvent);

export const selectCreatingLoaded = createSelector(getEventManagementState, (state) => state.creatingStatus);

export const selectEventLoading = createSelector(getEventManagementState, (state) => state.loadingStatus);

export const selectEventById = (eventId: string) =>
	createSelector(getEventManagementState, (state) => {
		const entities = selectEventManagementEntities({ eventmanagement: state });
		return entities[eventId] || null;
	});

export const selectNumberEventPrivate = createSelector(
	selectAllEventManagement,
	(events) => events.filter((event) => event.channel_id && event.channel_id !== '0' && event.channel_id !== '').length
);
export const selectEventsByChannelId = createSelector([selectAllEventManagement, (_, channelId: string) => channelId], (events, channelId) => {
	const filteredEvents = events.filter((event) => event.channel_id === channelId);

	const ongoingEvents = filteredEvents.filter((event) => event.event_status === EEventStatus.ONGOING);
	if (ongoingEvents.length > 0) {
		const oldestOngoingTime = Math.min(...ongoingEvents.map((event) => (event.start_time ? new Date(event.start_time).getTime() : Infinity)));
		return ongoingEvents.filter((event) => new Date(event.start_time as string).getTime() === oldestOngoingTime);
	}

	const upcomingEvents = filteredEvents.filter((event) => event.event_status === EEventStatus.UPCOMING);
	if (upcomingEvents.length > 0) {
		const nearestUpcomingTime = Math.min(...upcomingEvents.map((event) => (event.start_time ? new Date(event.start_time).getTime() : Infinity)));
		return upcomingEvents.filter((event) => new Date(event.start_time as string).getTime() === nearestUpcomingTime);
	}

	return [];
});
