import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus, SearchFilter } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { Snowflake } from '@theinternetfolks/snowflake';
import { safeJSONParse } from 'mezon-js';
import type { ApiSearchMessageDocument, ApiSearchMessageRequest } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx } from '../helpers';
export const SEARCH_MESSAGES_FEATURE_KEY = 'searchMessages';

export interface ISearchMessage extends ApiSearchMessageDocument {
	id: string;
	content?: any;
	avatar?: string;
}
export interface SearchMessageEntity extends ISearchMessage {
	id: string;
}

export const mapSearchMessageToEntity = (searchMessage: ApiSearchMessageDocument): ISearchMessage => {
	return {
		...searchMessage,
		avatar: searchMessage.avatar_url,
		id: searchMessage.message_id || Snowflake.generate(),
		content: searchMessage.content ? safeJSONParse(searchMessage.content) : null
	};
};

export interface SearchMessageState {
	byChannels: Record<
		string,
		{
			entities: EntityState<SearchMessageEntity, string>;
			totalResult: number;
			currentPage: number;
			valueInputSearch: string;
			searchedRequest: ApiSearchMessageRequest;
		}
	>;
	loadingStatus: LoadingStatus;
	error?: string | null;
	isSearchMessage: Record<string, boolean>;
}

export const SearchMessageAdapter = createEntityAdapter<SearchMessageEntity>();

