import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { ACCOUNT_FEATURE_KEY, accountActions, accountReducer, selectAccountFrame, updateUserFrame } from '../account/account.slice';
import { ensureSession } from '../helpers';
import { USERS_CLANS_FEATURE_KEY, selectIsProUser, selectUserFrame, usersClanActions, usersClanReducer } from './clan.members';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({
	EUserStatus: { ONLINE: 'Online', INVISIBLE: 'Invisible' },
	notificationService: { setUserStatus: jest.fn() }
}));
jest.mock('mezon-js', () => ({}));
jest.mock('react-redux', () => ({ batch: (fn: () => void) => fn() }));
jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../auth/auth.slice', () => ({ authActions: {} }));
jest.mock('../app/setting.slice', () => ({ settingActions: {} }));
jest.mock('../wallet/wallet.slice', () => ({ walletActions: {} }));
jest.mock('../direct/status.slice', () => ({ convertStatusClan: jest.fn(), selectStatusEntities: jest.fn(), statusActions: {} }));
jest.mock('../helpers', () => ({
	getMezonCtx: () => ({}),
	ensureSession: jest.fn(),
	ensureSocket: jest.fn(),
	fetchDataWithSocketFallback: jest.fn(),
	withRetry: jest.fn()
}));

const ME = 'user-me-1';
const CLAN_1 = 'clan-1';
const CLAN_2 = 'clan-2';
const PEER_PRO = 'user-peer-pro';
const PEER_FREE = 'user-peer-free';

const makeRootState = ({
	accountProfile,
	clan1Users = [],
	clan2Users = [],
	currentClanId = CLAN_1
}: {
	accountProfile?: Record<string, unknown> | null;
	clan1Users?: Record<string, unknown>[];
	clan2Users?: Record<string, unknown>[];
	currentClanId?: string;
}) => {
	let accountState = accountReducer(undefined, { type: 'init' });
	if (accountProfile !== undefined) {
		accountState = { ...accountState, userProfile: accountProfile as never };
	}

	let usersClanState = usersClanReducer(undefined, { type: 'init' });
	if (clan1Users.length) {
		usersClanState = usersClanReducer(usersClanState, usersClanActions.upsertMany({ clanId: CLAN_1, users: clan1Users as never }));
	}
	if (clan2Users.length) {
		usersClanState = usersClanReducer(usersClanState, usersClanActions.upsertMany({ clanId: CLAN_2, users: clan2Users as never }));
	}

	return {
		[ACCOUNT_FEATURE_KEY]: accountState,
		[USERS_CLANS_FEATURE_KEY]: usersClanState,
		clans: { currentClanId }
	};
};

