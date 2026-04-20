import { captureSentryError } from '@mezon/logger';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type {
	ApiClosePollRequest,
	ApiCreatePollRequest,
	ApiCreatePollResponse,
	ApiGetPollRequest,
	ApiGetPollResponse,
	ApiVotePollRequest,
	ApiVotePollResponse
} from 'mezon-js';
import { ensureSession, getMezonCtx } from '../helpers';

export const POLLS_FEATURE_KEY = 'polls';

export interface PollsState {
	myVote: Record<string, number[]>;
}

export const initialPollsState: PollsState = {
	myVote: {}
};

export const createChannelPoll = createAsyncThunk<ApiCreatePollResponse, ApiCreatePollRequest>('polls/createPoll', async (payload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const body = {
			channel_id: payload.channel_id,
			clan_id: payload.clan_id,
			question: payload.question,
			answers: payload.answers,
			expire_hours: payload.expire_hours,
			type: payload.type
		};

		const response = await mezon.client.createPoll(mezon.session, body);

		return response;
	} catch (error) {
		captureSentryError(error, 'polls/createChannelPoll');
		return thunkAPI.rejectWithValue(error);
	}
});

export const votePoll = createAsyncThunk<ApiVotePollResponse, ApiVotePollRequest>('polls/votePoll', async (payload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const body = {
			poll_id: payload.poll_id,
			message_id: payload.message_id,
			channel_id: payload.channel_id,
			answer_indices: payload.answer_indices
		};

		const response = await mezon.client.votePoll(mezon.session, body);

		return response;
	} catch (error) {
		captureSentryError(error, 'polls/votePoll');
		return thunkAPI.rejectWithValue(error);
	}
});

export const closePoll = createAsyncThunk<ApiGetPollResponse, ApiClosePollRequest>('polls/closePoll', async (payload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const body = {
			poll_id: payload.poll_id,
			message_id: payload.message_id,
			channel_id: payload.channel_id
		};

		const response = await mezon.client.closePoll(mezon.session, body);

		return response;
	} catch (error) {
		captureSentryError(error, 'polls/closePoll');
		return thunkAPI.rejectWithValue(error);
	}
});

export const getPoll = createAsyncThunk<ApiGetPollResponse, ApiGetPollRequest>('polls/getPoll', async (payload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const body = {
			// poll_id: payload.poll_id,
			message_id: payload.message_id,
			channel_id: payload.channel_id
		};

		const response = await mezon.client.getPoll(mezon.session, body);

		return response;
	} catch (error) {
		captureSentryError(error, 'polls/getPoll');
		return thunkAPI.rejectWithValue(error);
	}
});

export const pollsSlice = createSlice({
	name: POLLS_FEATURE_KEY,
	initialState: initialPollsState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(votePoll.fulfilled, (state, action) => {
			try {
				const messageId = action.meta.arg?.message_id;
				if (!messageId) return;
				const indices = action.payload?.my_answer_indices ?? [];
				state.myVote[messageId] = indices;
			} catch (error) {
				console.error('Failed to update my vote:', error);
			}
		});
	}
});

export const pollsReducer = pollsSlice.reducer;
export const pollsActions = pollsSlice.actions;

export const getPollsState = (rootState: { [POLLS_FEATURE_KEY]: PollsState }): PollsState => rootState[POLLS_FEATURE_KEY];

export const selectMyVote = createSelector(getPollsState, (state) => state?.myVote);
