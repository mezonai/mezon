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
	short_url: string;
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

export const getCommunityInfo = createAsyncThunk('comunity/getCommunityInfo', async ({ clan_id }: { clan_id: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.listClanDescs(mezon.session);
		const clan = response.clandesc?.find((c) => c.clan_id === clan_id);
		if (!clan) {
			return thunkAPI.rejectWithValue('Clan not found');
		}
		return {
			clan_id,
			isCommunityEnabled: clan.is_community || false,
			communityBanner: clan.community_banner || null,
			about: clan.about || '',
			description: clan.description || '',
			short_url: clan.short_url || ''
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
			clan_id,
			enabled,
			bannerUrl,
			about,
			description,
			short_url
		}: { clan_id: string; enabled: boolean; bannerUrl: string; about: string; description: string; short_url: string },
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clan_id, {
				is_community: enabled,
				community_banner: bannerUrl,
				about,
				description,
				short_url
			});
			return { clan_id, enabled, bannerUrl, about, description, short_url };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunity');
			return thunkAPI.rejectWithValue('Failed to update community');
		}
	}
);

export const updateCommunityStatus = createAsyncThunk(
	'comunity/updateCommunityStatus',
	async ({ clan_id, enabled }: { clan_id: string; enabled: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clan_id, {
				is_community: enabled
			});
			return { clan_id, enabled };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityStatus');
			return thunkAPI.rejectWithValue('Failed to update community status');
		}
	}
);

export const updateCommunityBanner = createAsyncThunk(
	'comunity/updateCommunityBanner',
	async ({ clan_id, bannerUrl }: { clan_id: string; bannerUrl: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clan_id, {
				community_banner: bannerUrl
			});
			return { clan_id, bannerUrl };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityBanner');
			return thunkAPI.rejectWithValue('Failed to update community banner');
		}
	}
);

export const updateCommunityAbout = createAsyncThunk(
	'comunity/updateCommunityAbout',
	async ({ clan_id, about }: { clan_id: string; about: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clan_id, {
				about
			});
			return { clan_id, about };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityAbout');
			return thunkAPI.rejectWithValue('Failed to update community about');
		}
	}
);

export const updateCommunityDescription = createAsyncThunk(
	'comunity/updateCommunityDescription',
	async ({ clan_id, description }: { clan_id: string; description: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clan_id, {
				description
			});
			return { clan_id, description };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityDescription');
			return thunkAPI.rejectWithValue('Failed to update community description');
		}
	}
);

export const updateCommunityShortUrl = createAsyncThunk(
	'comunity/updateCommunityShortUrl',
	async ({ clan_id, short_url }: { clan_id: string; short_url: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateClanDesc(mezon.session, clan_id, {
				short_url,
				is_community: true
			});
			return { clan_id, short_url };
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
				state.byClanId[clanId] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', short_url: '' };
			state.byClanId[clanId].communityBanner = banner;
		},
		setCommunityAbout: (state, action: PayloadAction<{ clanId: string; about: string; description?: string }>) => {
			const { clanId, about, description = '' } = action.payload;
			if (!state.byClanId[clanId])
				state.byClanId[clanId] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', short_url: '' };
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
				const { clan_id, isCommunityEnabled, communityBanner, about, description, short_url } = action.payload;
				state.byClanId[clan_id] = {
					isCommunityEnabled,
					communityBanner,
					about,
					description,
					short_url
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
				const { clan_id, enabled, bannerUrl, about, description, short_url } = action.payload;
				if (!state.byClanId[clan_id]) {
					state.byClanId[clan_id] = {
						isCommunityEnabled: false,
						communityBanner: null,
						about: '',
						description: '',
						short_url: ''
					};
				}
				// Update all fields
				state.byClanId[clan_id].isCommunityEnabled = enabled;
				state.byClanId[clan_id].communityBanner = bannerUrl;
				state.byClanId[clan_id].about = about;
				state.byClanId[clan_id].description = description;
				state.byClanId[clan_id].short_url = short_url;
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
				const { clan_id, enabled } = action.payload;
				if (!state.byClanId[clan_id])
					state.byClanId[clan_id] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', short_url: '' };
				state.byClanId[clan_id].isCommunityEnabled = enabled;
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
				const { clan_id, bannerUrl } = action.payload;
				if (!state.byClanId[clan_id])
					state.byClanId[clan_id] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', short_url: '' };
				state.byClanId[clan_id].communityBanner = bannerUrl;
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
				const { clan_id, about } = action.payload;
				if (!state.byClanId[clan_id])
					state.byClanId[clan_id] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', short_url: '' };
				state.byClanId[clan_id].about = about;
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
				const { clan_id, description } = action.payload;
				if (!state.byClanId[clan_id])
					state.byClanId[clan_id] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', short_url: '' };
				state.byClanId[clan_id].description = description;
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
				const { clan_id, short_url } = action.payload;
				if (!state.byClanId[clan_id])
					state.byClanId[clan_id] = { isCommunityEnabled: false, communityBanner: null, about: '', description: '', short_url: '' };
				state.byClanId[clan_id].short_url = short_url;
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
	[(state: RootState, clanId: string) => selectComunityState(state).byClanId?.[clanId]?.short_url],
	(short_url) => short_url ?? ''
);

export const selectCommunityStateByClanId = createSelector(
	[(state: RootState, clanId: string) => selectComunityState(state)?.byClanId?.[clanId]],
	(community): ComunityClanState => community ?? { isCommunityEnabled: false, communityBanner: null, about: '', description: '', short_url: '' }
);
