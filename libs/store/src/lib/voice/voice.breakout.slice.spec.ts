import { SfuBreakoutApiError, callSfuBreakoutMerge } from '@mezon/transport';
import type { EntityState } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { ensureClientAsync } from '../helpers';
import { createOpenedHostedBreakout } from './breakout';
import type { VoiceState, VoiceUserData } from './voice.slice';
import { VOICE_FEATURE_KEY, initialVoiceState, voiceActions, voiceReducer } from './voice.slice';

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
jest.mock('@mezon/utils', () => ({ LENGHT_USER_ID: 19 }));
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

const CLAN_ID = '1';
const PARENT_ID = '100';
const CHILD_ID = '201';
const SELF_ID = '61';

function voiceRoom(ids: string[]): EntityState<VoiceUserData, string> {
	return { ids, entities: Object.fromEntries(ids.map((id) => [id, { user_id: id, user_name: '', user_avatar: '' }])) };
}

function joinedState(channelId: string, overrides: Partial<VoiceState> = {}): VoiceState {
	return {
		...initialVoiceState,
		isJoined: true,
		token: 'old-token',
		voiceInfo: { clanId: CLAN_ID, clanName: 'clan', channelId, channelLabel: 'room', channelPrivate: 0 },
		...overrides
	} as VoiceState;
}

