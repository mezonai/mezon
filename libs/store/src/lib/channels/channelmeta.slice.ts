import { LoadingStatus } from '@mezon/utils';
import { createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { selectEntiteschannelCategorySetting } from '../notificationSetting/notificationSettingCategory.slice';
import { ChannelsEntity } from './channels.slice';

export const CHANNELMETA_FEATURE_KEY = 'channelmeta';

export const enableMute = 0;

export interface ChannelMetaEntity {
	id: string; // Primary ID
	lastSeenTimestamp: number;
	lastSentTimestamp: number;
	lastSeenPinMessage: string;
	clanId: string;
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
		removeAll: channelMetaAdapter.removeAll,
		remove: channelMetaAdapter.removeOne,
		update: channelMetaAdapter.updateOne,
		setChannelLastSentTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number }>) => {
			const channel = state?.entities[action.payload.channelId];
			if (channel) {
				channel.lastSentTimestamp = action.payload.timestamp;
				state.lastSentChannelId = channel.id;
			}
		},
		setChannelLastSeenTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number }>) => {
			const channel = state?.entities[action.payload.channelId];
			if (channel) {
				channel.lastSeenTimestamp = action.payload.timestamp;
			}
		},
		setChannelLastSeenPinMessage: (state, action: PayloadAction<{ channelId: string; lastSeenPinMess: string }>) => {
			const channel = state?.entities[action.payload.channelId];
			if (channel) {
				channel.lastSeenPinMessage = action.payload.lastSeenPinMess;
			}
		},
		updateBulkChannelMetadata: (state, action: PayloadAction<ChannelMetaEntity[]>) => {
			state = channelMetaAdapter.upsertMany(state, action.payload);
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
const { selectAll, selectEntities } = channelMetaAdapter.getSelectors();

export const getChannelMetaState = (rootState: { [CHANNELMETA_FEATURE_KEY]: ChannelMetaState }): ChannelMetaState =>
	rootState[CHANNELMETA_FEATURE_KEY];

export const selectAllChannelMeta = createSelector(getChannelMetaState, selectAll);

export const selectChannelMetaEntities = createSelector(getChannelMetaState, selectEntities);

export const selectLastSeenPinMessageChannelById = (channelId: string) =>
	createSelector(getChannelMetaState, (state) => {
		const channel = state?.entities[channelId];
		return channel?.lastSeenPinMessage || '';
	});

export const selectIsUnreadChannelById = createSelector(
	[getChannelMetaState, selectEntiteschannelCategorySetting, (state, channelId) => channelId],
	(state, settings, channelId) => {
		const channel = state?.entities[channelId];
		const inactiveMuteSetting = settings?.[channelId]?.action !== enableMute;
		// unread last seen timestamp is less than last sent timestamp
		return inactiveMuteSetting && channel?.lastSeenTimestamp < channel?.lastSentTimestamp;
	}
);

export const selectLastChannelTimestamp = (channelId: string) =>
	createSelector(getChannelMetaState, (state) => {
		const channel = state?.entities?.[channelId];
		return channel?.lastSeenTimestamp || 0;
	});

export const selectUnreadChannels = createSelector([getChannelMetaState, selectEntiteschannelCategorySetting], (state, settings) => {
	const unreadChannels: ChannelsEntity[] = [];

	if (state.lastSentChannelId && settings?.[state.lastSentChannelId]?.action !== enableMute) {
		const lastSentChannel = state?.entities?.[state.lastSentChannelId];
		if (lastSentChannel?.lastSeenTimestamp && lastSentChannel?.lastSeenTimestamp < lastSentChannel?.lastSentTimestamp) {
			unreadChannels.push(lastSentChannel);
		}
	}

	for (let index = 0; index < state?.ids?.length; index++) {
		const channelId = state.ids[index];
		const channel = state.entities[channelId];

		if (settings?.[channelId]?.action === enableMute) continue; // Skip muted channels
		if (channel?.lastSeenTimestamp && channel?.lastSeenTimestamp < channel?.lastSentTimestamp) {
			unreadChannels.push(channel);
		}
	}

	return unreadChannels;
});

export const selectAllChannelLastSeenTimestampByClanId = (clanId: string) =>
	createSelector(selectAllChannelMeta, (channelMetas) =>
		channelMetas.filter((channelMeta) => channelMeta.lastSeenTimestamp && channelMeta.clanId === clanId)
	);
