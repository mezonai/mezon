import { LoadingStatus, SearchFilter } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiSearchMessageDocument } from 'mezon-js/api.gen';
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
		id: searchMessage.message_id || '',
		content: searchMessage.content ? JSON.parse(searchMessage.content) : null
	};
};

export interface SearchMessageState extends EntityState<SearchMessageEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	isSearchMessage: Record<string, boolean>;
	totalResult: number;
	currentPage: number;
	valueInputSearch: Record<string, string>;
}

export const SearchMessageAdapter = createEntityAdapter<SearchMessageEntity>();

export const fetchListSearchMessage = createAsyncThunk(
	'searchMessage/fetchListSearchMessage',
	async ({ filters, from, size, sorts }: any, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.searchMessage(mezon.session, { filters, from, size, sorts });
		if (!response.messages) {
			thunkAPI.dispatch(searchMessagesActions.setTotalResults(0));
			return [];
		}
		const searchMessage = response.messages.map(mapSearchMessageToEntity);
		thunkAPI.dispatch(searchMessagesActions.setTotalResults(response.total ?? 0));
		return searchMessage;
	}
);

export const initialSearchMessageState: SearchMessageState = SearchMessageAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	isSearchMessage: {},
	totalResult: 0,
	currentPage: 1,
	valueInputSearch: {}
});

export const searchMessageSlice = createSlice({
	name: SEARCH_MESSAGES_FEATURE_KEY,
	initialState: initialSearchMessageState,
	reducers: {
		add: SearchMessageAdapter.addOne,
		remove: SearchMessageAdapter.removeOne,
		setTotalResults: (state, action: PayloadAction<number>) => {
			state.totalResult = action.payload;
		},
		setIsSearchMessage: (state, action: PayloadAction<{ channelId: string; isSearchMessage: boolean }>) => {
			const { channelId, isSearchMessage } = action.payload;
			state.isSearchMessage[channelId] = isSearchMessage;
		},
		setCurrentPage: (state, action: PayloadAction<number>) => {
			state.currentPage = action.payload;
		},
		setValueInputSearch: (state, action: PayloadAction<{ channelId: string; value: string }>) => {
			const { channelId, value } = action.payload;
			state.valueInputSearch[channelId] = value;
		}
	},

	extraReducers: (builder) => {
		builder
			.addCase(fetchListSearchMessage.pending, (state: SearchMessageState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchListSearchMessage.fulfilled,
				(state: SearchMessageState, action: PayloadAction<ISearchMessage[], string, { arg: { filters: SearchFilter[] } }>) => {
					const channelId = action.meta.arg.filters[1].field_value;
					const ids = Object.values(state.entities)
						.filter((message) => message.channel_id === channelId)
						.map((message) => message.id);
					SearchMessageAdapter.removeMany(state, ids);
					SearchMessageAdapter.setAll(state, action.payload);
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

export const selectAllMessageSearch = createSelector(getSearchMessageState, selectAll);

export const selectMessageSearchByChannelId = (channelId: string) =>
	createSelector(selectAllMessageSearch, (state) => state.filter((message) => message.channel_id === channelId));

export const selectTotalResultSearchMessage = createSelector(getSearchMessageState, (state) => state.totalResult);
export const selectCurrentPage = createSelector(getSearchMessageState, (state) => state.currentPage);

export const selectIsSearchMessage = createSelector(
	[getSearchMessageState, (_, channelId) => channelId],
	(state, channelId) => state.isSearchMessage[channelId]
);

export const selectValueInputSearchMessage = (channelId: string) =>
	createSelector(getSearchMessageState, (state) => state.valueInputSearch[channelId]);
