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
} from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const EVENT_MANAGEMENT_FEATURE_KEY = 'eventmanagement';

export interface EventManagementEntity extends Omit<IEventManagement, 'id'> {
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
				clan_id: BigInt(clanId)
			}
		},
		() => ensuredMezon.client.listEvents(ensuredMezon.session, BigInt(clanId)),
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
		id: eventRes.id ? eventRes.id.toString() : '',
		channel_id: eventRes.channel_id?.toString() === '0' || eventRes.channel_id?.toString() === '' ? BigInt('') : eventRes.channel_id,
		channel_voice_id: eventRes.channel_voice_id?.toString() === '0' || eventRes.channel_voice_id?.toString() === '' ? BigInt('') : eventRes.channel_voice_id
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
			const events = response.events.map((eventRes) => mapEventManagementToEntity(eventRes as ApiEventManagement, clanId));
			return { events, clanId, fromCache: response?.fromCache };
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
		{
			clan_id,
			channel_voice_id,
			address,
			title,
			start_time_seconds,
			end_time_seconds,
			description,
			logo,
			channel_id,
			repeat_type,
			is_private = false
		}: ApiCreateEventRequest,
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				clan_id,
				channel_voice_id,
				address: address || '',
				title,
				start_time_seconds: start_time_seconds ? start_time_seconds / 1000 : undefined,
				end_time_seconds: end_time_seconds ? end_time_seconds / 1000 : undefined,
				description: description || '',
				logo: logo || '',
				channel_id,
				repeat_type: repeat_type || ERepeatType.DOES_NOT_REPEAT,
				is_private
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
			start_time_seconds,
			end_time_seconds,
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
				address,
				channel_voice_id,
				event_id,
				description,
				end_time_seconds: end_time_seconds ? end_time_seconds / 1000 : undefined,
				logo,
				start_time_seconds: start_time_seconds ? start_time_seconds / 1000 : undefined,
				title,
				clan_id,
				creator_id,
				channel_id,
				channel_id_old,
				repeat_type
			};
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateEvent(mezon.session, BigInt(event_id ?? ''), body);
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
			const response = await mezon.client.deleteEvent(mezon.session, BigInt(body.eventID), BigInt(body.clanId), BigInt(body.creatorId), body.eventLabel);
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
		await mezon.client.deleteUserEvent(mezon.session, request.clan_id, request.event_id);
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
			const { event_id } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[action.payload.clan_id].entities, event_id);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.removeOne(state.byClans[action.payload.clan_id].entities, event_id);
			if (state.privateMeetingRooms) {
				state.privateMeetingRooms = state.privateMeetingRooms.filter((record) => !(event_id in record));
			}
		},
		updateEventStatus: (state, action) => {
			const { event_id, event_status } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[action.payload.clan_id].entities, event_id);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.updateOne(state.byClans[action.payload.clan_id].entities, {
				id: event_id,
				changes: {
					event_status
				}
			});
		},
		updateUserEvent: (state, action) => {
			const { event_id, user_id, clan_id } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[clan_id]?.entities, event_id);

			if (!existingEvent) {
				return;
			}

			let updatedUserIds = [...(existingEvent.user_ids || [])];
			if (action.payload.action === EEventAction.INTERESTED) {
				if (!updatedUserIds.includes(user_id)) {
					updatedUserIds.push(user_id);
				}
			} else if (action.payload.action === EEventAction.UNINTERESTED) {
				updatedUserIds = updatedUserIds.filter((id) => id !== user_id);
			}

			eventManagementAdapter.updateOne(state.byClans[clan_id].entities, {
				id: event_id,
				changes: {
					user_ids: updatedUserIds
				}
			});
		},

		updateNewStartTime: (state, action) => {
			const { event_id, start_time_seconds } = action.payload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[action.payload.clan_id].entities, event_id);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.updateOne(state.byClans[action.payload.clan_id].entities, {
				id: event_id,
				changes: {
					start_time_seconds
				}
			});
		},
		addOneEvent: (state, action) => {
			const { event_id, channel_id, event_status, channel_voice_id, ...restPayload } = action.payload;
			const normalizedChannelId = channel_id === '0' || channel_id === '' ? '' : channel_id;
			const normalizedVoiceChannelId = channel_voice_id === '0' || channel_voice_id === '' ? '' : channel_voice_id;

			if (!state.byClans[action.payload.clan_id]) {
				state.byClans[action.payload.clan_id] = {
					entities: eventManagementAdapter.getInitialState()
				};
			}

			eventManagementAdapter.addOne(state.byClans[action.payload.clan_id].entities, {
				id: event_id,
				channel_id: normalizedChannelId,
				channel_voice_id: normalizedVoiceChannelId,
				event_status,
				user_ids: [action.payload.creator_id],
				...restPayload
			});
		},
		upsertEvent: (state, action) => {
			const { event_id, channel_id, channel_voice_id, event_status, ...restPayload } = action.payload;

			const normalizedChannelId = channel_id === '0' || channel_id === '' ? '' : channel_id;
			const normalizedVoiceChannelId = channel_voice_id === '0' || channel_voice_id === '' ? '' : channel_voice_id;

			const { event_status: _, ...restWithoutEventStatus } = restPayload;
			const existingEvent = eventManagementAdapter.getSelectors().selectById(state.byClans[action.payload.clan_id].entities, event_id);
			if (!existingEvent) {
				return;
			}
			eventManagementAdapter.upsertOne(state.byClans[action.payload.clan_id].entities, {
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

				if (event?.is_private && event?.meet_room) {
					if (!state.privateMeetingRooms) {
						state.privateMeetingRooms = [];
					}
					const hasEvents = state.privateMeetingRooms.some((record) => record[event.id?.toString() as string]);
					if (!hasEvents) {
						state.privateMeetingRooms.push({ [event?.id?.toString() as string]: event?.meet_room });
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

export const selectChooseEvent = createSelector(getEventManagementState, (state) => state.chooseEvent);

export const selectShowModelEvent = createSelector(getEventManagementState, (state) => state.showModalEvent);

export const selectShowModelDetailEvent = createSelector(getEventManagementState, (state) => state.showModalDetailEvent);

export const selectOngoingEvent = createSelector(getEventManagementState, (state) => state.ongoingEvent);

export const selectCreatingLoaded = createSelector(getEventManagementState, (state) => state.creatingStatus);

export const selectEventLoading = createSelector(getEventManagementState, (state) => state.loadingStatus);

export const selectNumberEventPrivate = createSelector(
	selectEventsByClanId,
	(events) => events.filter((event) => event.channel_id && event.channel_id?.toString() !== '0' && event.channel_id?.toString() !== '').length
);

// check
export const selectEventsByChannelId = createSelector(
	[selectEventsByClanId, (state: RootState, clanId: string, channelId: string) => channelId],
	(entities, channelId) => {
		const filteredEntities = Object.values(entities).filter((entity: EventManagementEntity) => entity.channel_id?.toString() === channelId);
		const ongoingEvents = filteredEntities.filter((event) => event.event_status === EEventStatus.ONGOING);
		if (ongoingEvents.length > 0) {
			const oldestOngoingTime = Math.min(
				...ongoingEvents.map((event) => (event.start_time_seconds ? new Date(event.start_time_seconds).getTime() : Infinity))
			);
			return ongoingEvents.filter((event) => new Date(event.start_time_seconds || 0).getTime() === oldestOngoingTime);
		}
		const upcomingEvents = filteredEntities.filter((event) => event.event_status === EEventStatus.UPCOMING);
		if (upcomingEvents.length > 0) {
			const nearestUpcomingTime = Math.min(
				...upcomingEvents.map((event) => (event.start_time_seconds ? new Date(event.start_time_seconds).getTime() : Infinity))
			);
			return upcomingEvents.filter((event) => new Date(event.start_time_seconds || 0).getTime() === nearestUpcomingTime);
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
