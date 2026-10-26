import { configureStore } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import {
	USERS_STREAM_FEATURE_KEY,
	fetchStreamChannelMembers,
	selectStreamMembersByChannelId,
	selectStreamViewerCount,
	usersStreamActions,
	usersStreamReducer
} from './usersStream.slice';

const mockFetchDataWithSocketFallback = jest.fn();

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('mezon-js', () => ({ ChannelType: { CHANNEL_TYPE_STREAMING: 6 } }));
jest.mock('../helpers', () => ({
	getMezonCtx: () => ({}),
	ensureSession: async () => ({}),
	fetchDataWithSocketFallback: (...args: unknown[]) => mockFetchDataWithSocketFallback(...args)
}));

const createStore = () => configureStore({ reducer: { [USERS_STREAM_FEATURE_KEY]: usersStreamReducer } });

const publisher = (clanId: string, channelId: string, userId: string) => ({
	id: `row-${userId}`,
	user_id: userId,
	clan_id: clanId,
	clan_name: '',
	streaming_channel_id: channelId,
	streaming_channel_label: '',
	participant: '',
	user_name: '',
	user_avatar: '',
	is_publisher: true as boolean | undefined
});

const viewer = (clanId: string, channelId: string, userId: string) => ({ ...publisher(clanId, channelId, userId), id: '0', is_publisher: false });

const refetch = (clanId: string) =>
	fetchStreamChannelMembers({ clanId, channelId: '', channelType: ChannelType.CHANNEL_TYPE_STREAMING, noCache: true });

beforeEach(() => {
	mockFetchDataWithSocketFallback.mockReset();
});

describe('fetchStreamChannelMembers', () => {
	it("replaces the clan's members and counts the listed viewers", async () => {
		const store = createStore();
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-1', 'u1')));
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-2', 'u2')));
		store.dispatch(usersStreamActions.add(publisher('clan-b', 'ch-3', 'u3')));
		store.dispatch(usersStreamActions.add(viewer('clan-a', 'ch-2', 'v2')));
		mockFetchDataWithSocketFallback.mockResolvedValueOnce({
			streaming_channel_users: [
				{ id: 'row-u1', user_id: 'u1', channel_id: 'ch-1', is_publisher: true },
				{ id: '0', user_id: 'v1', channel_id: 'ch-1' },
				{ id: '0', user_id: 'v3', channel_id: 'ch-1' },
				{ id: 'row-u4', user_id: 'u4', channel_id: 'ch-4', is_publisher: true }
			]
		});

		await store.dispatch(refetch('clan-a'));

		expect(store.getState()[USERS_STREAM_FEATURE_KEY].ids).toEqual(['u1:ch-1', 'u3:ch-3', 'v1:ch-1', 'v3:ch-1', 'u4:ch-4']);
		expect(selectStreamViewerCount(store.getState(), 'ch-1')).toBe(2);
		expect(selectStreamViewerCount(store.getState(), 'ch-2')).toBe(0);
		expect(selectStreamViewerCount(store.getState(), 'ch-4')).toBe(0);
	});

	it('removes every publisher of the clan when the list comes back empty', async () => {
		const store = createStore();
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-1', 'u1')));
		store.dispatch(usersStreamActions.add(publisher('clan-b', 'ch-3', 'u3')));
		mockFetchDataWithSocketFallback.mockResolvedValueOnce({});

		await store.dispatch(refetch('clan-a'));

		expect(store.getState()[USERS_STREAM_FEATURE_KEY].ids).toEqual(['u3:ch-3']);
	});

	it('fetches again when an event of the clan arrives while the list is in flight', async () => {
		const store = createStore();
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-1', 'u1')));
		let resolveList: (value: unknown) => void = () => undefined;
		mockFetchDataWithSocketFallback.mockReturnValueOnce(new Promise((resolve) => (resolveList = resolve)));
		mockFetchDataWithSocketFallback.mockResolvedValueOnce({
			streaming_channel_users: [
				{ id: 'row-u2', user_id: 'u2', channel_id: 'ch-2' },
				{ id: 'row-u5', user_id: 'u5', channel_id: 'ch-5' }
			]
		});

		const refetching = store.dispatch(refetch('clan-a'));
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(mockFetchDataWithSocketFallback).toHaveBeenCalledTimes(1);
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-2', 'u2')));
		resolveList({ streaming_channel_users: [{ id: 'row-u5', user_id: 'u5', channel_id: 'ch-5' }] });
		await refetching;

		expect(mockFetchDataWithSocketFallback).toHaveBeenCalledTimes(2);
		expect(store.getState()[USERS_STREAM_FEATURE_KEY].ids).toEqual(['u2:ch-2', 'u5:ch-5']);
	});

	it('keeps the state when the clan keeps changing during three fetches', async () => {
		const store = createStore();
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-1', 'u1')));
		mockFetchDataWithSocketFallback.mockImplementation(async () => {
			store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-9', 'u9')));
			return { streaming_channel_users: [] };
		});

		const result = await store.dispatch(refetch('clan-a'));

		expect(result.type).toBe(fetchStreamChannelMembers.rejected.type);
		expect(mockFetchDataWithSocketFallback).toHaveBeenCalledTimes(3);
		expect(store.getState()[USERS_STREAM_FEATURE_KEY].ids).toEqual(['u1:ch-1', 'u9:ch-9']);
	});

	it('does not fetch again for events of another clan', async () => {
		const store = createStore();
		mockFetchDataWithSocketFallback.mockImplementation(async () => {
			store.dispatch(usersStreamActions.add(publisher('clan-b', 'ch-3', 'u3')));
			return { streaming_channel_users: [{ id: 'row-u1', user_id: 'u1', channel_id: 'ch-1' }] };
		});

		await store.dispatch(refetch('clan-a'));

		expect(mockFetchDataWithSocketFallback).toHaveBeenCalledTimes(1);
		expect(store.getState()[USERS_STREAM_FEATURE_KEY].ids).toEqual(['u3:ch-3', 'u1:ch-1']);
	});

	it('takes is_publisher and the participant name from the list and keeps a known avatar', async () => {
		const store = createStore();
		store.dispatch(usersStreamActions.add({ ...viewer('clan-a', 'ch-1', 'v1'), user_avatar: 'https://avatar/v1' }));
		mockFetchDataWithSocketFallback.mockResolvedValueOnce({
			streaming_channel_users: [
				{ id: 'row-u1', user_id: 'u1', channel_id: 'ch-1', is_publisher: true },
				{ id: '0', user_id: 'v1', channel_id: 'ch-1', participant: 'Viewer One' }
			]
		});

		await store.dispatch(refetch('clan-a'));

		expect(
			selectStreamMembersByChannelId(store.getState(), 'ch-1').map(({ user_id, is_publisher, user_name, user_avatar }) => ({
				user_id,
				is_publisher,
				user_name,
				user_avatar
			}))
		).toEqual([
			{ user_id: 'u1', is_publisher: true, user_name: '', user_avatar: '' },
			{ user_id: 'v1', is_publisher: undefined, user_name: 'Viewer One', user_avatar: 'https://avatar/v1' }
		]);
		expect(selectStreamViewerCount(store.getState(), 'ch-1')).toBe(1);
	});
});

