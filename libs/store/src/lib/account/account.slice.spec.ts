import { configureStore } from '@reduxjs/toolkit';
import { ensureSession, withRetry } from '../helpers';
import {
	ACCOUNT_FEATURE_KEY,
	accountActions,
	accountReducer,
	buildOwnProfileAccountPatch,
	getUserProfile,
	updateAccountUsername
} from './account.slice';

const mockUpdateUsername = jest.fn();

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({ notificationService: { setUserStatus: jest.fn() } }));
jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../auth/auth.slice', () => ({ authActions: { updateSession: (payload: unknown) => ({ type: 'auth/updateSession', payload }) } }));
jest.mock('../cache-metadata', () => ({
	clearApiCallTracker: jest.fn(),
	createApiKey: jest.fn(),
	createCacheMetadata: jest.fn(),
	markApiFirstCalled: jest.fn(),
	shouldForceApiCall: jest.fn(() => true)
}));
jest.mock('../app/setting.slice', () => ({
	settingActions: { setSettingLocal: jest.fn((id: string) => ({ type: 'setting/setSettingLocal', payload: id })) }
}));
jest.mock('../decorations/decorations.slice', () => ({
	fetchUserDecorations: jest.fn((ids: string[]) => ({ type: 'decorations/fetchUserDecorations', payload: ids }))
}));
jest.mock('../helpers', () => ({ ensureSession: jest.fn(), getMezonCtx: jest.fn(), withRetry: jest.fn() }));
jest.mock('../wallet/wallet.slice', () => ({
	walletActions: { fetchWalletDetail: jest.fn((arg: unknown) => ({ type: 'wallet/fetchWalletDetail', payload: arg })) }
}));

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

describe('buildOwnProfileAccountPatch and getUserProfile decoration fetch', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(ensureSession).mockResolvedValue({
			client: { getAccount: jest.fn() },
			session: { token: 't' },
			sessionRef: { current: null }
		} as never);
	});

	it('preserves stored encrypt_private_key when event encrypt_private_key is empty or unchanged', () => {
		expect(buildOwnProfileAccountPatch({ encrypt_private_key: '' }, 'enc-stored-key')).toBeNull();
		expect(buildOwnProfileAccountPatch({ encrypt_private_key: undefined }, 'enc-stored-key')).toBeNull();
		expect(buildOwnProfileAccountPatch({ encrypt_private_key: 'enc-stored-key' }, 'enc-stored-key')).toBeNull();
	});

	it('applies non-empty encrypt_private_key from own profile event while preserving pro_plan', () => {
		let state = accountReducer(undefined, { type: 'init' });
		state = {
			...state,
			userProfile: {
				pro_plan: true,
				encrypt_private_key: 'enc-old',
				user: { id: 'u-1', pro_plan: true }
			} as never
		};

		const patch = buildOwnProfileAccountPatch({ encrypt_private_key: 'enc-new' }, state.userProfile?.encrypt_private_key);
		expect(patch).not.toBeNull();
		state = accountReducer(state, accountActions.setUpdateAccount(patch as never));

		expect(state.userProfile?.encrypt_private_key).toBe('enc-new');
		expect(state.userProfile?.pro_plan).toBe(true);
	});

	it('dispatches fetchUserDecorations for own Pro account after getUserProfile loads and skips non-Pro', async () => {
		const dispatched: unknown[] = [];
		const dispatch = jest.fn((action: unknown) => {
			dispatched.push(action);
			return action;
		});
		const getState = () => ({ [ACCOUNT_FEATURE_KEY]: accountReducer(undefined, { type: 'init' }), auth: { session: { token: 't' } } });

		jest.mocked(withRetry).mockResolvedValueOnce({ pro_plan: true, user: { id: 'u-pro', pro_plan: true } } as never);
		await getUserProfile()(dispatch as never, getState, undefined);
		expect(dispatched).toContainEqual({ type: 'decorations/fetchUserDecorations', payload: ['u-pro'] });

		dispatched.length = 0;
		jest.mocked(withRetry).mockResolvedValueOnce({ pro_plan: false, user: { id: 'u-free', pro_plan: false } } as never);
		await getUserProfile()(dispatch as never, getState, undefined);
		expect(dispatched.some((a) => (a as { type?: string }).type === 'decorations/fetchUserDecorations')).toBe(false);
	});
});
