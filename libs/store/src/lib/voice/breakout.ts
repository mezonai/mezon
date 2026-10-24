import type { SfuBreakoutParticipant } from 'mezon-js-protobuf';

export enum BreakoutRule {
	Automatic = 1,
	Manual = 2,
	SelfSelect = 3
}

export type BreakoutInvite =
	| { kind: 'Assigned'; roomId: string; token?: string }
	| { kind: 'Choose'; roomIds: string[] }
	| { kind: 'Return'; token?: string };

export type BreakoutSignal = { kind: 'Invite'; invite: BreakoutInvite } | { kind: 'Closed' };

export interface BreakoutRoomState {
	parentChannelId: string;
	parentLabel: string;
	roomId: string;
}

export interface BreakoutInviteState {
	parentChannelId: string;
	invite: BreakoutInvite;
}

export interface HostedBreakout {
	breakoutId: string;
	parentChannelId: string;
	clanId: string;
	roomIds: string[];
	ownerUserId: string;
	invitees: string[];
	pendingInvitees: string[];
	openedAtUnixSecs: number;
	hadOccupants: boolean;
	closedSignal?: boolean;
	emptySinceUnixSecs?: number | null;
	autoCloseFailures?: number;
	autoCloseRetryAt?: number;
	autoCloseGaveUp?: boolean;
}

export interface HostedRoomsObservation {
	occupants: Set<string>;
	parentMembers: Set<string>;
}

export type HostedBreakoutPlan = { kind: 'Keep' } | { kind: 'RecheckAt'; atUnixSecs: number } | { kind: 'Close' };

export interface BreakoutParticipantItem {
	userId: string;
	displayName: string;
	avatarUrl?: string;
}

export interface IdleVoiceChannelItem {
	channelId: string;
	label: string;
}

export interface DraftBreakoutRoom {
	channelId: string;
	label: string;
	userIds: string[];
	collapsed: boolean;
}

export interface BreakoutMenuPlacement {
	up: boolean;
	maxHeight: number;
}

export const MAX_BREAKOUT_ROOMS = 50;
export const BREAKOUT_INVITE_RESPONSE_SECS = 180;
export const BREAKOUT_EMPTY_CLOSE_DELAY_SECS = 20;
export const BREAKOUT_UNOBSERVED_RECHECK_SECS = 30;
export const BREAKOUT_AUTO_CLOSE_RETRY_SECS: readonly [number, number] = [15, 60];
export const BREAKOUT_MENU_ROW_HEIGHT = 28;
export const BREAKOUT_MENU_MAX_LIST_HEIGHT = 224;
export const BREAKOUT_MENU_PADDING = 18;
const BREAKOUT_MENU_GAP = 4;
export const API_INVALID_ARGUMENT = 3;
export const API_NOT_FOUND = 5;
export const API_PERMISSION_DENIED = 7;
export const API_FAILED_PRECONDITION = 9;

const HOSTED_BREAKOUTS_STORAGE_PREFIX = 'mezon.voice.hostedBreakouts.';
const HOSTED_BREAKOUTS_STORAGE_VERSION = 2;

interface PersistedHostedBreakoutsEnvelope {
	version: number;
	ownerUserId: string;
	entries: Array<{
		breakoutId: string;
		parentChannelId: string;
		clanId: string;
		roomIds: string[];
		ownerUserId: string;
		invitees?: string[];
		pendingInvitees?: string[];
		openedAtUnixSecs?: number;
		hadOccupants?: boolean;
	}>;
}

function isValidSnowflakeId(value: string | null | undefined): value is string {
	return typeof value === 'string' && value.trim().length > 0 && value.trim() !== '0';
}

export function createOpenedHostedBreakout(params: {
	breakoutId: string;
	parentChannelId: string;
	clanId: string;
	roomIds: string[];
	ownerUserId: string;
	invitees: string[];
	openedAtUnixSecs: number;
}): HostedBreakout {
	const invitees = Array.from(new Set(params.invitees.filter(isValidSnowflakeId)));
	return {
		breakoutId: params.breakoutId,
		parentChannelId: params.parentChannelId,
		clanId: params.clanId,
		roomIds: params.roomIds.filter(isValidSnowflakeId),
		ownerUserId: params.ownerUserId,
		invitees,
		pendingInvitees: [...invitees],
		openedAtUnixSecs: params.openedAtUnixSecs,
		hadOccupants: false,
		closedSignal: false,
		emptySinceUnixSecs: null,
		autoCloseFailures: 0,
		autoCloseRetryAt: 0,
		autoCloseGaveUp: false
	};
}

