import type { SfuPeer, SfuRemoteMedia, SfuSignalMessage } from '../types';

type Assignment = {
	generation: bigint;
	peerId: string;
	userId?: string;
	mids: string[];
	active: boolean[];
};
type SlotState = { generation: bigint; assignment?: Assignment };

const slotNumber = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) < 0xffffffff;
const generationNumber = (value: unknown): bigint | undefined => {
	if (typeof value === 'number' && (!Number.isSafeInteger(value) || value <= 0)) return;
	if (typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))) return;
	return BigInt(value);
};

export class SfuSlotAssignments {
	enabled = false;
	private slots = new Map<number, SlotState>();

	reset() {
		this.enabled = false;
		this.slots.clear();
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

	removePeer(message: SfuSignalMessage) {
		if (message.peer_id == null) return;
		const generation = generationNumber(message.assignment_generation);
		for (const [slot, state] of this.slots) {
			if (state.assignment?.peerId !== String(message.peer_id)) continue;
			if (generation !== undefined && state.generation !== generation) continue;
			this.release(slot, state.generation);
		}
	}

	getMedia(transceivers: RTCRtpTransceiver[]): Map<string, SfuRemoteMedia> {
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
		return media;
	}
}
