import { captureSentryError } from '@mezon/logger';
import type { ICategory, LoadingStatus, SortChannel } from '@mezon/utils';
import { TypeCheck } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiCategoryDesc, ApiCreateCategoryDescRequest, ApiUpdateCategoryDescRequest, ApiUpdateCategoryOrderRequest } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { clearApiCallTracker, createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { channelsActions } from '../channels/channels.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, ensureSocket, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const CATEGORIES_FEATURE_KEY = 'categories';

/*
 * Update these interfaces according to your requirements.
 */

export interface CategoriesEntity extends ICategory {
	id: string; // Primary ID
}

export const mapCategoryToEntity = (categoriesRes: ApiCategoryDesc) => {
	const id = (categoriesRes as unknown as any).category_id;
	return { ...categoriesRes, id };
};

export interface CategoriesState {
	byClans: Record<
		string,
		{
			entities: EntityState<CategoriesEntity, string>;
			sortChannelByCategoryId: Record<string, boolean>;
			categoryExpandState: Record<string, boolean>;
			showEmptyCategory: boolean;
			cache?: CacheMetadata;
		}
	>;
	loadingStatus: LoadingStatus;
	error?: string | null;
	ctrlKSelectedChannelId?: string;
	ctrlKFocusChannel?: { id: string; parentId: string } | null;
}

export const categoriesAdapter = createEntityAdapter<CategoriesEntity>();

type fetchCategoriesPayload = {
	clanId: string;
	noCache?: boolean;
};

type updatCategoryPayload = {
	clanId: string;
	request: ApiUpdateCategoryDescRequest;
};

export type FetchCategoriesPayload = {
	categories: ICategory[];
	clanId: string;
	fromCache?: boolean;
};

type SetCategoryExpandStatePayload = {
	clanId: string;
	categoryId: string;
	expandState: boolean;
};

const { selectAll: selectAllCategoriesEntities } = categoriesAdapter.getSelectors();

const selectCachedCategoriesByClan = createSelector(
	[(state: RootState, clanId: string) => state[CATEGORIES_FEATURE_KEY].byClans[clanId]?.entities],
	(entitiesState) => {
		return entitiesState ? selectAllCategoriesEntities(entitiesState) : [];
	}
);

export const fetchCategoriesCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, clanId: string, noCache = false) => {
	const state = getState();
	const clanData = state[CATEGORIES_FEATURE_KEY].byClans[clanId];
	const apiKey = createApiKey('fetchCategories', clanId);
	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.cache, noCache);

	if (!shouldForceCall) {
		const categories = selectCachedCategoriesByClan(state, clanId);
		return {
			categorydesc: categories,
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListCategoryDescs',
			list_category_req: {
				clan_id: clanId
			}
		},
		() => ensuredMezon.client.listCategoryDescs(ensuredMezon.session, clanId),
		'category_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async ({ clanId, noCache }: fetchCategoriesPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchCategoriesCached(thunkAPI.getState as () => RootState, mezon, clanId, noCache);

		if (!response.categorydesc) {
			return { categories: [], clanId };
		}

		const payload: FetchCategoriesPayload = {
			categories: response.categorydesc.map(mapCategoryToEntity),
			clanId,
			fromCache: response.fromCache
		};
		return payload;
	} catch (error) {
		captureSentryError(error, 'categories/fetchCategories');
		return thunkAPI.rejectWithValue(error);
	}
});

export const createNewCategory = createAsyncThunk('categories/createCategories', async (body: ApiCreateCategoryDescRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.createCategoryDesc(mezon.session, body);
		if (response) {
			return response;
		} else {
			return thunkAPI.rejectWithValue([]);
		}
	} catch (error) {
		captureSentryError(error, 'categories/createCategories');
		return thunkAPI.rejectWithValue(error);
	}
});

