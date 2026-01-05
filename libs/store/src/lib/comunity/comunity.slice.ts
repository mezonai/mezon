import { captureSentryError } from '@mezon/logger';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { ensureSession, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const COMUNITY_FEATURE_KEY = 'COMUNITY_FEATURE_KEY';

export interface ComunityClanState {
	isCommunityEnabled: boolean;
	communityBanner: string | null;
	about: string;
	description: string;
	shortUrl: string;
}

export interface ComunityState {
	byClanId: Record<string, ComunityClanState>;
	isLoading: boolean;
	error: string | null;
}

export const initialComunityState: ComunityState = {
	byClanId: {},
	isLoading: false,
	error: null
};

export const getCommunityInfo = createAsyncThunk('comunity/getCommunityInfo', async ({ clanId }: { clanId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.listClanDescs(mezon.session);
		const clan = response.clandesc?.find((c: any) => c.clanId === clanId);
		if (!clan) {
			return thunkAPI.rejectWithValue('Clan not found');
		}
		return {
			clanId,
			isCommunityEnabled: clan.isCommunity || false,
			communityBanner: clan.communityBanner || null,
			about: clan.about || '',
			description: clan.description || '',
			shortUrl: clan.shortUrl || ''
		};
	} catch (error) {
		captureSentryError(error, 'comunity/getCommunityInfo');
		return thunkAPI.rejectWithValue('Failed to get community info');
	}
});

export const updateCommunity = createAsyncThunk(
	'comunity/updateCommunity',
	async (
		{
			clanId,
			enabled,
			bannerUrl,
			about,
			description,
			shortUrl
		}: { clanId: string; enabled: boolean; bannerUrl: string; about: string; description: string; shortUrl: string },
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clanId, {
				isCommunity: enabled,
				communityBanner: bannerUrl,
				about,
				description,
				shortUrl
			});
			return { clanId, enabled, bannerUrl, about, description, shortUrl };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunity');
			return thunkAPI.rejectWithValue('Failed to update community');
		}
	}
);

export const updateCommunityStatus = createAsyncThunk(
	'comunity/updateCommunityStatus',
	async ({ clanId, enabled }: { clanId: string; enabled: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clanId, {
				isCommunity: enabled
			});
			return { clanId, enabled };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityStatus');
			return thunkAPI.rejectWithValue('Failed to update community status');
		}
	}
);

export const updateCommunityBanner = createAsyncThunk(
	'comunity/updateCommunityBanner',
	async ({ clanId, bannerUrl }: { clanId: string; bannerUrl: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clanId, {
				communityBanner: bannerUrl
			});
			return { clanId, bannerUrl };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityBanner');
			return thunkAPI.rejectWithValue('Failed to update community banner');
		}
	}
);

export const updateCommunityAbout = createAsyncThunk(
	'comunity/updateCommunityAbout',
	async ({ clanId, about }: { clanId: string; about: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clanId, {
				about
			});
			return { clanId, about };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityAbout');
			return thunkAPI.rejectWithValue('Failed to update community about');
		}
	}
);

export const updateCommunityDescription = createAsyncThunk(
	'comunity/updateCommunityDescription',
	async ({ clanId, description }: { clanId: string; description: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clanId, {
				description
			});
			return { clanId, description };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityDescription');
			return thunkAPI.rejectWithValue('Failed to update community description');
		}
	}
);

export const updateCommunityShortUrl = createAsyncThunk(
	'comunity/updateCommunityShortUrl',
	async ({ clanId, shortUrl }: { clanId: string; shortUrl: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clanId, {
				shortUrl,
				isCommunity: true
			});
			return { clanId, shortUrl };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityShortUrl');
			return thunkAPI.rejectWithValue('Failed to update community short url');
		}
	}
);

