import {
	BREAKOUT_AUTO_CLOSE_RETRY_SECS,
	BREAKOUT_EMPTY_CLOSE_DELAY_SECS,
	BREAKOUT_INVITE_RESPONSE_SECS,
	BreakoutRule,
	breakoutInviteRoomId,
	breakoutInviteToken,
	breakoutInviteesFromAssignments,
	breakoutMenuHeight,
	breakoutSignalFromEvent,
	buildManualAssignments,
	canCreateRoomCount,
	canOpenBreakout,
	canOpenSelectedRooms,
	createOpenedHostedBreakout,
	deleteLastRoom,
	effectiveBreakoutRule,
	isEligibleIdleVoiceChannel,
	loadHostedBreakouts,
	noteHostedBreakoutAutoCloseFailure,
	observeHostedRooms,
	pickNextUnusedIdleChannel,
	placeBreakoutMenu,
	placeUnassignedParticipants,
	planHostedBreakout,
	rebindRoomsToIdlePrefix,
	redistributeAutomatic,
	retainHostedBreakoutsForUser,
	saveHostedBreakouts,
	sortAndLabelIdleChannels,
	toggleParticipantRoom,
	voiceMembersByChannelId
} from './breakout';

describe('breakout domain logic', () => {
	beforeEach(() => {
		const store = new Map<string, string>();
		const mockLocalStorage = {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, val: string) => {
				store.set(key, val);
			},
			removeItem: (key: string) => {
				store.delete(key);
			},
			clear: () => {
				store.clear();
			}
		};
		(globalThis as unknown as { window: { localStorage: typeof mockLocalStorage } }).window = {
			localStorage: mockLocalStorage
		};
	});

	describe('breakoutSignalFromEvent', () => {
		it('parses SelfSelect rooms from self_select_ids', () => {
			const signal = breakoutSignalFromEvent({ channel_id: '0', token: '', self_select_ids: ['101', '0', '102'] }, '999', false);
			expect(signal).toEqual({
				kind: 'Invite',
				invite: { kind: 'Choose', roomIds: ['101', '102'] }
			});
		});

		it('parses Assigned invite when channel_id is a child room and token is present', () => {
			const signal = breakoutSignalFromEvent({ channel_id: '201', token: 'jwt-token', self_select_ids: [] }, '100', false);
			expect(signal).toEqual({
				kind: 'Invite',
				invite: { kind: 'Assigned', roomId: '201', token: 'jwt-token' }
			});
		});

		it('parses Return invite when user is in breakout and event targets parent channel', () => {
			const signal = breakoutSignalFromEvent({ channel_id: '100', token: 'return-jwt' }, '100', true);
			expect(signal).toEqual({
				kind: 'Invite',
				invite: { kind: 'Return', token: 'return-jwt' }
			});
		});

		it('returns Closed signal when user is in parent channel and merge event targets parent channel', () => {
			const signal = breakoutSignalFromEvent({ channel_id: '100', token: 'return-jwt' }, '100', false);
			expect(signal).toEqual({ kind: 'Closed' });
		});

		it('ignores late/duplicate merge event targeting a known breakout parent when user moved to another channel', () => {
			const signal = breakoutSignalFromEvent({ channel_id: '100', token: 'stale-return-jwt' }, '555', false, ['100']);
			expect(signal).toBeNull();
		});

		it('ignores a merge event sent to someone outside the breakout when the target channel already has people', () => {
			const occupied = new Set(['100']);
			const signal = breakoutSignalFromEvent({ channel_id: '100', token: 'merge-jwt' }, '201', false, [], (id) => occupied.has(id));
			expect(signal).toBeNull();
		});

		it('still delivers an assignment to an empty room', () => {
			const signal = breakoutSignalFromEvent({ channel_id: '201', token: 'jwt-token' }, '100', false, [], () => false);
			expect(signal).toEqual({
				kind: 'Invite',
				invite: { kind: 'Assigned', roomId: '201', token: 'jwt-token' }
			});
		});
	});

	describe('breakoutInviteRoomId & breakoutInviteToken', () => {
		it('resolves roomId and token for Assigned, Choose, and Return invites', () => {
			expect(breakoutInviteRoomId({ kind: 'Assigned', roomId: '10', token: 't1' })).toBe('10');
			expect(breakoutInviteToken({ kind: 'Assigned', roomId: '10', token: 't1' })).toBe('t1');

			expect(breakoutInviteRoomId({ kind: 'Choose', roomIds: ['10', '20'] }, '20')).toBe('20');
			expect(breakoutInviteRoomId({ kind: 'Choose', roomIds: ['10', '20'] }, '99')).toBe('10');
			expect(breakoutInviteToken({ kind: 'Choose', roomIds: ['10', '20'] })).toBeNull();

			expect(breakoutInviteRoomId({ kind: 'Return', token: 't2' })).toBeNull();
			expect(breakoutInviteToken({ kind: 'Return', token: 't2' })).toBe('t2');
		});
	});

	describe('observeHostedRooms & planHostedBreakout', () => {
		const baseHosted = createOpenedHostedBreakout({
			breakoutId: '9001',
			parentChannelId: '100',
			clanId: '1',
			roomIds: ['201', '202'],
			ownerUserId: '50',
			invitees: ['61', '62'],
			openedAtUnixSecs: 1000
		});

		it('waits until clan channels and voice members are loaded before observing', () => {
			const obs = observeHostedRooms(baseHosted, false, {});
			expect(obs).toBeNull();
			const result = planHostedBreakout(baseHosted, obs, 1500);
			expect(result.plan).toEqual({ kind: 'Keep' });
		});

		it('does not auto-close empty rooms while invitees are still in parent channel within grace window', () => {
			const obs = observeHostedRooms(baseHosted, true, {
				'100': ['50', '61'],
				'201': [],
				'202': []
			});
			const result = planHostedBreakout(baseHosted, obs, 1050);
			expect(result.plan).toEqual({
				kind: 'RecheckAt',
				atUnixSecs: 1000 + BREAKOUT_INVITE_RESPONSE_SECS
			});
			expect(result.next.emptySinceUnixSecs).toBeNull();
		});

		it('records hadOccupants and removes joined invitees from pendingInvitees', () => {
			const obs = observeHostedRooms(baseHosted, true, {
				'100': ['50', '62'],
				'201': ['61'],
				'202': []
			});
			const result = planHostedBreakout(baseHosted, obs, 1020);
			expect(result.dirty).toBe(true);
			expect(result.next.hadOccupants).toBe(true);
			expect(result.next.pendingInvitees).toEqual(['62']);
			expect(result.plan).toEqual({ kind: 'Keep' });
		});

		it('waits BREAKOUT_EMPTY_CLOSE_DELAY_SECS after all occupants leave before auto-closing, and backs off on failure', () => {
			const occupied = {
				...baseHosted,
				hadOccupants: true,
				pendingInvitees: []
			};
			const emptyObs = observeHostedRooms(occupied, true, {
				'100': ['50', '61', '62'],
				'201': [],
				'202': []
			});

			const firstCheck = planHostedBreakout(occupied, emptyObs, 2000);
			expect(firstCheck.next.emptySinceUnixSecs).toBe(2000);
			expect(firstCheck.plan).toEqual({
				kind: 'RecheckAt',
				atUnixSecs: 2000 + BREAKOUT_EMPTY_CLOSE_DELAY_SECS
			});

			const dueCheck = planHostedBreakout(firstCheck.next, emptyObs, 2000 + BREAKOUT_EMPTY_CLOSE_DELAY_SECS);
			expect(dueCheck.plan).toEqual({ kind: 'Close' });

			const afterFailure = noteHostedBreakoutAutoCloseFailure(dueCheck.next, false, 2020);
			expect(afterFailure.autoCloseFailures).toBe(1);
			expect(afterFailure.autoCloseRetryAt).toBe(2020 + BREAKOUT_AUTO_CLOSE_RETRY_SECS[0]);

			const retryCheck = planHostedBreakout(afterFailure, emptyObs, 2025);
			expect(retryCheck.plan).toEqual({
				kind: 'RecheckAt',
				atUnixSecs: 2020 + BREAKOUT_AUTO_CLOSE_RETRY_SECS[0]
			});
		});
	});

	describe('menu placement', () => {
		it('caps a menu at 8 rows plus padding', () => {
			expect(breakoutMenuHeight(1)).toBe(46);
			expect(breakoutMenuHeight(16)).toBe(242);
			expect(breakoutMenuHeight(0)).toBe(46);
		});

		it('opens below when it fits, flips up near the bottom of the list, and never exceeds the free space', () => {
			const list = { top: 265, bottom: 624 };
			expect(placeBreakoutMenu({ top: 283, bottom: 301 }, list, 240)).toEqual({ up: false, maxHeight: 240 });
			expect(placeBreakoutMenu({ top: 559, bottom: 581 }, list, 240)).toEqual({ up: true, maxHeight: 240 });
			expect(placeBreakoutMenu({ top: 559, bottom: 581 }, list, 44)).toEqual({ up: true, maxHeight: 44 });
			expect(placeBreakoutMenu({ top: 540, bottom: 560 }, list, 44)).toEqual({ up: false, maxHeight: 44 });
			expect(placeBreakoutMenu({ top: 400, bottom: 420 }, { top: 265, bottom: 560 }, 240)).toEqual({ up: false, maxHeight: 136 });
		});
	});

	describe('voiceMembersByChannelId', () => {
		it('flattens the voice member entity state of a clan into string ids per channel', () => {
			expect(voiceMembersByChannelId({ '201': { ids: ['61', 62] }, '202': { ids: [] }, '203': undefined })).toEqual({
				'201': ['61', '62'],
				'202': [],
				'203': []
			});
			expect(voiceMembersByChannelId(undefined)).toEqual({});
		});
	});

	describe('per-account persistence', () => {
		it('isolates hosted breakouts by ownerUserId and persists hadOccupants & pendingInvitees', () => {
			const hostedA = {
				...createOpenedHostedBreakout({
					breakoutId: '9001',
					parentChannelId: '100',
					clanId: '1',
					roomIds: ['201'],
					ownerUserId: '111',
					invitees: ['61', '62'],
					openedAtUnixSecs: 1000
				}),
				hadOccupants: true,
				pendingInvitees: ['62']
			};

			saveHostedBreakouts('111', { '100': hostedA });

			expect(loadHostedBreakouts('222')).toEqual({});
			const loadedA = loadHostedBreakouts('111');
			expect(loadedA['100']).toBeDefined();
			expect(loadedA['100'].ownerUserId).toBe('111');
			expect(loadedA['100'].hadOccupants).toBe(true);
			expect(loadedA['100'].pendingInvitees).toEqual(['62']);
			expect(retainHostedBreakoutsForUser(loadedA, '222')).toEqual({});
		});
	});

	describe('idle channel selection & modal helpers', () => {
		const idleChannels = sortAndLabelIdleChannels([
			{ channelId: '1000', label: 'Room C' },
			{ channelId: '200', label: 'Room A' },
			{ channelId: '300', label: 'Room B' }
		]);

		it('sorts eligible idle channels by numeric snowflake ascending', () => {
			expect(idleChannels.map((c) => c.channelId)).toEqual(['200', '300', '1000']);
			expect(isEligibleIdleVoiceChannel('100', '200', true, false, 0)).toBe(true);
			expect(isEligibleIdleVoiceChannel('100', '100', true, false, 0)).toBe(false);
			expect(isEligibleIdleVoiceChannel('100', '200', true, true, 0)).toBe(false);
			expect(isEligibleIdleVoiceChannel('100', '200', true, false, 2)).toBe(false);
		});

		it('preserves SelfSelect rule and Automatic redistribution when deleting the last room', () => {
			const participants = [
				{ userId: 'u1', displayName: 'U1' },
				{ userId: 'u2', displayName: 'U2' },
				{ userId: 'u3', displayName: 'U3' }
			];
			const rooms = redistributeAutomatic(
				idleChannels.map((c) => ({ channelId: c.channelId, label: c.label, userIds: [], collapsed: false })),
				participants
			);

			// Cannot delete a non-last room
			expect(deleteLastRoom(rooms, 1, BreakoutRule.Automatic, false, participants).deleted).toBe(false);

			// Deleting the last room in Automatic redistributes participants across remaining prefix rooms
			const afterDeleteAuto = deleteLastRoom(rooms, 2, BreakoutRule.Automatic, false, participants);
			expect(afterDeleteAuto.deleted).toBe(true);
			expect(afterDeleteAuto.rooms.map((r) => r.channelId)).toEqual(['200', '300']);
			expect(afterDeleteAuto.rooms[0].userIds).toEqual(['u1', 'u3']);
			expect(afterDeleteAuto.rooms[1].userIds).toEqual(['u2']);

			// SelfSelect remains openable with 0 assigned users after deleting last room
			const selfSelectRooms = afterDeleteAuto.rooms.map((r) => ({ ...r, userIds: [] }));
			expect(canOpenBreakout(BreakoutRule.SelfSelect, selfSelectRooms, idleChannels, 3)).toBe(true);
			expect(effectiveBreakoutRule(BreakoutRule.SelfSelect, false)).toBe(BreakoutRule.SelfSelect);
		});

		it('sends the preview groups for Automatic and Manual rules and lets the server pick the channels', () => {
			const rooms = [
				{ channelId: '200', label: 'Room A', userIds: ['u1'], collapsed: false },
				{ channelId: '300', label: 'Room B', userIds: ['u2'], collapsed: false }
			];
			expect(buildManualAssignments(BreakoutRule.Automatic, rooms)).toEqual([
				{ channel_id: '0', user_ids: ['u1'] },
				{ channel_id: '0', user_ids: ['u2'] }
			]);
			expect(buildManualAssignments(BreakoutRule.SelfSelect, rooms)).toEqual([]);
			expect(breakoutInviteesFromAssignments([['u1'], ['u2']], [], 'host')).toEqual(['u1', 'u2']);
		});

		it('rebinds rooms to idle prefix and keeps their groups, blocking open if idle channels shrink below room count', () => {
			const rooms = [
				{ channelId: '200', label: 'Room A', userIds: ['u1'], collapsed: false },
				{ channelId: '300', label: 'Room B', userIds: ['u2'], collapsed: false }
			];
			const busyB = [idleChannels[0], idleChannels[2]];
			const rebound = rebindRoomsToIdlePrefix(rooms, busyB);
			expect(rebound.map((r) => r.channelId)).toEqual(['200', '1000']);
			expect(rebound[1].label).toBe('Room C');
			expect(rebound[1].userIds).toEqual(['u2']);
			expect(canOpenSelectedRooms(rebound, busyB)).toBe(true);

			const onlyOneIdle = [idleChannels[0]];
			const reboundShort = rebindRoomsToIdlePrefix(rebound, onlyOneIdle);
			expect(reboundShort).toHaveLength(2);
			expect(reboundShort.map((r) => r.channelId)).toEqual(['200', '1000']);
			expect(reboundShort.map((r) => r.label)).toEqual(['Room A', 'Room C']);
			expect(canOpenSelectedRooms(reboundShort, onlyOneIdle)).toBe(false);
			expect(pickNextUnusedIdleChannel(rebound.slice(0, 1), idleChannels)?.channelId).toBe('300');
			expect(canCreateRoomCount(2, idleChannels.length)).toBe(true);
			expect(canCreateRoomCount(4, idleChannels.length)).toBe(false);
		});

		it('keeps every room on its own channel when a room channel gets taken', () => {
			const rooms = idleChannels.map((ch) => ({ channelId: ch.channelId, label: ch.label, userIds: [], collapsed: false }));
			const firstTaken = idleChannels.slice(1);
			const rebound = rebindRoomsToIdlePrefix(rooms, firstTaken);
			expect(rebound.map((r) => r.channelId)).toEqual(['200', '300', '1000']);
			expect(new Set(rebound.map((r) => r.label)).size).toBe(3);
			expect(canOpenSelectedRooms(rebound, firstTaken)).toBe(false);
		});

		it('blocks opening breakout rooms when no other participants are in the call', () => {
			const rooms = [{ channelId: '200', label: 'Room A', userIds: ['u1'], collapsed: false }];
			expect(canOpenBreakout(BreakoutRule.Automatic, rooms, idleChannels, 0)).toBe(false);
			expect(canOpenBreakout(BreakoutRule.Manual, rooms, idleChannels, 0)).toBe(false);
			expect(canOpenBreakout(BreakoutRule.SelfSelect, rooms, idleChannels, 0)).toBe(false);
			expect(canOpenBreakout(BreakoutRule.SelfSelect, [{ ...rooms[0], userIds: [] }], idleChannels, 2)).toBe(true);
			expect(canOpenBreakout(BreakoutRule.Manual, [{ ...rooms[0], userIds: [] }], idleChannels, 2)).toBe(false);
			expect(canOpenBreakout(BreakoutRule.Manual, rooms, idleChannels, 2)).toBe(true);
		});

		it('toggles and places unassigned participants into least populated room', () => {
			const rooms = [
				{ channelId: '200', label: 'Room A', userIds: ['u1', 'u2'], collapsed: false },
				{ channelId: '300', label: 'Room B', userIds: [], collapsed: false }
			];
			const placed = placeUnassignedParticipants(rooms, [
				{ userId: 'u1', displayName: 'U1' },
				{ userId: 'u2', displayName: 'U2' },
				{ userId: 'u3', displayName: 'U3' }
			]);
			expect(placed[1].userIds).toEqual(['u3']);

			const toggled = toggleParticipantRoom(placed, 1, 'u1');
			expect(toggled[0].userIds).toEqual(['u2']);
			expect(toggled[1].userIds).toEqual(['u3', 'u1']);
		});
	});
});
