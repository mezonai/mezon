import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { ensureSession } from '../helpers';
import {
	DECORATIONS_CHUNK_SIZE,
	DECORATIONS_CLAN_FRESHNESS_MS,
	DECORATIONS_FEATURE_KEY,
	DECORATIONS_RETRY_PAUSE_MS,
	classifyDecorationSaveError,
	collectShownDecorationUserIds,
	decorationsActions,
	decorationsReducer,
	fetchClanUserDecorations,
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

const createClanStore = (options?: {
	decorations?: ReturnType<typeof decorationsReducer>;
	usersClan?: unknown;
	account?: unknown;
	clans?: unknown;
	direct?: unknown;
	allUsersByAddChannel?: unknown;
}) =>
	configureStore({
		reducer: {
			[DECORATIONS_FEATURE_KEY]: decorationsReducer,
			usersClan: (state = options?.usersClan ?? { byClans: {} }) => state,
			account: (state = options?.account ?? {}) => state,
			clans: (state = options?.clans ?? {}) => state,
			direct: (state = options?.direct ?? {}) => state,
			allUsersByAddChannel: (state = options?.allUsersByAddChannel ?? {}) => state
		},
		...(options?.decorations ? { preloadedState: { [DECORATIONS_FEATURE_KEY]: options.decorations } } : {})
	});

describe('decorations.slice', () => {
	const mockListUserDecorations = jest.fn();
	const mockUpdateUserDecoration = jest.fn();

	beforeEach(() => {
		decorationsReducer(undefined, decorationsActions.reset());
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

	it('collects shown decoration user ids from own Pro account and active DM/group while excluding current clan members', () => {
		const baseState = {
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
		};

		expect(collectShownDecorationUserIds(baseState as never)).toEqual(['me', 'grp-1', 'dm-peer-1']);

		expect(
			collectShownDecorationUserIds({
				...baseState,
				usersClan: {
					byClans: {
						'clan-1': {
							entities: {
								entities: {
									...baseState.usersClan.byClans['clan-1'].entities.entities,
									me: { id: 'me', user: { id: 'me', pro_plan: true } }
								}
							}
						}
					}
				}
			} as never)
		).toEqual(['grp-1', 'dm-peer-1']);

		expect(
			collectShownDecorationUserIds({
				...baseState,
				clans: { currentClanId: '0' }
			} as never)
		).toEqual(['me', 'grp-1', 'p1', 'dm-peer-1']);
	});

	it('reconnect frees in-flight ids for a refetch and drops the older in-flight answer', async () => {
		const store = createStore();
		let resolveFirst!: (value: unknown) => void;
		mockListUserDecorations.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveFirst = resolve;
				})
		);
		const firstPromise = store.dispatch(fetchUserDecorations(['u-1']));
		for (let i = 0; i < 5; i += 1) {
			await Promise.resolve();
		}
		expect(mockListUserDecorations).toHaveBeenCalledTimes(1);

		store.dispatch(decorationsActions.markAllStale());
		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'u-1', frame: 6 }] });
		await store.dispatch(fetchUserDecorations(['u-1']));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(2);
		expect(selectUserDecorationFrame(store.getState(), 'u-1')).toBe(6);

		resolveFirst({ decorations: [{ user_id: 'u-1', frame: 2 }] });
		await firstPromise;
		expect(selectUserDecorationFrame(store.getState(), 'u-1')).toBe(6);
	});

	it('treats an empty updateUserDecoration reply as unsupported and keeps the stored frame', async () => {
		const store = createStore();
		store.dispatch(decorationsActions.receiveDecorationUpdated({ userId: 'self-1', frame: 3 }));
		mockUpdateUserDecoration.mockResolvedValueOnce({ user_id: '0', frame: 0 });

		const action = await store.dispatch(updateUserDecoration(7));
		expect(updateUserDecoration.rejected.match(action)).toBe(true);
		expect(classifyDecorationSaveError(action.payload)).toBe('unsupported');
		expect(selectUserDecorationFrame(store.getState(), 'self-1')).toBe(3);
		expect(selectUserDecorationFrame(store.getState(), '0')).toBeUndefined();
	});

	it('fetches clan decorations in clan mode and skips fresh clans until the freshness window expires', async () => {
		const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
		const store = createClanStore({
			usersClan: {
				byClans: {
					'clan-1': {
						entities: {
							entities: {
								'u-pro': { id: 'u-pro', user: { id: 'u-pro', pro_plan: true } }
							}
						}
					}
				}
			}
		});

		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'u-pro', frame: 7 }] });
		await store.dispatch(fetchClanUserDecorations('clan-1'));

		expect(mockListUserDecorations).toHaveBeenCalledTimes(1);
		expect(mockListUserDecorations).toHaveBeenCalledWith({ token: 't' }, [], 'clan-1');
		expect(selectUserDecorationFrame(store.getState(), 'u-pro')).toBe(7);

		nowSpy.mockReturnValue(1_000_000 + DECORATIONS_CLAN_FRESHNESS_MS - 1);
		await store.dispatch(fetchClanUserDecorations('clan-1'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(1);

		nowSpy.mockReturnValue(1_000_000 + DECORATIONS_CLAN_FRESHNESS_MS);
		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'u-pro', frame: 11 }] });
		await store.dispatch(fetchClanUserDecorations('clan-1'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(2);
		expect(selectUserDecorationFrame(store.getState(), 'u-pro')).toBe(11);
	});

	it('leaves absent non-Pro members unfetched while zeroing absent Pro and existing entries', async () => {
		const store = createClanStore({
			decorations: {
				frames: { 'u-existing-free': 5, 'u-pro-absent': 9 },
				stale: { 'u-existing-free': true, 'u-pro-absent': true },
				generation: 0
			},
			usersClan: {
				byClans: {
					'clan-1': {
						entities: {
							entities: {
								'u-pro-returned': { id: 'u-pro-returned', user: { id: 'u-pro-returned', pro_plan: true } },
								'u-pro-absent': { id: 'u-pro-absent', user: { id: 'u-pro-absent', pro_plan: true } },
								'u-free-absent': { id: 'u-free-absent', user: { id: 'u-free-absent', pro_plan: false } },
								'u-existing-free': { id: 'u-existing-free', user: { id: 'u-existing-free', pro_plan: false } },
								'u-free-returned': { id: 'u-free-returned', user: { id: 'u-free-returned', pro_plan: false } }
							}
						}
					}
				}
			}
		});

		mockListUserDecorations.mockResolvedValueOnce({
			decorations: [
				{ user_id: 'u-pro-returned', frame: -1 },
				{ user_id: 'u-free-returned', frame: 4 }
			]
		});
		await store.dispatch(fetchClanUserDecorations('clan-1'));

		expect(selectUserDecorationFrame(store.getState(), 'u-pro-returned')).toBe(-1);
		expect(selectUserDecorationFrame(store.getState(), 'u-free-returned')).toBe(4);
		expect(selectUserDecorationFrame(store.getState(), 'u-pro-absent')).toBe(0);
		expect(selectUserDecorationFrame(store.getState(), 'u-existing-free')).toBe(0);
		expect(selectUserDecorationFrame(store.getState(), 'u-free-absent')).toBeUndefined();
		expect(store.getState()[DECORATIONS_FEATURE_KEY].stale['u-pro-absent']).toBeUndefined();
		expect(store.getState()[DECORATIONS_FEATURE_KEY].stale['u-existing-free']).toBeUndefined();
	});

	it('keeps in-flight receiveDecorationUpdated and updateUserDecoration values over an older clan response', async () => {
		const store = createClanStore({
			usersClan: {
				byClans: {
					'clan-1': {
						entities: {
							entities: {
								'u-rt': { id: 'u-rt', user: { id: 'u-rt', pro_plan: true } },
								'u-own': { id: 'u-own', user: { id: 'u-own', pro_plan: true } },
								'u-other': { id: 'u-other', user: { id: 'u-other', pro_plan: true } }
							}
						}
					}
				}
			}
		});

		let resolveClan!: (value: unknown) => void;
		mockListUserDecorations.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveClan = resolve;
				})
		);

		const clanFetchPromise = store.dispatch(fetchClanUserDecorations('clan-1'));
		for (let i = 0; i < 5; i += 1) {
			await Promise.resolve();
		}

		store.dispatch(decorationsActions.receiveDecorationUpdated({ userId: 'u-rt', frame: 14 }));
		mockUpdateUserDecoration.mockResolvedValueOnce({ user_id: 'u-own', frame: 9 });
		await store.dispatch(updateUserDecoration(9));

		resolveClan({
			decorations: [
				{ user_id: 'u-rt', frame: 2 },
				{ user_id: 'u-other', frame: 8 }
			]
		});
		await clanFetchPromise;

		expect(selectUserDecorationFrame(store.getState(), 'u-rt')).toBe(14);
		expect(selectUserDecorationFrame(store.getState(), 'u-own')).toBe(9);
		expect(selectUserDecorationFrame(store.getState(), 'u-other')).toBe(8);
	});

	it('deduplicates in-flight clan fetches and applies retry pause per clan', async () => {
		const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(2_000_000);
		const store = createClanStore();

		let rejectClan1!: (err: unknown) => void;
		mockListUserDecorations
			.mockImplementationOnce(
				() =>
					new Promise((_resolve, reject) => {
						rejectClan1 = reject;
					})
			)
			.mockResolvedValueOnce({ decorations: [{ user_id: 'u-c2', frame: 6 }] });

		const clan1Promise = store.dispatch(fetchClanUserDecorations('clan-1'));
		await Promise.resolve();
		await store.dispatch(fetchClanUserDecorations('clan-1'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(1);

		await store.dispatch(fetchClanUserDecorations('clan-2'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(2);
		expect(mockListUserDecorations).toHaveBeenNthCalledWith(2, { token: 't' }, [], 'clan-2');
		expect(selectUserDecorationFrame(store.getState(), 'u-c2')).toBe(6);

		rejectClan1({ code: 0, error: { code: 500, message: 'err' } });
		await clan1Promise;

		await store.dispatch(fetchClanUserDecorations('clan-1'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(2);

		nowSpy.mockReturnValue(2_000_000 + DECORATIONS_RETRY_PAUSE_MS + 1);
		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'u-c1', frame: 3 }] });
		await store.dispatch(fetchClanUserDecorations('clan-1'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(3);
		expect(selectUserDecorationFrame(store.getState(), 'u-c1')).toBe(3);
	});

	it('refetches current clan on reconnect without duplicating current clan ids and drops pre-reconnect clan answers', async () => {
		const store = createClanStore({
			account: { userProfile: { pro_plan: true, user: { id: 'me' } } },
			clans: { currentClanId: 'clan-1' },
			usersClan: {
				byClans: {
					'clan-1': {
						entities: {
							entities: {
								me: { id: 'me', user: { id: 'me', pro_plan: true } },
								'u-clan-pro': { id: 'u-clan-pro', user: { id: 'u-clan-pro', pro_plan: true } }
							}
						}
					}
				}
			},
			direct: {
				currentDirectMessageId: 'dm-1',
				entities: {
					'dm-1': { user_ids: ['u-dm'] }
				}
			}
		});

		let resolvePreReconnect!: (value: unknown) => void;
		mockListUserDecorations.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolvePreReconnect = resolve;
				})
		);

		const preReconnectPromise = store.dispatch(fetchClanUserDecorations('clan-1'));
		for (let i = 0; i < 5; i += 1) {
			await Promise.resolve();
		}

		store.dispatch(decorationsActions.markAllStale());
		mockListUserDecorations
			.mockResolvedValueOnce({ decorations: [{ user_id: 'u-clan-pro', frame: 10 }] })
			.mockResolvedValueOnce({ decorations: [{ user_id: 'u-dm', frame: 12 }] });

		await store.dispatch(fetchClanUserDecorations('clan-1'));
		const shownIds = collectShownDecorationUserIds(store.getState() as never);
		expect(shownIds).toEqual(['u-dm']);
		await store.dispatch(fetchUserDecorations(shownIds));

		expect(mockListUserDecorations).toHaveBeenCalledTimes(3);
		expect(mockListUserDecorations).toHaveBeenNthCalledWith(2, { token: 't' }, [], 'clan-1');
		expect(mockListUserDecorations).toHaveBeenNthCalledWith(3, { token: 't' }, ['u-dm']);
		expect(selectUserDecorationFrame(store.getState(), 'u-clan-pro')).toBe(10);
		expect(selectUserDecorationFrame(store.getState(), 'u-dm')).toBe(12);

		resolvePreReconnect({ decorations: [{ user_id: 'u-clan-pro', frame: 2 }] });
		await preReconnectPromise;
		expect(selectUserDecorationFrame(store.getState(), 'u-clan-pro')).toBe(10);
	});

	it('clears clan freshness and retry pause on logout and ignores pre-logout clan answers', async () => {
		const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(3_000_000);
		const store = createClanStore();

		let resolvePending!: (value: unknown) => void;
		mockListUserDecorations.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolvePending = resolve;
				})
		);

		const pendingPromise = store.dispatch(fetchClanUserDecorations('clan-1'));
		await Promise.resolve();

		store.dispatch({ type: 'auth/setLogout' });
		resolvePending({ decorations: [{ user_id: 'u-stale', frame: 4 }] });
		await pendingPromise;
		expect(selectUserDecorationFrame(store.getState(), 'u-stale')).toBeUndefined();

		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'u-fresh', frame: 9 }] });
		await store.dispatch(fetchClanUserDecorations('clan-1'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(2);
		expect(selectUserDecorationFrame(store.getState(), 'u-fresh')).toBe(9);

		store.dispatch({ type: 'auth/resetSession' });
		mockListUserDecorations.mockRejectedValueOnce({ code: 0, error: { code: 500 } });
		await store.dispatch(fetchClanUserDecorations('clan-2'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(3);

		await store.dispatch(fetchClanUserDecorations('clan-2'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(3);

		store.dispatch(decorationsActions.reset());
		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'u-reset', frame: 15 }] });
		await store.dispatch(fetchClanUserDecorations('clan-2'));
		expect(mockListUserDecorations).toHaveBeenCalledTimes(4);
		expect(selectUserDecorationFrame(store.getState(), 'u-reset')).toBe(15);
		nowSpy.mockRestore();
	});

	it('asks by id for Pro members missing from a clan that was fetched recently', async () => {
		type Member = { id: string; user: { id: string; pro_plan?: boolean } };
		const initialMembers: Record<string, Member> = { a: { id: 'a', user: { id: 'a', pro_plan: true } } };
		const usersClan = (
			state = { byClans: { c1: { entities: { entities: initialMembers } } } },
			action: { type: string; payload?: Record<string, Member> }
		) =>
			action.type === 'test/addMembers'
				? { byClans: { c1: { entities: { entities: { ...state.byClans.c1.entities.entities, ...action.payload } } } } }
				: state;
		const store = configureStore({ reducer: { [DECORATIONS_FEATURE_KEY]: decorationsReducer, usersClan } });
		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'a', frame: 4 }] });
		await store.dispatch(fetchClanUserDecorations('c1') as never);
		expect(mockListUserDecorations).toHaveBeenLastCalledWith({ token: 't' }, [], 'c1');

		store.dispatch({
			type: 'test/addMembers',
			payload: { u: { id: 'u', user: { id: 'u', pro_plan: true } }, n: { id: 'n', user: { id: 'n', pro_plan: false } } }
		});
		mockListUserDecorations.mockResolvedValueOnce({ decorations: [{ user_id: 'u', frame: 7 }] });
		await store.dispatch(fetchClanUserDecorations('c1') as never);
		await new Promise((r) => setTimeout(r, 0));

		expect(mockListUserDecorations).toHaveBeenCalledTimes(2);
		expect(mockListUserDecorations).toHaveBeenLastCalledWith({ token: 't' }, ['u']);
		expect(selectUserDecorationFrame(store.getState(), 'u')).toBe(7);
		expect(selectUserDecorationFrame(store.getState(), 'n')).toBeUndefined();
	});
});