describe('selectIsProUser and pro_plan preservation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns true for the signed-in account when Account.pro_plan is true', () => {
		const state = makeRootState({
			accountProfile: { pro_plan: true, user: { id: ME, username: 'me' } }
		});
		expect(selectIsProUser(state, ME)).toBe(true);
	});

	it('returns true for the signed-in account when Account.user.pro_plan is true', () => {
		const state = makeRootState({
			accountProfile: { user: { id: ME, username: 'me', pro_plan: true } }
		});
		expect(selectIsProUser(state, ME)).toBe(true);
	});

	it('returns false for the signed-in account when pro_plan is false even if clan member has true', () => {
		const state = makeRootState({
			accountProfile: { pro_plan: false, user: { id: ME, username: 'me', pro_plan: false } },
			clan1Users: [{ id: ME, user: { id: ME, username: 'me', pro_plan: true } }]
		});
		expect(selectIsProUser(state, ME)).toBe(false);
	});

	it('reads pro_plan from clan members in the current clan and across clans in DM view', () => {
		const clanState = makeRootState({
			accountProfile: { user: { id: ME } },
			clan1Users: [
				{ id: PEER_PRO, user: { id: PEER_PRO, pro_plan: true } },
				{ id: PEER_FREE, user: { id: PEER_FREE, pro_plan: false } }
			],
			clan2Users: [{ id: 'other-pro', user: { id: 'other-pro', pro_plan: true } }],
			currentClanId: CLAN_1
		});
		expect(selectIsProUser(clanState, PEER_PRO)).toBe(true);
		expect(selectIsProUser(clanState, PEER_FREE)).toBe(false);
		expect(selectIsProUser(clanState, 'unknown-user')).toBe(false);
		expect(selectIsProUser(clanState, '')).toBe(false);

		const dmState = { ...clanState, clans: { currentClanId: '0' } };
		expect(selectIsProUser(dmState, PEER_PRO)).toBe(true);
		expect(selectIsProUser(dmState, 'other-pro')).toBe(true);
		expect(selectIsProUser(dmState, PEER_FREE)).toBe(false);
	});

	it('keeps pro_plan across clan member profile updates and upserts lacking pro_plan', () => {
		let usersClanState = usersClanReducer(undefined, { type: 'init' });
		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.upsertMany({
				clanId: CLAN_1,
				users: [{ id: PEER_PRO, user: { id: PEER_PRO, display_name: 'Old', pro_plan: true } }] as never
			})
		);

		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.updateUserProfileAcrossClans({
				userId: PEER_PRO,
				display_name: 'New Name',
				avatar: 'https://cdn/new.png',
				about_me: 'Updated bio'
			})
		);
		let member = usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO] as { user?: { pro_plan?: boolean; display_name?: string } };
		expect(member.user?.display_name).toBe('New Name');
		expect(member.user?.pro_plan).toBe(true);

		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.updateUserDisplayName({
				clanId: CLAN_1,
				userId: PEER_PRO,
				displayName: 'Clan Name',
				avatarUrl: 'https://cdn/avt.png'
			})
		);
		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.updateUserStatus({
				userId: PEER_PRO,
				user_status: 'Busy'
			})
		);
		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.upsertMany({
				clanId: CLAN_1,
				users: [{ id: PEER_PRO, user: { id: PEER_PRO, display_name: 'From GetUsers' } }] as never
			})
		);

		member = usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO] as { user?: { pro_plan?: boolean; display_name?: string } };
		expect(member.user?.display_name).toBe('From GetUsers');
		expect(member.user?.pro_plan).toBe(true);

		const state = {
			[ACCOUNT_FEATURE_KEY]: accountReducer(undefined, { type: 'init' }),
			[USERS_CLANS_FEATURE_KEY]: usersClanState,
			clans: { currentClanId: CLAN_1 }
		};
		expect(selectIsProUser(state, PEER_PRO)).toBe(true);
	});

	it('keeps pro_plan when accountActions.setUpdateAccount applies partial updates', () => {
		let accountState = accountReducer(undefined, { type: 'init' });
		accountState = {
			...accountState,
			userProfile: {
				pro_plan: true,
				user: { id: ME, display_name: 'Me', pro_plan: true }
			} as never
		};

		accountState = accountReducer(accountState, accountActions.setUpdateAccount({ encrypt_private_key: 'key-1' } as never));
		accountState = accountReducer(
			accountState,
			accountActions.setUpdateAccount({
				pro_plan: undefined,
				user: { display_name: 'Me Updated', pro_plan: undefined }
			} as never)
		);

		const profile = accountState.userProfile as { pro_plan?: boolean; user?: { pro_plan?: boolean; display_name?: string } };
		expect(profile.user?.display_name).toBe('Me Updated');
		expect(profile.pro_plan).toBe(true);
		expect(profile.user?.pro_plan).toBe(true);

		const state = {
			[ACCOUNT_FEATURE_KEY]: accountState,
			[USERS_CLANS_FEATURE_KEY]: usersClanReducer(undefined, { type: 'init' }),
			clans: { currentClanId: CLAN_1 }
		};
		expect(selectIsProUser(state, ME)).toBe(true);
	});
});

