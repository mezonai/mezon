import { ALL_USERS_BY_ADD_CHANNEL, selectChannelAccessVersion, userChannelsActions, userChannelsReducer } from './AllUsersChannelByAddChannel.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({ TypeSearch: { Dm_Type: 1, Channel_Type: 2 } }));
jest.mock('../helpers', () => ({ ensureSession: jest.fn(), fetchDataWithSocketFallback: jest.fn(), getMezonCtx: jest.fn() }));

const root = (state: ReturnType<typeof userChannelsReducer>) => ({ [ALL_USERS_BY_ADD_CHANNEL]: state });

describe('channel access version', () => {
	it('starts at zero for a channel that never changed', () => {
		const state = userChannelsReducer(undefined, { type: '' });
		expect(selectChannelAccessVersion(root(state), 'c1')).toBe(0);
	});

	it('counts each access change of a channel on its own', () => {
		let state = userChannelsReducer(undefined, userChannelsActions.markAccessChanged('c1'));
		state = userChannelsReducer(state, userChannelsActions.markAccessChanged('c1'));
		state = userChannelsReducer(state, userChannelsActions.markAccessChanged('c2'));
		expect(selectChannelAccessVersion(root(state), 'c1')).toBe(2);
		expect(selectChannelAccessVersion(root(state), 'c2')).toBe(1);
		expect(selectChannelAccessVersion(root(state), 'c3')).toBe(0);
	});

	it('keeps the cached member list when access changes', () => {
		let state = userChannelsReducer(undefined, userChannelsActions.addUserChannel({ channelId: 'c1', userAdds: ['u1'] }));
		const before = state.entities['c1'];
		state = userChannelsReducer(state, userChannelsActions.markAccessChanged('c1'));
		expect(state.entities['c1']).toBe(before);
	});
});
