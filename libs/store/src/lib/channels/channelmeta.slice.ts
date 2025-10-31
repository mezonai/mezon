import type { LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { selectAllAccount } from '../account/account.slice';
export const CHANNELMETA_FEATURE_KEY = 'channelmeta';

export const enableMute = 0;

export interface ChannelMetaEntity {
	id: string; // Primary ID
	lastSeenTimestamp: number;
	lastSentTimestamp: number;
	clanId: string;
	isMute: boolean;
	senderId: string;
	lastSeenMessageId?: string;
}

export interface ChannelMetaState extends EntityState<ChannelMetaEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	lastSentChannelId?: string;
}

const channelMetaAdapter = createEntityAdapter<ChannelMetaEntity>();

export const initialChannelMetaState: ChannelMetaState = channelMetaAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const channelMetaSlice = createSlice({
	name: CHANNELMETA_FEATURE_KEY,
	initialState: initialChannelMetaState,
	reducers: {
		add: channelMetaAdapter.addOne,
		setChannelLastSentTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number; senderId: string }>) => {
			const channel = state?.entities[action.payload.channelId];
			if (channel) {
				channel.lastSentTimestamp = Math.floor(action.payload.timestamp);
				state.lastSentChannelId = channel.id;
				channel.senderId = action.payload.senderId;
			}
		},
		setChannelLastSeenTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number; messageId?: string }>) => {
			const { channelId, timestamp, messageId } = action.payload;
			const channel = state?.entities[channelId];
			if (channel) {
				channelMetaAdapter.updateOne(state, {
					id: channelId,
					changes: {
						lastSeenTimestamp: Math.floor(timestamp),
						...(messageId && { lastSeenMessageId: messageId })
					}
				});
			}
		},
		setChannelsLastSeenTimestamp: (state, action: PayloadAction<Array<{ channelId: string; messageId?: string }>>) => {
			const timestamp = Date.now() / 1000;
			const updates = action.payload.map(({ channelId, messageId }) => ({
				id: channelId,
				changes: {
					lastSeenTimestamp: Math.floor(timestamp),
					...(messageId && { lastSeenMessageId: messageId })
				}
			}));
			channelMetaAdapter.updateMany(state, updates);
		},
		updateBulkChannelMetadata: (state, action: PayloadAction<ChannelMetaEntity[]>) => {
			channelMetaAdapter.upsertMany(state, action.payload);
		}
	}
});

/*
 * Export reducer for store configuration.
 */
export const channelMetaReducer = channelMetaSlice.reducer;

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
 *   dispatch(channelsActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const channelMetaActions = {
	...channelMetaSlice.actions
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
import { channel } from 'process';
import { mess } from '@mezon/store';
import { remove } from '@mezon/mobile-components';
 *
 * // ...
 *
 * const entities = useSelector(selectAllChannels);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectEntities } = channelMetaAdapter.getSelectors();

export const getChannelMetaState = (rootState: { [CHANNELMETA_FEATURE_KEY]: ChannelMetaState }): ChannelMetaState =>
	rootState[CHANNELMETA_FEATURE_KEY];

export const selectChannelMetaEntities = createSelector(getChannelMetaState, selectEntities);

export const selectChannelMetaById = createSelector([selectChannelMetaEntities, (state, channelId) => channelId], (entities, channelId) => {
	return entities[channelId];
});

export const selectIsUnreadChannelById = createSelector(
	[getChannelMetaState, selectChannelMetaEntities, (state, channelId) => channelId],
	(state, settings, channelId) => {
		const channel = state?.entities[channelId];
		return channel?.lastSeenTimestamp < channel?.lastSentTimestamp;
	}
);

export const selectLastSeenMessageId = createSelector([selectChannelMetaEntities, (state, channelId) => channelId], (settings, channelId) => {
	const channel = settings?.[channelId];
	return channel?.lastSeenMessageId;
});

export const selectAnyUnreadChannel = createSelector([getChannelMetaState, selectChannelMetaEntities, selectAllAccount], (state, settings, user) => {
	if (state.lastSentChannelId && settings?.[state.lastSentChannelId]?.isMute !== true) {
		const lastSentChannel = state?.entities?.[state.lastSentChannelId];
		if (
			lastSentChannel?.lastSeenTimestamp &&
			lastSentChannel?.lastSeenTimestamp < lastSentChannel?.lastSentTimestamp &&
			lastSentChannel.senderId !== user?.user?.id
		) {
			return true;
		}
	}

	for (let index = 0; index < state?.ids?.length; index++) {
		const channel = state?.entities?.[state?.ids[index]];
		if (settings?.[channel?.id]?.isMute === true) continue;
		if (channel?.lastSeenTimestamp && channel?.lastSeenTimestamp < channel?.lastSentTimestamp && channel.senderId !== user?.user?.id) {
			return true;
		}
	}
	return false;
});

export const selectIsUnreadThreadInChannel = createSelector(
	[getChannelMetaState, selectChannelMetaEntities, (state, listThreadIds: string[]) => listThreadIds],
	(state, channelEntites, listThreadIds) => {
		for (let index = 0; index < listThreadIds.length; index++) {
			const channel = state?.entities?.[listThreadIds[index]];
			if (!channel) continue;
			if (channelEntites?.[channel?.id]?.isMute === true) continue;
			if (channel?.lastSeenTimestamp && channel?.lastSeenTimestamp < channel?.lastSentTimestamp) {
				return true;
			}
		}
		return false;
	}
);
