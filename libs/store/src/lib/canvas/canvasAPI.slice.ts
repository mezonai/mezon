import { captureSentryError } from '@mezon/logger';
import type { CanvasUpdate, ICanvas, LoadingStatus } from '@mezon/utils';
import { LIMIT } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiEditChannelCanvasRequest } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';
import type { RootState } from '../store';

export const CANVAS_API_FEATURE_KEY = 'canvasapi';

/*
 * Update these interfaces according to your requirements.
 */
export interface CanvasAPIEntity extends ICanvas {
	id: string; // Primary ID
	countCanvas?: number;
	create_time?: string;
}

export interface CanvasAPIState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	channelCanvas: Record<
		string,
		EntityState<CanvasAPIEntity, string> & {
			id: string;
			countCanvas?: number;
			cache?: CacheMetadata;
		}
	>;
}

export const canvasAPIAdapter = createEntityAdapter({
	selectId: (canvas: CanvasAPIEntity) => canvas.id || '',
	sortComparer: (a, b) => {
		if (a.create_time && b.create_time) {
			return new Date(b.create_time).getTime() - new Date(a.create_time).getTime();
		}

		if (a.create_time && !b.create_time) return -1;
		if (!a.create_time && b.create_time) return 1;

		return b.id.localeCompare(a.id);
	}
});

type fetchCanvasPayload = {
	id: string;
	clan_id: string;
	channel_id: string;
	noCache?: boolean;
};

type getCanvasListPayload = {
	channel_id: string;
	clan_id: string;
	limit?: number;
	page?: number;
	noCache?: boolean;
};

const selectCachedCanvasByChannel = createSelector(
	[(state: RootState, channelId: string) => state[CANVAS_API_FEATURE_KEY].channelCanvas[channelId]],
	(channelData) => {
		if (!channelData) return [];

		//TODO: recheck
		const entities = Object.values(channelData.entities || {});
		return entities.sort((a, b) => {
			if (a.create_time && b.create_time) {
				return new Date(b.create_time).getTime() - new Date(a.create_time).getTime();
			}

			if (a.create_time && !b.create_time) return -1;
			if (!a.create_time && b.create_time) return 1;

			return b.id.localeCompare(a.id);
		});
	}
);

const fetchCanvasListCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	channel_id: string,
	clan_id: string,
	limit?: number,
	page?: number,
	noCache = false
) => {
	const state = getState();
	const channelData = state[CANVAS_API_FEATURE_KEY].channelCanvas[channel_id];
	const apiKey = createApiKey('fetchCanvasList', channel_id, clan_id, String(limit || ''), String(page || ''));
	const shouldForceCall = shouldForceApiCall(apiKey, channelData?.cache, noCache);

	if (!shouldForceCall) {
		const entities = selectCachedCanvasByChannel(state, channel_id);
		return {
			channel_canvases: entities,
			count: channelData.countCanvas || 0,
			fromCache: true
		};
	}

	const response = await withRetry(() => mezon.client.getChannelCanvasList(mezon.session, channel_id, clan_id, limit || LIMIT, page), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'channel-canvas-list'
	});

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

const fetchCanvasDetailCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	id: string,
	clan_id: string,
	channel_id: string,
	noCache = false
) => {
	const state = getState();
	const channelData = state[CANVAS_API_FEATURE_KEY].channelCanvas[channel_id];
	const apiKey = createApiKey('fetchCanvasDetail', id, clan_id, channel_id);
	const shouldForceCall = shouldForceApiCall(apiKey, channelData?.cache, noCache);
	if (!shouldForceCall) {
		return {
			canvas: channelData.entities[id],
			fromCache: true
		};
	}

	const response = await withRetry(() => mezon.client.getChannelCanvasDetail(mezon.session, id, clan_id, channel_id), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'channel-canvas-detail'
	});

	markApiFirstCalled(apiKey);

	return {
		canvas: {
			...response,
			channel_id
		},
		fromCache: false
	};
};

export const createEditCanvas = createAsyncThunk('canvas/editChannelCanvases', async (body: ApiEditChannelCanvasRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.editChannelCanvases(mezon.session, body);

		const result = {
			...response,
			channel_id: body.channel_id,
			title: body.title,
			content: body.content,
			is_default: body.is_default,
			create_time: new Date().toISOString()
		};

		if (body.channel_id && result.id) {
			if (body.id) {
				thunkAPI.dispatch(
					canvasAPIActions.updateCanvas({
						channelId: body.channel_id,
						dataUpdate: {
							id: result.id,
							title: body.title as string,
							content: body.content as string
						}
					})
				);
			} else {
				thunkAPI.dispatch(
					canvasAPIActions.upsertOne({
						channel_id: body.channel_id,
						canvas: result
					})
				);
			}
		}

		return result;
	} catch (error) {
		captureSentryError(error, 'canvas/editChannelCanvases');
		return thunkAPI.rejectWithValue(error);
	}
});

