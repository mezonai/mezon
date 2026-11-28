import { captureSentryError } from '@mezon/logger';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ThunkConfigWithError } from '../errors';
import { ensureSession, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const DECORATIONS_FEATURE_KEY = 'decorations';
export const DECORATIONS_CHUNK_SIZE = 500;
export const DECORATIONS_RETRY_PAUSE_MS = 10_000;
export const DECORATIONS_CLAN_FRESHNESS_MS = 5 * 60 * 1000;

export interface DecorationsState {
	frames: Record<string, number>;
	stale: Record<string, true>;
	generation: number;
}

export const initialDecorationsState: DecorationsState = {
	frames: {},
	stale: {},
	generation: 0
};

export type DecorationSaveErrorReason = 'notPro' | 'rateLimited' | 'unsupported' | 'failed';

type DecorationsRootState = { [DECORATIONS_FEATURE_KEY]?: DecorationsState };

const inFlightIds = new Map<string, number>();
let fetchSeq = 0;
let staleEpoch = 0;
const failedUntilById = new Map<string, number>();
const inFlightClans = new Map<string, number>();
const clanFetchedAt = new Map<string, number>();
const failedUntilByClan = new Map<string, number>();
let mutationSeq = 0;
const userMutationSeq = new Map<string, number>();

const recordUserMutation = (userId: string) => {
	if (inFlightClans.size === 0 && inFlightIds.size === 0) {
		return;
	}
	mutationSeq += 1;
	userMutationSeq.set(userId, mutationSeq);
};

const releaseMutationTracking = () => {
	if (inFlightClans.size === 0 && inFlightIds.size === 0) {
		userMutationSeq.clear();
	}
};

const collectUncachedClanProIds = (rootState: RootState, clanId: string, decoState: DecorationsState): string[] => {
	const clanEntities = rootState.usersClan?.byClans?.[clanId]?.entities?.entities;
	if (!clanEntities) {
		return [];
	}
	const accountProfile = rootState.account?.userProfile as { pro_plan?: boolean; user?: { id?: string; pro_plan?: boolean } } | null | undefined;
	const ownUserId = accountProfile?.user?.id;
	const ownIsPro = Boolean(accountProfile?.pro_plan || accountProfile?.user?.pro_plan);
	const missing: string[] = [];
	for (const member of Object.values(clanEntities)) {
		const memberUser = member?.user as { id?: string; pro_plan?: boolean } | undefined;
		const memberId = memberUser?.id || member?.id;
		if (!memberId || memberId === '0') {
			continue;
		}
		const isPro = memberId === ownUserId ? ownIsPro : Boolean(memberUser?.pro_plan);
		const known = Object.prototype.hasOwnProperty.call(decoState.frames, memberId) && !decoState.stale[memberId];
		if (isPro && !known) {
			missing.push(memberId);
		}
	}
	return missing;
};

const resetTracking = () => {
	inFlightIds.clear();
	failedUntilById.clear();
	inFlightClans.clear();
	clanFetchedAt.clear();
	failedUntilByClan.clear();
	userMutationSeq.clear();
};

const mapHttpOrEnvelopeCode = (code: number): DecorationSaveErrorReason | undefined => {
	switch (code) {
		case 404:
		case 5:
			return 'unsupported';
		case 429:
		case 8:
			return 'rateLimited';
		case 412:
		case 9:
			return 'notPro';
		default:
			return undefined;
	}
};

export const classifyDecorationSaveError = (error: unknown): DecorationSaveErrorReason => {
	const errObj = error as { code?: unknown; status?: unknown; error?: { code?: unknown } } | null | undefined;
	const innerCode = errObj?.error?.code;
	if (typeof innerCode === 'number') {
		const mapped = mapHttpOrEnvelopeCode(innerCode);
		if (mapped) return mapped;
	}
	const topCode = errObj?.code;
	if (typeof topCode === 'number' && topCode !== 0) {
		const mapped = mapHttpOrEnvelopeCode(topCode);
		if (mapped) return mapped;
	}
	const status = errObj?.status;
	if (typeof status === 'number') {
		const mapped = mapHttpOrEnvelopeCode(status);
		if (mapped) return mapped;
	}
	return 'failed';
};

export const getDecorationsState = (rootState: DecorationsRootState): DecorationsState =>
	rootState[DECORATIONS_FEATURE_KEY] ?? initialDecorationsState;

export const fetchUserDecorations = createAsyncThunk<
	{ frames: Record<string, number>; generation: number; startEpoch: number; startMutationSeq: number },
	string[]
>('decorations/fetchUserDecorations', async (rawIds, thunkAPI) => {
	const decoState = getDecorationsState(thunkAPI.getState() as DecorationsRootState);
	const startGeneration = decoState.generation;
	const startEpoch = staleEpoch;
	const startMutationSeq = mutationSeq;
	const fetchToken = ++fetchSeq;
	const now = Date.now();
	const seen = new Set<string>();
	const idsToFetch: string[] = [];

	for (const id of rawIds) {
		if (!id || id === '0' || seen.has(id)) {
			continue;
		}
		seen.add(id);
		if (Object.prototype.hasOwnProperty.call(decoState.frames, id) && !decoState.stale[id]) {
			continue;
		}
		if (inFlightIds.has(id)) {
			continue;
		}
		if ((failedUntilById.get(id) ?? 0) > now) {
			continue;
		}
		idsToFetch.push(id);
	}

	if (idsToFetch.length === 0) {
		return { frames: {}, generation: startGeneration, startEpoch, startMutationSeq };
	}

	for (const id of idsToFetch) {
		inFlightIds.set(id, fetchToken);
	}

	const fetchedFrames: Record<string, number> = {};

	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		for (let offset = 0; offset < idsToFetch.length; offset += DECORATIONS_CHUNK_SIZE) {
			if (getDecorationsState(thunkAPI.getState() as DecorationsRootState).generation !== startGeneration || staleEpoch !== startEpoch) {
				break;
			}
			const chunk = idsToFetch.slice(offset, offset + DECORATIONS_CHUNK_SIZE);
			try {
				const response = await mezon.client.listUserDecorations(mezon.session, chunk);
				for (const id of chunk) {
					fetchedFrames[id] = 0;
					failedUntilById.delete(id);
				}
				for (const item of response?.decorations ?? []) {
					if (item?.user_id) {
						fetchedFrames[item.user_id] = typeof item.frame === 'number' ? item.frame : 0;
					}
				}
			} catch {
				if (getDecorationsState(thunkAPI.getState() as DecorationsRootState).generation === startGeneration && staleEpoch === startEpoch) {
					const retryAt = Date.now() + DECORATIONS_RETRY_PAUSE_MS;
					for (const id of chunk) {
						failedUntilById.set(id, retryAt);
					}
				}
			}
		}
	} catch {
		if (getDecorationsState(thunkAPI.getState() as DecorationsRootState).generation === startGeneration && staleEpoch === startEpoch) {
			const retryAt = Date.now() + DECORATIONS_RETRY_PAUSE_MS;
			for (const id of idsToFetch) {
				failedUntilById.set(id, retryAt);
			}
		}
	} finally {
		for (const id of idsToFetch) {
			if (inFlightIds.get(id) === fetchToken) {
				inFlightIds.delete(id);
			}
		}
	}

	if (staleEpoch !== startEpoch) {
		return { frames: {}, generation: startGeneration, startEpoch, startMutationSeq };
	}
	return { frames: fetchedFrames, generation: startGeneration, startEpoch, startMutationSeq };
});

