import { configureStore } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import { channelMetaActions, channelMetaReducer } from './channelmeta.slice';

jest.mock('@mezon/utils', () => jest.requireActual('../../../../utils/src/lib/utils/clanChannel'));
jest.mock('mezon-js', () => ({
	ChannelType: {
		CHANNEL_TYPE_CHANNEL: 1,
		CHANNEL_TYPE_GROUP: 2,
		CHANNEL_TYPE_DM: 3,
		CHANNEL_TYPE_MEZON_VOICE: 4,
		CHANNEL_TYPE_APP: 8
	},
	ChannelStreamMode: {
		STREAM_MODE_CHANNEL: 2,
		STREAM_MODE_GROUP: 3,
		STREAM_MODE_DM: 4,
		STREAM_MODE_THREAD: 6
	}
}));
jest.mock('../account/account.slice', () => ({ selectAllAccount: () => undefined }));

const createStore = () => configureStore({ reducer: { channelmeta: channelMetaReducer } });

describe('channelmeta.slice synthetic negative clan_id handling', () => {
	it('routes negative synthetic clanId updates to dmEntities and normalizes clanId to "0"', () => {
		const store = createStore();

		store.dispatch(
			channelMetaActions.updateBulkChannelMetadata({
				clanId: '-999001',
				data: [
					{
						channel_id: 'dm-1',
						clan_id: '-999001',
						type: ChannelType.CHANNEL_TYPE_DM,
						count_mess_unread: 2,
						last_sent_message: { timestamp_seconds: 100, sender_id: 'u1' },
						last_seen_message: { timestamp_seconds: 50 }
					} as any
				]
			})
		);

		expect(store.getState().channelmeta.entities['dm-1']).toBeUndefined();
		expect(store.getState().channelmeta.dmEntities.entities['dm-1']?.clanId).toBe('0');
		expect(store.getState().channelmeta.dmEntities.entities['dm-1']?.count_mess_unread).toBe(2);

		store.dispatch(
			channelMetaActions.setChannelLastSentTimestamp({
				channelId: 'dm-1',
				clanId: '-999001',
				senderId: 'u1',
				timestamp: 250
			})
		);
		expect(store.getState().channelmeta.dmEntities.entities['dm-1']?.lastSentTimestamp).toBe(250);

		store.dispatch(
			channelMetaActions.updateChannelBadgeCount({
				clanId: '-999001',
				channelId: 'dm-2',
				count: 3
			})
		);
		expect(store.getState().channelmeta.entities['dm-2']).toBeUndefined();
		expect(store.getState().channelmeta.dmEntities.entities['dm-2']?.clanId).toBe('0');
		expect(store.getState().channelmeta.dmEntities.entities['dm-2']?.count_mess_unread).toBe(3);
	});

	it('keeps real positive clanId channels in clan entities', () => {
		const store = createStore();

		store.dispatch(
			channelMetaActions.updateChannelBadgeCount({
				clanId: '1840654629384729600',
				channelId: 'ch-1',
				count: 4
			})
		);

		expect(store.getState().channelmeta.dmEntities.entities['ch-1']).toBeUndefined();
		expect(store.getState().channelmeta.entities['ch-1']?.clanId).toBe('1840654629384729600');
		expect(store.getState().channelmeta.entities['ch-1']?.count_mess_unread).toBe(4);
	});
});
