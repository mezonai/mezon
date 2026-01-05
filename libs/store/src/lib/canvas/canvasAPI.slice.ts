import { captureSentryError } from '@mezon/logger';
import type { CanvasUpdate, ICanvas, LoadingStatus } from '@mezon/utils';
import { LIMIT } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiEditChannelCanvasRequest } from 'mezon-js/types';
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
	createTime?: string;
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
		if (a.createTime && b.createTime) {
			return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
		}

		if (a.createTime && !b.createTime) return -1;
		if (!a.createTime && b.createTime) return 1;

		return b.id.localeCompare(a.id);
	}
});

type fetchCanvasPayload = {
	id: string;
	clanId: string;
	channelId: string;
	noCache?: boolean;
};

type getCanvasListPayload = {
	channelId: string;
	clanId: string;
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
			if (a.createTime && b.createTime) {
				return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
			}

			if (a.createTime && !b.createTime) return -1;
			if (!a.createTime && b.createTime) return 1;

			return b.id.localeCompare(a.id);
		});
	}
);

const fetchCanvasListCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	channelId: string,
	clanId: string,
	limit?: number,
	page?: number,
	noCache = false
) => {
	const state = getState();
	const channelData = state[CANVAS_API_FEATURE_KEY].channelCanvas[channelId];
	const apiKey = createApiKey('fetchCanvasList', channelId, clanId, String(limit || ''), String(page || ''));
	const shouldForceCall = shouldForceApiCall(apiKey, channelData?.cache, noCache);

	if (!shouldForceCall) {
		const entities = selectCachedCanvasByChannel(state, channelId);
		return {
			channel_canvases: entities,
			count: channelData.countCanvas || 0,
			fromCache: true
		};
	}

	const response = await withRetry(() => mezon.client.getChannelCanvasList(mezon.session, channelId, clanId, limit || LIMIT, page), {
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
	clanId: string,
	channelId: string,
	noCache = false
) => {
	const state = getState();
	const channelData = state[CANVAS_API_FEATURE_KEY].channelCanvas[channelId];
	const apiKey = createApiKey('fetchCanvasDetail', id, clanId, channelId);
	const shouldForceCall = shouldForceApiCall(apiKey, channelData?.cache, noCache);
	if (!shouldForceCall) {
		return {
			canvas: channelData.entities[id],
			fromCache: true
		};
	}

	const response = await withRetry(() => mezon.client.getChannelCanvasDetail(mezon.session, id, clanId, channelId), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'channel-canvas-detail'
	});

	markApiFirstCalled(apiKey);

	return {
		canvas: {
			...response,
			channelId
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
			channelId: body.channelId,
			title: body.title,
			content: body.content,
			is_default: body.is_default,
			createTime: new Date().toISOString()
		};

		if (body.channelId && result.id) {
			if (body.id) {
				thunkAPI.dispatch(
					canvasAPIActions.updateCanvas({
						channelId: body.channelId,
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
						channelId: body.channelId,
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
	async ({ id, clanId, channelId, noCache }: fetchCanvasPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchCanvasDetailCached(thunkAPI.getState as () => RootState, mezon, id, clanId, channelId, noCache);

			return response;
		} catch (error) {
			captureSentryError(error, 'canvas/getChannelCanvasDetail');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const getChannelCanvasList = createAsyncThunk(
	'canvas/getChannelCanvasList',
	async ({ channelId, clanId, limit, page, noCache }: getCanvasListPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchCanvasListCached(thunkAPI.getState as () => RootState, mezon, channelId, clanId, limit, page, noCache);

			return { ...response, channelId };
		} catch (error) {
			captureSentryError(error, 'canvas/getChannelCanvasList');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteCanvas = createAsyncThunk('canvas/deleteCanvas', async ({ id, channelId, clanId }: fetchCanvasPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.deleteChannelCanvas(mezon.session, id, clanId, channelId);

		if (channelId && id) {
			thunkAPI.dispatch(
				canvasAPIActions.removeOneCanvas({
					channelId: channelId,
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
		if (a.createTime && b.createTime) {
			return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
		}

		if (a.createTime && !b.createTime) return -1;
		if (!a.createTime && b.createTime) return 1;

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
		upsertOne: (state, action: PayloadAction<{ channelId: string; canvas: any }>) => {
			const { channelId, canvas } = action.payload;
			if (!state.channelCanvas[channelId]) {
				state.channelCanvas[channelId] = canvasAPIAdapter.getInitialState({
					id: canvas.id
				});
			}
			const canvasWithTimestamp = {
				...canvas
			};

			const currentEntities = Object.values(state.channelCanvas[channelId].entities || {});
			const existingCanvas = state.channelCanvas[channelId].entities[canvas.id];

			if (existingCanvas) {
				const updatedEntities = currentEntities.map((entity) => (entity.id === canvas.id ? { ...entity, ...canvasWithTimestamp } : entity));
				canvasAPIAdapter.setAll(state.channelCanvas[channelId], updatedEntities);
			} else {
				const newEntities = [...currentEntities, canvasWithTimestamp];
				canvasAPIAdapter.setAll(state.channelCanvas[channelId], newEntities);
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
				const { channelId } = action.payload;
				if (!channelId) return;
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
				const channelId = action.payload.channelId;
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
					const channelId = canvas.channelId;

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
				if (a.createTime && b.createTime) {
					return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
				}

				if (a.createTime && !b.createTime) return -1;
				if (!a.createTime && b.createTime) return 1;

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
