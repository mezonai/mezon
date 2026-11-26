export const AVATAR_FRAMES = [
	'edu_1',
	'edu_2',
	'fest_1',
	'fest_2',
	'tech_1',
	'tech_2',
	'mascot_1',
	'mascot_2',
	'nature_1',
	'nature_2',
	'love_1',
	'love_2',
	'fantasy_1',
	'fantasy_2',
	'aesthetic_1',
	'aesthetic_2',
	'food_1',
	'food_2'
] as const;

export type AvatarFrameId = (typeof AVATAR_FRAMES)[number];

const utf8Encoder = new TextEncoder();

function fnv1a32(input: string): number {
	const bytes = utf8Encoder.encode(input);
	let h = 0x811c9dc5;
	for (let i = 0; i < bytes.length; i++) {
		h ^= bytes[i];
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return h;
}

export function defaultAvatarFrameForUser(userId: string): AvatarFrameId {
	return AVATAR_FRAMES[fnv1a32(userId) % AVATAR_FRAMES.length];
}

export function avatarFrameUrl(id: AvatarFrameId, animated: boolean): string {
	return `/assets/images/avatar-frames/${id}.${animated ? 'webp' : 'png'}`;
}

export function clanFrameId(proPlan?: boolean, frame?: number): AvatarFrameId | undefined {
	if (!proPlan || typeof frame !== 'number' || !Number.isInteger(frame) || frame < 1 || frame > AVATAR_FRAMES.length) {
		return undefined;
	}
	return AVATAR_FRAMES[frame - 1];
}