export function noteHostedBreakoutAutoCloseFailure(hosted: HostedBreakout, permanent: boolean, nowUnixSecs: number): HostedBreakout {
	const failures = (hosted.autoCloseFailures ?? 0) + 1;
	const retryDelay = !permanent ? BREAKOUT_AUTO_CLOSE_RETRY_SECS[failures - 1] : undefined;
	if (retryDelay !== undefined) {
		return {
			...hosted,
			autoCloseFailures: failures,
			autoCloseRetryAt: nowUnixSecs + retryDelay
		};
	}
	return {
		...hosted,
		autoCloseFailures: failures,
		autoCloseGaveUp: true
	};
}

export function breakoutInviteesFromAssignments(
	assignments: ReadonlyArray<readonly string[]>,
	participants: readonly BreakoutParticipantItem[],
	hostUserId?: string | null
): string[] {
	const seen = new Set<string>();
	const assigned = assignments.flat().filter(isValidSnowflakeId);
	const candidates = assigned.length > 0 ? assigned : participants.map((p) => p.userId).filter(isValidSnowflakeId);
	const out: string[] = [];
	for (const uid of candidates) {
		if (hostUserId && uid === hostUserId) {
			continue;
		}
		if (!seen.has(uid)) {
			seen.add(uid);
			out.push(uid);
		}
	}
	return out;
}

export function breakoutInviteRoomId(invite: BreakoutInvite, selectedRoomId?: string | null): string | null {
	switch (invite.kind) {
		case 'Assigned':
			return invite.roomId;
		case 'Choose': {
			if (selectedRoomId && invite.roomIds.includes(selectedRoomId)) {
				return selectedRoomId;
			}
			return invite.roomIds[0] ?? null;
		}
		case 'Return':
			return null;
	}
}

export function breakoutInviteToken(invite: BreakoutInvite): string | null {
	switch (invite.kind) {
		case 'Assigned':
		case 'Return':
			return invite.token || null;
		case 'Choose':
			return null;
	}
}

export function breakoutSignalFromEvent(
	event: { channel_id?: string; token?: string; self_select_ids?: readonly string[] },
	parentChannelId: string,
	inBreakout: boolean,
	knownParents: ReadonlyArray<string> | ReadonlySet<string> = [],
	isChannelOccupied: (channelId: string) => boolean = () => false
): BreakoutSignal | null {
	const selfSelectRooms = (event.self_select_ids ?? []).map((id) => String(id).trim()).filter(isValidSnowflakeId);
	if (selfSelectRooms.length > 0) {
		return {
			kind: 'Invite',
			invite: { kind: 'Choose', roomIds: selfSelectRooms }
		};
	}

	const rawChannelId = (event.channel_id ?? '').trim();
	if (!isValidSnowflakeId(rawChannelId)) {
		return null;
	}

	if (rawChannelId === parentChannelId) {
		return inBreakout
			? {
					kind: 'Invite',
					invite: { kind: 'Return', token: event.token || undefined }
				}
			: { kind: 'Closed' };
	}

	const knownParentSet = knownParents instanceof Set ? knownParents : new Set(knownParents);
	const token = event.token ?? '';
	if (!token || knownParentSet.has(rawChannelId) || isChannelOccupied(rawChannelId)) {
		return null;
	}

	return {
		kind: 'Invite',
		invite: { kind: 'Assigned', roomId: rawChannelId, token }
	};
}

export function voiceMembersByChannelId(
	clanVoiceRooms: Readonly<Record<string, { ids: ReadonlyArray<string | number> } | undefined>> | undefined
): Record<string, string[]> {
	const out: Record<string, string[]> = {};
	for (const [channelId, room] of Object.entries(clanVoiceRooms ?? {})) {
		out[channelId] = (room?.ids ?? []).map(String);
	}
	return out;
}

