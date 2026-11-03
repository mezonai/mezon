type StatusListener = (status: 'connected' | 'disconnected' | 'connecting') => void;

let mockIsConnected = false;
const mockListeners = new Set<StatusListener>();
const mockSubscribe = jest.fn((listener: StatusListener) => {
	mockListeners.add(listener);
	return () => {
		mockListeners.delete(listener);
	};
});

const mockGetUserProfile = jest.fn(() => ({ type: 'account/getUserProfile' }));
const mockFetchStickerByUserId = jest.fn(() => ({ type: 'stickers/fetch' }));
const mockFetchListChannelsByUser = jest.fn(() => ({ type: 'channels/fetch' }));
const mockFetchClans = jest.fn(() => ({ type: 'clans/fetch' }));
const mockListClanBadgeCount = jest.fn(() => ({ type: 'clans/badge' }));
const mockFetchListFriends = jest.fn(() => ({ type: 'friends/fetch' }));
const mockJoinDirectMessageSpace = jest.fn(() => ({ type: 'direct/join' }));
const mockFetchEmojiRecent = jest.fn(() => ({ type: 'emoji/recent' }));
const mockFetchEmoji = jest.fn(() => ({ type: 'emoji/fetch' }));
const mockConnectNotificationService = jest.fn(() => ({ type: 'fcm/connect' }));

jest.mock(
	'@mezon/store',
	() => ({
		accountActions: { getUserProfile: mockGetUserProfile },
		stickerSettingActions: { fetchStickerByUserId: mockFetchStickerByUserId },
		listChannelsByUserActions: { fetchListChannelsByUser: mockFetchListChannelsByUser },
		clansActions: { fetchClans: mockFetchClans, listClanBadgeCount: mockListClanBadgeCount },
		friendsActions: { fetchListFriends: mockFetchListFriends },
		directActions: { joinDirectMessageSpace: mockJoinDirectMessageSpace },
		emojiRecentActions: { fetchEmojiRecent: mockFetchEmojiRecent },
		emojiSuggestionActions: { fetchEmoji: mockFetchEmoji },
		fcmActions: { connectNotificationService: mockConnectNotificationService }
	}),
	{ virtual: true }
);

jest.mock(
	'@mezon/transport',
	() => ({
		isOnline: () => true,
		waitForOnline: jest.fn(),
		socketState: {
			get isConnected() {
				return mockIsConnected;
			},
			subscribe: mockSubscribe
		}
	}),
	{ virtual: true }
);

const emitStatus = (status: 'connected' | 'disconnected' | 'connecting') => {
	Array.from(mockListeners).forEach((listener) => listener(status));
};

const loadAuthLoader = async () => {
	jest.resetModules();
	const mod = await import('./authLoader');
	return mod.authLoader;
};

describe('authLoader', () => {
	beforeEach(() => {
		mockIsConnected = false;
		mockListeners.clear();
		jest.clearAllMocks();
	});

	it('dispatches getUserProfile once and does not subscribe when the socket is already connected', async () => {
		mockIsConnected = true;
		const dispatch = jest.fn(async (action: unknown) => action);
		const authLoader = await loadAuthLoader();

		await authLoader({ dispatch } as never);

		expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledWith({ type: 'account/getUserProfile' });
		expect(mockSubscribe).not.toHaveBeenCalled();
	});

	it('reloads signed-in data once when the socket transitions to connected and unsubscribes', async () => {
		mockIsConnected = false;
		const dispatch = jest.fn(async (action: unknown) => action);
		const authLoader = await loadAuthLoader();

		await authLoader({ dispatch } as never);

		expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
		expect(mockSubscribe).toHaveBeenCalledTimes(1);
		expect(mockListeners.size).toBe(1);

		emitStatus('connecting');
		expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
		expect(mockListeners.size).toBe(1);

		mockIsConnected = true;
		emitStatus('connected');
		await Promise.resolve();

		expect(mockGetUserProfile).toHaveBeenCalledTimes(2);
		expect(mockFetchClans).toHaveBeenCalledTimes(2);
		expect(mockFetchListFriends).toHaveBeenCalledTimes(2);
		expect(mockListeners.size).toBe(0);

		emitStatus('connected');
		await Promise.resolve();

		expect(mockGetUserProfile).toHaveBeenCalledTimes(2);
	});

	it('registers only one listener when authLoader runs twice while disconnected', async () => {
		mockIsConnected = false;
		const dispatch = jest.fn(async (action: unknown) => action);
		const authLoader = await loadAuthLoader();

		await authLoader({ dispatch } as never);
		await authLoader({ dispatch } as never);

		expect(mockGetUserProfile).toHaveBeenCalledTimes(2);
		expect(mockSubscribe).toHaveBeenCalledTimes(1);
		expect(mockListeners.size).toBe(1);

		mockIsConnected = true;
		emitStatus('connected');
		await Promise.resolve();

		expect(mockGetUserProfile).toHaveBeenCalledTimes(3);
		expect(mockListeners.size).toBe(0);
	});
});
