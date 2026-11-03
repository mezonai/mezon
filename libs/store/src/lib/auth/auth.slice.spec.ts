import { captureSentryError } from '@mezon/logger';
import { subscribeSessionUpdate } from '@mezon/transport';
import { configureStore } from '@reduxjs/toolkit';
import { getMezonCtx } from '../helpers';
import { AUTH_FEATURE_KEY, authActions, authReducer, authenticateMezon, setupSessionSyncListener } from './auth.slice';

const mockAuthenticateMezon = jest.fn();
const mockConnectSocket = jest.fn();

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock(
	'@mezon/transport',
	() => ({
		publishSessionUpdate: jest.fn(),
		resolveSessionWsUrl: (session: { ws_url?: string }) => session.ws_url || 'sock.mezon.ai',
		subscribeSessionUpdate: jest.fn()
	}),
	{ virtual: true }
);
jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../cache-metadata', () => ({ clearApiCallTracker: jest.fn() }));
jest.mock('../cdnSignature/cdnSignature.slice', () => ({ cdnSignatureActions: {} }));
jest.mock('../channels/channelUser.slice', () => ({ listChannelsByUserActions: {} }));
jest.mock('../fcm/fcm.slice', () => ({ fcmActions: {} }));
jest.mock('../helpers', () => ({
	ensureClientAsync: jest.fn(),
	ensureSession: jest.fn(),
	getMezonCtx: jest.fn(),
	restoreLocalStorage: jest.fn()
}));
jest.mock('../stream/videoStream.slice', () => ({
	getVideoStreamState: jest.fn(),
	videoStreamActions: {},
	watchStream: jest.fn()
}));
jest.mock('../voice/voice.slice', () => ({ voiceActions: {} }));
jest.mock('../wallet/wallet.slice', () => ({ walletActions: { fetchZkProofs: jest.fn(), setLogout: jest.fn() } }));

const sessionWithoutIdToken = {
	token: 'jwt-token',
	refresh_token: 'refresh-token',
	session_id: 'session-123',
	api_url: 'https://api.mezon.ai',
	ws_url: 'sock.mezon.ai',
	created: true,
	created_at: 1000
};

const createStore = () => configureStore({ reducer: { [AUTH_FEATURE_KEY]: authReducer } });

describe('authenticateMezon', () => {
	let sessionRef: { current: unknown };
	let clientRef: { current: { authenticateMezon: jest.Mock } | null };

	beforeEach(() => {
		mockAuthenticateMezon.mockReset();
		mockConnectSocket.mockReset();
		jest.mocked(captureSentryError).mockReset();
		sessionRef = { current: null };
		clientRef = { current: { authenticateMezon: mockAuthenticateMezon } };
		jest.mocked(getMezonCtx).mockImplementation(() => ({ clientRef, sessionRef, connectSocket: mockConnectSocket }) as never);
	});

	it('fulfills and persists the session when connectSocket rejects before handshake', async () => {
		mockAuthenticateMezon.mockResolvedValueOnce(sessionWithoutIdToken);
		mockConnectSocket.mockRejectedValueOnce(new Error('Connection closed before receiving a handshake'));
		const store = createStore();

		const action = await store.dispatch(authenticateMezon('code'));

		expect(authenticateMezon.fulfilled.match(action)).toBe(true);
		expect(action.payload).toMatchObject({ token: 'jwt-token', session_id: 'session-123' });
		expect(sessionRef.current).toMatchObject({ token: 'jwt-token', session_id: 'session-123' });
		expect(mockConnectSocket).toHaveBeenCalledTimes(1);
		expect(captureSentryError).toHaveBeenCalledWith(expect.any(Error), 'auth/connectSocketAfterLogin');
	});

	it('fulfills and persists the session when connectSocket resolves', async () => {
		mockAuthenticateMezon.mockResolvedValueOnce(sessionWithoutIdToken);
		mockConnectSocket.mockResolvedValueOnce(undefined);
		const store = createStore();

		const action = await store.dispatch(authenticateMezon('code'));

		expect(authenticateMezon.fulfilled.match(action)).toBe(true);
		expect(action.payload).toMatchObject({ token: 'jwt-token', session_id: 'session-123' });
		expect(sessionRef.current).toMatchObject({ token: 'jwt-token', session_id: 'session-123' });
		expect(mockConnectSocket).toHaveBeenCalledTimes(1);
	});

	it('rejects with Invalid session without calling connectSocket when authenticateMezon resolves undefined', async () => {
		mockAuthenticateMezon.mockResolvedValueOnce(undefined);
		const store = createStore();

		const action = await store.dispatch(authenticateMezon('code'));

		expect(authenticateMezon.rejected.match(action)).toBe(true);
		expect(action.payload).toBe('Invalid session');
		expect(mockConnectSocket).not.toHaveBeenCalled();
	});

	it('rejects with Client not initialized when clientRef.current is null', async () => {
		clientRef.current = null;
		const store = createStore();

		const action = await store.dispatch(authenticateMezon('code'));

		expect(authenticateMezon.rejected.match(action)).toBe(true);
		expect(action.payload).toBe('Client not initialized');
		expect(mockConnectSocket).not.toHaveBeenCalled();
	});
});

describe('setupSessionSyncListener', () => {
	const s1 = sessionWithoutIdToken;
	const s2 = {
		...sessionWithoutIdToken,
		token: 'jwt-token-2',
		session_id: 'session-456'
	};

	let listener: Parameters<typeof subscribeSessionUpdate>[0];
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		jest.mocked(subscribeSessionUpdate).mockReset();
		jest.mocked(subscribeSessionUpdate).mockImplementation((l) => {
			listener = l;
			return () => undefined;
		});
		store = createStore();
		setupSessionSyncListener(store);
	});

	it('sets session and sets isLogin true on cross-tab update when logged out', () => {
		listener({ session: s1, source: 'cross-tab', sequence: 1 });

		const state = store.getState();
		expect(state.auth.session).toEqual(s1);
		expect(state.auth.isLogin).toBe(true);
	});

	it('stores session and keeps isLogin false on refresh update when logged out', () => {
		listener({ session: s1, source: 'refresh', sequence: 1 });

		const state = store.getState();
		expect(state.auth.session).toEqual(s1);
		expect(state.auth.isLogin).toBe(false);
	});

	it('clears session and sets isLogin false on cross-tab null session update when logged in', () => {
		store.dispatch(authActions.setSession(s1));

		listener({ session: null, source: 'cross-tab', sequence: 1 });

		const state = store.getState();
		expect(state.auth.session).toBeNull();
		expect(state.auth.isLogin).toBe(false);
	});

	it('updates session to s2 and keeps isLogin true on refresh update when logged in', () => {
		store.dispatch(authActions.setSession(s1));

		listener({ session: s2, source: 'refresh', sequence: 1 });

		const state = store.getState();
		expect(state.auth.session).toEqual(s2);
		expect(state.auth.isLogin).toBe(true);
	});

	it('ignores updates with a sequence not greater than the last applied one', () => {
		listener({ session: s2, source: 'cross-tab', sequence: 2 });
		listener({ session: s1, source: 'cross-tab', sequence: 2 });
		listener({ session: null, source: 'cross-tab', sequence: 1 });

		const state = store.getState();
		expect(state.auth.session).toEqual(s2);
		expect(state.auth.isLogin).toBe(true);
	});
});
