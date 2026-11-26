import { configureStore } from '@reduxjs/toolkit';
import { ensureSession } from '../helpers';
import { ACCOUNT_FEATURE_KEY, accountReducer, updateAccountUsername } from './account.slice';

const mockUpdateUsername = jest.fn();

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({ notificationService: {} }));
jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../auth/auth.slice', () => ({ authActions: { updateSession: (payload: unknown) => ({ type: 'auth/updateSession', payload }) } }));
jest.mock('../cache-metadata', () => ({
	clearApiCallTracker: jest.fn(),
	createApiKey: jest.fn(),
	createCacheMetadata: jest.fn(),
	markApiFirstCalled: jest.fn(),
	shouldForceApiCall: jest.fn()
}));
jest.mock('../app/setting.slice', () => ({ settingActions: {} }));
jest.mock('../helpers', () => ({ ensureSession: jest.fn(), getMezonCtx: jest.fn(), withRetry: jest.fn() }));
jest.mock('../wallet/wallet.slice', () => ({ walletActions: {} }));

const createStore = () => configureStore({ reducer: { [ACCOUNT_FEATURE_KEY]: accountReducer, auth: () => ({ session: null }) } });

describe('updateAccountUsername', () => {
	beforeEach(() => {
		mockUpdateUsername.mockReset();
		jest.mocked(ensureSession).mockResolvedValue({
			client: { updateUsername: mockUpdateUsername },
			session: { token: 't' },
			sessionRef: { current: null }
		} as never);
	});

	it('rejects with toast disabled so the global error modal stays closed', async () => {
		mockUpdateUsername.mockRejectedValueOnce({ code: 3 });

		const action = await createStore().dispatch(updateAccountUsername({ username: 'taken' }));

		expect(updateAccountUsername.rejected.match(action)).toBe(true);
		expect((action.meta as { error?: { toast?: boolean } }).error).toEqual({ toast: false });
		expect(action.payload).toEqual({ code: 3 });
	});

	it('keeps the toast-disabled meta when the client rejects with undefined', async () => {
		mockUpdateUsername.mockRejectedValueOnce(undefined);

		const action = await createStore().dispatch(updateAccountUsername({ username: 'taken' }));

		expect(updateAccountUsername.rejected.match(action)).toBe(true);
		expect(action.payload).toBeNull();
		expect((action.meta as { error?: { toast?: boolean } }).error).toEqual({ toast: false });
	});
});