export function observeHostedRooms(
	hosted: HostedBreakout,
	isClanReady: boolean,
	membersByChannelId: Readonly<Record<string, readonly string[]>>
): HostedRoomsObservation | null {
	if (hosted.roomIds.length === 0 || !isClanReady) {
		return null;
	}
	const invited = new Set(hosted.invitees);
	const occupants = new Set<string>();
	for (const roomId of hosted.roomIds) {
		const members = membersByChannelId[roomId] ?? [];
		for (const uid of members) {
			if (isValidSnowflakeId(uid) && (invited.size === 0 || invited.has(uid))) {
				occupants.add(uid);
			}
		}
	}
	const parentMembers = new Set<string>();
	for (const uid of membersByChannelId[hosted.parentChannelId] ?? []) {
		if (isValidSnowflakeId(uid)) {
			parentMembers.add(uid);
		}
	}
	return { occupants, parentMembers };
}

export function planHostedBreakout(
	hosted: HostedBreakout,
	observation: HostedRoomsObservation | null,
	nowUnixSecs: number
): { next: HostedBreakout; dirty: boolean; plan: HostedBreakoutPlan } {
	if (!observation) {
		const next = hosted.emptySinceUnixSecs != null ? { ...hosted, emptySinceUnixSecs: null } : hosted;
		return { next, dirty: false, plan: { kind: 'Keep' } };
	}

	const pendingInvitees = hosted.pendingInvitees.filter((uid) => !observation.occupants.has(uid));
	let dirty = pendingInvitees.length !== hosted.pendingInvitees.length;

	if (observation.occupants.size > 0) {
		dirty = dirty || !hosted.hadOccupants;
		return {
			next: {
				...hosted,
				pendingInvitees,
				hadOccupants: true,
				emptySinceUnixSecs: null,
				autoCloseFailures: 0,
				autoCloseRetryAt: 0,
				autoCloseGaveUp: false
			},
			dirty,
			plan: { kind: 'Keep' }
		};
	}

	const baseNext: HostedBreakout = dirty ? { ...hosted, pendingInvitees } : { ...hosted };
	if (baseNext.autoCloseGaveUp) {
		return { next: baseNext, dirty, plan: { kind: 'Keep' } };
	}

	const responseDeadline = baseNext.openedAtUnixSecs + BREAKOUT_INVITE_RESPONSE_SECS;
	const inviteeWaiting = !baseNext.hadOccupants || pendingInvitees.some((uid) => observation.parentMembers.has(uid));
	if (inviteeWaiting && !baseNext.closedSignal && baseNext.openedAtUnixSecs > 0 && nowUnixSecs < responseDeadline) {
		return {
			next: baseNext.emptySinceUnixSecs != null ? { ...baseNext, emptySinceUnixSecs: null } : baseNext,
			dirty,
			plan: { kind: 'RecheckAt', atUnixSecs: responseDeadline }
		};
	}

	const emptySince = baseNext.emptySinceUnixSecs ?? nowUnixSecs;
	const withEmptySince = baseNext.emptySinceUnixSecs === emptySince ? baseNext : { ...baseNext, emptySinceUnixSecs: emptySince };
	const closeAt = Math.max(emptySince + BREAKOUT_EMPTY_CLOSE_DELAY_SECS, withEmptySince.autoCloseRetryAt ?? 0);
	if (nowUnixSecs >= closeAt) {
		return { next: withEmptySince, dirty, plan: { kind: 'Close' } };
	}
	return { next: withEmptySince, dirty, plan: { kind: 'RecheckAt', atUnixSecs: closeAt } };
}

function getHostedBreakoutsStorageKey(userId: string): string {
	return `${HOSTED_BREAKOUTS_STORAGE_PREFIX}${userId}`;
}

export function retainHostedBreakoutsForUser(map: Readonly<Record<string, HostedBreakout>>, userId: string): Record<string, HostedBreakout> {
	const out: Record<string, HostedBreakout> = {};
	for (const [parentId, hosted] of Object.entries(map)) {
		if (hosted.ownerUserId === userId && hosted.roomIds.length > 0 && isValidSnowflakeId(hosted.breakoutId)) {
			out[parentId] = hosted;
		}
	}
	return out;
}

