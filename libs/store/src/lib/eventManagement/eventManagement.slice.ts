import { captureSentryError } from '@mezon/logger';
import type { IEventManagement, LoadingStatus } from '@mezon/utils';
import { EEventAction, EEventStatus, ERepeatType } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type {
	ApiCreateEventRequest,
	ApiEventManagement,
	ApiGenerateMezonMeetResponse,
	ApiUserEventRequest,
	MezonUpdateEventBody
} from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const EVENT_MANAGEMENT_FEATURE_KEY = 'eventmanagement';

export interface EventManagementEntity extends IEventManagement {
	id: string;
}

export const eventManagementAdapter = createEntityAdapter<EventManagementEntity>();

const { selectAll } = eventManagementAdapter.getSelectors();

const selectCachedEventManagementByClan = createSelector(
	[(state: RootState, clanId: string) => state[EVENT_MANAGEMENT_FEATURE_KEY].byClans[clanId]?.entities],
	(entitiesState) => {
		return entitiesState ? selectAll(entitiesState) : [];
	}
);

export const fetchEventManagementCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, clanId: string, noCache = false) => {
	const state = getState();
	const eventData = state[EVENT_MANAGEMENT_FEATURE_KEY].byClans[clanId];
	const apiKey = createApiKey('fetchEventManagement', clanId);
	const shouldForceCall = shouldForceApiCall(apiKey, eventData?.cache, noCache);

	if (!shouldForceCall) {
		const events = selectCachedEventManagementByClan(state, clanId);
		return {
			events,
			time: Date.now(),
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListEvents',
			list_event_req: {
				clanId: clanId
			}
		},
		() => ensuredMezon.client.listEvents(ensuredMezon.session, clanId),
		'event_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		time: Date.now(),
		fromCache: false
	};
};

