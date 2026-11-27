import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ACCOUNT_FEATURE_KEY, accountActions, accountReducer } from '../account/account.slice';
import { ensureSession, fetchDataWithSocketFallback } from '../helpers';
import {
	USERS_CLANS_FEATURE_KEY,
	buildPeerClanProfileUpdate,
	fetchUsersClan,
	selectIsProUser,
	usersClanActions,
	usersClanReducer
} from './clan.members';

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
jest.mock('../decorations/decorations.slice', () => ({
	fetchUserDecorations: jest.fn((ids: string[]) => ({ type: 'decorations/fetchUserDecorations', payload: ids }))
}));
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

describe('peer profile bio preservation and clan decoration fetch', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('keeps stored about_me when peer UserProfileUpdatedEvent omits or blanks about_me', () => {
		let usersClanState = usersClanReducer(undefined, { type: 'init' });
		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.upsertMany({
				clanId: CLAN_1,
				users: [{ id: PEER_PRO, user: { id: PEER_PRO, about_me: 'Keep my bio' } }] as never
			})
		);

		const payload = buildPeerClanProfileUpdate({
			user_id: PEER_PRO,
			avatar: '',
			display_name: 'Alice',
			about_me: ''
		});
		expect(payload).toEqual({ userId: PEER_PRO, display_name: 'Alice' });

		usersClanState = usersClanReducer(usersClanState, usersClanActions.updateUserProfileAcrossClans(payload));
		const clan1User = usersClanState.byClans[CLAN_1].entities.entities[PEER_PRO]?.user as { about_me?: string; display_name?: string };
		expect(clan1User?.about_me).toBe('Keep my bio');
		expect(clan1User?.display_name).toBe('Alice');
	});

	it('skips updateOne in updateUserProfileAcrossClans when all provided fields match stored values', () => {
		let usersClanState = usersClanReducer(undefined, { type: 'init' });
		usersClanState = usersClanReducer(
			usersClanState,
			usersClanActions.upsertMany({
				clanId: CLAN_1,
				users: [
					{
						id: PEER_PRO,
						user: {
							id: PEER_PRO,
							avatar_url: 'https://cdn/a.png',
							display_name: 'Alice',
							about_me: 'Bio'
						}
					}
				] as never
			})
		);

		const afterEcho = usersClanReducer(
			usersClanState,
			usersClanActions.updateUserProfileAcrossClans({
				userId: PEER_PRO,
				avatar: 'https://cdn/a.png',
				display_name: 'Alice',
				about_me: 'Bio'
			})
		);
		expect(afterEcho).toBe(usersClanState);
	});

	it('dispatches fetchUserDecorations for Pro clan members after fetchUsersClan loads', async () => {
		jest.mocked(ensureSession).mockResolvedValueOnce({
			client: { listClanUsers: jest.fn() },
			session: { token: 't' }
		} as never);
		jest.mocked(fetchDataWithSocketFallback).mockResolvedValueOnce({
			clan_users: [{ user: { id: PEER_PRO, pro_plan: true } }, { user: { id: PEER_FREE, pro_plan: false } }]
		} as never);

		const dispatched: unknown[] = [];
		const dispatch = jest.fn((action: unknown) => {
			dispatched.push(action);
			return action;
		});
		const getState = () => ({ [USERS_CLANS_FEATURE_KEY]: usersClanReducer(undefined, { type: 'init' }) });

		await fetchUsersClan({ clanId: CLAN_1, noCache: true })(dispatch as never, getState, undefined);
		expect(dispatched).toContainEqual({ type: 'decorations/fetchUserDecorations', payload: [PEER_PRO] });
	});
});