export function loadHostedBreakouts(userId: string | null | undefined): Record<string, HostedBreakout> {
	if (!isValidSnowflakeId(userId) || typeof window === 'undefined' || !window.localStorage) {
		return {};
	}
	try {
		const raw = window.localStorage.getItem(getHostedBreakoutsStorageKey(userId));
		if (!raw) {
			return {};
		}
		const parsed = JSON.parse(raw) as Partial<PersistedHostedBreakoutsEnvelope>;
		if (!parsed || parsed.ownerUserId !== userId || !Array.isArray(parsed.entries)) {
			return {};
		}
		const result: Record<string, HostedBreakout> = {};
		for (const entry of parsed.entries) {
			if (
				!entry ||
				!isValidSnowflakeId(entry.breakoutId) ||
				!isValidSnowflakeId(entry.parentChannelId) ||
				!isValidSnowflakeId(entry.clanId) ||
				entry.ownerUserId !== userId ||
				!Array.isArray(entry.roomIds)
			) {
				continue;
			}
			const roomIds = entry.roomIds.filter(isValidSnowflakeId);
			if (roomIds.length === 0) {
				continue;
			}
			result[entry.parentChannelId] = {
				breakoutId: entry.breakoutId,
				parentChannelId: entry.parentChannelId,
				clanId: entry.clanId,
				roomIds,
				ownerUserId: userId,
				invitees: Array.isArray(entry.invitees) ? entry.invitees.filter(isValidSnowflakeId) : [],
				pendingInvitees: Array.isArray(entry.pendingInvitees) ? entry.pendingInvitees.filter(isValidSnowflakeId) : [],
				openedAtUnixSecs: typeof entry.openedAtUnixSecs === 'number' ? entry.openedAtUnixSecs : 0,
				hadOccupants: Boolean(entry.hadOccupants),
				closedSignal: false,
				emptySinceUnixSecs: null,
				autoCloseFailures: 0,
				autoCloseRetryAt: 0,
				autoCloseGaveUp: false
			};
		}
		return result;
	} catch {
		return {};
	}
}

export function saveHostedBreakouts(userId: string | null | undefined, map: Readonly<Record<string, HostedBreakout>>): void {
	if (!isValidSnowflakeId(userId) || typeof window === 'undefined' || !window.localStorage) {
		return;
	}
	const key = getHostedBreakoutsStorageKey(userId);
	try {
		const retained = retainHostedBreakoutsForUser(map, userId);
		const parentIds = Object.keys(retained).sort();
		if (parentIds.length === 0) {
			window.localStorage.removeItem(key);
			return;
		}
		const envelope: PersistedHostedBreakoutsEnvelope = {
			version: HOSTED_BREAKOUTS_STORAGE_VERSION,
			ownerUserId: userId,
			entries: parentIds.map((parentChannelId) => {
				const hosted = retained[parentChannelId];
				return {
					breakoutId: hosted.breakoutId,
					parentChannelId: hosted.parentChannelId,
					clanId: hosted.clanId,
					roomIds: hosted.roomIds,
					ownerUserId: hosted.ownerUserId,
					invitees: hosted.invitees,
					pendingInvitees: hosted.pendingInvitees,
					openedAtUnixSecs: hosted.openedAtUnixSecs,
					hadOccupants: hosted.hadOccupants
				};
			})
		};
		window.localStorage.setItem(key, JSON.stringify(envelope));
	} catch {
		// Ignore storage errors
	}
}

export function isEligibleIdleVoiceChannel(
	parentChannelId: string,
	channelId: string,
	isVoiceChannel: boolean,
	isPrivate: boolean,
	occupantCount: number
): boolean {
	return isVoiceChannel && !isPrivate && isValidSnowflakeId(channelId) && channelId !== parentChannelId && occupantCount === 0;
}

function compareChannelIdsAscending(a: string, b: string): number {
	const aDigits = /^\d+$/.test(a);
	const bDigits = /^\d+$/.test(b);
	if (aDigits && bDigits) {
		const aBig = BigInt(a);
		const bBig = BigInt(b);
		if (aBig < bBig) return -1;
		if (aBig > bBig) return 1;
		return 0;
	}
	return a.localeCompare(b);
}