export const mapEventManagementToEntity = (eventRes: ApiEventManagement, clanId?: string) => {
	return {
		...eventRes,
		id: eventRes.id || '',
		channelId: eventRes.channelId === '0' || eventRes.channelId === '' ? '' : eventRes.channelId,
		channelVoiceId: eventRes.channelVoiceId === '0' || eventRes.channelVoiceId === '' ? '' : eventRes.channelVoiceId
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
			thunkAPI.dispatch(eventManagementActions.initializeClanState(clanId as string));
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchEventManagementCached(thunkAPI.getState as () => RootState, mezon, clanId, noCache);

			if (!response.events) {
				return { events: [], clanId, fromCache: response?.fromCache };
			}
			if (Date.now() - response.time > 1000) {
				return {
					events: [],
					clanId,
					fromCache: true
				};
			}
			const events = response.events.map((eventRes) => mapEventManagementToEntity(eventRes, clanId));
			return { events, clanId, fromCache: response?.fromCache };
		} catch (error) {
			captureSentryError(error, 'eventManagement/fetchEventManagement');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type UpdateEventManagementPayload = {
	eventId: string;
	clanId: string;
	channelVoiceId: string;
	address: string;
	title: string;
	startTime: string;
	endTime: string;
	description: string;
	logo: string;
	creatorId: string;
	channelId: string;
};

export type EventManagementOnGogoing = {
	address: string;
	channelVoiceId: string;
	clanId: string;
	description: string;
	endTime: Date;
	eventId: string;
	eventStatus: string;
	logo: string;
	startTime: Date;
	title: string;
	channelId: string;
};

export const fetchCreateEventManagement = createAsyncThunk(
	'CreatEventManagement/fetchCreateEventManagement',
	async (
		{
			clanId,
			channelVoiceId,
			address,
			title,
			startTime,
			endTime,
			description,
			logo,
			channelId,
			repeatType,
			isPrivate = false
		}: ApiCreateEventRequest,
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				clanId,
				channelVoiceId: channelVoiceId || '',
				address: address || '',
				title,
				startTime,
				endTime,
				description: description || '',
				logo: logo || '',
				channelId,
				repeatType: repeatType || ERepeatType.DOES_NOT_REPEAT,
				isPrivate
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
			eventId,
			clanId,
			channelVoiceId,
			address,
			title,
			startTime,
			endTime,
			description,
			logo,
			creatorId,
			channelId,
			channelIdOld,
			repeatType
		}: MezonUpdateEventBody,
		thunkAPI
	) => {
		try {
			const body: MezonUpdateEventBody = {
				address,
				channelVoiceId,
				eventId,
				description,
				endTime,
				logo,
				startTime,
				title,
				clanId,
				creatorId,
				channelId,
				channelIdOld,
				repeatType
			};
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateEvent(mezon.session, eventId ?? '', body);
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

export const addUserEvent = createAsyncThunk('userEvent/addUserEvent', async (request: ApiUserEventRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		await mezon.client.addUserEvent(mezon.session, request);
	} catch (error) {
		captureSentryError(error, 'userEvent/addUserEvent');
		return thunkAPI.rejectWithValue(error);
	}
});

export const deleteUserEvent = createAsyncThunk('userEvent/deleteUserEvent', async (request: ApiUserEventRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		await mezon.client.deleteUserEvent(mezon.session, request.clanId, request.eventId);
	} catch (error) {
		captureSentryError(error, 'userEvent/deleteUserEvent');
		return thunkAPI.rejectWithValue(error);
	}
});

export interface EventManagementState {
	byClans: Record<
		string,
		{
			entities: EntityState<EventManagementEntity, string>;
			cache?: CacheMetadata;
		}
	>;
	loadingStatus: LoadingStatus;
	creatingStatus: LoadingStatus;
	error?: string | null;
	chooseEvent: EventManagementEntity | null;
	ongoingEvent: EventManagementOnGogoing | null;
	showModalDetailEvent?: boolean;
	showModalEvent?: boolean;
	privateMeetingRooms?: Record<string, ApiGenerateMezonMeetResponse>[] | null;
}

export const initialEventManagementState: EventManagementState = {
	byClans: {},
	loadingStatus: 'not loaded',
	error: null,
	chooseEvent: null,
	ongoingEvent: null,
	creatingStatus: 'not loaded',
	showModalDetailEvent: false,
	showModalEvent: false,
	privateMeetingRooms: null
};

export const eventManagementSlice = createSlice({
	name: EVENT_MANAGEMENT_FEATURE_KEY,
	initialState: initialEventManagementState,
	reducers: {
		initializeClanState: (state, action: PayloadAction<string>) => {
			const clanId = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = {
					entities: eventManagementAdapter.getInitialState()
				};
			}
		},
		setChooseEvent: (state, action) => {
			state.chooseEvent = action.payload;
		},
		showModalDetailEvent: (state, action) => {
			state.showModalDetailEvent = action.payload;
		},
		showModalEvent: (state, action) => {
			state.showModalEvent = action.payload;
		},
		removeOneEvent: (state, action) => {
			const { eventId } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[action.payload.clanId].entities, eventId);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.removeOne(state.byClans[action.payload.clanId].entities, eventId);
			if (state.privateMeetingRooms) {
				state.privateMeetingRooms = state.privateMeetingRooms.filter((record) => !(eventId in record));
			}
		},
		updateEventStatus: (state, action) => {
			const { eventId, eventStatus } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[action.payload.clanId].entities, eventId);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.updateOne(state.byClans[action.payload.clanId].entities, {
				id: eventId,
				changes: {
					eventStatus
				}
			});
		},
		updateUserEvent: (state, action) => {
			const { eventId, userId, clanId } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[clanId]?.entities, eventId);

			if (!existingEvent) {
				return;
			}

			let updatedUserIds = [...(existingEvent.userIds || [])];
			if (action.payload.action === EEventAction.INTERESTED) {
				if (!updatedUserIds.includes(userId)) {
					updatedUserIds.push(userId);
				}
			} else if (action.payload.action === EEventAction.UNINTERESTED) {
				updatedUserIds = updatedUserIds.filter((id) => id !== userId);
			}

			eventManagementAdapter.updateOne(state.byClans[clanId].entities, {
				id: eventId,
				changes: {
					userIds: updatedUserIds
				}
			});
		},

		updateNewStartTime: (state, action) => {
			const { eventId, startTime } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[action.payload.clanId].entities, eventId);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.updateOne(state.byClans[action.payload.clanId].entities, {
				id: eventId,
				changes: {
					startTime
				}
			});
		},
		addOneEvent: (state, action) => {
			const { eventId, channelId, eventStatus, channelVoiceId, ...restPayload } = action.payload;
			const normalizedChannelId = channelId === '0' || channelId === '' ? '' : channelId;
			const normalizedVoiceChannelId = channelVoiceId === '0' || channelVoiceId === '' ? '' : channelVoiceId;

			if (!state.byClans[action.payload.clanId]) {
				state.byClans[action.payload.clanId] = {
					entities: eventManagementAdapter.getInitialState()
				};
			}

			eventManagementAdapter.addOne(state.byClans[action.payload.clanId].entities, {
				id: eventId,
				channelId: normalizedChannelId,
				channelVoiceId: normalizedVoiceChannelId,
				eventStatus,
				userIds: [action.payload.creatorId],
				...restPayload
			});
		},
		upsertEvent: (state, action) => {
			const { eventId, channelId, channelVoiceId, eventStatus, ...restPayload } = action.payload;

			const normalizedChannelId = channelId === '0' || channelId === '' ? '' : channelId;
			const normalizedVoiceChannelId = channelVoiceId === '0' || channelVoiceId === '' ? '' : channelVoiceId;

			const { eventStatus: _, ...restWithoutEventStatus } = restPayload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[action.payload.clanId].entities, eventId);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.upsertOne(state.byClans[action.payload.clanId].entities, {
				id: eventId,
				channelId: normalizedChannelId,
				channelVoiceId: normalizedVoiceChannelId,
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
			.addCase(
				fetchEventManagement.fulfilled,
				(state: EventManagementState, action: PayloadAction<{ events: EventManagementEntity[]; clanId: string; fromCache?: boolean }>) => {
					state.loadingStatus = 'loaded';
					if (!state.byClans[action.payload.clanId]) {
						state.byClans[action.payload.clanId] = {
							entities: eventManagementAdapter.getInitialState()
						};
					}
					if (state?.byClans?.[action?.payload?.clanId] && !action?.payload?.fromCache) {
						state.byClans[action.payload.clanId].cache = createCacheMetadata();
					}
					if (action.payload.fromCache) return;
					eventManagementAdapter.setAll(state.byClans[action.payload.clanId].entities, action.payload.events);
				}
			)
			.addCase(fetchEventManagement.rejected, (state: EventManagementState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(fetchCreateEventManagement.pending, (state) => {
				state.creatingStatus = 'loading';
				state.error = null;
			})
			.addCase(fetchCreateEventManagement.fulfilled, (state, action) => {
				state.creatingStatus = 'loaded';
				state.error = null;
				const event = action.payload;

				if (event?.isPrivate && event?.meetRoom) {
					if (!state.privateMeetingRooms) {
						state.privateMeetingRooms = [];
					}
					const hasEvents = state.privateMeetingRooms.some((record) => record[event.id as string]);
					if (!hasEvents) {
						state.privateMeetingRooms.push({ [event?.id as string]: event?.meetRoom });
					}
				}
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

export const getEventManagementState = (rootState: { [EVENT_MANAGEMENT_FEATURE_KEY]: EventManagementState }): EventManagementState =>
	rootState[EVENT_MANAGEMENT_FEATURE_KEY];

export const selectEventsByClanId = createSelector(
	[(state: RootState) => state.eventmanagement, (state: RootState, clanId: string) => clanId],
	(events, clanId) => selectAll(events.byClans[clanId]?.entities ?? eventManagementAdapter.getInitialState())
);

export const selectNumberEvent = createSelector(selectEventsByClanId, (events) => events?.length);

export const selectChooseEvent = createSelector(getEventManagementState, (state) => state.chooseEvent);

export const selectShowModelEvent = createSelector(getEventManagementState, (state) => state.showModalEvent);

export const selectShowModelDetailEvent = createSelector(getEventManagementState, (state) => state.showModalDetailEvent);

export const selectOngoingEvent = createSelector(getEventManagementState, (state) => state.ongoingEvent);

export const selectCreatingLoaded = createSelector(getEventManagementState, (state) => state.creatingStatus);

export const selectEventLoading = createSelector(getEventManagementState, (state) => state.loadingStatus);

export const selectNumberEventPrivate = createSelector(
	selectEventsByClanId,
	(events) => events.filter((event) => event.channelId && event.channelId !== '0' && event.channelId !== '').length
);

// check
export const selectEventsByChannelId = createSelector(
	[selectEventsByClanId, (state: RootState, clanId: string, channelId: string) => channelId],
	(entities, channelId) => {
		const filteredEntities = Object.values(entities).filter((entity: EventManagementEntity) => entity.channelId === channelId);
		const ongoingEvents = filteredEntities.filter((event) => event.eventStatus === EEventStatus.ONGOING);
		if (ongoingEvents.length > 0) {
			const oldestOngoingTime = Math.min(...ongoingEvents.map((event) => (event.startTime ? new Date(event.startTime).getTime() : Infinity)));
			return ongoingEvents.filter((event) => new Date(event.startTime as string).getTime() === oldestOngoingTime);
		}
		const upcomingEvents = filteredEntities.filter((event) => event.eventStatus === EEventStatus.UPCOMING);
		if (upcomingEvents.length > 0) {
			const nearestUpcomingTime = Math.min(
				...upcomingEvents.map((event) => (event.startTime ? new Date(event.startTime).getTime() : Infinity))
			);
			return upcomingEvents.filter((event) => new Date(event.startTime as string).getTime() === nearestUpcomingTime);
		}

		return [];
	}
);

export const selectEventById = createSelector(
	[(state: RootState) => state.eventmanagement, (state: RootState, clanId: string, eventId: string) => ({ clanId, eventId })],
	(events, { clanId, eventId }) => {
		const event = events.byClans[clanId]?.entities.entities[eventId];
		return event;
	}
);

export const selectMeetRoomByEventId = createSelector(
	[(state: RootState) => state.eventmanagement, (state: RootState, eventId: string) => eventId],
	(event, eventId) => {
		if (!event.privateMeetingRooms) return null;
		const record = event.privateMeetingRooms.find((record) => record[eventId]);
		return record ? record[eventId] : null;
	}
);
