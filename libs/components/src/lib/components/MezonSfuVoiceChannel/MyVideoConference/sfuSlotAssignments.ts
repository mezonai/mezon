import type { SfuMediaKind, SfuPeer, SfuRemoteMedia, SfuSignalMessage } from '../types';

type Assignment = {
	generation: bigint;
	peerId: string;
	userId?: string;
	mids: string[];
	active: boolean[];
};
type SlotState = { generation: bigint; assignment?: Assignment };
type PoolLayout = Record<SfuMediaKind, number>;
type PoolAssignment = {
	generation: bigint;
	peerId: string;
	userId?: string;
	kind: SfuMediaKind;
	mid: string;
	active: boolean;
};
type PoolSlotState = { generation: bigint; assignment?: PoolAssignment };

const MEDIA_KINDS: SfuMediaKind[] = ['audio', 'camera', 'screen'];

export const SFU_MEDIA_POOL_VERSION = 1;

const slotNumber = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) < 0xffffffff;
const generationNumber = (value: unknown): bigint | undefined => {
	if (typeof value === 'number' && (!Number.isSafeInteger(value) || value <= 0)) return;
	if (typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))) return;
	return BigInt(value);
};

export class SfuSlotAssignments {
	enabled = false;
	private slots = new Map<number, SlotState>();
	private pools?: PoolLayout;
	private poolSlots = new Map<string, PoolSlotState>();

	reset() {
		this.enabled = false;
		this.slots.clear();
		this.pools = undefined;
		this.poolSlots.clear();
	}

	observeJoined(message: SfuSignalMessage) {
		if (message.media_pool_mode !== 'decoupled') return;
		this.pools = { audio: message.max_audio_slots ?? 0, camera: message.max_camera_slots ?? 0, screen: message.max_screen_slots ?? 0 };
		this.enabled = true;
	}

	observeOffer(sdp: string) {
		const hasSlotMsid = /^a=msid:slot-\d+\s/m.test(sdp);
		if (hasSlotMsid) this.enabled = true;
	}

	handle(message: SfuSignalMessage): boolean {
		if (message.type !== 'slot_assigned' && message.type !== 'slot_released') return false;
		const generation = generationNumber(message.generation);
		if (!slotNumber(message.slot) || generation === undefined) {
			return false;
		}
		if (message.kind) {
			return this.handlePool(message, message.kind, message.slot, generation);
		}
		if (message.type === 'slot_assigned') {
			if (message.peer_id == null || String(message.peer_id) === '0') {
				return false;
			}
			const base = 3 + message.slot * 3;
			const mids = [message.mid_audio ?? base, message.mid_video ?? base + 1, message.mid_screen ?? base + 2].map(String);
			if (mids.some((mid, index) => mid !== String(base + index))) {
				return false;
			}
			this.enabled = true;
			return this.assign(message.slot, {
				generation,
				peerId: String(message.peer_id),
				userId: message.user_id,
				mids,
				active: [message.audio_active === true, message.video_active === true, message.screen_active === true]
			});
		}
		this.enabled = true;
		return this.release(message.slot, generation);
	}

	private handlePool(message: SfuSignalMessage, kind: SfuMediaKind, slot: number, generation: bigint): boolean {
		const mid = this.poolMid(kind, slot);
		if (mid === undefined) return false;
		if (message.type === 'slot_released') return this.releasePool(kind, slot, generation);
		if (message.peer_id == null || String(message.peer_id) === '0') return false;
		if (message.mid != null && String(message.mid) !== mid) return false;
		return this.assignPool(slot, {
			generation,
			peerId: String(message.peer_id),
			userId: message.user_id,
			kind,
			mid,
			active: message.active === true
		});
	}

	private poolMid(kind: SfuMediaKind, slot: number): string | undefined {
		if (!this.pools) return;
		let start = 3;
		for (const block of MEDIA_KINDS) {
			if (block === kind) return slot < this.pools[block] ? String(start + slot) : undefined;
			start += this.pools[block];
		}
		return;
	}

	private assignPool(slot: number, assignment: PoolAssignment): boolean {
		const key = `${assignment.kind}:${slot}`;
		const previous = this.poolSlots.get(key);
		if (previous && previous.generation > assignment.generation) {
			return false;
		}
		if (previous?.generation === assignment.generation && previous.assignment?.peerId !== assignment.peerId) {
			return false;
		}
		this.poolSlots.set(key, { generation: assignment.generation, assignment });
		return true;
	}

	private releasePool(kind: SfuMediaKind, slot: number, generation: bigint): boolean {
		const key = `${kind}:${slot}`;
		const previous = this.poolSlots.get(key);
		if (previous && previous.generation > generation) {
			return false;
		}
		this.poolSlots.set(key, { generation });
		return true;
	}

