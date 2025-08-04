import { captureSentryError } from '@mezon/logger';
import { IMessageWithUser, IThread, LIMIT, LoadingStatus, TypeCheck } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiChannelDescription } from 'mezon-js/api.gen';
import { CacheMetadata, createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { channelsActions } from '../channels/channels.slice';
import { listChannelRenderAction } from '../channels/listChannelRender.slice';
import { MezonValueContext, ensureSession, ensureSocket, getMezonCtx } from '../helpers';
import { RootState } from '../store';

export const THREADS_FEATURE_KEY = 'threads';

/*
 * Update these interfaces according to your requirements.
 */
export interface ThreadsEntity extends IThread {
	id: string; // Primary ID
}

export interface ThreadsState extends EntityState<ThreadsEntity, string> {
	byChannels: Record<string, EntityState<ThreadsEntity, string> & { cache?: CacheMetadata }>;
	loadingStatus: LoadingStatus;
	error?: string | null;
	isShowCreateThread?: Record<string, boolean>;
	nameThreadError?: string;
	messageThreadError?: string;
	isPrivate: number;
	listThreadId?: Record<string, string>;
	nameValueThread?: Record<string, string>;
	valueThread: IMessageWithUser | null;
	openThreadMessageState: boolean;
	currentThread?: ApiChannelDescription;
	isThreadModalVisible?: boolean;
	isFocusThreadBox?: boolean;
	loadingStatusSearchedThread?: LoadingStatus;
	threadSearchedResult?: Record<string, ThreadsEntity[] | null>;
	inputSearchThread?: Record<string, string>;
}

export const threadsAdapter = createEntityAdapter({
	selectId: (thread: ThreadsEntity) => thread.id || '',
	sortComparer: (a: ThreadsEntity, b: ThreadsEntity) => {
		if (a.last_sent_message && b.last_sent_message) {
			return (b.last_sent_message.timestamp_seconds || 0) - (a.last_sent_message.timestamp_seconds || 0);
		}
		return 0;
	}
});

/**
 * Export an effect using createAsyncThunk from
 * the Redux Toolkit: https://redux-toolkit.js.org/api/createAsyncThunk
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
 *   dispatch(fetchThreads())
 * }, [dispatch]);
 * ```
 */
export interface FetchThreadsArgs {
	channelId: string;
	clanId: string;
	threadId?: string;
	noCache?: boolean;
	page?: number;
}

export const fetchThreadsCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	channelId: string,
	clanId: string,
	threadId?: string,
	page?: number,
	noCache = false
) => {
	const currentState = getState();
	const threadsState = currentState[THREADS_FEATURE_KEY];
	const channelData = threadsState.byChannels?.[channelId] || getInitialChannelState();

	const apiKey = createApiKey('fetchThreads', channelId, clanId, mezon.session.username || '', threadId || '', page || 1);

	const shouldForceCall = shouldForceApiCall(apiKey, channelData.cache, noCache);

	if (!shouldForceCall && channelData) {
		return {
			channeldesc: channelData || [],
			fromCache: true,
			time: channelData.cache?.lastFetched || Date.now()
		};
	}
	const response = await mezon.client.listThreadDescs(mezon.session, channelId, LIMIT, 0, clanId, threadId, page);
	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

const updateCacheOnThreadCreation = createAsyncThunk(
	'threads/updateCache',
	async (
		{ clanId, channelId, defaultThreadList }: { clanId: string; channelId: string; defaultThreadList: Array<ApiChannelDescription> },
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const threads = await fetchThreadsCached(thunkAPI.getState as () => RootState, mezon, channelId, clanId, undefined, undefined);

			return mapToThreadEntity((threads.channeldesc as ApiChannelDescription[]) || []);
		} catch (e) {
			console.error(e);
		}
	}
);

const mapToThreadEntity = (threads: ApiChannelDescription[]) => {
	return threads.map((thread) => ({
		...thread,
		id: thread.channel_id as string
	}));
};

