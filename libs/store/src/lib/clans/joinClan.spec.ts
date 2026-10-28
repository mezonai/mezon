import { configureStore } from '@reduxjs/toolkit';
import { joinClan, waitForClanJoin } from './clans.slice';

const calls: string[] = [];
const mockFetchChannels = jest.fn();
const mockJoinClanChat = jest.fn();

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({ FOR_1_HOUR_SEC: 3600, LIMIT_CLAN_ITEM: 50, ONE_MILISECONDS: 1 }));
jest.mock('mezon-js', () => ({ ChannelType: { CHANNEL_TYPE_CHANNEL: 1 } }));
jest.mock('mezon-js-protobuf', () => ({ ClanDescList: {}, ListClanDescRequest: {} }));
jest.mock('react-redux', () => ({ batch: (fn: () => void) => fn() }));
jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('react-toastify', () => ({ toast: jest.fn() }));
jest.mock('../account/account.slice', () => ({ accountActions: {} }));
jest.mock('../application/adminAPI.slice', () => ({ callApiAdmin: jest.fn() }));
jest.mock('../avatarOverride/avatarOverride', () => ({ setUserAvatarOverride: jest.fn() }));
jest.mock('../channels/channelmeta.slice', () => ({ channelMetaActions: {} }));
jest.mock('../channels/channels.slice', () => {
	const { createAsyncThunk } = jest.requireActual('@reduxjs/toolkit');
	return { channelsActions: { fetchChannels: createAsyncThunk('channels/fetchChannels', (arg: unknown) => mockFetchChannels(arg)) } };
});
jest.mock('../clanMembers/clan.members', () => {
	const { createAsyncThunk } = jest.requireActual('@reduxjs/toolkit');
	return { usersClanActions: {}, fetchClanMembersWithStatus: createAsyncThunk('clanMembers/fetch', async () => undefined) };
});
jest.mock('../emojiSuggestion/emojiSuggestion.slice', () => ({ emojiSuggestionSlice: {} }));
jest.mock('../eventManagement/eventManagement.slice', () => ({ eventManagementActions: {} }));
jest.mock('../messages/messages.slice', () => ({ messagesActions: {}, processQueuedLastSeenMessages: jest.fn() }));
jest.mock('../notificationSetting/notificationSettingChannel.slice', () => ({ notificationSettingActions: {} }));
jest.mock('../notificationSetting/notificationSettingClan.slice', () => ({ defaultNotificationActions: {} }));
jest.mock('../policies/policies.slice', () => ({ policiesActions: {} }));
jest.mock('../roleclan/roleclan.slice', () => ({ rolesClanActions: {} }));
jest.mock('../settingSticker/settingSticker.slice', () => ({ settingClanStickerSlice: {}, soundEffectActions: {} }));
jest.mock('../stream/usersStream.slice', () => ({ usersStreamActions: {} }));
jest.mock('../voice/voice.slice', () => ({ voiceActions: {} }));
jest.mock('../helpers', () => ({
	getMezonCtx: () => ({}),
	ensureSocket: async () => ({ clientRef: { current: { joinClanChat: mockJoinClanChat } }, session: {} }),
	ensureSession: async () => {
		throw new Error('no session in this test');
	},
	ensureClient: jest.fn(),
	fetchDataWithSocketFallback: jest.fn()
}));

const deferred = () => {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => (resolve = r));
	return { promise, resolve };
};

const createStore = () => configureStore({ reducer: { app: (state: Record<string, never> = {}) => state } });

beforeEach(() => {
	calls.length = 0;
	mockFetchChannels.mockReset().mockImplementation(async ({ clanId, noCache }: { clanId: string; noCache: boolean }) => {
		calls.push(`list:${clanId}${noCache ? ':noCache' : ''}`);
	});
	mockJoinClanChat.mockReset().mockImplementation(async (_session: unknown, clanId: string) => {
		calls.push(`join:${clanId}`);
	});
});

it('loads the clan channel list before joining the clan, and exposes the join while it runs', async () => {
	const store = createStore();
	const list = deferred();
	mockFetchChannels.mockImplementationOnce(async ({ clanId }: { clanId: string }) => {
		await list.promise;
		calls.push(`list:${clanId}`);
	});

	const joining = store.dispatch(joinClan({ clanId: '42' }));
	const waiting = waitForClanJoin('42');
	expect(waiting).toBeDefined();
	await Promise.resolve();
	expect(mockJoinClanChat).not.toHaveBeenCalled();

	list.resolve();
	await waiting;
	expect(calls).toEqual(['list:42', 'join:42']);
	await joining;
	expect(waitForClanJoin('42')).toBeUndefined();
});

it('passes noCache to the channel list and skips it for the DM space', async () => {
	const store = createStore();

	await store.dispatch(joinClan({ clanId: '42', noCache: true }));
	await store.dispatch(joinClan({ clanId: '0' }));

	expect(calls).toEqual(['list:42:noCache', 'join:42', 'join:0']);
});

it('releases waiting channel joins when the clan join fails', async () => {
	const store = createStore();
	mockJoinClanChat.mockImplementationOnce(async () => {
		throw new Error('socket closed');
	});

	const joining = store.dispatch(joinClan({ clanId: '42' }));
	await expect(waitForClanJoin('42')).resolves.toBeUndefined();
	await joining;
	expect(waitForClanJoin('42')).toBeUndefined();
});
