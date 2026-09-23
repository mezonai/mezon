import { captureSentryError } from '@mezon/logger';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiClanDesc } from 'mezon-js';
import { ensureSession, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const COMUNITY_FEATURE_KEY = 'COMUNITY_FEATURE_KEY';

export const serializeHashtags = (tags: string[]): string => {
	if (!tags || tags.length === 0) return '';
	return tags
		.map((t) => t.trim().replace(/^#/, ''))
		.filter(Boolean)
		.join(',');
};

export const parseHashtags = (raw?: string | null): string[] => {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim().replace(/^#/, '')).filter(Boolean);
	} catch {
		// Ignore JSON parse error, fallback to delimiters
	}
	if (raw.includes(',')) {
		return raw
			.split(',')
			.map((t) => t.trim().replace(/^#/, ''))
			.filter(Boolean);
	}
	if (raw.includes(' ') || raw.startsWith('#')) {
		return raw
			.split(/\s+/)
			.map((t) => t.trim().replace(/^#/, ''))
			.filter(Boolean);
	}
	return [raw.replace(/^#/, '').trim()].filter(Boolean);
};

export interface ComunityClanState {
	isCommunityEnabled: boolean;
	communityBanner: string | null;
	about: string;
	description: string;
	short_url: string;
	hashtags: string[];
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

export const createEmptyClanCommunityState = (): ComunityClanState => ({
	isCommunityEnabled: false,
	communityBanner: null,
	about: '',
	description: '',
	short_url: '',
	hashtags: []
});

export const getCommunityInfo = createAsyncThunk('comunity/getCommunityInfo', async ({ clan_id }: { clan_id: string }, thunkAPI) => {
	try {
		const rootState = thunkAPI.getState() as RootState;
		let clan: ApiClanDesc | undefined = rootState.clans?.entities?.[clan_id];

		if (!clan) {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.listClanDescs(mezon.session);
			clan = response.clandesc?.find((c) => c.clan_id === clan_id);
		}

		if (!clan) {
			return thunkAPI.rejectWithValue('Clan not found');
		}

		return {
			clan_id,
			isCommunityEnabled: clan.is_community || false,
			communityBanner: clan.community_banner || null,
			about: clan.about || '',
			description: clan.description || '',
			short_url: clan.short_url || '',
			hashtags: parseHashtags(clan.hashtags)
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
			short_url,
			hashtags
		}: {
			clan_id: string;
			enabled: boolean;
			bannerUrl: string;
			about: string;
			description: string;
			short_url: string;
			hashtags?: string[];
		},
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const hashtagsStr = hashtags ? serializeHashtags(hashtags) : undefined;
			await mezon.client.updateClanDesc(mezon.session, clan_id, {
				is_community: enabled,
				community_banner: bannerUrl,
				about,
				description,
				short_url,
				hashtags: hashtagsStr
			});
			return { clan_id, enabled, bannerUrl, about, description, short_url, hashtags: hashtags ?? [] };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunity');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateCommunityHashtags = createAsyncThunk(
	'comunity/updateCommunityHashtags',
	async ({ clan_id, hashtags }: { clan_id: string; hashtags: string[] }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const hashtagsStr = serializeHashtags(hashtags);
			await mezon.client.updateClanDesc(mezon.session, clan_id, {
				hashtags: hashtagsStr
			});
			return { clan_id, hashtags };
		} catch (error) {
			captureSentryError(error, 'comunity/updateCommunityHashtags');
			return thunkAPI.rejectWithValue(error);
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
			return thunkAPI.rejectWithValue(error);
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
			if (!state.byClanId[clanId]) state.byClanId[clanId] = createEmptyClanCommunityState();
			state.byClanId[clanId].communityBanner = banner;
		},
		setCommunityAbout: (state, action: PayloadAction<{ clanId: string; about: string; description?: string }>) => {
			const { clanId, about, description = '' } = action.payload;
			if (!state.byClanId[clanId]) state.byClanId[clanId] = createEmptyClanCommunityState();
			state.byClanId[clanId].about = about;
			state.byClanId[clanId].description = description;
		},
		setCommunityHashtags: (state, action: PayloadAction<{ clanId: string; hashtags: string[] }>) => {
			const { clanId, hashtags } = action.payload;
			if (!state.byClanId[clanId]) state.byClanId[clanId] = createEmptyClanCommunityState();
			state.byClanId[clanId].hashtags = hashtags;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(getCommunityInfo.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(getCommunityInfo.fulfilled, (state, action) => {
				const { clan_id, isCommunityEnabled, communityBanner, about, description, short_url, hashtags } = action.payload;
				state.byClanId[clan_id] = {
					isCommunityEnabled,
					communityBanner,
					about,
					description,
					short_url,
					hashtags
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
				const { clan_id, enabled, bannerUrl, about, description, short_url, hashtags } = action.payload;
				if (!state.byClanId[clan_id]) {
					state.byClanId[clan_id] = createEmptyClanCommunityState();
				}
				// Update all fields
				state.byClanId[clan_id].isCommunityEnabled = enabled;
				state.byClanId[clan_id].communityBanner = bannerUrl;
				state.byClanId[clan_id].about = about;
				state.byClanId[clan_id].description = description;
				state.byClanId[clan_id].short_url = short_url;
				state.byClanId[clan_id].hashtags = hashtags;
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
				if (!state.byClanId[clan_id]) state.byClanId[clan_id] = createEmptyClanCommunityState();
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
				if (!state.byClanId[clan_id]) state.byClanId[clan_id] = createEmptyClanCommunityState();
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
				if (!state.byClanId[clan_id]) state.byClanId[clan_id] = createEmptyClanCommunityState();
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
				if (!state.byClanId[clan_id]) state.byClanId[clan_id] = createEmptyClanCommunityState();
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
				if (!state.byClanId[clan_id]) state.byClanId[clan_id] = createEmptyClanCommunityState();
				state.byClanId[clan_id].short_url = short_url;
				state.isLoading = false;
			})
			.addCase(updateCommunityShortUrl.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(updateCommunityHashtags.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(updateCommunityHashtags.fulfilled, (state, action) => {
				const { clan_id, hashtags } = action.payload;
				if (!state.byClanId[clan_id]) state.byClanId[clan_id] = createEmptyClanCommunityState();
				state.byClanId[clan_id].hashtags = hashtags;
				state.isLoading = false;
			})
			.addCase(updateCommunityHashtags.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addMatcher(
				(action) => action.type === 'clans/update',
				(state, action: PayloadAction<{ dataUpdate: Partial<ApiClanDesc> }>) => {
					const dataUpdate = action.payload?.dataUpdate;
					if (!dataUpdate?.clan_id) return;
					const clanId = dataUpdate.clan_id;
					if (!state.byClanId[clanId]) {
						state.byClanId[clanId] = createEmptyClanCommunityState();
					}
					if (dataUpdate.about !== undefined) state.byClanId[clanId].about = dataUpdate.about;
					if (dataUpdate.description !== undefined) state.byClanId[clanId].description = dataUpdate.description;
					if (dataUpdate.is_community !== undefined) state.byClanId[clanId].isCommunityEnabled = dataUpdate.is_community;
					if (dataUpdate.community_banner !== undefined) state.byClanId[clanId].communityBanner = dataUpdate.community_banner;
					if (dataUpdate.short_url !== undefined) state.byClanId[clanId].short_url = dataUpdate.short_url;
					if (dataUpdate.hashtags !== undefined) state.byClanId[clanId].hashtags = parseHashtags(dataUpdate.hashtags);
				}
			);
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
	updateCommunityShortUrl,
	updateCommunityHashtags
};

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

export const selectComunityHashtags = createSelector(
	[(state: RootState, clanId: string) => selectComunityState(state)?.byClanId?.[clanId]?.hashtags],
	(hashtags) => hashtags ?? []
);

export const selectCommunityStateByClanId = createSelector(
	[(state: RootState, clanId: string) => selectComunityState(state)?.byClanId?.[clanId]],
	(community): ComunityClanState => community ?? createEmptyClanCommunityState()
);
