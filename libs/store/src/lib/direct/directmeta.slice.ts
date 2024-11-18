import { ActiveDm, IChannel, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelMessage } from 'mezon-js';
import { ApiChannelMessageHeader } from 'mezon-js/api.gen';
import { MessagesEntity } from '../messages/messages.slice';
import { DirectEntity } from './direct.slice';

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
		lastSeenTimestamp: isNaN(lastSeenTimestamp) ? lastSentTimestamp : lastSeenTimestamp,
		lastSentTimestamp: lastSentTimestamp,
		count_mess_unread: Number(channel.count_mess_unread || 0),
		active: channel.active,
		channel_label: channel.channel_label,
		is_mute: channel.is_mute
	};
}

export const directMetaSlice = createSlice({
	name: DIRECT_META_FEATURE_KEY,
	initialState: dmMetaAdapter.getInitialState(),
	reducers: {
		add: directMetaAdapter.addOne,
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
		setCountMessUnread: (state, action: PayloadAction<{ channelId: string; isMention: boolean }>) => {
			const { channelId, isMention } = action.payload;
			const entity = state.entities[channelId];
			if (entity?.is_mute !== true || isMention === true) {
				directMetaAdapter.updateOne(state, {
					id: channelId,
					changes: {
						count_mess_unread: (entity?.count_mess_unread || 0) + 1
					}
				});
			}
		},
		setDirectLastSeenTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number }>) => {
			directMetaAdapter.updateOne(state, {
				id: action.payload.channelId,
				changes: {
					count_mess_unread: 0,
					lastSeenTimestamp: action.payload.timestamp
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
					}
				}
			});
		},
		setDirectMetaEntities: (state, action: PayloadAction<IChannel[]>) => {
			const channels = action.payload;
			if (channels) {
				const meta = channels.map((ch) => extractDMMeta(ch));
				dmMetaAdapter.upsertMany(state, meta);
			}
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
		return item?.count_mess_unread;
	});
});

export const selectIsUnreadDMById = createSelector([getDirectMetaState, (state, channelId) => channelId], (state, channelId) => {
	const channel = state.entities[channelId];
	return channel?.lastSeenTimestamp < channel?.lastSentTimestamp;
});

export const selectTotalUnreadDM = createSelector(selectDirectsUnreadlist, (listUnreadDM) => {
	return listUnreadDM.reduce((total, count) => total + (count?.count_mess_unread ?? 0), 0);
});
