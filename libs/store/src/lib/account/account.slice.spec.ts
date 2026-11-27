import { configureStore } from '@reduxjs/toolkit';
import { ensureSession } from '../helpers';
import {
	ACCOUNT_FEATURE_KEY,
	accountActions,
	accountReducer,
	buildOwnProfileAccountPatch,
	selectAccountFrame,
	updateAccountUsername,
	updateUserFrame
} from './account.slice';

const mockUpdateUsername = jest.fn();
const mockUpdateAccount = jest.fn();

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

describe('user frame state and updateUserFrame', () => {
	beforeEach(() => {
		mockUpdateAccount.mockReset();
		jest.mocked(ensureSession).mockResolvedValue({
			client: { updateAccount: mockUpdateAccount },
			session: { token: 't' },
			sessionRef: { current: null }
		} as never);
	});

	it.each([-1, 0, 5])('preserves user.frame (%i) across partial setUpdateAccount payloads', (frame) => {
		let state = accountReducer(undefined, { type: 'init' });
		state = {
			...state,
			userProfile: {
				pro_plan: true,
				encrypt_private_key: 'enc-1',
				user: { id: 'u-1', display_name: 'Me', frame }
			} as never
		};

		state = accountReducer(state, accountActions.setUpdateAccount({ encrypt_private_key: 'enc-2' } as never));
		state = accountReducer(
			state,
			accountActions.setUpdateAccount({
				user: { display_name: 'Me Updated', frame: undefined }
			} as never)
		);

		const root = { [ACCOUNT_FEATURE_KEY]: state };
		expect(selectAccountFrame(root)).toBe(frame);
		expect(state.userProfile?.user?.display_name).toBe('Me Updated');
	});

	it('updates user.frame explicitly to -1, 0, and a positive frame id', () => {
		let state = accountReducer(undefined, { type: 'init' });
		state = {
			...state,
			userProfile: {
				pro_plan: true,
				user: { id: 'u-1', frame: 3 }
			} as never
		};

		state = accountReducer(state, accountActions.setUpdateAccount({ user: { frame: -1 } } as never));
		expect(selectAccountFrame({ [ACCOUNT_FEATURE_KEY]: state })).toBe(-1);

		state = accountReducer(state, accountActions.setUpdateAccount({ user: { frame: 0 } } as never));
		expect(selectAccountFrame({ [ACCOUNT_FEATURE_KEY]: state })).toBe(0);

		state = accountReducer(state, accountActions.setUpdateAccount({ user: { frame: 7 } } as never));
		expect(selectAccountFrame({ [ACCOUNT_FEATURE_KEY]: state })).toBe(7);
	});

	it('dispatches updateAccount and patches account frame on success', async () => {
		mockUpdateAccount.mockResolvedValueOnce(true);
		const store = configureStore({
			reducer: { [ACCOUNT_FEATURE_KEY]: accountReducer, auth: () => ({ session: null }) },
			preloadedState: {
				[ACCOUNT_FEATURE_KEY]: {
					...accountReducer(undefined, { type: 'init' }),
					userProfile: {
						pro_plan: true,
						encrypt_private_key: 'enc-keep',
						user: { id: 'u-1', pro_plan: true, frame: 0 }
					} as never
				}
			}
		});

		const action = await store.dispatch(updateUserFrame(-1));

		expect(updateUserFrame.fulfilled.match(action)).toBe(true);
		expect(mockUpdateAccount).toHaveBeenCalledWith({ token: 't' }, { frame: -1 });
		expect(action.payload).toEqual({ userId: 'u-1', frame: -1 });
		expect(selectAccountFrame(store.getState())).toBe(-1);
		expect(store.getState()[ACCOUNT_FEATURE_KEY].userProfile?.pro_plan).toBe(true);
		expect(store.getState()[ACCOUNT_FEATURE_KEY].userProfile?.encrypt_private_key).toBe('enc-keep');
	});

	it('rejects when updateAccount returns false or throws', async () => {
		mockUpdateAccount.mockResolvedValueOnce(false);
		const store = createStore();

		const falseAction = await store.dispatch(updateUserFrame(4));
		expect(updateUserFrame.rejected.match(falseAction)).toBe(true);
		expect((falseAction.meta as { error?: { toast?: boolean } }).error).toEqual({ toast: false });

		mockUpdateAccount.mockRejectedValueOnce({ code: 3 });
		const errAction = await store.dispatch(updateUserFrame(4));
		expect(updateUserFrame.rejected.match(errAction)).toBe(true);
		expect((errAction.meta as { error?: { toast?: boolean } }).error).toEqual({ toast: false });
	});

	it.each([-1, 0, 5])('keeps stored encrypt_private_key and applies frame (%i) for an own frame-only profile event', (frame) => {
		let state = accountReducer(undefined, { type: 'init' });
		state = {
			...state,
			userProfile: {
				pro_plan: true,
				encrypt_private_key: 'enc-stored-key',
				user: { id: 'u-1', pro_plan: true, frame: 3 }
			} as never
		};

		const patch = buildOwnProfileAccountPatch({ encrypt_private_key: '', frame }, state.userProfile?.encrypt_private_key);
		expect(patch).not.toBeNull();
		state = accountReducer(state, accountActions.setUpdateAccount(patch as never));

		expect(state.userProfile?.encrypt_private_key).toBe('enc-stored-key');
		expect(state.userProfile?.pro_plan).toBe(true);
		expect(selectAccountFrame({ [ACCOUNT_FEATURE_KEY]: state })).toBe(frame);
	});

	it('returns null when an own profile event carries neither encrypt_private_key nor frame', () => {
		expect(buildOwnProfileAccountPatch({ encrypt_private_key: '', frame: undefined }, 'enc-stored-key')).toBeNull();
	});

	it('applies non-empty encrypt_private_key from own profile event while preserving user.frame', () => {
		let state = accountReducer(undefined, { type: 'init' });
		state = {
			...state,
			userProfile: {
				pro_plan: true,
				encrypt_private_key: 'enc-old',
				user: { id: 'u-1', pro_plan: true, frame: 8 }
			} as never
		};

		const patch = buildOwnProfileAccountPatch({ encrypt_private_key: 'enc-new' }, state.userProfile?.encrypt_private_key);
		expect(patch).not.toBeNull();
		state = accountReducer(state, accountActions.setUpdateAccount(patch as never));

		expect(state.userProfile?.encrypt_private_key).toBe('enc-new');
		expect(selectAccountFrame({ [ACCOUNT_FEATURE_KEY]: state })).toBe(8);
	});
});
