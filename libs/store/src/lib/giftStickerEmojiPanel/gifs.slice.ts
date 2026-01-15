import { captureSentryError } from '@mezon/logger';
import type { IGif, IGifCategory } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';

export const GIFS_FEATURE_KEY = 'gifs';

export interface GifCategoriesEntity extends IGifCategory {
	id: string;
}

export interface GifEntity extends IGif {
	id: string;
}

export interface GifCategoriesResponse {
	locale: string;
	tags: GifCategoriesEntity[];
}

export const gifsAdapter = createEntityAdapter<GifCategoriesEntity>({
	selectId: (emo: GifCategoriesEntity) => emo.id || emo.path || ''
} as any);

export interface GifsState extends EntityState<GifCategoriesEntity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	error?: string | null;
	dataGifsSearch: GifEntity[];
	dataGifsFeatured: GifEntity[];
	trendingClickingStatus: boolean;
	categoriesStatus: boolean;
	buttonArrowBackStatus: boolean;
}
export const initialGifsState: GifsState = {
	...gifsAdapter.getInitialState(),
	loadingStatus: 'not loaded',
	error: null,
	dataGifsSearch: [],
	dataGifsFeatured: [],
	trendingClickingStatus: false,
	categoriesStatus: false,
	buttonArrowBackStatus: false
};

const apiKey = process.env.NX_CHAT_APP_API_TENOR_KEY;
const clientKey = process.env.NX_CHAT_APP_API_CLIENT_KEY_CUSTOM;
const limit = 30;

export const fetchGifCategories = createAsyncThunk<GifCategoriesResponse>('gifs/fetchStatus', async (_, thunkAPI) => {
	const baseUrl = process.env.NX_CHAT_APP_API_TENOR_URL_CATEGORIES ?? '';
	const categoriesUrl = `${baseUrl + apiKey}&client_key=${clientKey}&limit=${limit}`;

	try {
		const response = await fetch(`${categoriesUrl}`);
		if (!response.ok) {
			throw new Error('Failed to fetch gifs data');
		}
		const data = await response.json();
		return data;
	} catch (error) {
		captureSentryError(error, 'gifs/fetchStatus');
		return thunkAPI.rejectWithValue(error);
	}
});

export const fetchGifsDataSearch = createAsyncThunk<any, string>('gifs/fetchDataSearch', async (valueSearch, thunkAPI) => {
	const baseUrl = process.env.NX_CHAT_APP_API_TENOR_URL_SEARCH ?? '';
	const searchUrl = `${baseUrl + valueSearch}&key=${apiKey}&client_key=${clientKey}&limit=${limit}`;

	try {
		const response = await fetch(`${searchUrl}`);

		if (!response.ok) {
			throw new Error('Failed to fetch gifs data search');
		}
		const data = await response.json();
		return data;
	} catch (error) {
		captureSentryError(error, 'gifs/fetchDataSearch');
		return thunkAPI.rejectWithValue(error);
	}
});

export const fetchGifCategoryFeatured = createAsyncThunk<GifEntity[]>('gifs/fetchDataTrending', async (_, thunkAPI) => {
	const baseUrl = process.env.NX_CHAT_APP_API_TENOR_URL_FEATURED ?? '';
	const featuredUrl = `${baseUrl + apiKey}&client_key=${clientKey}&limit=${limit}`;

	try {
		const response = await fetch(`${featuredUrl}`);
		if (!response.ok) {
			throw new Error('Failed to fetch gifs data');
		}
		const data = await response.json();
		return data;
	} catch (error) {
		captureSentryError(error, 'gifs/fetchDataTrending');
		return thunkAPI.rejectWithValue(error);
	}
});

export const gifsSlice = createSlice({
	name: GIFS_FEATURE_KEY,
	initialState: initialGifsState,
	reducers: {
		add: gifsAdapter.addOne,
		remove: gifsAdapter.removeOne,

		setClickedTrendingGif: (state, action) => {
			state.trendingClickingStatus = action.payload;
		},
		setShowCategories: (state, action) => {
			state.categoriesStatus = action.payload;
		},
		setButtonArrowBack: (state, action) => {
			state.buttonArrowBackStatus = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchGifCategories.pending, (state: GifsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchGifCategories.fulfilled, (state: GifsState, action: PayloadAction<GifCategoriesResponse>) => {
				gifsAdapter.setAll(state, action.payload.tags);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchGifCategories.rejected, (state: GifsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(fetchGifsDataSearch.pending, (state: GifsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchGifsDataSearch.fulfilled, (state: GifsState, action: PayloadAction<any>) => {
				state.dataGifsSearch = action.payload.results;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchGifsDataSearch.rejected, (state: GifsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(fetchGifCategoryFeatured.pending, (state: GifsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchGifCategoryFeatured.fulfilled, (state: GifsState, action: PayloadAction<any>) => {
				state.dataGifsFeatured = action.payload.results;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchGifCategoryFeatured.rejected, (state: GifsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const gifsReducer = gifsSlice.reducer;

export const gifsActions = {
	...gifsSlice.actions,
	fetchGifCategories,
	fetchGifsDataSearch,
	fetchGifCategoryFeatured
};

const { selectAll } = gifsAdapter.getSelectors();

export const getGifsState = (rootState: { [GIFS_FEATURE_KEY]: GifsState }): GifsState => rootState[GIFS_FEATURE_KEY];

export const selectAllgifCategory = createSelector(getGifsState, selectAll);

export const selectGifsDataSearch = createSelector(getGifsState, (state: GifsState) => state.dataGifsSearch);

export const selectLoadingStatusGifs = createSelector(getGifsState, (state: GifsState) => state.loadingStatus);

export const selectDataGifsFeatured = createSelector(getGifsState, (state: GifsState) => state.dataGifsFeatured);

export const selectTrendingClickingStatus = createSelector(getGifsState, (state: GifsState) => state.trendingClickingStatus);

export const selectCategoriesStatus = createSelector(getGifsState, (state: GifsState) => state.categoriesStatus);

export const selectButtonArrowBackStatus = createSelector(getGifsState, (state: GifsState) => state.buttonArrowBackStatus);
