import { fetchSessionRefresh, isJwtExpired, publishSessionUpdate } from '@mezon/transport';
import { getAdminSession, isAdminSessionExpiredError } from './adminSession';
import type { ISession } from './auth.slice';

jest.mock(
	'@mezon/transport',
	() => ({
		fetchSessionRefresh: jest.fn(),
		isJwtExpired: jest.fn(),
		isRefreshRefused: (status: number) => status === 400 || status === 401 || status === 403,
		publishSessionUpdate: jest.fn()
	}),
	{ virtual: true }
);
jest.mock('mezon-js', () => ({ safeJSONParse: JSON.parse }), { virtual: true });
jest.mock('./auth.slice', () => ({
	authActions: {
		updateSession: (session: ISession) => ({ type: 'auth/updateSession', payload: session })
	}
}));

const baseSession: ISession = {
	token: 'expired-access',
	refresh_token: 'valid-refresh',
	created: true,
	created_at: 1000,
	user_id: 'user-1',
	session_id: 'sid-1',
	api_url: 'https://api.mezon.ai',
	is_remember: true
};

const makeContext = (session: ISession | null) => {
	const state = { auth: { session } };
	const dispatch = jest.fn((action: { type?: string; payload?: ISession }) => {
		if (action?.type === 'auth/updateSession' && action.payload) {
			state.auth.session = action.payload;
		}
		return action;
	});
	return {
		getState: () => state,
		dispatch
	};
};

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	process.env.NX_CHAT_APP_API_HOST = 'api.mezon.ai';
	process.env.NX_CHAT_APP_API_PORT = '443';
	process.env.NX_CHAT_APP_API_KEY = 'key';
});

afterEach(() => {
	jest.useRealTimers();
	delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe('getAdminSession', () => {
	it('throws AdminSessionExpiredError when session or refresh_token is missing', async () => {
		try {
			await getAdminSession(makeContext(null) as never);
			throw new Error('expected throw');
		} catch (error) {
			expect(isAdminSessionExpiredError(error)).toBe(true);
		}

		jest.mocked(isJwtExpired).mockReturnValue(true);
		try {
			await getAdminSession(makeContext({ ...baseSession, refresh_token: '' }) as never);
			throw new Error('expected throw');
		} catch (error) {
			expect(isAdminSessionExpiredError(error)).toBe(true);
		}
	});

	it('throws AdminSessionExpiredError on confirmed 401 refusal after retry', async () => {
		jest.mocked(isJwtExpired).mockImplementation((token) => token === baseSession.token);
		jest.mocked(fetchSessionRefresh).mockResolvedValue({ status: 401, tokens: null });

		const promise = getAdminSession(makeContext({ ...baseSession }) as never);
		const caught = promise.catch((error) => error);
		await jest.advanceTimersByTimeAsync(1000);
		const error = await caught;

		expect(fetchSessionRefresh).toHaveBeenCalledTimes(2);
		expect(isAdminSessionExpiredError(error)).toBe(true);
	});

	it('recovers when a sibling tab wrote a fresh session to localStorage after initial 401 refusal', async () => {
		const rotated: ISession = { ...baseSession, token: 'fresh-access', refresh_token: 'new-refresh' };
		jest.mocked(isJwtExpired).mockImplementation((token) => token === 'expired-access');
		jest.mocked(fetchSessionRefresh).mockResolvedValueOnce({ status: 401, tokens: null });

		Object.defineProperty(globalThis, 'localStorage', {
			value: {
				getItem: () => JSON.stringify({ session: JSON.stringify(rotated), isLogin: 'true' })
			},
			configurable: true
		});

		const ctx = makeContext({ ...baseSession });
		const promise = getAdminSession(ctx as never);
		await jest.advanceTimersByTimeAsync(1000);
		const result = await promise;

		expect(result).toEqual(rotated);
		expect(fetchSessionRefresh).toHaveBeenCalledTimes(1);
		expect(ctx.dispatch).toHaveBeenCalledWith({ type: 'auth/updateSession', payload: rotated });
	});

	it('retries with rotated refresh_token from localStorage when sibling tab rotated tokens', async () => {
		const rotatedStored: ISession = { ...baseSession, token: 'expired-access', refresh_token: 'rotated-refresh' };
		jest.mocked(isJwtExpired).mockImplementation((token) => token === 'expired-access');
		jest.mocked(fetchSessionRefresh)
			.mockResolvedValueOnce({ status: 401, tokens: null })
			.mockResolvedValueOnce({ status: 200, tokens: { token: 'new-access', refresh_token: 'newest-refresh' } });

		Object.defineProperty(globalThis, 'localStorage', {
			value: {
				getItem: () => JSON.stringify({ session: JSON.stringify(rotatedStored), isLogin: 'true' })
			},
			configurable: true
		});

		const ctx = makeContext({ ...baseSession });
		const promise = getAdminSession(ctx as never);
		await jest.advanceTimersByTimeAsync(1000);
		const result = await promise;

		expect(fetchSessionRefresh).toHaveBeenNthCalledWith(2, 'https://api.mezon.ai:443', 'key', 'rotated-refresh', true);
		expect(result.token).toBe('new-access');
		expect(publishSessionUpdate).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-access' }), 'refresh');
	});

	it('throws a non-expired error on transient 503 or network failures without retrying refusal path', async () => {
		jest.mocked(isJwtExpired).mockReturnValue(true);
		jest.mocked(fetchSessionRefresh).mockResolvedValueOnce({ status: 503, tokens: null });

		try {
			await getAdminSession(makeContext({ ...baseSession }) as never);
			throw new Error('expected throw');
		} catch (error) {
			expect(isAdminSessionExpiredError(error)).toBe(false);
		}
		expect(fetchSessionRefresh).toHaveBeenCalledTimes(1);
	});
});
