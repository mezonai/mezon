import type { RequestInput } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export const COMPOSE_FEATURE_KEY = 'compose';

export interface ComposeState {
	byChannelId: Record<string, RequestInput>;
	lastUpdatedChannelId: string | null;
}

const initialComposeState: ComposeState = {
	byChannelId: {},
	lastUpdatedChannelId: null
};

export const composeSlice = createSlice({
	name: COMPOSE_FEATURE_KEY,
	initialState: initialComposeState,
	reducers: {
		setComposeInput: (state, action: PayloadAction<{ channelId: string; request: RequestInput }>) => {
			const { channelId, request } = action.payload;
			state.byChannelId[channelId] = request;
			state.lastUpdatedChannelId = channelId;
		},

		clearComposeInput: (state, action: PayloadAction<{ channelId: string }>) => {
			const { channelId } = action.payload;
			delete state.byChannelId[channelId];
		},

		clearAllComposeInputs: (state) => {
			state.byChannelId = {};
			state.lastUpdatedChannelId = null;
		},

		setLastUpdatedChannelId: (state, action: PayloadAction<string | null>) => {
			state.lastUpdatedChannelId = action.payload;
		}
	}
});

export const composeReducer = composeSlice.reducer;

export const composeActions = {
	...composeSlice.actions
};

const getComposeState = (rootState: { [COMPOSE_FEATURE_KEY]: ComposeState }): ComposeState => rootState[COMPOSE_FEATURE_KEY];

export const selectComposeInputByChannelId = createSelector(
	[getComposeState, (state: RootState, channelId: string) => channelId],
	(state, channelId) => state.byChannelId[channelId] ?? null
);
