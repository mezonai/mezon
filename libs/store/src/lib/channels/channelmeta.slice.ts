import type { LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import type { ApiChannelDescription, ApiChannelMessageHeader, ChannelMessage } from 'mezon-js/api';
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
	count_mess_unread?: number;
	last_sent_message?: ApiChannelMessageHeader;
}

function extractChannelMeta(channel: ApiChannelDescription): ChannelMetaEntity {
	return {
		id: channel.channel_id || '0',
		lastSeenTimestamp: Number(channel.last_seen_message?.timestamp_seconds) ?? 0,
		lastSentTimestamp: Number(channel.last_sent_message?.timestamp_seconds),
		clanId: channel.clan_id ?? '0',
		isMute: channel.is_mute ?? false,
		senderId: channel.last_sent_message?.sender_id ?? '0',
		lastSeenMessageId: channel.last_seen_message?.id,
		count_mess_unread: channel?.count_mess_unread ?? 0,
		last_sent_message: channel?.last_sent_message
	};
}

const mapMessageToConversation = (message: ChannelMessage): ApiChannelMessageHeader => {
	return {
		...message,
		timestamp_seconds: message?.create_time_seconds
	};
};

export interface ChannelMetaState extends EntityState<ChannelMetaEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	lastSentChannelId?: string;
	dmEntities: EntityState<ChannelMetaEntity, string>;
}

const channelMetaAdapter = createEntityAdapter<ChannelMetaEntity>();
const dmMetaAdapter = createEntityAdapter<ChannelMetaEntity>({
	sortComparer: (a, b) => (b.lastSentTimestamp || 0) - (a.lastSentTimestamp || 0)
});

export const initialChannelMetaState: ChannelMetaState = channelMetaAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	dmEntities: dmMetaAdapter.getInitialState({})
});

