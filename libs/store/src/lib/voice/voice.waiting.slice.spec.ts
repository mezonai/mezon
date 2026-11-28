import { captureSentryError } from '@mezon/logger';
import { configureStore } from '@reduxjs/toolkit';
import { ensureSession } from '../helpers';
import type { VoiceState } from './voice.slice';
import {
	VOICE_FEATURE_KEY,
	VOICE_JOIN_WAITING_TIMEOUT_MS,
	initialVoiceState,
	isVoiceJoinNotFoundError,
	selectVoiceWaitingUsersByChannelId,
	voiceActions,
	voiceReducer
} from './voice.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock(
	'@mezon/transport',
	() => ({
		SfuBreakoutApiError: class SfuBreakoutApiError extends Error {},
		callSfuBreakoutMerge: jest.fn(),
		callSfuBreakoutRoom: jest.fn()
	}),
	{ virtual: true }
);
jest.mock('@mezon/utils', () => ({
	...jest.requireActual('../../../../utils/src/lib/utils/clanChannel'),
	LENGHT_USER_ID: 19
}));
jest.mock('mezon-js', () => ({ ChannelType: { CHANNEL_TYPE_MEZON_VOICE: 4 } }));
jest.mock('../account/account.slice', () => ({ selectCurrentUserId: jest.fn() }));
jest.mock('../cache-metadata', () => ({
	createApiKey: jest.fn(),
	createCacheMetadata: jest.fn(),
	markApiFirstCalled: jest.fn(),
	shouldForceApiCall: jest.fn()
}));
jest.mock('../channels/channels.slice', () => ({ channelsActions: {}, selectCurrentChannelId: jest.fn() }));
jest.mock('../clans/clans.slice', () => ({ selectCurrentClanId: jest.fn() }));
jest.mock('../helpers', () => ({
	ensureClientAsync: jest.fn(),
	ensureSession: jest.fn(),
	fetchDataWithSocketFallback: jest.fn(),
	getMezonCtx: jest.fn()
}));
jest.mock('../meet/meet.slice', () => ({ generateMeetToken: jest.fn() }));

const ensureSessionMock = ensureSession as jest.Mock;
const captureSentryErrorMock = captureSentryError as jest.Mock;

