import { captureSentryError } from '@mezon/logger';
import type { IChannel } from '@mezon/utils';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { clansActions } from '../clans/clans.slice';
import type { RootState } from '../store';
import { CHANNELS_FEATURE_KEY } from './channels.slice';

export const updateClanBadgeRender = createAsyncThunk(
	'channelListBadge/updateClanBadge',
	async ({ channelId, clanId }: { channelId: string; clanId: string }, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as RootState;
			const entity = state[CHANNELS_FEATURE_KEY].byClans[clanId]?.entities.entities[channelId] as IChannel | undefined;
			const unread = entity?.count_mess_unread ?? 0;
			thunkAPI.dispatch(clansActions.updateClanBadgeCount({ clanId, count: unread * -1 }));
		} catch (error) {
			captureSentryError(error, 'channelListBadge/updateClanBadge');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const bulkUpdateClanBadgeRender = createAsyncThunk(
	'channelListBadge/bulkUpdateClanBadge',
	async ({ channelIds, clanId }: { channelIds: string[]; clanId: string }, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as RootState;
			const entities = state[CHANNELS_FEATURE_KEY].byClans[clanId]?.entities.entities ?? {};
			const totalBadgeCount = channelIds.reduce((total, channelId) => {
				const channel = entities[channelId] as IChannel | undefined;
				return total + (channel?.count_mess_unread ?? 0);
			}, 0);
			if (totalBadgeCount > 0) {
				thunkAPI.dispatch(clansActions.updateClanBadgeCount({ clanId, count: totalBadgeCount * -1 }));
			}
		} catch (error) {
			captureSentryError(error, 'channelListBadge/bulkUpdateClanBadge');
			return thunkAPI.rejectWithValue(error);
		}
	}
);