export const fetchListSearchMessage = createAsyncThunk(
	'searchMessage/fetchListSearchMessage',
	async ({ filters, from, size, sorts, isMobile = false }: any, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.searchMessage(mezon.session, { filters, from, size, sorts });
			const channelId = filters.find((filter: { field_name: string }) => filter.field_name === 'channel_id')?.field_value;

			if (!response.messages) {
				thunkAPI.dispatch(searchMessagesActions.setTotalResults({ channelId, total: isMobile ? response.total || 0 : 0 }));
				return { searchMessage: [], isMobile, channelId };
			}

			const searchMessage = response.messages.map(mapSearchMessageToEntity);
			thunkAPI.dispatch(searchMessagesActions.setTotalResults({ channelId, total: response.total ?? 0 }));

			return {
				searchMessage,
				isMobile,
				channelId
			};
		} catch (error) {
			captureSentryError(error, 'searchMessage/fetchListSearchMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

const getInitialChannelState = () => {
	return {
		entities: SearchMessageAdapter.getInitialState(),
		totalResult: 0,
		currentPage: 1,
		valueInputSearch: '',
		searchedRequest: {} as ApiSearchMessageRequest
	};
};

export const initialSearchMessageState: SearchMessageState = {
	byChannels: {},
	loadingStatus: 'not loaded',
	error: null,
	isSearchMessage: {}
};

export const searchMessageSlice = createSlice({
	name: SEARCH_MESSAGES_FEATURE_KEY,
	initialState: initialSearchMessageState,
	reducers: {
		add: (state, action: PayloadAction<{ channelId: string; message: SearchMessageEntity }>) => {
			const { channelId, message } = action.payload;
			if (!state.byChannels[channelId]) {
				state.byChannels[channelId] = getInitialChannelState();
			}
			SearchMessageAdapter.addOne(state.byChannels[channelId].entities, message);
		},
		remove: (state, action: PayloadAction<{ channelId: string; messageId: string }>) => {
			const { channelId, messageId } = action.payload;
			if (state.byChannels[channelId]) {
				SearchMessageAdapter.removeOne(state.byChannels[channelId].entities, messageId);
			}
		},
		setTotalResults: (state, action: PayloadAction<{ channelId: string; total: number }>) => {
			const { channelId, total } = action.payload;
			if (!state.byChannels[channelId]) {
				state.byChannels[channelId] = getInitialChannelState();
			}
			state.byChannels[channelId].totalResult = total;
		},
		setIsSearchMessage: (state, action: PayloadAction<{ channelId: string; isSearchMessage: boolean }>) => {
			const { channelId, isSearchMessage } = action.payload;
			state.isSearchMessage[channelId] = isSearchMessage;
		},
		setCurrentPage: (state, action: PayloadAction<{ channelId: string; page: number }>) => {
			const { channelId, page } = action.payload;
			if (!state.byChannels[channelId]) {
				state.byChannels[channelId] = getInitialChannelState();
			}
			state.byChannels[channelId].currentPage = page;
		},
		setValueInputSearch: (state, action: PayloadAction<{ channelId: string; value: string }>) => {
			const { channelId, value } = action.payload;
			if (!state.byChannels[channelId]) {
				state.byChannels[channelId] = getInitialChannelState();
			}
			state.byChannels[channelId].valueInputSearch = value;
		},
		setSearchedRequest: (state, action: PayloadAction<{ channelId: string; value: ApiSearchMessageRequest }>) => {
			const { channelId, value } = action.payload;
			if (!state.byChannels[channelId]) {
				state.byChannels[channelId] = getInitialChannelState();
			}
			state.byChannels[channelId].searchedRequest = value;
		},
		clearSearchResults: (state, action: PayloadAction<{ channelId: string }>) => {
			const { channelId } = action.payload;
			if (state.byChannels[channelId]) {
				state.byChannels[channelId] = getInitialChannelState();
			}
		}
	},

	extraReducers: (builder) => {
		builder
			.addCase(fetchListSearchMessage.pending, (state: SearchMessageState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchListSearchMessage.fulfilled,
				(
					state: SearchMessageState,
					action: PayloadAction<
						{ searchMessage: ISearchMessage[]; isMobile?: boolean; channelId: string },
						string,
						{ arg: { filters: SearchFilter[] } }
					>
				) => {
					const { channelId, searchMessage, isMobile } = action.payload;

					if (!state.byChannels[channelId]) {
						state.byChannels[channelId] = getInitialChannelState();
					}

					if (isMobile) {
						SearchMessageAdapter.addMany(state.byChannels[channelId].entities, searchMessage);
					} else {
						SearchMessageAdapter.setAll(state.byChannels[channelId].entities, searchMessage);
					}
					state.loadingStatus = 'loaded';
				}
			)
			.addCase(fetchListSearchMessage.rejected, (state: SearchMessageState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const searchMessageReducer = searchMessageSlice.reducer;

export const searchMessagesActions = {
	...searchMessageSlice.actions,
	fetchListSearchMessage
};

const { selectAll } = SearchMessageAdapter.getSelectors();

export const getSearchMessageState = (rootState: { [SEARCH_MESSAGES_FEATURE_KEY]: SearchMessageState }): SearchMessageState =>
	rootState[SEARCH_MESSAGES_FEATURE_KEY];

export const selectChannelSearchState = (channelId: string) =>
	createSelector(getSearchMessageState, (state) => state.byChannels?.[channelId] ?? getInitialChannelState());

export const selectAllMessageSearch = createSelector([getSearchMessageState, (_, channelId: string) => channelId], (state, channelId) => {
	const channelState = state.byChannels[channelId];

	if (!channelState) return [];

	return selectAll(channelState.entities);
});

export const selectMessageSearchByChannelId = createSelector([getSearchMessageState, (_, channelId: string) => channelId], (state, channelId) => {
	const channelState = state.byChannels[channelId];
	if (!channelState) return [];

	return selectAll(channelState.entities);
});

export const selectTotalResultSearchMessage = createSelector([getSearchMessageState, (_, channelId: string) => channelId], (state, channelId) => {
	return state.byChannels[channelId]?.totalResult ?? 0;
});

export const selectCurrentPage = createSelector([getSearchMessageState, (_, channelId: string) => channelId], (state, channelId) => {
	if (!channelId) return 1;
	return state.byChannels[channelId]?.currentPage ?? 1;
});

export const selectIsSearchMessage = createSelector(
	[getSearchMessageState, (_, channelId) => channelId],
	(state, channelId) => state.isSearchMessage[channelId] ?? false
);

export const selectValueInputSearchMessage = createSelector([getSearchMessageState, (_, channelId: string) => channelId], (state, channelId) => {
	return state.byChannels[channelId]?.valueInputSearch ?? '';
});

export const selectSearchedRequestByChannelId = createSelector([getSearchMessageState, (_, channelId: string) => channelId], (state, channelId) => {
	return state.byChannels[channelId]?.searchedRequest ?? ({} as ApiSearchMessageRequest);
});

export const selectSearchMessagesLoadingStatus = createSelector(getSearchMessageState, (state) => state.loadingStatus);