export function sortAndLabelIdleChannels(
	rawChannels: ReadonlyArray<{ channelId: string; label?: string | null }>,
	fallbackRoomLabel?: (index: number) => string
): IdleVoiceChannelItem[] {
	const sorted = [...rawChannels]
		.filter((ch) => isValidSnowflakeId(ch.channelId))
		.sort((a, b) => compareChannelIdsAscending(a.channelId, b.channelId));
	const seen = new Set<string>();
	const out: IdleVoiceChannelItem[] = [];
	for (const ch of sorted) {
		if (seen.has(ch.channelId)) {
			continue;
		}
		seen.add(ch.channelId);
		const idx = out.length;
		const trimmed = (ch.label ?? '').trim();
		out.push({
			channelId: ch.channelId,
			label: trimmed || (fallbackRoomLabel ? fallbackRoomLabel(idx) : `Room ${idx + 1}`)
		});
	}
	return out;
}

export function toggleParticipantRoom(rooms: readonly DraftBreakoutRoom[], roomIdx: number, userId: string): DraftBreakoutRoom[] {
	if (roomIdx < 0 || roomIdx >= rooms.length) {
		return [...rooms];
	}
	const alreadyInTarget = rooms[roomIdx].userIds.includes(userId);
	return rooms.map((room, idx) => {
		const filtered = room.userIds.filter((uid) => uid !== userId);
		if (idx === roomIdx && !alreadyInTarget) {
			return { ...room, userIds: [...filtered, userId] };
		}
		return filtered.length === room.userIds.length ? room : { ...room, userIds: filtered };
	});
}

export function redistributeAutomatic(rooms: readonly DraftBreakoutRoom[], participants: readonly BreakoutParticipantItem[]): DraftBreakoutRoom[] {
	if (rooms.length === 0) {
		return [];
	}
	const buckets: string[][] = rooms.map(() => []);
	const seen = new Set<string>();
	let idx = 0;
	for (const participant of participants) {
		if (seen.has(participant.userId)) {
			continue;
		}
		seen.add(participant.userId);
		buckets[idx % rooms.length].push(participant.userId);
		idx += 1;
	}
	return rooms.map((room, rIdx) => ({
		...room,
		userIds: buckets[rIdx]
	}));
}

export function placeUnassignedParticipants(
	rooms: readonly DraftBreakoutRoom[],
	participants: readonly BreakoutParticipantItem[]
): DraftBreakoutRoom[] {
	if (rooms.length === 0) {
		return [];
	}
	const validIds = new Set(participants.map((p) => p.userId));
	const assigned = new Set<string>();
	const buckets: string[][] = rooms.map((room) => {
		for (const uid of room.userIds) {
			if (validIds.has(uid)) {
				assigned.add(uid);
			}
		}
		return [...room.userIds];
	});

	for (const participant of participants) {
		if (assigned.has(participant.userId)) {
			continue;
		}
		let minIdx = 0;
		let minCount = buckets[0].filter((uid) => validIds.has(uid)).length;
		for (let i = 1; i < buckets.length; i++) {
			const count = buckets[i].filter((uid) => validIds.has(uid)).length;
			if (count < minCount) {
				minIdx = i;
				minCount = count;
			}
		}
		if (!buckets[minIdx].includes(participant.userId)) {
			buckets[minIdx].push(participant.userId);
		}
		assigned.add(participant.userId);
	}

	return rooms.map((room, idx) => ({
		...room,
		userIds: buckets[idx]
	}));
}

export function rebindRoomsToIdlePrefix(rooms: readonly DraftBreakoutRoom[], idleChannels: readonly IdleVoiceChannelItem[]): DraftBreakoutRoom[] {
	return rooms.map((room, idx) => {
		const idle = idleChannels[idx];
		if (!idle) {
			return { ...room, userIds: [...room.userIds] };
		}
		return {
			...room,
			channelId: idle.channelId,
			label: idle.label,
			userIds: [...room.userIds]
		};
	});
}