export const fetchThreads = createAsyncThunk('threads/fetchThreads', async ({ channelId, clanId, noCache, page }: FetchThreadsArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchThreadsCached(thunkAPI.getState as () => RootState, mezon, channelId, clanId, undefined, page, Boolean(noCache));

		if (!response.channeldesc || response.fromCache) {
			return {
				channelId,
				threads: [],
				fromCache: response.fromCache || false
			};
		}
		const threads = mapToThreadEntity(response.channeldesc as ApiChannelDescription[]);
		return {
			channelId,
			threads,
			fromCache: response.fromCache || false
		};
	} catch (error) {
		captureSentryError(error, 'threads/fetchThreads');
		return thunkAPI.rejectWithValue(error);
	}
});

export interface SearchThreadsArgs {
	label: string;
	channelId: string;
}
export const searchedThreads = createAsyncThunk('threads/searchThreads', async ({ label, channelId }: SearchThreadsArgs, thunkAPI) => {
	try {
		if (!label?.trim() || label.trim().length < 1) {
			return null;
		}

		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const state = thunkAPI.getState() as RootState;
		const clanId = state?.clans?.currentClanId;
		const channelId = state.channels?.byClans[state.clans?.currentClanId as string]?.currentChannelId;

		if (clanId && clanId !== '0' && channelId) {
			const response = await mezon.client.searchThread(mezon.session, clanId, channelId, label?.trim());
			if (!response.channeldesc) {
				return [];
			}
			const threads = mapToThreadEntity(response.channeldesc);
			return threads;
		}
	} catch (error) {
		captureSentryError(error, 'threads/searchThreads');
		return thunkAPI.rejectWithValue(error);
	}
});

export const fetchThread = createAsyncThunk('threads/fetchThread', async ({ channelId, clanId, threadId, noCache }: FetchThreadsArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchThreadsCached(
			thunkAPI.getState as () => RootState,
			mezon,
			channelId,
			clanId,
			threadId,
			undefined,
			Boolean(noCache)
		);

		if (!response.channeldesc) {
			return {
				channelId,
				threads: [],
				fromCache: response.fromCache || false
			};
		}

		const threads = mapToThreadEntity(response.channeldesc as ApiChannelDescription[]);
		return {
			channelId,
			threads,
			fromCache: response.fromCache || false
		};
	} catch (error) {
		captureSentryError(error, 'threads/fetchThread');
		return thunkAPI.rejectWithValue(error);
	}
});

const getInitialChannelState = () => {
	return {
		threads: threadsAdapter.getInitialState()
	};
};

export const initialThreadsState: ThreadsState = threadsAdapter.getInitialState({
	byChannels: {},
	loadingStatus: 'not loaded',
	error: null,
	isShowCreateThread: {},
	isPrivate: 0,
	nameValueThread: {},
	valueThread: null,
	openThreadMessageState: false,
	isThreadModalVisible: false,
	loadingStatusSearchedThread: 'not loaded',
	threadSearchedResult: {},
	inputSearchThread: {}
});