export const checkDuplicateCategoryInClan = createAsyncThunk(
	'categories/checkDuplicateCategoryInClan',
	async ({ categoryName, clanId }: { categoryName: string; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const isDuplicateName = await mezon.socketRef.current?.checkDuplicateName(categoryName, clanId, TypeCheck.TYPECATEGORY);

			if (isDuplicateName?.type === TypeCheck.TYPECATEGORY) {
				return isDuplicateName.exist;
			}
			return;
		} catch (error) {
			captureSentryError(error, 'categories/checkDuplicateCategoryInClan');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteCategory = createAsyncThunk(
	'categories/deleteCategory',
	async ({ clanId, categoryId, categoryLabel }: { clanId: string; categoryId: string; categoryLabel: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.deleteCategoryDesc(mezon.session, categoryId, clanId, categoryLabel);
			// Clear API call tracker to force fresh data on next fetch
			const apiKey = createApiKey('fetchCategories', clanId);
			clearApiCallTracker(apiKey);
			thunkAPI.dispatch(categoriesActions.deleteOne({ clanId, categoryId }));
			thunkAPI.dispatch(channelsActions.removeByCategory({ clanId, categoryId }));
		} catch (error) {
			captureSentryError(error, 'categories/deleteCategory');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateCategoriesOrder = createAsyncThunk(
	'categories/updateCategoriesOrder',
	async ({ clan_id, categories }: ApiUpdateCategoryOrderRequest, thunkAPI) => {
		try {
			if (!categories?.length || !clan_id) return;
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateCategoryOrder(mezon.session, {
				clan_id,
				categories
			});

			const state = thunkAPI.getState() as RootState;
			const currentCategories = selectCachedCategoriesByClan(state, clan_id as string);

			const updatedCategories = currentCategories.map((cat) => {
				const updatedOrder = categories.find((c) => c.category_id === cat.id);
				return {
					...cat,
					order: updatedOrder?.order
				};
			});

			const sortedCategories = [...updatedCategories].sort((a, b) => (a.order || 0) - (b.order || 0));

			thunkAPI.dispatch(
				categoriesActions.setAll({
					clanId: clan_id,
					categories: sortedCategories
				})
			);
		} catch (error) {
			captureSentryError(error, 'categories/updateCategoriesOrder');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateCategory = createAsyncThunk('categories/updateCategory', async ({ clanId, request }: updatCategoryPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		await mezon.client.updateCategory(mezon.session, clanId, request);
	} catch (error) {
		captureSentryError(error, 'categories/updateCategory');
		return thunkAPI.rejectWithValue(error);
	}
});

const getInitialClanState = () => {
	return {
		entities: categoriesAdapter.getInitialState(),
		sortChannelByCategoryId: {},
		categoryExpandState: {},
		showEmptyCategory: false
	};
};

export const initialCategoriesState: CategoriesState = {
	byClans: {},
	loadingStatus: 'not loaded',
	error: null,
	ctrlKSelectedChannelId: undefined,
	ctrlKFocusChannel: null
};

export const categoriesSlice = createSlice({
	name: CATEGORIES_FEATURE_KEY,
	initialState: initialCategoriesState,
	reducers: {
		updateOne: (state, action: PayloadAction<{ clanId: string; category: CategoriesEntity }>) => {
			const { clanId, category } = action.payload;
			categoriesAdapter.updateOne(state.byClans[clanId].entities, {
				id: category.id,
				changes: {
					...category
				}
			});
		},
		insertOne: (state, action: PayloadAction<{ clanId: string; category: CategoriesEntity }>) => {
			const { clanId, category } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			categoriesAdapter.addOne(state.byClans[clanId].entities, category);
		},

		setAll: (state, action: PayloadAction<{ clanId: string; categories: CategoriesEntity[] }>) => {
			const { clanId, categories } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			categoriesAdapter.setAll(state.byClans[clanId].entities, categories);
		},

		deleteOne: (state, action: PayloadAction<{ clanId: string; categoryId: string }>) => {
			const { clanId, categoryId } = action.payload;
			if (state.byClans[clanId]) {
				categoriesAdapter.removeOne(state.byClans[clanId].entities, categoryId);
			}
		},
		setCategoryIdSortChannel: (state, action: PayloadAction<SortChannel & { clanId: string }>) => {
			if (action.payload.categoryId) {
				if (!state.byClans[action.payload.clanId]) {
					state.byClans[action.payload.clanId] = getInitialClanState();
				}
				state.byClans[action.payload.clanId].sortChannelByCategoryId[action.payload.categoryId] = action.payload.isSortChannelByCategoryId;
			}
		},
		setShowEmptyCategory: (state, action: PayloadAction<string>) => {
			if (!state.byClans[action.payload]) {
				state.byClans[action.payload] = getInitialClanState();
			}
			state.byClans[action.payload].showEmptyCategory = true;
		},
		setHideEmptyCategory: (state, action: PayloadAction<string>) => {
			if (state.byClans[action.payload]) {
				state.byClans[action.payload].showEmptyCategory = false;
			}
		},
		setCtrlKSelectedChannelId: (state, action: PayloadAction<string>) => {
			state.ctrlKSelectedChannelId = action.payload;
		},
		setCtrlKFocusChannel: (state, action: PayloadAction<{ id: string; parentId: string } | null>) => {
			state.ctrlKFocusChannel = action.payload;
		},
		setCategoryExpandState: (state, action: PayloadAction<SetCategoryExpandStatePayload>) => {
			const { clanId, categoryId, expandState } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].categoryExpandState[categoryId] = expandState;
		},
		setCollapseAllCategory: (state, action: PayloadAction<{ clanId: string }>) => {
			const { clanId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			Object.keys(state.byClans[clanId].categoryExpandState).map((cateName) => {
				state.byClans[clanId].categoryExpandState[cateName] = false;
			});
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCategories.pending, (state: CategoriesState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchCategories.fulfilled, (state: CategoriesState, action: PayloadAction<FetchCategoriesPayload>) => {
				const { categories, clanId, fromCache } = action.payload;
				state.loadingStatus = 'loaded';
				if (fromCache) return;
				if (!state.byClans[clanId]) {
					state.byClans[clanId] = getInitialClanState();
				}

				const newEntities = categories.reduce(
					(acc, category) => {
						acc[category.id] = category;
						return acc;
					},
					{} as Record<string, CategoriesEntity>
				);

				state.byClans[clanId].entities = {
					ids: categories.map((c) => c.id),
					entities: newEntities
				};

				state.byClans[clanId].cache = createCacheMetadata();

				categories.forEach((category) => {
					if (state.byClans[clanId].categoryExpandState[category.id] === undefined) {
						state.byClans[clanId].categoryExpandState[category.id] = true;
					}
				});
			})
			.addCase(fetchCategories.rejected, (state: CategoriesState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});

		builder
			.addCase(createNewCategory.pending, (state: CategoriesState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(createNewCategory.fulfilled, (state: CategoriesState) => {
				state.loadingStatus = 'loaded';
			})
			.addCase(createNewCategory.rejected, (state: CategoriesState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});

		builder
			.addCase(deleteCategory.pending, (state: CategoriesState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(deleteCategory.fulfilled, (state: CategoriesState) => {
				state.loadingStatus = 'loaded';
			})
			.addCase(deleteCategory.rejected, (state: CategoriesState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const categoriesReducer = categoriesSlice.reducer;

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
 *   dispatch(categoriesActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const categoriesActions = {
	...categoriesSlice.actions,
	fetchCategories,
	createNewCategory,
	updateCategory,
	deleteCategory,
	updateCategoriesOrder
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
 * const entities = useSelector(selectAllCategories);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
export const getCategoriesState = (rootState: { [CATEGORIES_FEATURE_KEY]: CategoriesState }): CategoriesState => rootState[CATEGORIES_FEATURE_KEY];

export const selectCategoryIdSortChannel = createSelector(
	[getCategoriesState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		return state.byClans[clanId]?.sortChannelByCategoryId;
	}
);

export const selectIsShowEmptyCategory = createSelector(
	[getCategoriesState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.showEmptyCategory ?? false
);

export const selectCategoryById = createSelector(
	[getCategoriesState, (state: RootState) => state.clans.currentClanId as string, (_, id: string) => id],
	(state, clanId, id) => state.byClans[clanId]?.entities.entities[id]
);

export const selectCtrlKSelectedChannelId = createSelector(getCategoriesState, (state) => state.ctrlKSelectedChannelId);

export const selectCtrlKFocusChannel = createSelector(getCategoriesState, (state) => state.ctrlKFocusChannel);

export const selectCategoryExpandStateByCategoryId = createSelector(
	[getCategoriesState, (state: RootState) => state.clans.currentClanId as string, (_, categoryId: string) => categoryId],
	(state, clanId, categoryId) => state.byClans[clanId]?.categoryExpandState[categoryId] ?? true
);

export const selectAllCategories = createSelector(
	[
		(state: RootState, id?: null | string) => id || (state.clans.currentClanId as string),
		(state: RootState) => state[CATEGORIES_FEATURE_KEY].byClans
	],
	(clanId, byClans) => {
		const clanState = byClans[clanId]?.entities;
		return clanState ? selectAllCategoriesEntities(clanState) : [];
	}
);
