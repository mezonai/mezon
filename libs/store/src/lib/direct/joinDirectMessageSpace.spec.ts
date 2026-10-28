import { configureStore } from '@reduxjs/toolkit';

const calls: string[] = [];
const mockListChannelDescs = jest.fn();
const mockJoinClanChat = jest.fn();

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({ ActiveDm: { OPEN_DM: 1 } }));
jest.mock('react-toastify', () => ({ toast: jest.fn() }));
jest.mock('mezon-js', () => ({
	ChannelType: { CHANNEL_TYPE_GROUP: 2, CHANNEL_TYPE_DM: 3 },
	ChannelStreamMode: { STREAM_MODE_GROUP: 3, STREAM_MODE_DM: 4 }
}));
jest.mock('../account/account.slice', () => ({ selectAllAccount: () => undefined }));
jest.mock('../cdnSignature/cdnSignature.slice', () => ({ cdnSignatureActions: {} }));
jest.mock('../channelmembers/AllUsersChannelByAddChannel.slice', () => ({ userChannelsActions: {} }));
jest.mock('../channels/channelmeta.slice', () => ({ channelMetaActions: {} }));
jest.mock('../channels/channels.slice', () => ({ channelsActions: {} }));
jest.mock('../messages/messages.slice', () => ({ messagesActions: {} }));
jest.mock('../helpers', () => {
	const mezon = () => ({
		client: { listChannelDescs: mockListChannelDescs },
		clientRef: { current: { joinClanChat: mockJoinClanChat } },
		session: { token: 'session' }
	});
	return {
		getMezonCtx: () => ({}),
		ensureSession: async () => mezon(),
		ensureSocket: async () => mezon(),
		withRetry: (fn: () => unknown) => fn()
	};
});
jest.mock('../clans/clans.slice', () => {
	const { createAsyncThunk } = jest.requireActual('@reduxjs/toolkit');
	return {
		joinClan: createAsyncThunk('direct/joinClan', async ({ clanId }: { clanId: string }, thunkAPI) => {
			try {
				await mockJoinClanChat({ token: 'session' }, clanId);
			} catch (error) {
				return thunkAPI.rejectWithValue((error as Error).message);
			}
		}),
		listChannelBadgeCount: createAsyncThunk('clans/listChannelBadgeCount', async () => ({ channeldesc: [] }))
	};
});

const deferred = () => {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => (resolve = r));
	return { promise, resolve };
};

const load = () => {
	let slice!: typeof import('./direct.slice');
	jest.isolateModules(() => {
		slice = require('./direct.slice');
	});
	const store = configureStore({ reducer: { direct: slice.directReducer } });
	return { joinDirectMessageSpace: slice.joinDirectMessageSpace, store };
};

beforeEach(() => {
	calls.length = 0;
	mockListChannelDescs.mockReset().mockImplementation(async () => {
		calls.push('list');
		return { channeldesc: [] };
	});
	mockJoinClanChat.mockReset().mockImplementation(async (_session: unknown, clanId: string) => {
		calls.push(`join:${clanId}`);
	});
});

it('loads the DM list before joining, and callers that are not a login or reconnect only wait for it', async () => {
	const { joinDirectMessageSpace, store } = load();
	const list = deferred();
	mockListChannelDescs.mockImplementationOnce(async () => {
		await list.promise;
		calls.push('list');
		return { channeldesc: [] };
	});

	await store.dispatch(joinDirectMessageSpace({}));
	expect(calls).toEqual([]);

	const login = store.dispatch(joinDirectMessageSpace({ restart: true }));
	const friends = store.dispatch(joinDirectMessageSpace({}));
	await Promise.resolve();
	expect(mockJoinClanChat).not.toHaveBeenCalled();

	list.resolve();
	await Promise.all([login, friends]);
	await store.dispatch(joinDirectMessageSpace({}));

	expect(calls).toEqual(['list', 'join:0']);
});

it('reloads the list and joins again on every reconnect', async () => {
	const { joinDirectMessageSpace, store } = load();

	await store.dispatch(joinDirectMessageSpace({ restart: true }));
	await store.dispatch(joinDirectMessageSpace({ restart: true }));

	expect(calls).toEqual(['list', 'join:0', 'list', 'join:0']);
});

it('lets a later caller retry a join that failed', async () => {
	const { joinDirectMessageSpace, store } = load();
	mockJoinClanChat.mockImplementationOnce(async () => {
		calls.push('join failed');
		throw new Error('socket closed');
	});

	await store.dispatch(joinDirectMessageSpace({ restart: true }));
	await store.dispatch(joinDirectMessageSpace({}));
	await store.dispatch(joinDirectMessageSpace({}));

	expect(calls).toEqual(['list', 'join failed', 'list', 'join:0']);
});
