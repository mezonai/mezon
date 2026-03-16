import { captureSentryError } from '@mezon/logger';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type {
	ApiClosePollRequest,
	ApiCreatePollRequest,
	ApiCreatePollResponse,
	ApiGetPollRequest,
	ApiGetPollResponse,
	ApiVotePollRequest
} from 'node_modules/mezon-js/dist/api';
import { ensureSession, getMezonCtx } from '../helpers';

export const POLLS_FEATURE_KEY = 'polls';

export interface PollsState {
	loadingCreate: boolean;
	loadingVoteByMessageId: Record<string, boolean>;
	loadingCloseByMessageId: Record<string, boolean>;
	loadingGetByMessageId: Record<string, boolean>;
	error: string | null;
	pollsByMessageId: Record<string, ApiGetPollResponse>;
}

export const initialPollsState: PollsState = {
	loadingCreate: false,
	loadingVoteByMessageId: {},
	loadingCloseByMessageId: {},
	loadingGetByMessageId: {},
	error: null,
	pollsByMessageId: {}
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

export const votePoll = createAsyncThunk<ApiGetPollResponse, ApiVotePollRequest>('polls/votePoll', async (payload, thunkAPI) => {
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

function isPollContentLike(content: unknown): content is Record<string, unknown> {
	if (!content || typeof content !== 'object' || Array.isArray(content)) return false;
	const o = content as Record<string, unknown>;
	return 'message_id' in o || 'poll_id' in o || 'answer_counts' in o;
}

export const pollsSlice = createSlice({
	name: POLLS_FEATURE_KEY,
	initialState: initialPollsState,
	reducers: {
		setPollFromMessageContent(state, action: { payload: { message_id: string; content: unknown } }) {
			const { message_id, content } = action.payload;
			if (!message_id || !isPollContentLike(content)) return;
			const existing = state.pollsByMessageId[message_id];
			const contentObj = content as Record<string, unknown>;
			const merged = {
				...(existing || {}),
				...contentObj,
				message_id
			} as ApiGetPollResponse;
			if (!contentObj.voter_details) delete (merged as Record<string, unknown>).voter_details;
			state.pollsByMessageId[message_id] = merged;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(createChannelPoll.pending, (state) => {
				state.loadingCreate = true;
				state.error = null;
			})
			.addCase(createChannelPoll.fulfilled, (state, action) => {
				state.loadingCreate = false;
				const payload = action.payload as { message_id?: string; id?: string } | undefined;
				const messageId = payload?.message_id ?? payload?.id;
				if (payload && messageId) {
					state.pollsByMessageId[String(messageId)] = action.payload as ApiGetPollResponse;
				}
			})
			.addCase(createChannelPoll.rejected, (state, action) => {
				state.loadingCreate = false;
				state.error = action.error.message || 'Failed to create poll';
			})

			.addCase(votePoll.pending, (state, action) => {
				const messageId = action.meta.arg.message_id;
				if (messageId) state.loadingVoteByMessageId[messageId] = true;
				state.error = null;
			})
			.addCase(votePoll.fulfilled, (state, action) => {
				const messageId = action.meta.arg.message_id;
				if (messageId) state.loadingVoteByMessageId[messageId] = false;

				if (action.payload && action.payload.message_id && Object.keys(action.payload).length > 1) {
					state.pollsByMessageId[action.payload.message_id] = action.payload;
				}
			})
			.addCase(votePoll.rejected, (state, action) => {
				const messageId = action.meta.arg.message_id;
				if (messageId) state.loadingVoteByMessageId[messageId] = false;
				state.error = action.error.message || 'Failed to vote';
			})

			.addCase(closePoll.pending, (state, action) => {
				const messageId = action.meta.arg.message_id;
				if (messageId) {
					state.loadingCloseByMessageId[messageId] = true;
				}
				state.error = null;
			})
			.addCase(closePoll.fulfilled, (state, action) => {
				const messageId = action.meta.arg.message_id;
				if (messageId) {
					state.loadingCloseByMessageId[messageId] = false;
				}
				if (action.payload && action.payload.message_id) {
					state.pollsByMessageId[action.payload.message_id] = action.payload;
				}
			})
			.addCase(closePoll.rejected, (state, action) => {
				const messageId = action.meta.arg.message_id;
				if (messageId) {
					state.loadingCloseByMessageId[messageId] = false;
				}
				state.error = action.error.message || 'Failed to close poll';
			})

			.addCase(getPoll.pending, (state, action) => {
				const messageId = action.meta.arg.message_id;
				if (messageId) {
					state.loadingGetByMessageId[messageId] = true;
				}
				state.error = null;
			})
			.addCase(getPoll.fulfilled, (state, action) => {
				const messageId = action.meta.arg.message_id;
				if (messageId) {
					state.loadingGetByMessageId[messageId] = false;
				}
				if (action.payload && action.payload.message_id) {
					state.pollsByMessageId[action.payload.message_id] = action.payload;
				}
			})
			.addCase(getPoll.rejected, (state, action) => {
				const messageId = action.meta.arg.message_id;
				if (messageId) {
					state.loadingGetByMessageId[messageId] = false;
				}
				state.error = action.error.message || 'Failed to get poll';
			});
	}
});

export const pollsReducer = pollsSlice.reducer;
export const pollsActions = pollsSlice.actions;

export const getPollsState = (rootState: { [POLLS_FEATURE_KEY]: PollsState }): PollsState => rootState[POLLS_FEATURE_KEY];

export const selectPollLoadingCreate = (rootState: { [POLLS_FEATURE_KEY]: PollsState }): boolean => getPollsState(rootState).loadingCreate;

export const selectPollByMessageId = (rootState: { [POLLS_FEATURE_KEY]: PollsState }, messageId: string): ApiGetPollResponse | undefined =>
	getPollsState(rootState).pollsByMessageId[messageId];

export const selectPollLoadingVote = (rootState: { [POLLS_FEATURE_KEY]: PollsState }, messageId?: string): boolean =>
	messageId ? getPollsState(rootState).loadingVoteByMessageId[messageId] || false : false;

export const selectPollLoadingClose = (rootState: { [POLLS_FEATURE_KEY]: PollsState }, messageId?: string): boolean =>
	messageId ? getPollsState(rootState).loadingCloseByMessageId[messageId] || false : false;

export const selectPollLoadingGet = (rootState: { [POLLS_FEATURE_KEY]: PollsState }, messageId?: string): boolean =>
	messageId ? getPollsState(rootState).loadingGetByMessageId[messageId] || false : false;

export const selectPollError = (rootState: { [POLLS_FEATURE_KEY]: PollsState }): string | null => getPollsState(rootState).error;