	private assign(slot: number, assignment: Assignment): boolean {
		const previous = this.slots.get(slot);
		if (previous && previous.generation > assignment.generation) {
			return false;
		}
		if (previous?.generation === assignment.generation && previous.assignment?.peerId !== assignment.peerId) {
			return false;
		}
		this.slots.set(slot, { generation: assignment.generation, assignment });
		return true;
	}

	private release(slot: number, generation: bigint): boolean {
		const previous = this.slots.get(slot);
		if (previous && previous.generation > generation) {
			return false;
		}
		this.slots.set(slot, { generation });
		return true;
	}

	seedMembers(peers: SfuPeer[]) {
		for (const peer of peers) {
			this.seedPoolSlots(peer);
			const slot = peer.slot ?? peer.remote_slot;
			const generation = generationNumber(peer.assignment_generation);
			if (!slotNumber(slot) || generation === undefined) continue;
			const previous = this.slots.get(slot);
			if (previous && previous.generation >= generation) continue;
			const base = 3 + slot * 3;
			this.assign(slot, {
				generation,
				peerId: String(peer.peer_id),
				userId: peer.user_id,
				mids: [base, base + 1, base + 2].map(String),
				active: [true, peer.camera_active === true, peer.screen_active === true]
			});
		}
	}

	private seedPoolSlots(peer: SfuPeer) {
		for (const kind of MEDIA_KINDS) {
			const granted = peer.media_slots?.[kind];
			const generation = generationNumber(granted?.generation);
			if (!granted || !slotNumber(granted.slot) || generation === undefined) continue;
			const mid = this.poolMid(kind, granted.slot);
			if (mid === undefined || String(granted.mid) !== mid) continue;
			const previous = this.poolSlots.get(`${kind}:${granted.slot}`);
			if (previous && previous.generation >= generation) continue;
			this.assignPool(granted.slot, { generation, peerId: String(peer.peer_id), userId: peer.user_id, kind, mid, active: true });
		}
	}

	removePeer(message: SfuSignalMessage) {
		if (message.peer_id == null) return;
		const peerId = String(message.peer_id);
		for (const [key, state] of this.poolSlots) {
			if (state.assignment?.peerId === peerId) this.poolSlots.set(key, { generation: state.generation });
		}
		const generation = generationNumber(message.assignment_generation);
		for (const [slot, state] of this.slots) {
			if (state.assignment?.peerId !== String(message.peer_id)) continue;
			if (generation !== undefined && state.generation !== generation) continue;
			this.release(slot, state.generation);
		}
	}

	getMedia(transceivers: RTCRtpTransceiver[], peers = new Map<string, SfuPeer>()): Map<string, SfuRemoteMedia> {
		const tracks = new Map<string, MediaStreamTrack>();
		for (const transceiver of transceivers) {
			if (
				transceiver.mid &&
				transceiver.receiver.track.readyState === 'live' &&
				(transceiver.currentDirection === 'recvonly' || transceiver.currentDirection === 'sendrecv')
			)
				tracks.set(transceiver.mid, transceiver.receiver.track);
		}
		const media = new Map<string, SfuRemoteMedia>();
		for (const { assignment } of this.slots.values()) {
			if (!assignment) continue;
			const { peerId, userId, mids, active } = assignment;
			const participant: SfuRemoteMedia = media.get(peerId) || { id: `sfu-peer-${peerId}`, peerId, userId };
			const fields = ['audio', 'video', 'screen'] as const;
			fields.forEach((field, index) => {
				const track = tracks.get(mids[index]);
				if (active[index] && track?.kind === (index === 0 ? 'audio' : 'video')) participant[field] = track;
			});
			participant.cameraActive = !!participant.video;
			participant.screenActive = !!participant.screen;
			media.set(peerId, participant);
		}
		for (const { assignment } of this.poolSlots.values()) {
			if (!assignment) continue;
			const { peerId, userId, kind, mid, active } = assignment;
			const participant: SfuRemoteMedia = media.get(peerId) || { id: `sfu-peer-${peerId}`, peerId, userId };
			const track = tracks.get(mid);
			const peer = peers.get(peerId);
			const sharing = peer?.screen_active === true && peer.screen_requested !== false;
			if (kind === 'audio' && active && track?.kind === 'audio') participant.audio = track;
			if (kind === 'camera' && peer?.camera_active === true && track?.kind === 'video') participant.video = track;
			if (kind === 'screen' && sharing && track?.kind === 'video') participant.screen = track;
			participant.cameraActive = !!participant.video;
			participant.screenActive = !!participant.screen;
			media.set(peerId, participant);
		}
		return media;
	}
}