export const fetchClanUserDecorations = createAsyncThunk<
	{
		clanId: string;
		frames: Record<string, number>;
		absentZeroIds: string[];
		generation: number;
		startEpoch: number;
		startMutationSeq: number;
	},
	string
>('decorations/fetchClanUserDecorations', async (clanId, thunkAPI) => {
	const decoState = getDecorationsState(thunkAPI.getState() as DecorationsRootState);
	const startGeneration = decoState.generation;
	const startEpoch = staleEpoch;
	const startMutationSeq = mutationSeq;
	const emptyResult = { clanId, frames: {}, absentZeroIds: [], generation: startGeneration, startEpoch, startMutationSeq };

	if (!clanId || clanId === '0') {
		return emptyResult;
	}

	const now = Date.now();
	const lastFetchedAt = clanFetchedAt.get(clanId);
	if (lastFetchedAt !== undefined && now >= lastFetchedAt && now - lastFetchedAt < DECORATIONS_CLAN_FRESHNESS_MS) {
		const missingProIds = collectUncachedClanProIds(thunkAPI.getState() as RootState, clanId, decoState);
		if (missingProIds.length > 0) {
			thunkAPI.dispatch(fetchUserDecorations(missingProIds));
		}
		return emptyResult;
	}
	if (inFlightClans.has(clanId)) {
		return emptyResult;
	}
	if ((failedUntilByClan.get(clanId) ?? 0) > now) {
		return emptyResult;
	}

	const fetchToken = ++fetchSeq;
	inFlightClans.set(clanId, fetchToken);

	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (getDecorationsState(thunkAPI.getState() as DecorationsRootState).generation !== startGeneration || staleEpoch !== startEpoch) {
			return emptyResult;
		}
		const response = await mezon.client.listUserDecorations(mezon.session, [], clanId);
		const rootState = thunkAPI.getState() as RootState;
		const currentDecoState = getDecorationsState(rootState as DecorationsRootState);
		if (currentDecoState.generation !== startGeneration || staleEpoch !== startEpoch) {
			return emptyResult;
		}

		clanFetchedAt.set(clanId, Date.now());
		failedUntilByClan.delete(clanId);

		const returnedFrames: Record<string, number> = {};
		for (const item of response?.decorations ?? []) {
			if (item?.user_id && item.user_id !== '0') {
				returnedFrames[item.user_id] = typeof item.frame === 'number' ? item.frame : 0;
			}
		}

		const absentZeroIds: string[] = [];
		const accountProfile = rootState.account?.userProfile as
			| { pro_plan?: boolean; user?: { id?: string; pro_plan?: boolean } }
			| null
			| undefined;
		const ownUserId = accountProfile?.user?.id;
		const ownIsPro = Boolean(accountProfile?.pro_plan || accountProfile?.user?.pro_plan);
		const clanEntities = rootState.usersClan?.byClans?.[clanId]?.entities?.entities;
		if (clanEntities) {
			for (const member of Object.values(clanEntities)) {
				const memberUser = member?.user as { id?: string; pro_plan?: boolean } | undefined;
				const memberId = memberUser?.id || member?.id;
				if (!memberId || memberId === '0') {
					continue;
				}
				if (Object.prototype.hasOwnProperty.call(returnedFrames, memberId)) {
					continue;
				}
				const isPro = memberId === ownUserId && accountProfile ? ownIsPro : Boolean(memberUser?.pro_plan);
				const hasExistingEntry = Object.prototype.hasOwnProperty.call(currentDecoState.frames, memberId);
				if (isPro || hasExistingEntry) {
					absentZeroIds.push(memberId);
				}
			}
		}

		return {
			clanId,
			frames: returnedFrames,
			absentZeroIds,
			generation: startGeneration,
			startEpoch,
			startMutationSeq
		};
	} catch {
		if (getDecorationsState(thunkAPI.getState() as DecorationsRootState).generation === startGeneration && staleEpoch === startEpoch) {
			failedUntilByClan.set(clanId, Date.now() + DECORATIONS_RETRY_PAUSE_MS);
		}
		return emptyResult;
	} finally {
		if (inFlightClans.get(clanId) === fetchToken) {
			inFlightClans.delete(clanId);
		}
	}
});