export const checkDuplicateThread = createAsyncThunk(
	'thread/duplicateNameCthread',
	async ({ thread_name, channel_id }: { thread_name: string; channel_id: string }, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const isDuplicateName = await mezon.socketRef.current?.checkDuplicateName(thread_name, channel_id, TypeCheck.TYPETHREAD);
			if (isDuplicateName?.type === TypeCheck.TYPETHREAD) {
				return isDuplicateName.exist;
			}
		} catch (error) {
			captureSentryError(error, 'threads/duplicateNameCthread');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const leaveThread = createAsyncThunk(
	'thread/leavethread',
	async ({ clanId, channelId, threadId, isPrivate }: { clanId: string; channelId: string; threadId: string; isPrivate: number }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.leaveThread(mezon.session, threadId);
			if (response) {
				thunkAPI.dispatch(channelsActions.removeByChannelID({ channelId: threadId, clanId }));
				thunkAPI.dispatch(threadsActions.remove(threadId));
				thunkAPI.dispatch(listChannelRenderAction.leaveChannelListRender({ channelId: threadId, clanId }));
				thunkAPI.dispatch(threadsActions.removeThreadFromCache({ channelId, threadId }));
				return threadId;
			}
		} catch (error) {
			captureSentryError(error, 'threads/leavethread');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const threadsSlice = createSlice({
	name: THREADS_FEATURE_KEY,
	initialState: initialThreadsState,
	reducers: {
		add: threadsAdapter.addOne,
		update: threadsAdapter.updateOne,
		remove: (state, action: PayloadAction<string>) => {
			threadsAdapter.removeOne(state, action.payload);
		},
		toggleThreadModal: (state: ThreadsState) => {
			state.isThreadModalVisible = !state.isThreadModalVisible;
		},
		hideThreadModal: (state: ThreadsState) => {
			state.isThreadModalVisible = false;
		},
		setIsShowCreateThread: (state: ThreadsState, action: PayloadAction<{ channelId: string; isShowCreateThread: boolean }>) => {
			state.isShowCreateThread = {
				...state.isShowCreateThread,
				[action.payload.channelId]: action.payload.isShowCreateThread
			};
			state.listThreadId = {
				...state.listThreadId,
				[action.payload.channelId]: ''
			};
		},
		setNameThreadError: (state, action: PayloadAction<string>) => {
			state.nameThreadError = action.payload;
		},
		setValueThread: (state, action: PayloadAction<IMessageWithUser | null>) => {
			state.valueThread = action.payload;
		},
		setMessageThreadError: (state, action: PayloadAction<string>) => {
			state.messageThreadError = action.payload;
		},
		setIsPrivate: (state, action: PayloadAction<number>) => {
			state.isPrivate = action.payload;
		},
		setListThreadId: (state, action: PayloadAction<{ channelId: string; threadId: string }>) => {
			state.listThreadId = {
				...state.listThreadId,
				[action.payload.channelId]: action.payload.threadId
			};
		},
		setNameValueThread: (state, action: PayloadAction<{ channelId: string; nameValue: string }>) => {
			state.nameValueThread = {
				...state.nameValueThread,
				[action.payload.channelId]: action.payload.nameValue
			};
		},
		setOpenThreadMessageState(state, action) {
			state.openThreadMessageState = action.payload;
		},
		setCurrentThread: (state, action: PayloadAction<ApiChannelDescription>) => {
			state.currentThread = action.payload;
		},

		updateActiveCodeThread: (state: ThreadsState, action: PayloadAction<{ channelId: string; activeCode: number }>) => {
			const { channelId, activeCode } = action.payload;
			const entity = state.entities[channelId];
			if (entity) {
				threadsAdapter.updateOne(state, {
					id: channelId,
					changes: {
						active: activeCode
					}
				});
			}
		},
		updateLastSentInThread: (state: ThreadsState, action: PayloadAction<{ channelId: string; lastSentTime: number }>) => {
			const { channelId, lastSentTime } = action.payload;
			const entity = state.entities[channelId];
			if (entity) {
				threadsAdapter.updateOne(state, {
					id: channelId,
					changes: {
						last_sent_message: {
							...entity.last_sent_message,
							timestamp_seconds: lastSentTime
						}
					}
				});
			}
		},
		setFocusThreadBox(state, action: PayloadAction<boolean>) {
			state.isFocusThreadBox = action.payload;
		},

		setThreadInputSearch(state, action) {
			const { channelId, value } = action.payload;
			if (!state.inputSearchThread) {
				state.inputSearchThread = {};
			}
			state.inputSearchThread[channelId] = value;
		},
		removeThreadFromCache: (state, action: PayloadAction<{ channelId: string; threadId: string }>) => {
			const { channelId, threadId } = action.payload;
			const channelData = state.byChannels?.[channelId];

			if (channelData && channelData) {
				threadsAdapter.removeOne(channelData, threadId);
			}
		},
		addThreadToCached: (state, action: PayloadAction<{ channelId: string; thread: ThreadsEntity }>) => {
			const { channelId, thread } = action.payload;
			if (!state.byChannels?.[channelId]) {
				return;
			}

			threadsAdapter.upsertOne(state.byChannels[channelId], thread);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchThreads.pending, (state: ThreadsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchThreads.fulfilled,
				(state: ThreadsState, action: PayloadAction<{ channelId: string; threads: ThreadsEntity[]; fromCache: boolean }>) => {
					const { channelId, threads, fromCache } = action.payload;

					if (!state?.byChannels) {
						state.byChannels = {};
					}

					if (!state.byChannels?.[channelId]) {
						state.byChannels[channelId] = threadsAdapter.getInitialState();
					}

					if (!fromCache) {
						state.byChannels[channelId] = threadsAdapter.setMany(state.byChannels[channelId], threads);
						state.byChannels[channelId].cache = createCacheMetadata();
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(fetchThreads.rejected, (state: ThreadsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(checkDuplicateThread.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(checkDuplicateThread.fulfilled, (state, action: PayloadAction<boolean | undefined>) => {
				state.loadingStatus = 'loaded';
				if (action.payload) {
					state.nameThreadError = 'Thread name already exists.';
				} else {
					state.nameThreadError = '';
				}
			})
			.addCase(checkDuplicateThread.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.payload as string;
			})
			.addCase(updateCacheOnThreadCreation.fulfilled, (state, action) => {
				if (!action.payload) return;
				threadsAdapter.addMany(state, action.payload);
				state.loadingStatus = 'loaded';
			});
		builder
			.addCase(searchedThreads.pending, (state: ThreadsState) => {
				state.loadingStatusSearchedThread = 'loading';
			})
			.addCase(searchedThreads.fulfilled, (state: ThreadsState, action) => {
				const { channelId } = action.meta.arg;
				if (channelId) {
					state.threadSearchedResult = {
						...state.threadSearchedResult,
						[channelId]: action.payload || null
					};
				}
				state.loadingStatusSearchedThread = 'loaded';
			})
			.addCase(searchedThreads.rejected, (state: ThreadsState, action) => {
				state.loadingStatusSearchedThread = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const threadsReducer = threadsSlice.reducer;

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
 *   dispatch(threadsActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const threadsActions = { ...threadsSlice.actions, fetchThreads, fetchThread, leaveThread, updateCacheOnThreadCreation, searchedThreads };

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllThreads);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectAll, selectEntities } = threadsAdapter.getSelectors();

export const getThreadsState = (rootState: { [THREADS_FEATURE_KEY]: ThreadsState }): ThreadsState => rootState[THREADS_FEATURE_KEY];

export const selectAllThreads = createSelector(getThreadsState, selectAll);

export const selectThreadsEntities = createSelector(getThreadsState, selectEntities);

export const selectThreadById = createSelector([selectThreadsEntities, (state, threadId: string) => threadId], (state, threadId) => state[threadId]);

export const selectIsPrivate = createSelector(getThreadsState, (state) => state.isPrivate);

export const selectNameThreadError = createSelector(getThreadsState, (state) => state.nameThreadError);

export const selectMessageThreadError = createSelector(getThreadsState, (state) => state.messageThreadError);

export const selectListThreadId = createSelector(getThreadsState, (state) => state.listThreadId);

export const selectValueThread = createSelector(getThreadsState, (state) => state.valueThread);

export const selectOpenThreadMessageState = createSelector(getThreadsState, (state: ThreadsState) => state.openThreadMessageState);

export const selectCurrentThread = createSelector(getThreadsState, (state: ThreadsState) => state.currentThread);

export const selectNameValueThread = (channelId: string) =>
	createSelector(getThreadsState, (state) => {
		return state.nameValueThread?.[channelId] as string;
	});

export const selectIsShowCreateThread = createSelector([getThreadsState, (_, channelId: string) => channelId], (state, channelId) => {
	return !!state.isShowCreateThread?.[channelId];
});

export const selectIsThreadModalVisible = createSelector(getThreadsState, (state: ThreadsState) => state.isThreadModalVisible);

export const selectClickedOnThreadBoxStatus = createSelector(getThreadsState, (state) => state.isFocusThreadBox);

export const selectSearchedThreadLoadingStatus = createSelector(getThreadsState, (state) => state.loadingStatusSearchedThread);

export const selectSearchedThreadResult = createSelector(
	[(state: { threads: ThreadsState }) => state.threads.threadSearchedResult, (_: any, channelId: string) => channelId],
	(threadSearchedResult, channelId) => threadSearchedResult?.[channelId] || null
);

export const selectThreadInputSearchByChannelId = createSelector(
	[(state: { threads: ThreadsState }) => state.threads.inputSearchThread, (_: any, channelId: string) => channelId],
	(inputSearchThread, channelId) => inputSearchThread?.[channelId] || ''
);

export const selectThreadsByParentChannelId = createSelector(
	[getThreadsState, (_, parentChannelId: string) => parentChannelId],
	(state, parentChannelId) => {
		const channelState = state.byChannels?.[parentChannelId] ? state.byChannels?.[parentChannelId] : threadsAdapter.getInitialState();
		if (!channelState) {
			return [];
		}
		return selectAll(channelState);
	}
);