describe('voice slice breakout state', () => {
	it('keeps the breakout room through a reconnect but clears it when the call is left', () => {
		const inChild = joinedState(CHILD_ID, {
			breakoutRoom: { parentChannelId: PARENT_ID, parentLabel: 'main', roomId: CHILD_ID },
			breakoutParents: [PARENT_ID]
		});

		const reconnecting = voiceReducer(inChild, voiceActions.resetVoiceControl({ keepBreakout: true }));
		expect(reconnecting.breakoutRoom).toEqual(inChild.breakoutRoom);
		expect(reconnecting.breakoutParents).toEqual([PARENT_ID]);

		const rejoined = voiceReducer(reconnecting, voiceActions.setVoiceInfo(inChild.voiceInfo as NonNullable<VoiceState['voiceInfo']>));
		expect(rejoined.breakoutRoom?.roomId).toBe(CHILD_ID);

		const left = voiceReducer(inChild, voiceActions.resetVoiceControl());
		expect(left.breakoutRoom).toBeNull();
		expect(left.breakoutParents).toEqual([]);
	});

	it('turns the merge event into a return prompt for someone still tracked in a breakout room after a reconnect', () => {
		const inChild = voiceReducer(
			joinedState(CHILD_ID, {
				breakoutRoom: { parentChannelId: PARENT_ID, parentLabel: 'main', roomId: CHILD_ID },
				breakoutParents: [PARENT_ID]
			}),
			voiceActions.resetVoiceControl({ keepBreakout: true })
		);
		const rejoined = voiceReducer(
			{ ...inChild, isJoined: true },
			voiceActions.setVoiceInfo({ clanId: CLAN_ID, clanName: 'clan', channelId: CHILD_ID, channelLabel: 'room', channelPrivate: 0 })
		);
		const next = voiceReducer(
			rejoined,
			voiceActions.receiveBreakoutRoomEvent({ event: { channel_id: PARENT_ID, token: 'merge-jwt' }, selfUserId: SELF_ID })
		);
		expect(next.breakoutInvite).toEqual({ parentChannelId: PARENT_ID, invite: { kind: 'Return', token: 'merge-jwt' } });
	});

	it('ignores the merge event for someone who joined a breakout channel on their own', () => {
		const outsider = joinedState(CHILD_ID, {
			listVoiceMemberByClan: { [CLAN_ID]: { [PARENT_ID]: voiceRoom(['50']), [CHILD_ID]: voiceRoom([SELF_ID]) } }
		});
		const next = voiceReducer(
			outsider,
			voiceActions.receiveBreakoutRoomEvent({ event: { channel_id: PARENT_ID, token: 'merge-jwt' }, selfUserId: SELF_ID })
		);
		expect(next.breakoutInvite).toBeNull();
	});

	it('delivers an assignment to an empty room even when the stale member list still has the user there', () => {
		const inParent = joinedState(PARENT_ID, {
			listVoiceMemberByClan: { [CLAN_ID]: { [PARENT_ID]: voiceRoom(['50', SELF_ID]), [CHILD_ID]: voiceRoom([SELF_ID]) } }
		});
		const next = voiceReducer(
			inParent,
			voiceActions.receiveBreakoutRoomEvent({ event: { channel_id: CHILD_ID, token: 'assign-jwt' }, selfUserId: SELF_ID })
		);
		expect(next.breakoutInvite).toEqual({
			parentChannelId: PARENT_ID,
			invite: { kind: 'Assigned', roomId: CHILD_ID, token: 'assign-jwt' }
		});
	});

	it('drops the old room screen share and recording indicators when switching rooms', () => {
		const sharing = joinedState(PARENT_ID, { showScreen: true, openPopOut: true, recordingUserIds: ['50'] });
		const next = voiceReducer(
			sharing,
			voiceActions.applyBreakoutRoomSwitch({
				channelId: CHILD_ID,
				channelLabel: 'child',
				channelPrivate: 0,
				token: 'child-token',
				sfuUrl: '',
				breakoutRoom: { parentChannelId: PARENT_ID, parentLabel: 'main', roomId: CHILD_ID }
			})
		);
		expect(next.voiceInfo?.channelId).toBe(CHILD_ID);
		expect(next.token).toBe('child-token');
		expect(next.showScreen).toBe(false);
		expect(next.openPopOut).toBe(false);
		expect(next.recordingUserIds).toEqual([]);
	});

	describe('auto close', () => {
		const hosted = createOpenedHostedBreakout({
			breakoutId: '9001',
			parentChannelId: PARENT_ID,
			clanId: CLAN_ID,
			roomIds: [CHILD_ID],
			ownerUserId: '50',
			invitees: [SELF_ID],
			openedAtUnixSecs: 1000
		});

		function storeWithRooms(childMembers: string[]) {
			return configureStore({
				reducer: { [VOICE_FEATURE_KEY]: voiceReducer },
				preloadedState: {
					[VOICE_FEATURE_KEY]: {
						...initialVoiceState,
						hostedBreakouts: { [PARENT_ID]: { ...hosted, hadOccupants: true, pendingInvitees: [] } },
						listVoiceMemberByClan: {
							[CLAN_ID]: { [PARENT_ID]: voiceRoom(['50']), [CHILD_ID]: voiceRoom(childMembers) }
						}
					}
				}
			});
		}

		beforeEach(() => {
			jest.mocked(callSfuBreakoutMerge).mockReset();
			jest.mocked(ensureClientAsync).mockResolvedValue({ client: {} } as never);
		});

		it('does not close the rooms when the refreshed member list shows someone is still in them', async () => {
			const store = storeWithRooms([SELF_ID]);
			const action = await store.dispatch(voiceActions.autoCloseHostedBreakout({ parentChannelId: PARENT_ID, breakoutId: '9001' }));
			expect(action.payload).toMatchObject({ outcome: 'stillOccupied' });
			expect(callSfuBreakoutMerge).not.toHaveBeenCalled();
			const after = store.getState()[VOICE_FEATURE_KEY].hostedBreakouts[PARENT_ID];
			expect(after?.autoCloseFailures).toBe(0);
			expect(store.getState()[VOICE_FEATURE_KEY].closingBreakoutIds).toEqual([]);
		});

		it('closes the rooms once they are really empty', async () => {
			const store = storeWithRooms([]);
			const action = await store.dispatch(voiceActions.autoCloseHostedBreakout({ parentChannelId: PARENT_ID, breakoutId: '9001' }));
			expect(voiceActions.autoCloseHostedBreakout.fulfilled.match(action)).toBe(true);
			expect(callSfuBreakoutMerge).toHaveBeenCalledWith({}, { target_id: '9001' });
			expect(store.getState()[VOICE_FEATURE_KEY].hostedBreakouts[PARENT_ID]).toBeUndefined();
		});

		it('resolves instead of rejecting when the merge fails, so no global error is raised', async () => {
			jest.mocked(callSfuBreakoutMerge).mockRejectedValueOnce(new SfuBreakoutApiError('The socket timed out while waiting for a response.'));
			const store = storeWithRooms([]);
			const action = await store.dispatch(voiceActions.autoCloseHostedBreakout({ parentChannelId: PARENT_ID, breakoutId: '9001' }));
			expect(voiceActions.autoCloseHostedBreakout.fulfilled.match(action)).toBe(true);
			expect(action.payload).toMatchObject({ outcome: 'failed', permanent: false });
			const after = store.getState()[VOICE_FEATURE_KEY];
			expect(after.hostedBreakouts[PARENT_ID]?.autoCloseFailures).toBe(1);
			expect(after.closingBreakoutIds).toEqual([]);
		});
	});
});