export const updateUserDecoration = createAsyncThunk<{ userId: string; frame: number; generation: number }, number, ThunkConfigWithError>(
	'decorations/updateUserDecoration',
	async (frame, thunkAPI) => {
		const startGeneration = getDecorationsState(thunkAPI.getState() as DecorationsRootState).generation;
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateUserDecoration(mezon.session, frame);
			if (!response?.user_id || response.user_id === '0') {
				return thunkAPI.rejectWithValue({ code: 404 }, { error: { toast: false } });
			}
			const ownUserId = (thunkAPI.getState() as RootState).account?.userProfile?.user?.id || '';
			const userId = response.user_id || ownUserId;
			const savedFrame = typeof response.frame === 'number' ? response.frame : frame;
			return { userId, frame: savedFrame, generation: startGeneration };
		} catch (error) {
			if (classifyDecorationSaveError(error) === 'failed') {
				captureSentryError(error, 'decorations/updateUserDecoration');
			}
			if (error && typeof (error as { json?: unknown }).json === 'function') {
				const body = await (error as { json: () => Promise<{ code?: unknown }> }).json().catch(() => null);
				const status = (error as { status?: unknown }).status;
				if (body && typeof body.code === 'number') {
					return thunkAPI.rejectWithValue(
						{ code: body.code, ...(typeof status === 'number' ? { status } : {}) },
						{ error: { toast: false } }
					);
				}
			}
			return thunkAPI.rejectWithValue(error ?? null, { error: { toast: false } });
		}
	}
);

