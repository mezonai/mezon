import type { IChannel, LoadingStatus } from '@mezon/utils';
import { ActiveDm } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelMessage } from 'mezon-js';
import type { ApiChannelMessageHeader } from 'mezon-js/api.gen';
import type { MessagesEntity } from '../messages/messages.slice';
import type { DirectEntity } from './direct.slice';

export const DIRECT_META_FEATURE_KEY = 'directmeta';

export interface DMMetaEntity {
	id: string;
	channel_label?: string;
	lastSeenTimestamp: number;
	lastSentTimestamp: number;
	count_mess_unread: number;
	last_sent_message?: ApiChannelMessageHeader;
	last_seen_message?: ApiChannelMessageHeader;
	active?: number;
	is_mute?: boolean;
	lastSeenMessageId?: string;
}

const dmMetaAdapter = createEntityAdapter<DMMetaEntity>();

export interface DirectMetaState extends EntityState<DMMetaEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
}
export const directMetaAdapter = createEntityAdapter<DMMetaEntity>();

function extractDMMeta(channel: DirectEntity): DMMetaEntity {
	const lastSeenTimestamp = Number(channel?.last_seen_message?.timestamp_seconds);
	const lastSentTimestamp = Number(channel?.last_sent_message?.timestamp_seconds);

	return {
		id: channel.id,
		lastSeenTimestamp: isNaN(lastSeenTimestamp) ? lastSentTimestamp - 1 : lastSeenTimestamp,
		lastSentTimestamp,
		last_sent_message: channel?.last_sent_message,
		count_mess_unread: Number(channel.count_mess_unread || 0),
		active: channel.active,
		channel_label: channel.channel_label,
		is_mute: channel.is_mute,
		lastSeenMessageId: channel?.last_seen_message?.id
	};
}

export const directMetaSlice = createSlice({
	name: DIRECT_META_FEATURE_KEY,
	initialState: dmMetaAdapter.getInitialState(),
	reducers: {
		add: directMetaAdapter.addOne,
		upsertOne: directMetaAdapter.upsertOne,
		removeAll: directMetaAdapter.removeAll,
		remove: directMetaAdapter.removeOne,
		update: directMetaAdapter.updateOne,
		setDirectLastSentTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number }>) => {
			const channel = state.entities[action.payload.channelId];
			if (channel) {
				channel.lastSentTimestamp = action.payload.timestamp;
			}
		},
		updateDMSocket: (state, action: PayloadAction<ChannelMessage>) => {
			const payload = action.payload;
			const timestamp = Date.now() / 1000;
			const dmChannel = state.entities[payload.channel_id];

			directMetaAdapter.updateOne(state, {
				id: payload.channel_id,
				changes: {
					last_sent_message: {
						content: payload.content,
						id: payload.id,
						sender_id: payload.sender_id,
						timestamp_seconds: timestamp
					}
				}
			});

			if (payload.clan_id === '0' && dmChannel?.active !== ActiveDm.OPEN_DM) {
				directMetaAdapter.updateOne(state, {
					id: payload.channel_id,
					changes: {
						active: ActiveDm.OPEN_DM
					}
				});
			}
		},

		setCountMessUnread: (state, action: PayloadAction<{ channelId: string; isMention?: boolean; count?: number; isReset?: boolean }>) => {
			const { channelId, isMention = false, count = 1, isReset = false } = action.payload;
			const entity = state.entities[channelId];
			if (entity?.is_mute !== true || isMention === true) {
				const newCountMessUnread = isReset ? 0 : (entity?.count_mess_unread || 0) + count;
				const finalCount = Math.max(0, newCountMessUnread);
				directMetaAdapter.updateOne(state, {
					id: channelId,
					changes: {
						count_mess_unread: finalCount
					}
				});
			}
		},

		setDirectLastSeenTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number; messageId?: string }>) => {
			const { channelId, timestamp, messageId } = action.payload;
			directMetaAdapter.updateOne(state, {
				id: channelId,
				changes: {
					count_mess_unread: 0,
					lastSeenTimestamp: timestamp,
					...(messageId && { lastSeenMessageId: messageId })
				}
			});
		},
		updateLastSeenTime: (state, action: PayloadAction<MessagesEntity>) => {
			const payload = action.payload;
			const timestamp = Date.now() / 1000;
			directMetaAdapter.updateOne(state, {
				id: payload.channel_id,
				changes: {
					last_seen_message: {
						content: payload.content,
						id: payload.id,
						sender_id: payload.sender_id,
						timestamp_seconds: timestamp
					},
					count_mess_unread: 0,
					lastSeenMessageId: payload.id
				}
			});
		},
		setDirectMetaEntities: (state, action: PayloadAction<IChannel[]>) => {
			const channels = action.payload;
			if (channels) {
				const meta = channels.map((ch) => extractDMMeta(ch));
				dmMetaAdapter.upsertMany(state, meta);
			}
		},
		updateMuteDM: (state, action: PayloadAction<{ channelId: string; isMute: boolean }>) => {
			const payload = action.payload;
			directMetaAdapter.updateOne(state, {
				id: payload.channelId,
				changes: {
					is_mute: payload.isMute
				}
			});
		}
	}
});

export const directMetaReducer = directMetaSlice.reducer;

export const directMetaActions = {
	...directMetaSlice.actions
};
const { selectAll, selectEntities } = directMetaAdapter.getSelectors();

export const getDirectMetaState = (rootState: { [DIRECT_META_FEATURE_KEY]: DirectMetaState }): DirectMetaState => rootState[DIRECT_META_FEATURE_KEY];

export const selectEntitiesDirectMeta = createSelector(getDirectMetaState, selectEntities);

export const selectAllDMMeta = createSelector(getDirectMetaState, (state) => selectAll(state));

export const selectDirectsUnreadlist = createSelector(selectAllDMMeta, (state) => {
	return state.filter((item) => {
		return item?.count_mess_unread && item?.is_mute !== true;
	});
});

export const selectIsUnreadDMById = createSelector([getDirectMetaState, (state, channelId) => channelId], (state, channelId) => {
	const channel = state?.entities?.[channelId];
	return channel?.lastSeenTimestamp < channel?.lastSentTimestamp;
});

export const selectTotalUnreadDM = createSelector(selectDirectsUnreadlist, (listUnreadDM) => {
	return listUnreadDM.reduce((total, count) => total + (count?.count_mess_unread ?? 0), 0);
});

export const selectLastSeenMessageIdDM = createSelector([selectEntitiesDirectMeta, (state, dmId) => dmId], (entities, channelId) => {
	const dm = entities?.[channelId];
	return dm?.lastSeenMessageId;
});