describe('voice slice waiting room lifecycle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('recognizes HTTP 404, envelope 404, and gRPC NOT_FOUND (5) as not-found errors', () => {
		expect(isVoiceJoinNotFoundError({ code: 404 })).toBe(true);
		expect(isVoiceJoinNotFoundError({ code: 5 })).toBe(true);
		expect(isVoiceJoinNotFoundError({ status: 404 })).toBe(true);
		expect(isVoiceJoinNotFoundError({ error: { code: 404 } })).toBe(true);
		expect(isVoiceJoinNotFoundError({ error: { code: 5 } })).toBe(true);
		expect(isVoiceJoinNotFoundError({ code: 500 })).toBe(false);
		expect(isVoiceJoinNotFoundError(null)).toBe(false);
	});

	it('drops waiting user row when reviewVoiceJoin rejects with 404 and skips Sentry', async () => {
		ensureSessionMock.mockResolvedValue({
			client: {
				reviewVoiceJoin: jest.fn().mockRejectedValue({ code: 404 })
			},
			session: {}
		});

		const preloaded = voiceReducer(
			initialVoiceState,
			voiceActions.receiveVoiceJoinWaitingEvent({
				clan_id: '10',
				channel_id: '200',
				user_id: '300',
				username: 'alice',
				display_name: 'Alice',
				avatar: '',
				create_time_seconds: '1000',
				action: 0
			})
		);

		const store = configureStore({
			reducer: { [VOICE_FEATURE_KEY]: voiceReducer },
			preloadedState: { [VOICE_FEATURE_KEY]: preloaded }
		});

		expect(selectVoiceWaitingUsersByChannelId(store.getState() as never, '200')).toHaveLength(1);

		const action = await store.dispatch(voiceActions.reviewVoiceJoin({ channelId: '200', userId: '300', approve: true }));

		expect(action.meta.requestStatus).toBe('rejected');
		expect(selectVoiceWaitingUsersByChannelId(store.getState() as never, '200')).toHaveLength(0);
		expect(store.getState()[VOICE_FEATURE_KEY].waitingUsersByChannel['200']).toBeUndefined();
		expect(captureSentryErrorMock).not.toHaveBeenCalled();
	});

	it('keeps waiting user row and logs Sentry when reviewVoiceJoin rejects with non-404 error', async () => {
		ensureSessionMock.mockResolvedValue({
			client: {
				reviewVoiceJoin: jest.fn().mockRejectedValue({ code: 500 })
			},
			session: {}
		});

		const preloaded = voiceReducer(
			initialVoiceState,
			voiceActions.receiveVoiceJoinWaitingEvent({
				clan_id: '10',
				channel_id: '200',
				user_id: '300',
				username: 'alice',
				display_name: 'Alice',
				avatar: '',
				create_time_seconds: '1000',
				action: 0
			})
		);

		const store = configureStore({
			reducer: { [VOICE_FEATURE_KEY]: voiceReducer },
			preloadedState: { [VOICE_FEATURE_KEY]: preloaded }
		});

		await store.dispatch(voiceActions.reviewVoiceJoin({ channelId: '200', userId: '300', approve: true }));

		expect(selectVoiceWaitingUsersByChannelId(store.getState() as never, '200')).toHaveLength(1);
		expect(captureSentryErrorMock).toHaveBeenCalledTimes(1);
	});

	it('clears waitingUsersByChannel on resetVoiceControl (leave or reconnect), channel switch, and voiceEnded', () => {
		const withWaiting: VoiceState = voiceReducer(
			{
				...initialVoiceState,
				isJoined: true,
				voiceInfo: { clanId: '10', clanName: 'clan', channelId: '200', channelLabel: 'Voice', channelPrivate: 0 }
			},
			voiceActions.receiveVoiceJoinWaitingEvent({
				clan_id: '10',
				channel_id: '200',
				user_id: '300',
				username: 'alice',
				display_name: 'Alice',
				avatar: '',
				create_time_seconds: '1000',
				action: 0
			})
		);

		const afterLeave = voiceReducer(withWaiting, voiceActions.resetVoiceControl());
		expect(afterLeave.waitingUsersByChannel).toEqual({});

		const afterReconnectReset = voiceReducer(withWaiting, voiceActions.resetVoiceControl({ keepBreakout: true }));
		expect(afterReconnectReset.waitingUsersByChannel).toEqual({});

		const afterSwitch = voiceReducer(
			withWaiting,
			voiceActions.setVoiceInfo({ clanId: '10', clanName: 'clan', channelId: '201', channelLabel: 'Voice 2', channelPrivate: 0 })
		);
		expect(afterSwitch.waitingUsersByChannel['200']).toBeUndefined();

		const afterEnded = voiceReducer(withWaiting, voiceActions.voiceEnded({ clanId: '10', channelId: '200' }));
		expect(afterEnded.waitingUsersByChannel['200']).toBeUndefined();
	});

	it('removes waiting user on action=1 event and prunes expired waiting users after timeout', () => {
		let state = voiceReducer(
			initialVoiceState,
			voiceActions.receiveVoiceJoinWaitingEvent({
				clan_id: '10',
				channel_id: '200',
				user_id: '300',
				username: 'alice',
				display_name: 'Alice',
				avatar: '',
				create_time_seconds: '1000',
				action: 0
			})
		);
		expect(state.waitingUsersByChannel['200']).toHaveLength(1);
		const receivedAt = state.waitingUsersByChannel['200'][0].receivedAt as number;

		const notYetExpired = voiceReducer(
			state,
			voiceActions.pruneExpiredVoiceWaitingUsers({ channelId: '200', now: receivedAt + VOICE_JOIN_WAITING_TIMEOUT_MS - 1000 })
		);
		expect(notYetExpired.waitingUsersByChannel['200']).toHaveLength(1);

		const expired = voiceReducer(
			state,
			voiceActions.pruneExpiredVoiceWaitingUsers({ channelId: '200', now: receivedAt + VOICE_JOIN_WAITING_TIMEOUT_MS })
		);
		expect(expired.waitingUsersByChannel['200']).toBeUndefined();

		state = voiceReducer(
			state,
			voiceActions.receiveVoiceJoinWaitingEvent({
				clan_id: '10',
				channel_id: '200',
				user_id: '300',
				username: 'alice',
				display_name: 'Alice',
				avatar: '',
				create_time_seconds: '1000',
				action: 1
			})
		);
		expect(state.waitingUsersByChannel['200']).toBeUndefined();
	});

	it('populates startedAt on setVoiceJoinWaiting and ignores late admitted token after clearVoiceJoinWaiting', () => {
		const waiting = voiceReducer(
			initialVoiceState,
			voiceActions.setVoiceJoinWaiting({
				clanId: '10',
				clanName: 'clan',
				channelId: '200',
				channelLabel: 'Voice',
				channelPrivate: 0,
				joinRole: 'speaker'
			})
		);
		expect(typeof waiting.voiceJoinWaiting?.startedAt).toBe('number');

		const cancelled = voiceReducer(waiting, voiceActions.clearVoiceJoinWaiting());
		const afterLateAdmit = voiceReducer(
			cancelled,
			voiceActions.receiveVoiceJoinReviewedEvent({
				selfUserId: '300',
				event: {
					clan_id: '10',
					channel_id: '200',
					user_id: '300',
					reviewer_id: '100',
					approved: true,
					token: 'unused-token',
					url: 'wss://sfu.example/ws'
				}
			})
		);
		expect(afterLateAdmit.isJoined).toBe(false);
		expect(afterLateAdmit.token).toBe('');
	});
});
