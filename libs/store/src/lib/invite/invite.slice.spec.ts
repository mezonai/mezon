import { captureSentryError } from '@mezon/logger';
import { configureStore } from '@reduxjs/toolkit';
import { ensureSession } from '../helpers';
import { INVITE_FEATURE_KEY, initialInviteState, inviteActions, inviteReducer, selectInviteById } from './invite.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock(
	'@mezon/translations',
	() => ({
		__esModule: true,
		default: { t: (key: string) => key }
	}),
	{ virtual: true }
);
jest.mock('@mezon/transport', () => ({ createClient: jest.fn() }), { virtual: true });
jest.mock('../helpers', () => ({
	ensureSession: jest.fn(),
	getMezonCtx: jest.fn()
}));

const ensureSessionMock = ensureSession as jest.Mock;
const captureSentryErrorMock = captureSentryError as jest.Mock;

describe('inviteSlice inviteUser join_pending handling', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('resolves when server returns join_pending with clan_id and marks cached invite as pending', async () => {
		const inviteUserApi = jest.fn().mockResolvedValue({
			clan_id: '100',
			channel_id: '200',
			join_pending: true
		});
		ensureSessionMock.mockResolvedValue({ client: { inviteUser: inviteUserApi }, session: {} });

		const store = configureStore({
			reducer: { [INVITE_FEATURE_KEY]: inviteReducer },
			preloadedState: {
				[INVITE_FEATURE_KEY]: inviteReducer(
					initialInviteState,
					inviteActions.add({
						id: 'inv-1',
						clan_id: '100',
						channel_id: '200',
						clan_name: 'Test Clan',
						clan_logo: '',
						member_count: 5,
						banner: '',
						community_banner: '',
						is_community: false
					})
				)
			}
		});

		const result = await store.dispatch(inviteActions.inviteUser({ inviteId: 'inv-1' })).unwrap();

		expect(result).toEqual({ clan_id: '100', channel_id: '200', join_pending: true });
		expect(selectInviteById('inv-1')(store.getState())?.join_pending).toBe(true);
		expect(captureSentryErrorMock).not.toHaveBeenCalled();
	});

	it('resolves when server returns join_pending without clan_id', async () => {
		const inviteUserApi = jest.fn().mockResolvedValue({ join_pending: true });
		ensureSessionMock.mockResolvedValue({ client: { inviteUser: inviteUserApi }, session: {} });

		const store = configureStore({
			reducer: { [INVITE_FEATURE_KEY]: inviteReducer }
		});

		const result = await store.dispatch(inviteActions.inviteUser({ inviteId: 'inv-2' })).unwrap();

		expect(result).toEqual({ join_pending: true });
		expect(captureSentryErrorMock).not.toHaveBeenCalled();
	});

	it('rejects when response has neither clan_id nor join_pending', async () => {
		const inviteUserApi = jest.fn().mockResolvedValue({});
		ensureSessionMock.mockResolvedValue({ client: { inviteUser: inviteUserApi }, session: {} });

		const store = configureStore({
			reducer: { [INVITE_FEATURE_KEY]: inviteReducer }
		});

		const action = await store.dispatch(inviteActions.inviteUser({ inviteId: 'inv-3' }));

		expect(action.meta.requestStatus).toBe('rejected');
		expect(action.payload).toBe('common:cannotJoinClan');
		expect(captureSentryErrorMock).toHaveBeenCalledWith('common:cannotJoinClan', 'invite/inviteUser');
	});
});
