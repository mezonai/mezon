import { captureSentryError } from '@mezon/logger';
import { configureStore } from '@reduxjs/toolkit';
import { getMezonCtx } from '../helpers';
import { AUTH_FEATURE_KEY, authReducer, authenticateMezon } from './auth.slice';

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