export const decorationsSlice = createSlice({
	name: DECORATIONS_FEATURE_KEY,
	initialState: initialDecorationsState,
	reducers: {
		receiveDecorationUpdated(state, action: PayloadAction<{ userId: string; frame: number }>) {
			const { userId, frame } = action.payload;
			if (!userId || typeof frame !== 'number') {
				return;
			}
			recordUserMutation(userId);
			if (state.frames[userId] === frame && !state.stale[userId]) {
				return;
			}
			state.frames[userId] = frame;
			delete state.stale[userId];
			failedUntilById.delete(userId);
		},
		markAllStale(state) {
			failedUntilById.clear();
			inFlightIds.clear();
			failedUntilByClan.clear();
			inFlightClans.clear();
			clanFetchedAt.clear();
			staleEpoch += 1;
			const nextStale: Record<string, true> = {};
			for (const userId of Object.keys(state.frames)) {
				nextStale[userId] = true;
			}
			state.stale = nextStale;
		},
		reset(state) {
			resetTracking();
			state.frames = {};
			state.stale = {};
			state.generation += 1;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUserDecorations.fulfilled, (state, action) => {
				if (action.payload.generation !== state.generation || action.payload.startEpoch !== staleEpoch) {
					releaseMutationTracking();
					return;
				}
				const { frames, startMutationSeq } = action.payload;
				for (const [userId, frame] of Object.entries(frames)) {
					if ((userMutationSeq.get(userId) ?? 0) > startMutationSeq) {
						continue;
					}
					if (state.frames[userId] !== frame) {
						state.frames[userId] = frame;
					}
					delete state.stale[userId];
				}
				releaseMutationTracking();
			})
			.addCase(fetchClanUserDecorations.fulfilled, (state, action) => {
				if (action.payload.generation !== state.generation || action.payload.startEpoch !== staleEpoch) {
					releaseMutationTracking();
					return;
				}
				const { frames, absentZeroIds, startMutationSeq } = action.payload;
				for (const [userId, frame] of Object.entries(frames)) {
					if ((userMutationSeq.get(userId) ?? 0) > startMutationSeq) {
						continue;
					}
					if (state.frames[userId] !== frame) {
						state.frames[userId] = frame;
					}
					delete state.stale[userId];
					failedUntilById.delete(userId);
				}
				for (const userId of absentZeroIds) {
					if ((userMutationSeq.get(userId) ?? 0) > startMutationSeq) {
						continue;
					}
					if (state.frames[userId] !== 0) {
						state.frames[userId] = 0;
					}
					delete state.stale[userId];
					failedUntilById.delete(userId);
				}
				releaseMutationTracking();
			})
			.addCase(updateUserDecoration.fulfilled, (state, action) => {
				if (action.payload.generation !== state.generation) {
					return;
				}
				const { userId, frame } = action.payload;
				if (!userId) {
					return;
				}
				recordUserMutation(userId);
				if (state.frames[userId] !== frame) {
					state.frames[userId] = frame;
				}
				delete state.stale[userId];
				failedUntilById.delete(userId);
			})
			.addCase('auth/setLogout', (state) => {
				resetTracking();
				state.frames = {};
				state.stale = {};
				state.generation += 1;
			})
			.addCase('auth/resetSession', (state) => {
				resetTracking();
				state.frames = {};
				state.stale = {};
				state.generation += 1;
			});
	}
});

export const decorationsReducer = decorationsSlice.reducer;

export const decorationsActions = {
	...decorationsSlice.actions,
	fetchUserDecorations,
	fetchClanUserDecorations,
	updateUserDecoration
};

export const selectUserDecorationFrame = (rootState: DecorationsRootState, userId?: string): number | undefined =>
	userId ? rootState[DECORATIONS_FEATURE_KEY]?.frames[userId] : undefined;

export const collectShownDecorationUserIds = (state: RootState): string[] => {
	const ids = new Set<string>();
	const accountProfile = state.account?.userProfile as { pro_plan?: boolean; user?: { id?: string; pro_plan?: boolean } } | null | undefined;
	const ownUserId = accountProfile?.user?.id;
	if (ownUserId && (accountProfile?.pro_plan || accountProfile?.user?.pro_plan)) {
		ids.add(ownUserId);
	}

	const currentDmId = state.direct?.currentDirectMessageId;
	if (currentDmId) {
		const groupUserIds = state.allUsersByAddChannel?.entities?.[currentDmId]?.user_ids;
		if (groupUserIds) {
			for (const id of groupUserIds) {
				if (id) ids.add(id);
			}
		}
		const dmUserIds = state.direct?.entities?.[currentDmId]?.user_ids;
		if (dmUserIds) {
			for (const id of dmUserIds) {
				if (id) ids.add(id);
			}
		}
	}

	const currentClanId = state.clans?.currentClanId;
	if (currentClanId && currentClanId !== '0') {
		const clanEntities = state.usersClan?.byClans?.[currentClanId]?.entities?.entities;
		if (clanEntities) {
			for (const [entityKey, member] of Object.entries(clanEntities)) {
				const memberUser = member?.user as { id?: string } | undefined;
				const memberId = memberUser?.id || member?.id || entityKey;
				if (memberId) {
					ids.delete(memberId);
				}
				if (entityKey) {
					ids.delete(entityKey);
				}
			}
		}
	}

	return Array.from(ids);
};