export function deleteLastRoom(
	rooms: readonly DraftBreakoutRoom[],
	idx: number,
	rule: BreakoutRule,
	manualDirty: boolean,
	participants: readonly BreakoutParticipantItem[]
): { rooms: DraftBreakoutRoom[]; deleted: boolean } {
	if (rooms.length <= 1 || idx + 1 !== rooms.length) {
		return { rooms: [...rooms], deleted: false };
	}
	const sliced = rooms.slice(0, rooms.length - 1);
	if (rule === BreakoutRule.Automatic && !manualDirty) {
		return {
			rooms: redistributeAutomatic(sliced, participants),
			deleted: true
		};
	}
	return {
		rooms: sliced,
		deleted: true
	};
}

export function effectiveBreakoutRule(rule: BreakoutRule, manualDirty: boolean): BreakoutRule {
	if (rule === BreakoutRule.Automatic && manualDirty) {
		return BreakoutRule.Manual;
	}
	return rule;
}

export function buildManualAssignments(
	rule: BreakoutRule,
	rooms: readonly DraftBreakoutRoom[],
	participants?: readonly BreakoutParticipantItem[]
): SfuBreakoutParticipant[] {
	switch (rule) {
		case BreakoutRule.SelfSelect:
			return [];
		case BreakoutRule.Automatic:
		case BreakoutRule.Manual: {
			const validSet = participants ? new Set(participants.map((p) => p.userId)) : null;
			const seen = new Set<string>();
			return rooms.map((room) => {
				const user_ids: string[] = [];
				for (const uid of room.userIds) {
					if ((!validSet || validSet.has(uid)) && !seen.has(uid)) {
						seen.add(uid);
						user_ids.push(uid);
					}
				}
				return { channel_id: '0', user_ids };
			});
		}
	}
}

export function canCreateRoomCount(roomCount: number, idleChannelCount: number): boolean {
	return roomCount >= 1 && roomCount <= MAX_BREAKOUT_ROOMS && roomCount <= idleChannelCount;
}

export function canOpenSelectedRooms(rooms: readonly DraftBreakoutRoom[], idleChannels: readonly IdleVoiceChannelItem[]): boolean {
	return (
		rooms.length > 0 &&
		rooms.length <= idleChannels.length &&
		rooms.every((room) => idleChannels.some((idle) => idle.channelId === room.channelId))
	);
}

export function canOpenBreakout(
	rule: BreakoutRule,
	rooms: readonly DraftBreakoutRoom[],
	idleChannels: readonly IdleVoiceChannelItem[],
	participantCount: number,
	validParticipantIds?: ReadonlySet<string>
): boolean {
	if (!canOpenSelectedRooms(rooms, idleChannels) || participantCount <= 0) {
		return false;
	}
	if (rule === BreakoutRule.SelfSelect) {
		return true;
	}
	return rooms.some((room) => room.userIds.some((uid) => !validParticipantIds || validParticipantIds.has(uid)));
}

export function breakoutMenuHeight(rowCount: number): number {
	return Math.min(BREAKOUT_MENU_MAX_LIST_HEIGHT, Math.max(1, rowCount) * BREAKOUT_MENU_ROW_HEIGHT) + BREAKOUT_MENU_PADDING;
}

export function placeBreakoutMenu(
	anchor: { top: number; bottom: number },
	bounds: { top: number; bottom: number },
	wantedHeight: number
): BreakoutMenuPlacement {
	const below = bounds.bottom - anchor.bottom - BREAKOUT_MENU_GAP;
	const above = anchor.top - bounds.top - BREAKOUT_MENU_GAP;
	const up = below < wantedHeight && above > below;
	return { up, maxHeight: Math.max(0, Math.min(wantedHeight, up ? above : below)) };
}

export function pickNextUnusedIdleChannel(
	rooms: readonly DraftBreakoutRoom[],
	idleChannels: readonly IdleVoiceChannelItem[]
): IdleVoiceChannelItem | null {
	if (rooms.length >= MAX_BREAKOUT_ROOMS) {
		return null;
	}
	return idleChannels.find((ch) => !rooms.some((room) => room.channelId === ch.channelId)) ?? null;
}