export const getChannelCanvasDetail = createAsyncThunk(
	'canvas/getChannelCanvasDetail',
	async ({ id, clan_id, channel_id, noCache }: fetchCanvasPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchCanvasDetailCached(thunkAPI.getState as () => RootState, mezon, id, clan_id, channel_id, noCache);

			return response;
		} catch (error) {
			captureSentryError(error, 'canvas/getChannelCanvasDetail');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const getChannelCanvasList = createAsyncThunk(
	'canvas/getChannelCanvasList',
	async ({ channel_id, clan_id, limit, page, noCache }: getCanvasListPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchCanvasListCached(thunkAPI.getState as () => RootState, mezon, channel_id, clan_id, limit, page, noCache);

			return { ...response, channel_id };
		} catch (error) {
			captureSentryError(error, 'canvas/getChannelCanvasList');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteCanvas = createAsyncThunk('canvas/deleteCanvas', async ({ id, channel_id, clan_id }: fetchCanvasPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.deleteChannelCanvas(mezon.session, id, clan_id, channel_id);

		if (channel_id && id) {
			thunkAPI.dispatch(
				canvasAPIActions.removeOneCanvas({
					channelId: channel_id,
					canvasId: id
				})
			);
		}

		return response;
	} catch (error) {
		captureSentryError(error, 'canvas/deleteCanvas');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialCanvasAPIState: CanvasAPIState = canvasAPIAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	channelCanvas: {}
});

const handleSetManyCanvas = ({
	state,
	channelId,
	adapterPayload,
	countCanvas
}: {
	state: CanvasAPIState;
	channelId?: string;
	adapterPayload: CanvasAPIEntity[];
	countCanvas: number;
}) => {
	if (!channelId) return;
	if (!state.channelCanvas[channelId]) {
		state.channelCanvas[channelId] = canvasAPIAdapter.getInitialState({
			id: channelId,
			countCanvas
		});
	}

	const sortedPayload = [...adapterPayload].sort((a, b) => {
		if (a.create_time && b.create_time) {
			return new Date(b.create_time).getTime() - new Date(a.create_time).getTime();
		}

		if (a.create_time && !b.create_time) return -1;
		if (!a.create_time && b.create_time) return 1;

		return b.id.localeCompare(a.id);
	});

	const updatedChannelCanvas = canvasAPIAdapter.setAll(state.channelCanvas[channelId], sortedPayload);
	state.channelCanvas[channelId] = updatedChannelCanvas;
	state.channelCanvas[channelId].countCanvas = countCanvas;
	state.channelCanvas[channelId].cache = createCacheMetadata();
};

export const canvasAPISlice = createSlice({
	name: CANVAS_API_FEATURE_KEY,
	initialState: initialCanvasAPIState,
	reducers: {
		// ...
		updateCanvas: (state, action: PayloadAction<{ channelId: string; dataUpdate: CanvasUpdate }>) => {
			const { channelId, dataUpdate } = action.payload;
			const { id, title, content } = dataUpdate;
			canvasAPIAdapter.updateOne(state.channelCanvas[channelId], {
				id,
				changes: {
					title,
					content
				}
			});
		},
		removeOneCanvas: (state, action: PayloadAction<{ channelId: string; canvasId: string }>) => {
			const { channelId, canvasId } = action.payload;
			if (state.channelCanvas[channelId]) {
				canvasAPIAdapter.removeOne(state.channelCanvas[channelId], canvasId);
			}
		},
		upsertOne: (state, action: PayloadAction<{ channel_id: string; canvas: any }>) => {
			const { channel_id, canvas } = action.payload;
			if (!state.channelCanvas[channel_id]) {
				state.channelCanvas[channel_id] = canvasAPIAdapter.getInitialState({
					id: canvas.id
				});
			}
			const canvasWithTimestamp = {
				...canvas
			};

			const currentEntities = Object.values(state.channelCanvas[channel_id].entities || {});
			const existingCanvas = state.channelCanvas[channel_id].entities[canvas.id];

			if (existingCanvas) {
				const updatedEntities = currentEntities.map((entity) => (entity.id === canvas.id ? { ...entity, ...canvasWithTimestamp } : entity));
				canvasAPIAdapter.setAll(state.channelCanvas[channel_id], updatedEntities);
			} else {
				const newEntities = [...currentEntities, canvasWithTimestamp];
				canvasAPIAdapter.setAll(state.channelCanvas[channel_id], newEntities);
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(createEditCanvas.pending, (state: CanvasAPIState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(createEditCanvas.fulfilled, (state: CanvasAPIState, action: PayloadAction<any>) => {
				state.loadingStatus = 'loaded';
				const { channel_id } = action.payload;
				if (!channel_id) return;
			})
			.addCase(createEditCanvas.rejected, (state: CanvasAPIState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(getChannelCanvasList.pending, (state: CanvasAPIState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getChannelCanvasList.fulfilled, (state: CanvasAPIState, action: PayloadAction<any>) => {
				state.loadingStatus = 'loaded';
				if (action.payload.fromCache) return;
				const channelId = action.payload.channel_id;
				const reversedCanvas = action.payload.channel_canvases;
				const countCanvas = action.payload.count;
				handleSetManyCanvas({
					state,
					channelId,
					adapterPayload: reversedCanvas,
					countCanvas
				});
			})
			.addCase(getChannelCanvasList.rejected, (state: CanvasAPIState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(getChannelCanvasDetail.pending, (state: CanvasAPIState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getChannelCanvasDetail.fulfilled, (state: CanvasAPIState, action: PayloadAction<any>) => {
				state.loadingStatus = 'loaded';

				if (!action.payload.fromCache && action.payload.canvas) {
					const canvas = action.payload.canvas;
					const channelId = canvas.channel_id;

					if (channelId && canvas.id) {
						if (!state.channelCanvas[channelId]) {
							state.channelCanvas[channelId] = canvasAPIAdapter.getInitialState({
								id: channelId
							});
						}

						canvasAPIAdapter.upsertOne(state.channelCanvas[channelId], canvas);
					}
				}
			})
			.addCase(getChannelCanvasDetail.rejected, (state: CanvasAPIState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const canvasAPIReducer = canvasAPISlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(usersActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const canvasAPIActions = {
	...canvasAPISlice.actions,
	createEditCanvas,
	getChannelCanvasList,
	getChannelCanvasDetail,
	deleteCanvas
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllUsers);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */

export const getCanvasApiState = (rootState: { [CANVAS_API_FEATURE_KEY]: CanvasAPIState }): CanvasAPIState => rootState[CANVAS_API_FEATURE_KEY];

export const getChannelIdCanvasAsSecondParam = (_: unknown, channelId: string) => channelId;
export const getChannelIdCanvasAsParrent = (_: unknown, __: unknown, parrentChannelId?: string) => parrentChannelId;

export const selectCanvasIdsByChannelId = createSelector(
	[getCanvasApiState, getChannelIdCanvasAsSecondParam, getChannelIdCanvasAsParrent],
	(state, channelId, parrentChannelId) => {
		const canvastCurrent = state?.channelCanvas[channelId]?.entities || {};
		let wrapCanvast = { ...canvastCurrent };
		if (parrentChannelId) {
			const canvasParrent = state?.channelCanvas[parrentChannelId]?.entities || {};
			wrapCanvast = { ...wrapCanvast, ...canvasParrent };
		}

		const entities = Object.values(wrapCanvast)
			.map((entity) => ({
				...entity,
				title: entity.title || 'Untitled'
			}))
			.sort((a, b) => {
				if (a.create_time && b.create_time) {
					return new Date(b.create_time).getTime() - new Date(a.create_time).getTime();
				}

				if (a.create_time && !b.create_time) return -1;
				if (!a.create_time && b.create_time) return 1;

				return b.id.localeCompare(a.id);
			});

		return entities;
	}
);

export const selectCanvasEntityById = createSelector(
	[getCanvasApiState, getChannelIdCanvasAsSecondParam, getChannelIdCanvasAsParrent, (_, __, ___, canvasId) => canvasId],
	(canvasState, channelId, parentId, canvasId) => {
		if (!parentId) {
			return canvasState.channelCanvas[channelId]?.entities?.[canvasId];
		}
		const canvastCurrent = canvasState?.channelCanvas[channelId]?.entities || {};
		const canvasParrent = canvasState.channelCanvas[parentId]?.entities || {};
		const wrapCanvast = { ...canvastCurrent, ...canvasParrent };
		return wrapCanvast[canvasId];
	}
);

export const selectDefaultCanvasByChannelId = createSelector([getCanvasApiState, getChannelIdCanvasAsSecondParam], (canvasState, channelId) => {
	const entities = canvasState.channelCanvas[channelId]?.entities;
	if (!entities) return null;
	const canvasEntities = Object.values(entities);
	const defaultCanvas = canvasEntities.find((canvas) => canvas.is_default === true);

	return defaultCanvas || null;
});

export const selectCanvasCursors = createSelector([getCanvasApiState, getChannelIdCanvasAsSecondParam], (state, channelId) => ({
	countCanvas: state?.channelCanvas[channelId]?.countCanvas
}));
