export const STN_PING_INTERVAL_MS = 15000;
export const STN_CHANNELS_WAIT_MS = 800;
export const STN_ICE_GATHER_TIMEOUT_MS = 2500;
export const STN_DEFAULT_RENDITION = '1080';
export const STN_KNOWN_RENDITIONS = ['480', '720', '1080', '4k'] as const;
export const STN_PRESENCE_CONNECTED = 3;
export const STN_PRESENCE_DISCONNECTED = 5;

export type StnRendition = (typeof STN_KNOWN_RENDITIONS)[number];

export type StnChannelEntry = {
	id: string;
	hasVideo: boolean | null;
};

export type StnSignalMessage = {
	Key?: string;
	ClanId?: string;
	ChannelId?: string;
	UserId?: string;
	ClientId?: string;
	IsPublisher?: boolean;
	State?: number;
	Value?: unknown;
};

export type StnJoinIdentity = {
	clanId: string;
	channelId: string;
	userId: string;
	streamId: string;
	clientId: string;
};

export function stnClientId(userId: string): string {
	return `web-${userId}`;
}

export function buildStnEnvelope(key: string, identity: StnJoinIdentity, value: unknown, extra?: Partial<StnSignalMessage>): StnSignalMessage {
	return {
		Key: key,
		ClanId: identity.clanId,
		ChannelId: identity.channelId,
		UserId: identity.userId,
		ClientId: identity.clientId,
		IsPublisher: false,
		State: 0,
		Value: value,
		...extra
	};
}

export function parseChannelList(value: unknown): StnChannelEntry[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map((item) => {
		if (typeof item === 'string') {
			return { id: item, hasVideo: null };
		}
		if (!item || typeof item !== 'object') {
			return { id: '', hasVideo: null };
		}
		const rec = item as Record<string, unknown>;
		const id = rec.ChannelId ?? rec.channel_id ?? rec.id ?? '';
		const hv = rec.HasVideo ?? rec.has_video;
		return { id: String(id), hasVideo: hv == null ? null : !!hv };
	});
}

export function shouldOfferVideo(list: StnChannelEntry[] | null, streamId: string): boolean {
	if (!list) {
		return true;
	}
	const hit = list.find((entry) => entry.id === streamId);
	if (hit && hit.hasVideo === false) {
		return false;
	}
	return true;
}

export function parseInfoValue(raw: unknown): Record<string, unknown> | null {
	if (raw == null) {
		return null;
	}
	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw) as unknown;
			return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
		} catch {
			return null;
		}
	}
	if (typeof raw === 'object') {
		return raw as Record<string, unknown>;
	}
	return null;
}

export function sdpFromAnswer(value: unknown): string | null {
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}
	if (value && typeof value === 'object' && 'sdp' in value) {
		const sdp = (value as { sdp?: unknown }).sdp;
		return typeof sdp === 'string' && sdp.length > 0 ? sdp : null;
	}
	return null;
}

export function iceCandidateFromValue(value: unknown): RTCIceCandidateInit | null {
	let init: unknown = value;
	if (typeof value === 'string') {
		try {
			init = JSON.parse(value) as unknown;
		} catch {
			return null;
		}
	}
	if (!init || typeof init !== 'object') {
		return null;
	}
	const candidate = (init as RTCIceCandidateInit).candidate;
	if (!candidate) {
		return null;
	}
	return init as RTCIceCandidateInit;
}

export function infoHasVideo(info: Record<string, unknown> | null): boolean | null {
	if (!info) {
		return null;
	}
	const hv = info.has_video ?? info.HasVideo;
	if (hv == null) {
		return null;
	}
	return !!hv;
}

export function infoPlayoutDelayMs(info: Record<string, unknown> | null): number | null {
	if (!info) {
		return null;
	}
	const delay = info.playout_delay_ms ?? info.PlayoutDelayMs;
	const n = Number(delay);
	return Number.isFinite(n) && n > 0 ? n : null;
}

export function infoRendition(info: Record<string, unknown> | null): string | null {
	if (!info) {
		return null;
	}
	const id = info.rendition ?? info.Rendition;
	return typeof id === 'string' && id.length > 0 ? id.toLowerCase() : null;
}

export function infoRenditions(info: Record<string, unknown> | null): string[] {
	if (!info) {
		return [];
	}
	const list = info.renditions ?? info.Renditions;
	if (!Array.isArray(list)) {
		return [];
	}
	return list.map((item) => String(item).toLowerCase()).filter(Boolean);
}

export function normalizeRendition(id: string | null | undefined): string {
	const token = String(id || STN_DEFAULT_RENDITION)
		.toLowerCase()
		.replace(/p$/i, '');
	return (STN_KNOWN_RENDITIONS as readonly string[]).includes(token) ? token : STN_DEFAULT_RENDITION;
}

export function applyPlayoutDelayHint(peer: RTCPeerConnection | null, delayMs: number | null | undefined, hasVideo: boolean): void {
	if (!peer || !hasVideo || delayMs == null || Number.isNaN(Number(delayMs))) {
		return;
	}
	const sec = Number(delayMs) / 1000;
	peer.getReceivers().forEach((receiver) => {
		if (receiver.track?.kind === 'video' && 'playoutDelayHint' in receiver) {
			try {
				(receiver as RTCRtpReceiver & { playoutDelayHint?: number }).playoutDelayHint = sec;
			} catch {
				// Chromium-only hint; ignore unsupported browsers.
			}
		}
	});
}

export function waitIceGatheringComplete(peer: RTCPeerConnection, timeoutMs = STN_ICE_GATHER_TIMEOUT_MS): Promise<void> {
	if (peer.iceGatheringState === 'complete') {
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		const onChange = () => {
			if (peer.iceGatheringState === 'complete') {
				clearTimeout(timer);
				peer.removeEventListener('icegatheringstatechange', onChange);
				resolve();
			}
		};
		const timer = setTimeout(() => {
			peer.removeEventListener('icegatheringstatechange', onChange);
			resolve();
		}, timeoutMs);
		peer.addEventListener('icegatheringstatechange', onChange);
	});
}