export const comunitySlice = createSlice({
	name: COMUNITY_FEATURE_KEY,
	initialState: initialComunityState,
	reducers: {
		resetComunityState: (state) => {
			state.byClanId = {};
			state.isLoading = false;
			state.error = null;
		},
		setCommunityBanner: (state, action: PayloadAction<{ clanId: string; banner: string | null }>) => {
			const { clanId, banner } = action.payload;
			if (!state.byClanId[clanId])
				state.byClanId[clanId] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', shortUrl: '' };
			state.byClanId[clanId].communityBanner = banner;
		},
		setCommunityAbout: (state, action: PayloadAction<{ clanId: string; about: string; description?: string }>) => {
			const { clanId, about, description = '' } = action.payload;
			if (!state.byClanId[clanId])
				state.byClanId[clanId] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', shortUrl: '' };
			state.byClanId[clanId].about = about;
			state.byClanId[clanId].description = description;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(getCommunityInfo.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(getCommunityInfo.fulfilled, (state, action) => {
				const { clanId, isCommunityEnabled, communityBanner, about, description, shortUrl } = action.payload;
				state.byClanId[clanId] = {
					isCommunityEnabled,
					communityBanner,
					about,
					description,
					shortUrl
				};
				state.isLoading = false;
			})
			.addCase(getCommunityInfo.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(updateCommunity.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(updateCommunity.fulfilled, (state, action) => {
				const { clanId, enabled, bannerUrl, about, description, shortUrl } = action.payload;
				if (!state.byClanId[clanId]) {
					state.byClanId[clanId] = {
						isCommunityEnabled: false,
						communityBanner: null,
						about: '',
						description: '',
						shortUrl: ''
					};
				}
				// Update all fields
				state.byClanId[clanId].isCommunityEnabled = enabled;
				state.byClanId[clanId].communityBanner = bannerUrl;
				state.byClanId[clanId].about = about;
				state.byClanId[clanId].description = description;
				state.byClanId[clanId].shortUrl = shortUrl;
				state.isLoading = false;
			})
			.addCase(updateCommunity.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(updateCommunityStatus.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(updateCommunityStatus.fulfilled, (state, action) => {
				const { clanId, enabled } = action.payload;
				if (!state.byClanId[clanId])
					state.byClanId[clanId] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', shortUrl: '' };
				state.byClanId[clanId].isCommunityEnabled = enabled;
				state.isLoading = false;
			})
			.addCase(updateCommunityStatus.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(updateCommunityBanner.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(updateCommunityBanner.fulfilled, (state, action) => {
				const { clanId, bannerUrl } = action.payload;
				if (!state.byClanId[clanId])
					state.byClanId[clanId] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', shortUrl: '' };
				state.byClanId[clanId].communityBanner = bannerUrl;
				state.isLoading = false;
			})
			.addCase(updateCommunityBanner.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(updateCommunityAbout.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(updateCommunityAbout.fulfilled, (state, action) => {
				const { clanId, about } = action.payload;
				if (!state.byClanId[clanId])
					state.byClanId[clanId] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', shortUrl: '' };
				state.byClanId[clanId].about = about;
				state.isLoading = false;
			})
			.addCase(updateCommunityAbout.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(updateCommunityDescription.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(updateCommunityDescription.fulfilled, (state, action) => {
				const { clanId, description } = action.payload;
				if (!state.byClanId[clanId])
					state.byClanId[clanId] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', shortUrl: '' };
				state.byClanId[clanId].description = description;
				state.isLoading = false;
			})
			.addCase(updateCommunityDescription.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(updateCommunityShortUrl.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(updateCommunityShortUrl.fulfilled, (state, action) => {
				const { clanId, shortUrl } = action.payload;
				if (!state.byClanId[clanId])
					state.byClanId[clanId] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', shortUrl: '' };
				state.byClanId[clanId].shortUrl = shortUrl;
				state.isLoading = false;
			})
			.addCase(updateCommunityShortUrl.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			});
	}
});

export const comunityReducer = comunitySlice.reducer;

export const comunityActions = {
	...comunitySlice.actions,
	getCommunityInfo,
	updateCommunity,
	updateCommunityStatus,
	updateCommunityBanner,
	updateCommunityAbout,
	updateCommunityDescription,
	updateCommunityShortUrl
};
export const selectComunityDescription = createSelector(
	[(state: RootState, clanId: string) => selectComunityState(state).byClanId?.[clanId]?.description],
	(description) => description ?? ''
);

export const selectComunityState = (state: RootState) => state[COMUNITY_FEATURE_KEY] as ComunityState;

export const selectIsCommunityEnabled = createSelector(
	[(state: RootState, clanId: string) => selectComunityState(state)?.byClanId?.[clanId]?.isCommunityEnabled],
	(isCommunityEnabled) => isCommunityEnabled ?? false
);

export const selectCommunityBanner = createSelector(
	[(state: RootState, clanId: string) => selectComunityState(state).byClanId?.[clanId]?.communityBanner],
	(communityBanner) => communityBanner ?? null
);

export const selectComunityAbout = createSelector(
	[(state: RootState, clanId: string) => selectComunityState(state).byClanId?.[clanId]?.about],
	(about) => about ?? ''
);

export const selectComunityLoading = createSelector([selectComunityState], (state) => state.isLoading);

export const selectComunityError = createSelector([selectComunityState], (state) => state.error);

export const selectComunityShortUrl = createSelector(
	[(state: RootState, clanId: string) => selectComunityState(state).byClanId?.[clanId]?.shortUrl],
	(shortUrl) => shortUrl ?? ''
);

export const selectCommunityStateByClanId = createSelector(
	[(state: RootState, clanId: string) => selectComunityState(state)?.byClanId?.[clanId]],
	(community): ComunityClanState => community ?? { isCommunityEnabled: false, communityBanner: null, about: '', description: '', shortUrl: '' }
);
