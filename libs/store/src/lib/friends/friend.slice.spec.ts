import { configureStore } from '@reduxjs/toolkit';
import { EStateFriend, FRIEND_FEATURE_KEY, friendsActions, friendsReducer, selectAllFriends } from './friend.slice';

jest.mock('@mezon/translations', () => ({ t: (key: string) => key }), { virtual: true });
jest.mock('@mezon/utils', () => ({ EUserStatus: { ONLINE: 'Online', INVISIBLE: 'Invisible' } }));
jest.mock('../account/account.slice', () => ({ selectAllAccount: jest.fn(), selectCurrentUserId: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../helpers', () => ({
	getMezonCtx: () => ({}),
	ensureSession: jest.fn(),
	fetchDataWithSocketFallback: jest.fn()
}));

const ME = '1767478432163199777';
const PEER = '1767478432163199888';

const createStore = () => configureStore({ reducer: { [FRIEND_FEATURE_KEY]: friendsReducer } });

const event = (state: number) => ({ user_id: PEER, username: 'bichtest', display_name: 'Bich', avatar: 'a.png', state });

const friends = (store: ReturnType<typeof createStore>) => selectAllFriends(store.getState() as never);

it('adds an outgoing request sent from another device', async () => {
	const store = createStore();
	await store.dispatch(friendsActions.applyFriendStateUpdated({ user: event(EStateFriend.OTHER_PENDING), myId: ME }));
	expect(friends(store)).toEqual([
		expect.objectContaining({
			id: PEER,
			source_id: ME,
			state: EStateFriend.OTHER_PENDING,
			user: { id: PEER, username: 'bichtest', avatar_url: 'a.png', display_name: 'Bich' }
		})
	]);
});

it('turns an incoming request accepted on another device into a friend', async () => {
	const store = createStore();
	store.dispatch(
		friendsActions.upsertFriend({ id: PEER, source_id: ME, state: EStateFriend.MY_PENDING, user: { id: PEER, username: 'bichtest' } })
	);
	await store.dispatch(friendsActions.applyFriendStateUpdated({ user: event(EStateFriend.FRIEND), myId: ME }));
	expect(friends(store)).toHaveLength(1);
	expect(friends(store)[0]).toEqual(expect.objectContaining({ id: PEER, state: EStateFriend.FRIEND }));
});

it('applies incoming and blocked states and ignores unknown ones', async () => {
	const store = createStore();
	await store.dispatch(friendsActions.applyFriendStateUpdated({ user: event(EStateFriend.MY_PENDING), myId: ME }));
	expect(friends(store)[0]).toEqual(expect.objectContaining({ id: PEER, state: EStateFriend.MY_PENDING }));

	await store.dispatch(friendsActions.applyFriendStateUpdated({ user: event(EStateFriend.BLOCK), myId: ME }));
	expect(friends(store)).toHaveLength(1);
	expect(friends(store)[0]).toEqual(expect.objectContaining({ id: PEER, state: EStateFriend.BLOCK, source_id: ME }));

	await store.dispatch(friendsActions.applyFriendStateUpdated({ user: event(99), myId: ME }));
	expect(friends(store)[0]).toEqual(expect.objectContaining({ state: EStateFriend.BLOCK }));
});

it('blocks a stranger from another device', async () => {
	const store = createStore();
	await store.dispatch(friendsActions.applyFriendStateUpdated({ user: event(EStateFriend.BLOCK), myId: ME }));
	expect(friends(store)).toEqual([expect.objectContaining({ id: PEER, state: EStateFriend.BLOCK, source_id: ME })]);
});

it('treats an accepted AddFriend as a friend even without the outgoing row', async () => {
	const store = createStore();
	await store.dispatch(
		friendsActions.upsertFriendRequest({
			user: { user_id: PEER, username: 'bichtest', display_name: 'Bich', avatar: 'a.png', accepted: true },
			myId: ME
		})
	);
	expect(friends(store)).toEqual([expect.objectContaining({ id: PEER, state: EStateFriend.FRIEND })]);
});

it('turns a stale incoming row into a friend on an accepted AddFriend', async () => {
	const store = createStore();
	store.dispatch(
		friendsActions.upsertFriend({ id: PEER, source_id: ME, state: EStateFriend.MY_PENDING, user: { id: PEER, username: 'bichtest' } })
	);
	await store.dispatch(
		friendsActions.upsertFriendRequest({
			user: { user_id: PEER, username: 'bichtest', display_name: 'Bich', avatar: 'a.png', accepted: true },
			myId: ME
		})
	);
	expect(friends(store)[0]).toEqual(expect.objectContaining({ state: EStateFriend.FRIEND }));
});

it('keeps a plain AddFriend as an incoming request', async () => {
	const store = createStore();
	await store.dispatch(
		friendsActions.upsertFriendRequest({ user: { user_id: PEER, username: 'bichtest', display_name: 'Bich', avatar: 'a.png' }, myId: ME })
	);
	expect(friends(store)[0]).toEqual(expect.objectContaining({ state: EStateFriend.MY_PENDING }));
});