describe('selectUserFrame and frame preservation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('resolves own account frame before clan members and supports -1, 0, and positive ids', () => {
		const hiddenState = makeRootState({
			accountProfile: { pro_plan: true, user: { id: ME, frame: -1 } },
			clan1Users: [{ id: ME, user: { id: ME, frame: 5 } }]
		});
		expect(selectUserFrame(hiddenState, ME)).toBe(-1);

		const autoState = makeRootState({
			accountProfile: { pro_plan: true, user: { id: ME, frame: 0 } },
			clan1Users: [{ id: ME, user: { id: ME, frame: 5 } }]
		});
		expect(selectUserFrame(autoState, ME)).toBe(0);

		const undefinedState = makeRootState({
			accountProfile: { pro_plan: true, user: { id: ME } },
			clan1Users: [{ id: ME, user: { id: ME, frame: 5 } }]
		});
		expect(selectUserFrame(undefinedState, ME)).toBeUndefined();
	});

	it('reads peer frames from current clan first and falls back across clans in DM view', () => {
		const clanState = makeRootState({
			accountProfile: { user: { id: ME } },
			clan1Users: [
				{ id: PEER_PRO, user: { id: PEER_PRO, frame: 0 } },
				{ id: PEER_FREE, user: { id: PEER_FREE, frame: -1 } }
			],
			clan2Users: [
				{ id: PEER_PRO, user: { id: PEER_PRO, frame: 9 } },
				{ id: 'other-peer', user: { id: 'other-peer', frame: 12 } }
			],
			currentClanId: CLAN_1
		});

		expect(selectUserFrame(clanState, PEER_PRO)).toBe(0);
		expect(selectUserFrame(clanState, PEER_FREE)).toBe(-1);
		expect(selectUserFrame(clanState, 'other-peer')).toBe(12);
		expect(selectUserFrame(clanState, 'unknown-user')).toBeUndefined();
		expect(selectUserFrame(clanState, '')).toBeUndefined();

		const dmState = { ...clanState, clans: { currentClanId: '0' } };
		expect(selectUserFrame(dmState, 'other-peer')).toBe(12);
	});

	it('applies frame in updateUserProfileAcrossClans for -1, 0, and 5 and preserves when omitted', () => {
		let usersClanState = usersClanReducer(undefined, { type: 'init' });
		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.upsertMany({
				clanId: CLAN_1,
				users: [{ id: PEER_PRO, user: { id: PEER_PRO, frame: 3 } }] as never
			})
		);
		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.upsertMany({
				clanId: CLAN_2,
				users: [{ id: PEER_PRO, user: { id: PEER_PRO, frame: 3 } }] as never
			})
		);

		usersClanState = usersClanReducer(usersClanState, usersClanActions.updateUserProfileAcrossClans({ userId: PEER_PRO, frame: -1 }));
		expect((usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO]?.user as { frame?: number })?.frame).toBe(-1);
		expect((usersClanState.byClans[CLAN_2].entities.entities[PEER_PRO]?.user as { frame?: number })?.frame).toBe(-1);

		usersClanState = usersClanReducer(usersClanState, usersClanActions.updateUserProfileAcrossClans({ userId: PEER_PRO, frame: 0 }));
		expect((usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO]?.user as { frame?: number })?.frame).toBe(0);

		usersClanState = usersClanReducer(usersClanState, usersClanActions.updateUserProfileAcrossClans({ userId: PEER_PRO, frame: 5 }));
		expect((usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO]?.user as { frame?: number })?.frame).toBe(5);

		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.updateUserProfileAcrossClans({ userId: PEER_PRO, display_name: 'Renamed' })
		);
		expect((usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO]?.user as { frame?: number })?.frame).toBe(5);
	});

	it('preserves existing frame on upsertMany when incoming lacks frame and overwrites when provided', () => {
		let usersClanState = usersClanReducer(undefined, { type: 'init' });
		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.upsertMany({
				clanId: CLAN_1,
				users: [{ id: PEER_PRO, user: { id: PEER_PRO, pro_plan: true, frame: -1 } }] as never
			})
		);

		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.upsertMany({
				clanId: CLAN_1,
				users: [{ id: PEER_PRO, user: { id: PEER_PRO, display_name: 'Refetched' } }] as never
			})
		);
		expect((usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO]?.user as { frame?: number; pro_plan?: boolean })?.frame).toBe(-1);
		expect((usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO]?.user as { frame?: number; pro_plan?: boolean })?.pro_plan).toBe(true);

		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.upsertMany({
				clanId: CLAN_1,
				users: [{ id: PEER_PRO, user: { id: PEER_PRO, frame: 0 } }] as never
			})
		);
		expect((usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO]?.user as { frame?: number })?.frame).toBe(0);
	});

	it('updates both account and clan members across clans when updateUserFrame fulfills', async () => {
		const updateAccount = jest.fn(async () => true);
		jest.mocked(ensureSession).mockResolvedValueOnce({
			client: { updateAccount },
			session: { token: 't' }
		} as never);

		const preloaded = makeRootState({
			accountProfile: { pro_plan: true, user: { id: ME, pro_plan: true, frame: 0 } },
			clan1Users: [{ id: ME, user: { id: ME, pro_plan: true, frame: 0 } }],
			clan2Users: [{ id: ME, user: { id: ME, pro_plan: true, frame: 0 } }]
		});

		const store = configureStore({
			reducer: {
				[ACCOUNT_FEATURE_KEY]: accountReducer,
				[USERS_CLANS_FEATURE_KEY]: usersClanReducer,
				clans: (state = { currentClanId: CLAN_1 }) => state
			},
			preloadedState: preloaded
		});

		const action = await store.dispatch(updateUserFrame(11));

		expect(updateUserFrame.fulfilled.match(action)).toBe(true);
		expect(selectAccountFrame(store.getState())).toBe(11);
		expect((store.getState()[USERS_CLANS_FEATURE_KEY].byClans[CLAN_1].entities.entities[ME]?.user as { frame?: number })?.frame).toBe(11);
		expect((store.getState()[USERS_CLANS_FEATURE_KEY].byClans[CLAN_2].entities.entities[ME]?.user as { frame?: number })?.frame).toBe(11);
	});
});
