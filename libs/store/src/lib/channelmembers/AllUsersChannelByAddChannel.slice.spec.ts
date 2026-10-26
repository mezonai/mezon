import {
	ALL_USERS_BY_ADD_CHANNEL,
	fetchSearchCtrlK,
	selectChannelAccessVersion,
	userChannelsActions,
	userChannelsReducer
} from './AllUsersChannelByAddChannel.slice';

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

	it('maps avatar_url to avatarUser when avatar_url exists', () => {
		const state = userChannelsReducer(
			undefined,
			fetchSearchCtrlK.fulfilled(
				{
					users: [
						{
							id: 'u1',
							display_name: 'User One',
							username: 'userone',
							avatar_url: 'https://cdn.example.com/avatar.png',
							list_nick_names: []
						}
					]
				},
				'request-id',
				undefined
			)
		);

		const result = state.listSearch.find((item) => item.id === 'u1');

		expect(result?.avatarUser).toBe('https://cdn.example.com/avatar.png');
	});
});

describe('members added before the listing is fetched again', () => {
	const listing = () =>
		userChannelsReducer(
			undefined,
			userChannelsActions.addUserChannel({
				channelId: 'c1',
				userAdds: ['u1'],
				profiles: { u1: { username: 'one', display_name: 'One', avatar: 'a1' } }
			})
		);

	it('keeps the identity of an added member at its index', () => {
		const state = userChannelsReducer(
			listing(),
			userChannelsActions.addUserChannel({
				channelId: 'c1',
				userAdds: ['u2'],
				profiles: { u2: { username: 'giang', display_name: 'Chau Giang', avatar: 'a2' } }
			})
		);
		const entity = state.entities['c1'];
		expect(entity?.user_ids).toEqual(['u1', 'u2']);
		expect(entity?.usernames).toEqual(['one', 'giang']);
		expect(entity?.display_names).toEqual(['One', 'Chau Giang']);
		expect(entity?.avatars).toEqual(['a1', 'a2']);
	});

	it('pads the gap left by a member added without identity', () => {
		let state = userChannelsReducer(listing(), userChannelsActions.addUserChannel({ channelId: 'c1', userAdds: ['u2'] }));
		state = userChannelsReducer(
			state,
			userChannelsActions.addUserChannel({ channelId: 'c1', userAdds: ['u3'], profiles: { u3: { username: 'three' } } })
		);
		const entity = state.entities['c1'];
		expect(entity?.user_ids).toEqual(['u1', 'u2', 'u3']);
		expect(entity?.usernames).toEqual(['one', '', 'three']);
		expect(entity?.display_names).toEqual(['One', '', '']);
	});

	it('names a member the socket event appended before the add returned', () => {
		let state = userChannelsReducer(listing(), userChannelsActions.addUserChannel({ channelId: 'c1', userAdds: ['u2'] }));
		state = userChannelsReducer(
			state,
			userChannelsActions.addUserChannel({
				channelId: 'c1',
				userAdds: ['u2'],
				profiles: { u2: { username: 'giang', display_name: 'Chau Giang', avatar: 'a2' } }
			})
		);
		const entity = state.entities['c1'];
		expect(entity?.user_ids).toEqual(['u1', 'u2']);
		expect(entity?.usernames).toEqual(['one', 'giang']);
		expect(entity?.display_names).toEqual(['One', 'Chau Giang']);
	});

	it('keeps a name the listing already has', () => {
		const state = userChannelsReducer(
			listing(),
			userChannelsActions.addUserChannel({ channelId: 'c1', userAdds: ['u1'], profiles: { u1: { username: 'other' } } })
		);
		expect(state.entities['c1']?.usernames).toEqual(['one']);
	});

	it('leaves the identity columns alone when no profile comes with the add', () => {
		const before = listing();
		const state = userChannelsReducer(before, userChannelsActions.addUserChannel({ channelId: 'c1', userAdds: ['u2'] }));
		expect(state.entities['c1']?.user_ids).toEqual(['u1', 'u2']);
		expect(state.entities['c1']?.usernames).toEqual(['one']);
	});
});