describe('stream members', () => {
	it('counts viewers as they join and leave and keeps the stream when a viewer leaves', () => {
		const store = createStore();
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-1', 'u1')));
		store.dispatch(usersStreamActions.add(viewer('clan-a', 'ch-1', 'v1')));
		store.dispatch(usersStreamActions.add(viewer('clan-a', 'ch-1', 'v2')));
		expect(selectStreamViewerCount(store.getState(), 'ch-1')).toBe(2);

		store.dispatch(usersStreamActions.leave({ userId: 'v1', channelId: 'ch-1', clanId: 'clan-a' }));

		expect(selectStreamMembersByChannelId(store.getState(), 'ch-1').map((member) => member.user_id)).toEqual(['u1', 'v2']);
		expect(selectStreamViewerCount(store.getState(), 'ch-1')).toBe(1);
	});

	it('ends the stream when the publisher leaves', () => {
		const store = createStore();
		store.dispatch(usersStreamActions.add(viewer('clan-a', 'ch-1', 'v1')));
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-1', 'u1')));
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-2', 'u2')));
		expect(selectStreamViewerCount(store.getState(), 'ch-1')).toBe(1);

		store.dispatch(usersStreamActions.leave({ userId: 'u1', channelId: 'ch-1', clanId: 'clan-a' }));

		expect(store.getState()[USERS_STREAM_FEATURE_KEY].ids).toEqual(['u2:ch-2']);
		expect(selectStreamViewerCount(store.getState(), 'ch-1')).toBe(0);
	});

	it('takes the first member as the publisher when no member is flagged', () => {
		const store = createStore();
		store.dispatch(usersStreamActions.add({ ...publisher('clan-a', 'ch-1', 'u1'), is_publisher: undefined }));
		store.dispatch(usersStreamActions.add(viewer('clan-a', 'ch-1', 'v1')));

		store.dispatch(usersStreamActions.leave({ userId: 'u1', channelId: 'ch-1', clanId: 'clan-a' }));

		expect(store.getState()[USERS_STREAM_FEATURE_KEY].ids).toEqual([]);
	});

	it('lists the publisher first and never lets a viewer event replace it', () => {
		const store = createStore();
		store.dispatch(usersStreamActions.add(viewer('clan-a', 'ch-1', 'v1')));
		store.dispatch(usersStreamActions.add(publisher('clan-a', 'ch-1', 'u1')));
		store.dispatch(usersStreamActions.add({ ...viewer('clan-a', 'ch-1', 'u1'), user_name: 'stale' }));

		const members = selectStreamMembersByChannelId(store.getState(), 'ch-1');
		expect(members.map((member) => [member.user_id, member.is_publisher, member.user_name])).toEqual([
			['u1', true, ''],
			['v1', false, '']
		]);
		expect(selectStreamViewerCount(store.getState(), 'ch-1')).toBe(1);
	});
});
