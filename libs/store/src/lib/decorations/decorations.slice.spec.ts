import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { ensureSession } from '../helpers';
import {
	DECORATIONS_CHUNK_SIZE,
	DECORATIONS_FEATURE_KEY,
	DECORATIONS_RETRY_PAUSE_MS,
	classifyDecorationSaveError,
	collectShownDecorationUserIds,
	decorationsActions,
	decorationsReducer,
	fetchUserDecorations,
	selectUserDecorationFrame,
	updateUserDecoration
} from './decorations.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('../helpers', () => ({
	ensureSession: jest.fn(),
	getMezonCtx: jest.fn()
}));

const createStore = (preloadedDecorations?: ReturnType<typeof decorationsReducer>) =>
	configureStore({
		reducer: { [DECORATIONS_FEATURE_KEY]: decorationsReducer },
		...(preloadedDecorations ? { preloadedState: { [DECORATIONS_FEATURE_KEY]: preloadedDecorations } } : {})
	});

describe('decorations.slice', () => {
	const mockListUserDecorations = jest.fn();
	const mockUpdateUserDecoration = jest.fn();

	beforeEach(() => {
		mockListUserDecorations.mockReset();
		mockUpdateUserDecoration.mockReset();
		jest.mocked(ensureSession).mockResolvedValue({
			client: {
				listUserDecorations: mockListUserDecorations,
				updateUserDecoration: mockUpdateUserDecoration
			},
			session: { token: 't' }
		} as never);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('distinguishes unfetched undefined from fetched 0 and stores missing ids as 0', async () => {
		const store = createStore();
		expect(selectUserDecorationFrame(store.getState(), 'u-1')).toBeUndefined();
		expect(selectUserDecorationFrame(store.getState(), 'u-missing')).toBeUndefined();

		mockListUserDecorations.mockResolvedValueOnce({
			decorations: [
				{ user_id: 'u-1', frame: 7 },
				{ user_id: 'u-hidden', frame: -1 }
			]
		});

		await store.dispatch(fetchUserDecorations(['u-1', 'u-hidden', 'u-missing', 'u-1', '', '0']));

		expect(mockListUserDecorations).toHaveBeenCalledTimes(1);
		expect(mockListUserDecorations).toHaveBeenCalledWith({ token: 't' }, ['u-1', 'u-hidden', 'u-missing']);
		expect(selectUserDecorationFrame(store.getState(), 'u-1')).toBe(7);
		expect(selectUserDecorationFrame(store.getState(), 'u-hidden')).toBe(-1);
		expect(selectUserDecorationFrame(store.getState(), 'u-missing')).toBe(0);

		await store.dispatch(fetchUserDecorations(['u-missing', 'u-1']));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(1);
	});

	it('chunks fetchUserDecorations requests to at most 500 ids', async () => {
		const store = createStore();
		const ids = Array.from({ length: DECORATIONS_CHUNK_SIZE * 2 + 200 }, (_, i) => `u-${i + 1}`);
		mockListUserDecorations.mockImplementation(async (_session, chunk: unknown) => {
			const list = chunk as string[];
			return {
				decorations: list.slice(0, 1).map((id) => ({ user_id: id, frame: 3 }))
			};
		});

		await store.dispatch(fetchUserDecorations(ids));

		expect(mockListUserDecorations).toHaveBeenCalledTimes(3);
		expect((mockListUserDecorations.mock.calls[0][1] as string[]).length).toBe(500);
		expect((mockListUserDecorations.mock.calls[1][1] as string[]).length).toBe(500);
		expect((mockListUserDecorations.mock.calls[2][1] as string[]).length).toBe(200);
		expect(selectUserDecorationFrame(store.getState(), 'u-1')).toBe(3);
		expect(selectUserDecorationFrame(store.getState(), 'u-501')).toBe(3);
		expect(selectUserDecorationFrame(store.getState(), 'u-1200')).toBe(0);
	});

	it('skips in-flight ids during concurrent fetches and clears in-flight tracking in finally on rejection', async () => {
		const store = createStore();
		let rejectFirst!: (err: unknown) => void;
		mockListUserDecorations.mockImplementationOnce(
			() =>
				new Promise((_resolve, reject) => {
					rejectFirst = reject;
				})
		);

		const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

		const firstPromise = store.dispatch(fetchUserDecorations(['u-err']));
		await Promise.resolve();
		await store.dispatch(fetchUserDecorations(['u-err']));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(1);

		rejectFirst({ code: 0, error: { code: 404, message: 'Not Found' } });
		await firstPromise;

		await store.dispatch(fetchUserDecorations(['u-err']));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(1);

		nowSpy.mockReturnValue(1_000_000 + DECORATIONS_RETRY_PAUSE_MS + 1);
		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'u-err', frame: 9 }] });
		await store.dispatch(fetchUserDecorations(['u-err']));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(2);
		expect(selectUserDecorationFrame(store.getState(), 'u-err')).toBe(9);
	});

	it('ignores stale in-flight responses and clears state on logout and reset', async () => {
		const store = createStore();
		let resolveFirst!: (val: unknown) => void;
		mockListUserDecorations.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveFirst = resolve;
				})
		);

		const pendingFetch = store.dispatch(fetchUserDecorations(['u-race']));
		await Promise.resolve();

		store.dispatch({ type: 'auth/setLogout' });
		expect(store.getState()[DECORATIONS_FEATURE_KEY].frames).toEqual({});

		resolveFirst({ decorations: [{ user_id: 'u-race', frame: 4 }] });
		await pendingFetch;
		expect(selectUserDecorationFrame(store.getState(), 'u-race')).toBeUndefined();

		store.dispatch(decorationsActions.receiveDecorationUpdated({ userId: 'u-1', frame: 6 }));
		expect(selectUserDecorationFrame(store.getState(), 'u-1')).toBe(6);

		store.dispatch({ type: 'auth/resetSession' });
		expect(store.getState()[DECORATIONS_FEATURE_KEY].frames).toEqual({});

		store.dispatch(decorationsActions.receiveDecorationUpdated({ userId: 'u-2', frame: 8 }));
		store.dispatch(decorationsActions.reset());
		expect(store.getState()[DECORATIONS_FEATURE_KEY].frames).toEqual({});
	});

	it('treats duplicate receiveDecorationUpdated events with unchanged frame as a no-op', () => {
		const initial = decorationsReducer(undefined, decorationsActions.receiveDecorationUpdated({ userId: 'u-1', frame: 5 }));
		expect(initial.frames['u-1']).toBe(5);

		const duplicate = decorationsReducer(initial, decorationsActions.receiveDecorationUpdated({ userId: 'u-1', frame: 5 }));
		expect(duplicate).toBe(initial);

		const changed = decorationsReducer(initial, decorationsActions.receiveDecorationUpdated({ userId: 'u-1', frame: -1 }));
		expect(changed).not.toBe(initial);
		expect(changed.frames['u-1']).toBe(-1);
	});

	it('marks frames stale on reconnect and refetches stale ids without clearing current frame values', async () => {
		const store = createStore();
		store.dispatch(decorationsActions.receiveDecorationUpdated({ userId: 'u-1', frame: 5 }));
		store.dispatch(decorationsActions.markAllStale());

		expect(selectUserDecorationFrame(store.getState(), 'u-1')).toBe(5);
		expect(store.getState()[DECORATIONS_FEATURE_KEY].stale['u-1']).toBe(true);

		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'u-1', frame: 11 }] });
		await store.dispatch(fetchUserDecorations(['u-1']));

		expect(mockListUserDecorations).toHaveBeenCalledTimes(1);
		expect(selectUserDecorationFrame(store.getState(), 'u-1')).toBe(11);
		expect(store.getState()[DECORATIONS_FEATURE_KEY].stale['u-1']).toBeUndefined();
	});

	it('stores updateUserDecoration response and rejects with toast disabled on error', async () => {
		const store = createStore();
		mockUpdateUserDecoration.mockResolvedValueOnce({ user_id: 'self-1', frame: 12 });

		const okAction = await store.dispatch(updateUserDecoration(12));
		expect(updateUserDecoration.fulfilled.match(okAction)).toBe(true);
		expect(selectUserDecorationFrame(store.getState(), 'self-1')).toBe(12);

		mockUpdateUserDecoration.mockRejectedValueOnce({ code: 0, error: { code: 429, message: 'cooldown' } });
		const errAction = await store.dispatch(updateUserDecoration(4));
		expect(updateUserDecoration.rejected.match(errAction)).toBe(true);
		expect((errAction.meta as { error?: { toast?: boolean } }).error).toEqual({ toast: false });
		expect(classifyDecorationSaveError(errAction.payload)).toBe('rateLimited');

		mockUpdateUserDecoration.mockRejectedValueOnce({ status: 412, json: async () => ({ code: 9 }) });
		const httpErrAction = await store.dispatch(updateUserDecoration(4));
		expect(updateUserDecoration.rejected.match(httpErrAction)).toBe(true);
		expect(classifyDecorationSaveError(httpErrAction.payload)).toBe('notPro');
	});

	it('classifies FailedPrecondition, ResourceExhausted, 404, and unknown save errors', () => {
		expect(classifyDecorationSaveError({ code: 9 })).toBe('notPro');
		expect(classifyDecorationSaveError({ code: 0, error: { code: 412 } })).toBe('notPro');
		expect(classifyDecorationSaveError({ code: 8 })).toBe('rateLimited');
		expect(classifyDecorationSaveError({ code: 0, error: { code: 429 } })).toBe('rateLimited');
		expect(classifyDecorationSaveError({ code: 0, error: { code: 404 } })).toBe('unsupported');
		expect(classifyDecorationSaveError({ code: 5 })).toBe('unsupported');
		expect(classifyDecorationSaveError({ status: 404 })).toBe('unsupported');
		expect(classifyDecorationSaveError(new Error('network'))).toBe('failed');
	});

	it('collects shown decoration user ids from own Pro account, current clan Pro members, and active DM/group', () => {
		const ids = collectShownDecorationUserIds({
			account: { userProfile: { pro_plan: true, user: { id: 'me' } } },
			clans: { currentClanId: 'clan-1' },
			usersClan: {
				byClans: {
					'clan-1': {
						entities: {
							entities: {
								p1: { id: 'p1', user: { id: 'p1', pro_plan: true } },
								f1: { id: 'f1', user: { id: 'f1', pro_plan: false } }
							}
						}
					}
				}
			},
			direct: {
				currentDirectMessageId: 'dm-1',
				entities: {
					'dm-1': { user_ids: ['dm-peer-1'] }
				}
			},
			allUsersByAddChannel: {
				entities: {
					'dm-1': { user_ids: ['grp-1', 'p1'] }
				}
			}
		} as never);

		expect(ids).toEqual(['me', 'p1', 'grp-1', 'dm-peer-1']);
	});
});
