import { captureSentryError } from '@mezon/logger';
import { LoadingStatus, QUICK_MENU_TYPE } from '@mezon/utils';
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { Snowflake } from '@theinternetfolks/snowflake';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef, ApiQuickMenuAccess, ApiQuickMenuAccessRequest } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx } from '../helpers';
import { RootState } from '../store';

export const QUICK_MENU_FEATURE_KEY = 'quickMenu';

export interface QuickMenuState {
	byChannels: Record<string, Record<number, ApiQuickMenuAccess[]>>;
	timestamps: Record<string, Record<number, number>>;
	loadingStatus: LoadingStatus;
	error?: string | null;
}

export const initialQuickMenuState: QuickMenuState = {
	byChannels: {},
	timestamps: {},
	loadingStatus: 'not loaded',
	error: null
};

export const writeQuickMenuEvent = createAsyncThunk(
	'quickMenu/writeQuickMenuEvent',
	async (
		{
			channelId,
			clanId,
			menuName,
			mode,
			isPublic,
			content,
			mentions,
			attachments,
			references,
			anonymousMessage,
			mentionEveryone,
			avatar,
			code,
			topicId
		}: {
			channelId: string;
			clanId: string;
			menuName: string;
			mode: number;
			isPublic: boolean;
			content?: any;
			mentions?: Array<ApiMessageMention>;
			attachments?: Array<ApiMessageAttachment>;
			references?: Array<ApiMessageRef>;
			anonymousMessage?: boolean;
			mentionEveryone?: boolean;
			avatar?: string;
			code?: number;
			topicId?: string;
		},
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const socket = mezon.socketRef?.current;

			if (!socket || !socket.isOpen()) {
				throw new Error('Socket is not connected');
			}

			await socket.writeQuickMenuEvent(
				menuName,
				clanId,
				channelId,
				mode,
				isPublic,
				content,
				mentions,
				attachments,
				references,
				anonymousMessage || false,
				mentionEveryone || false,
				avatar,
				code || 0,
				topicId
			);

			return {
				success: true,
				eventData: {
					menu_name: menuName,
					clan_id: clanId,
					channel_id: channelId,
					mode,
					is_public: isPublic,
					timestamp: Date.now()
				}
			};
		} catch (error) {
			console.error('Error sending quick menu event:', error);
			captureSentryError(error, 'quickMenu/writeQuickMenuEvent');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const addQuickMenuAccess = createAsyncThunk(
	'quickMenu/addQuickMenuAccess',
	async (body: ApiQuickMenuAccessRequest & { channelId: string; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const data = {
				id: Snowflake.generate(),
				bot_id: '0',
				channel_id: body.channelId,
				clan_id: body.clanId,
				menu_name: body.menu_name,
				action_msg: body.action_msg || '',
				menu_type: body.menu_type || QUICK_MENU_TYPE.FLASH_MESSAGE
			};
			const response = await mezon.client.addQuickMenuAccess(mezon.session, data);
			if (response) {
				return { data, channelId: body.channelId };
			}
			return { data: null, channelId: body.channelId };
		} catch (error) {
			captureSentryError(error, 'quickMenu/addQuickMenuAccess');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateQuickMenuAccess = createAsyncThunk(
	'quickMenu/updateQuickMenuAccess',
	async (body: ApiQuickMenuAccessRequest & { channelId: string; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const data = {
				id: body.id,
				bot_id: '0',
				channel_id: body.channelId,
				clan_id: body.clanId,
				menu_name: body.menu_name,
				action_msg: body.action_msg || '',
				menu_type: body.menu_type || QUICK_MENU_TYPE.FLASH_MESSAGE
			};
			const response = await mezon.client.updateQuickMenuAccess(mezon.session, data);
			if (response) {
				return { data, channelId: body.channelId };
			}
			return { data: null, channelId: body.channelId };
		} catch (error) {
			captureSentryError(error, 'quickMenu/updateQuickMenuAccess');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteQuickMenuAccess = createAsyncThunk(
	'quickMenu/deleteQuickMenuAccess',
	async ({ id, channelId }: { id: string; channelId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.deleteQuickMenuAccess(mezon.session, id);
			return { id, channelId };
		} catch (error) {
			captureSentryError(error, 'quickMenu/deleteQuickMenuAccess');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const listQuickMenuAccess = createAsyncThunk(
	'quickMenu/listQuickMenuAccess',
	async ({ channelId, menuType }: { channelId: string; menuType: number }, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as RootState;
			const quickMenuState = getQuickMenuState(state);

			const cachedData = quickMenuState.byChannels[channelId]?.[menuType];
			const lastFetchTime = quickMenuState.timestamps[channelId]?.[menuType];
			const now = Date.now();
			const CACHE_DURATION = 5 * 60 * 1000;

			if (cachedData && lastFetchTime && now - lastFetchTime < CACHE_DURATION) {
				return { channelId, menuType, quickMenuItems: cachedData, fromCache: true };
			}

			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.listQuickMenuAccess(mezon.session, '0', channelId, menuType);

			return { channelId, menuType, quickMenuItems: response.list_menus || [], fromCache: false };
		} catch (error) {
			captureSentryError(error, 'quickMenu/listQuickMenuAccess');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const quickMenuSlice = createSlice({
	name: QUICK_MENU_FEATURE_KEY,
	initialState: initialQuickMenuState,
	reducers: {
		clearQuickMenuByChannel: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			delete state.byChannels[channelId];
			delete state.timestamps[channelId];
		},
		clearAllQuickMenu: (state) => {
			state.byChannels = {};
			state.timestamps = {};
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(listQuickMenuAccess.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(listQuickMenuAccess.fulfilled, (state, action) => {
				state.loadingStatus = 'loaded';
				const { channelId, menuType, quickMenuItems, fromCache } = action.payload;

				if (!state.byChannels[channelId]) {
					state.byChannels[channelId] = {};
				}
				if (!state.timestamps[channelId]) {
					state.timestamps[channelId] = {};
				}

				state.byChannels[channelId][menuType] = quickMenuItems;

				if (!fromCache) {
					state.timestamps[channelId][menuType] = Date.now();
				}
			})
			.addCase(listQuickMenuAccess.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(addQuickMenuAccess.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(addQuickMenuAccess.fulfilled, (state, action) => {
				state.loadingStatus = 'loaded';
				const { channelId, data } = action.payload;
				if (data && data.menu_type !== undefined) {
					if (!state.byChannels[channelId]) {
						state.byChannels[channelId] = {};
					}
					if (!state.byChannels[channelId][data.menu_type]) {
						state.byChannels[channelId][data.menu_type] = [];
					}
					state.byChannels[channelId][data.menu_type].push(data);
				}
			})
			.addCase(addQuickMenuAccess.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(updateQuickMenuAccess.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(updateQuickMenuAccess.fulfilled, (state, action) => {
				state.loadingStatus = 'loaded';
				const { channelId, data } = action.payload;
				if (data && data.menu_type !== undefined) {
					if (state.byChannels[channelId]?.[data.menu_type]) {
						const indexUpdate = state.byChannels[channelId][data.menu_type].findIndex((item) => item.id === data.id);
						if (indexUpdate !== -1) {
							state.byChannels[channelId][data.menu_type][indexUpdate] = data;
						}
					}
				}
			})
			.addCase(updateQuickMenuAccess.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(deleteQuickMenuAccess.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(deleteQuickMenuAccess.fulfilled, (state, action) => {
				state.loadingStatus = 'loaded';
				const { channelId, id } = action.payload;
				// Find and remove from all menu types in this channel
				if (state.byChannels[channelId]) {
					Object.keys(state.byChannels[channelId]).forEach((menuTypeKey) => {
						const menuType = parseInt(menuTypeKey);
						state.byChannels[channelId][menuType] = state.byChannels[channelId][menuType].filter((item) => item.id !== id);
					});
				}
			})
			.addCase(deleteQuickMenuAccess.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const quickMenuReducer = quickMenuSlice.reducer;

export const quickMenuActions = {
	...quickMenuSlice.actions,
	addQuickMenuAccess,
	updateQuickMenuAccess,
	deleteQuickMenuAccess,
	listQuickMenuAccess,
	writeQuickMenuEvent
};

export const getQuickMenuState = (rootState: { [QUICK_MENU_FEATURE_KEY]: QuickMenuState }): QuickMenuState => rootState[QUICK_MENU_FEATURE_KEY];

export const selectQuickMenuByChannelId = createSelector(
	[getQuickMenuState, (_state: RootState, channelId: string) => channelId],
	(quickMenuState, channelId) => {
		const channelData = quickMenuState?.byChannels?.[channelId];
		if (!channelData) return [];
		return Object.values(channelData).flat();
	}
);

export const selectQuickMenuByChannelIdAndType = createSelector(
	[getQuickMenuState, (_state: RootState, channelId: string) => channelId, (_state: RootState, _channelId: string, menuType: number) => menuType],
	(quickMenuState, channelId, menuType) => quickMenuState?.byChannels?.[channelId]?.[menuType] || []
);

export const selectFlashMessagesByChannelId = createSelector(
	[getQuickMenuState, (_state: RootState, channelId: string) => channelId],
	(quickMenuState, channelId) => quickMenuState?.byChannels?.[channelId]?.[QUICK_MENU_TYPE.FLASH_MESSAGE] || []
);

export const selectQuickMenusByChannelId = createSelector(
	[getQuickMenuState, (_state: RootState, channelId: string) => channelId],
	(quickMenuState, channelId) => quickMenuState?.byChannels?.[channelId]?.[QUICK_MENU_TYPE.QUICK_MENU] || []
);

export const selectQuickMenuLoadingStatus = createSelector(getQuickMenuState, (state) => state?.loadingStatus || 'not loaded');

export const selectQuickMenuError = createSelector(getQuickMenuState, (state) => state?.error || null);
