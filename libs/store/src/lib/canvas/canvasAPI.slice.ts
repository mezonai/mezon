import { captureSentryError } from '@mezon/logger';
import { CanvasUpdate, ICanvas, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiEditChannelCanvasRequest } from 'mezon-js/api.gen';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';

export const CANVAS_API_FEATURE_KEY = 'canvasapi';
const FETCH_MESSAGES_CACHED_TIME = 1000 * 60 * 60;
const limitCanvas = 10;

/*
 * Update these interfaces according to your requirements.
 */
export interface CanvasAPIEntity extends ICanvas {
	id: string; // Primary ID
	countCanvas?: number;
}

export interface CanvasAPIState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	channelCanvas: Record<
		string,
		EntityState<CanvasAPIEntity, string> & {
			id: string;
			countCanvas?: number;
		}
	>;
}

export const canvasAPIAdapter = createEntityAdapter({
	selectId: (canvas: CanvasAPIEntity) => canvas.id || '',
	sortComparer: (a, b) => b.id.localeCompare(a.id)
});

type fetchCanvasPayload = {
	id: string;
	clan_id: string;
	channel_id: string;
};

type getCanvasListPayload = {
	channel_id: string;
	clan_id: string;
	limit?: number;
	page?: number;
	noCache?: boolean;
};

export const fetchCanvasCached = memoizeAndTrack(
	async (mezon: MezonValueContext, channel_id: string, clan_id: string, limit?: number, page?: number) => {
		const response = await mezon.client.getChannelCanvasList(mezon.session, channel_id, clan_id, limitCanvas, page);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: FETCH_MESSAGES_CACHED_TIME,
		normalizer: (args) => {
			// set default value
			return args[1] + args[2] + args[3] + args[4] + args[0].session.username;
		}
	}
);

export const createEditCanvas = createAsyncThunk('canvas/editChannelCanvases', async (body: ApiEditChannelCanvasRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.editChannelCanvases(mezon.session, body);

		return { ...response, channel_id: body.channel_id, title: body.title, content: body.content, is_default: body.is_default };
	} catch (error) {
		captureSentryError(error, 'canvas/editChannelCanvases');
		return thunkAPI.rejectWithValue(error);
	}
});

export const getChannelCanvasDetail = createAsyncThunk(
	'canvas/getChannelCanvasDetail',
	async ({ id, clan_id, channel_id }: fetchCanvasPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.getChannelCanvasDetail(mezon.session, id, clan_id, channel_id);
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

			if (noCache) {
				fetchCanvasCached.delete(mezon, channel_id, clan_id, limit, page);
			}
			const response = await fetchCanvasCached(mezon, channel_id, clan_id, limit, page);
			if (Date.now() - response.time > 100) {
				return {
					fromCache: true
				};
			}
			return response;
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
			countCanvas: countCanvas
		});
	}

	const updatedChannelCanvas = canvasAPIAdapter.setAll(state.channelCanvas[channelId], adapterPayload);
	state.channelCanvas[channelId] = updatedChannelCanvas;
	state.channelCanvas[channelId].countCanvas = countCanvas;
};

export const canvasAPISlice = createSlice({
	name: CANVAS_API_FEATURE_KEY,
	initialState: initialCanvasAPIState,
	reducers: {
		// ...
		updateCanvas: (state, action: PayloadAction<{ channelId: string; dataUpdate: CanvasUpdate }>) => {
			const { channelId, dataUpdate } = action.payload;
			const { id, title, content, creator_id } = dataUpdate;
			canvasAPIAdapter.updateOne(state.channelCanvas[channelId], {
				id: id,
				changes: {
					title: title,
					content: content,
					creator_id: creator_id
				}
			});
		},
		removeOneCanvas: (state, action: PayloadAction<{ channelId: string; canvasId: string }>) => {
			const { channelId, canvasId } = action.payload;
			if (state.channelCanvas[channelId]) {
				canvasAPIAdapter.removeOne(state.channelCanvas[channelId], canvasId);
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
				if (!state.channelCanvas[channel_id]) {
					state.channelCanvas[channel_id] = canvasAPIAdapter.getInitialState({
						id: channel_id
					});
				}
				canvasAPIAdapter.upsertOne(state.channelCanvas[channel_id], action.payload);
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
				const channelId = (action as any)?.meta?.arg?.channel_id;
				const reversedCanvas = action.payload.channel_canvases;
				const countCanvas = action.payload.count;
				handleSetManyCanvas({
					state,
					channelId,
					adapterPayload: reversedCanvas,
					countCanvas: countCanvas
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

export const selectAllCanvas = createSelector(getCanvasApiState, (canvasState) => {
	const res: CanvasAPIEntity[] = [];
	Object.values(canvasState.channelCanvas || {}).forEach((item) => {
		res.concat(Object.values(item?.entities || {}));
	});
	return res;
});

export const selectCanvasIdsByChannelId = createSelector([getCanvasApiState, getChannelIdCanvasAsSecondParam], (state, channelId) => {
	const entities = state?.channelCanvas[channelId]?.entities || {};
	return Object.values(entities).map((entity) => ({
		...entity,
		title: entity.title || 'Untitled'
	}));
});

export const selectCanvasEntityById = createSelector(
	[getCanvasApiState, getChannelIdCanvasAsSecondParam, (_, __, canvasId) => canvasId],
	(canvasState, channelId, canvasId) => {
		return canvasState.channelCanvas[channelId]?.entities?.[canvasId];
	}
);

export const selectDefaultCanvasByChannelId = createSelector([getCanvasApiState, getChannelIdCanvasAsSecondParam], (canvasState, channelId) => {
	const entities = canvasState.channelCanvas[channelId]?.entities;
	const ids = canvasState.channelCanvas[channelId]?.ids;
	if (!entities || !ids) return null;

	let defaultCanvas = null;

	for (let i = 0; i < ids.length; i++) {
		const id = ids[i];
		if (entities[id]?.is_default === true) {
			defaultCanvas = entities[id];
			break;
		}
	}

	return defaultCanvas || null;
});

export const selectCanvasCursors = createSelector([getCanvasApiState, getChannelIdCanvasAsSecondParam], (state, channelId) => ({
	countCanvas: state?.channelCanvas[channelId]?.countCanvas
}));
