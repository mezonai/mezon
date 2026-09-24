import type { SfuPeer, SfuRemoteMedia } from '../types';

const getUserIdFromMsidPart = (msidPart: string) => /(?:^|-)u(\d+)(?:-|$)/.exec(msidPart)?.[1];
const getPeerIdFromMsidPart = (msidPart: string) => /(?:^|-)p(\d+)(?:-|$)/.exec(msidPart)?.[1];

export type MsidOccupant = { userId: string; peerId?: string };

export const getMsidOccupantsByMidFromSdp = (sdp: string) => {
	const occupantsByMid = new Map<string, MsidOccupant>();
	let currentMid: string | undefined;

	for (const line of sdp.split(/\r?\n/)) {
		if (line.startsWith('m=')) currentMid = undefined;
		else if (line.startsWith('a=mid:')) currentMid = line.slice('a=mid:'.length).trim();
		else if (currentMid && line.startsWith('a=msid:')) {
			const msidParts = line.slice('a=msid:'.length).trim().split(/\s+/);
			const userId = msidParts.map(getUserIdFromMsidPart).find(Boolean);
			const peerId = msidParts.map(getPeerIdFromMsidPart).find((id) => Boolean(id) && id !== '0');
			if (userId) occupantsByMid.set(currentMid, { userId, peerId });
		}
	}

	return occupantsByMid;
};

export const isReceivingRemoteTrack = (transceiver: RTCRtpTransceiver) => {
	const direction = transceiver.currentDirection;
	return transceiver.receiver.track.readyState === 'live' && (direction === 'recvonly' || direction === 'sendrecv');
};

export type RetiredSource = { peerId?: string; userId?: string };

export const getDepartedMids = (
	peerId: string | undefined,
	userId: string | undefined,
	signaled: Array<string | number | undefined>,
	owners: ReadonlyMap<string, string>,
	users: ReadonlyMap<string, string>
) => {
	const candidates = new Set(signaled.filter((mid) => mid != null && Number(mid) >= 3).map(String));
	if (peerId) for (const [mid, owner] of owners) if (owner === peerId) candidates.add(mid);
	return [...candidates].filter((mid) => {
		const owner = owners.get(mid);
		const user = users.get(mid);
		if (userId && user && user !== userId) return false;
		return owner ? owner === peerId : Boolean(peerId || (userId && user === userId));
	});
};

export const canReactivateMid = (retired: RetiredSource | undefined, next: MsidOccupant, currentPeer?: string) => {
	if (!retired) return true;
	if (retired.peerId && next.peerId) return retired.peerId !== next.peerId;
	if (next.userId !== retired.userId) return true;
	return Boolean(currentPeer && currentPeer !== retired.peerId);
};

export const isRemoteScreenSharing = (participant: SfuRemoteMedia) =>
	participant.screen?.readyState === 'live' && participant.screenActive === true && participant.screenRequested !== false;

export const mergeRemotePeerMetadata = (participant: SfuRemoteMedia, peer: SfuPeer): SfuRemoteMedia => {
	const peerId = String(peer.peer_id);
	const changedOwner =
		(participant.peerId && participant.peerId !== peerId) || (participant.userId && peer.user_id && participant.userId !== peer.user_id);
	const current: SfuRemoteMedia = changedOwner ? { id: participant.id } : participant;
	return {
		...current,
		peerId,
		userId: peer.user_id ?? current.userId,
		metadata: peer.metadata ?? current.metadata,
		role: peer.role ?? current.role,
		cameraRequested: peer.camera_requested ?? current.cameraRequested,
		cameraActive: peer.camera_active ?? current.cameraActive,
		screenRequested: peer.screen_requested ?? current.screenRequested,
		screenActive: peer.screen_active ?? current.screenActive,
		isMute: peer.is_mute ?? current.isMute
	};
};

export const isCurrentSfuPeer = (peerId: string | number | undefined, selfPeerId: string | undefined) =>
	peerId != null && selfPeerId !== undefined && String(peerId) === selfPeerId;

export const getRemoteParticipants = (media: Iterable<SfuRemoteMedia>, selfPeerId?: string): SfuRemoteMedia[] => {
	const byPeer = new Map<string, SfuRemoteMedia>();
	for (const participant of media) {
		if (isCurrentSfuPeer(participant.peerId, selfPeerId)) continue;
		const key = participant.peerId ? `peer-${participant.peerId}` : participant.id;
		const existing = byPeer.get(key);
		if (
			!existing ||
			participant.audio?.readyState === 'live' ||
			participant.video?.readyState === 'live' ||
			participant.screen?.readyState === 'live'
		) {
			byPeer.set(key, participant);
		}
	}
	return [...byPeer.values()];
};