export const channelMetaSlice = createSlice({
	name: CHANNELMETA_FEATURE_KEY,
	initialState: initialChannelMetaState,
	reducers: {
		add: channelMetaAdapter.addOne,
		setChannelLastSentTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number; senderId: string; clanId: string }>) => {
			if (action.payload.clanId === '0') {
				dmMetaAdapter.updateOne(state.dmEntities, {
					id: action.payload.channelId,
					changes: {
						lastSentTimestamp: Math.floor(action.payload.timestamp)
					}
				});
				return;
			}
			channelMetaAdapter.updateOne(state, {
				id: action.payload.channelId,
				changes: {
					lastSentTimestamp: Math.floor(action.payload.timestamp)
				}
			});
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
		updateBulkChannelMetadata: (state, action: PayloadAction<{ data: ChannelMetaEntity[]; clanId: string }>) => {
			const meta: ChannelMetaEntity[] = [];
			const data = action?.payload?.data as ApiChannelDescription[];

			for (const ch of data) {
				if (ch.type !== ChannelType.CHANNEL_TYPE_APP && ch.type !== ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
					meta.push(extractChannelMeta(ch));
				}
			}
			if (action?.payload?.clanId === '0') {
				dmMetaAdapter.upsertMany(state.dmEntities, meta);
				return;
			}
			channelMetaAdapter.upsertMany(state, meta);
		},
		updateChannelBadgeCount: (state, action: PayloadAction<{ clanId: string; channelId: string; count: number; isReset?: boolean }>) => {
			const { clanId, channelId, count, isReset = false } = action.payload;
			const isDM = clanId === '0';
			const adapter = isDM ? dmMetaAdapter : channelMetaAdapter;
			const entitiesState = isDM ? state.dmEntities : state;
			const entity = entitiesState.entities[channelId];

			if (!entity) {
				const initialCount = isReset ? 0 : Math.max(0, count);
				if (initialCount <= 0) return;

				adapter.addOne(entitiesState, {
					id: channelId,
					clanId,
					isMute: false,
					lastSeenTimestamp: 0,
					lastSentTimestamp: Date.now(),
					senderId: '0',
					count_mess_unread: initialCount
				});
				return;
			}
			const newCountMessUnread = isReset ? 0 : (entity.count_mess_unread ?? 0) + count;
			const finalCount = Math.max(0, newCountMessUnread);
			if ((entity.count_mess_unread || 0) === finalCount) return;
			adapter.updateOne(entitiesState, {
				id: channelId,
				changes: {
					count_mess_unread: finalCount
				}
			});
		},
		resetChannelsCount: (
			state,
			action: PayloadAction<{
				channelIds: string[];
			}>
		) => {
			const { channelIds } = action.payload;
			const clanChannels = state.entities;

			if (!clanChannels) return;

			const updates = channelIds.reduce<Array<{ id: string; changes: { count_mess_unread: number } }>>((acc, channelId) => {
				const entity = clanChannels[channelId];
				if (!entity || entity.count_mess_unread === 0) return acc;
				acc.push({
					id: channelId,
					changes: {
						count_mess_unread: 0
					}
				});
				return acc;
			}, []);
			if (updates.length > 0) {
				channelMetaAdapter.updateMany(state, updates);
			}
		},
		setDirectLastSeenTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number; messageId?: string }>) => {
			const { channelId, timestamp, messageId } = action.payload;
			const lastSeenMessage = Math.floor(timestamp);

			dmMetaAdapter.updateOne(state.dmEntities, {
				id: channelId,
				changes: {
					lastSeenTimestamp: lastSeenMessage,
					count_mess_unread: 0,
					lastSeenMessageId: messageId
				}
			});
		},
		setDirectLastSentTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number }>) => {
			const { channelId, timestamp } = action.payload;
			const lastSentMessage = Math.floor(timestamp);
			dmMetaAdapter.updateOne(state.dmEntities, {
				id: channelId,
				changes: {
					lastSentTimestamp: lastSentMessage
				}
			});
		},
		updateDmLastSentMessage: (state, action: PayloadAction<{ channelId: string; message: ChannelMessage }>) => {
			const { channelId, message } = action.payload;
			const updatedMessage = mapMessageToConversation(message);

			dmMetaAdapter.updateOne(state.dmEntities, {
				id: channelId,
				changes: {
					last_sent_message: updatedMessage
				}
			});
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
const { selectEntities, selectById } = channelMetaAdapter.getSelectors();

const {
	selectAll: selectAllDmMetadata,
	selectIds: selectAllDmMetadataIds,
	selectEntities: selectAllDmMetadataEntities
} = dmMetaAdapter.getSelectors();

export const getChannelMetaState = (rootState: { [CHANNELMETA_FEATURE_KEY]: ChannelMetaState }): ChannelMetaState =>
	rootState[CHANNELMETA_FEATURE_KEY];

export const getDmMetadataState = createSelector(getChannelMetaState, (state) => state?.dmEntities);

export const selectChannelMetaEntities = createSelector(getChannelMetaState, selectEntities);

export const selectChannelMetaById = createSelector([selectChannelMetaEntities, (state, channelId) => channelId], (entities, channelId) => {
	return entities[channelId];
});

export const selectIsUnreadChannelById = createSelector(
	[getChannelMetaState, selectChannelMetaEntities, (state, channelId) => channelId],
	(state, settings, channelId) => {
		const channel = state?.entities[channelId];
		return channel?.lastSeenTimestamp < channel?.lastSentTimestamp || !!channel?.count_mess_unread;
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

export const selectChannelBadgeById = createSelector(
	[getChannelMetaState, (state, channelId: string) => channelId],
	(state, channelId) => selectById(state, channelId)?.count_mess_unread || 0
);

export const selectDmSort = createSelector([getChannelMetaState], (state) => selectAllDmMetadataIds(state.dmEntities) || []);
export const selectAllDmSort = createSelector([getChannelMetaState], (state) => selectAllDmMetadata(state.dmEntities) || []);
export const selectDirectsUnreadlist = createSelector(selectAllDmSort, (state) => {
	return state.filter((item) => {
		return !!item?.count_mess_unread && item?.isMute !== true;
	});
});

export const selectTotalUnreadDM = createSelector(selectDirectsUnreadlist, (listUnreadDM) => {
	return listUnreadDM.reduce((total, count) => total + (count?.count_mess_unread ?? 0), 0);
});

export const selectIsUnreadDMById = createSelector([getDmMetadataState, (_state, channelId: string) => channelId], (dmState, channelId) => {
	const channel = dmState?.entities?.[channelId];

	if (!channel) {
		return false;
	}

	const lastSeen = channel.lastSeenTimestamp ?? 0;
	const lastSent = channel.lastSentTimestamp ?? 0;

	return lastSent > lastSeen;
});

export const selectDmLastSentMessage = createSelector([getDmMetadataState, (_state, channelId: string) => channelId], (dmState, channelId) => {
	return dmState?.entities?.[channelId]?.last_sent_message;
});
