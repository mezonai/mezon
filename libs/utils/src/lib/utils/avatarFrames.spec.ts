import { AVATAR_FRAMES, avatarFrameUrl, clanFrameId, defaultAvatarFrameForUser } from './avatarFrames';

describe('avatarFrames', () => {
	it('has 18 unique frame ids', () => {
		expect(AVATAR_FRAMES).toHaveLength(18);
		expect(new Set(AVATAR_FRAMES).size).toBe(18);
	});

	it('locks the exact 18-frame catalog order', () => {
		expect(AVATAR_FRAMES).toEqual([
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
		]);
	});

	it.each([
		['1775731111020111872', 7, 'mascot_2'],
		['1840651530236071936', 1, 'edu_2'],
		['0', 3, 'fest_2'],
		['1', 4, 'tech_1'],
		['2048775084906123264', 13, 'fantasy_2'],
		['', 7, 'mascot_2'],
		['người-dùng-1', 12, 'fantasy_1']
	])('maps user id %s to index %i (%s)', (userId, expectedIndex, expectedId) => {
		const frameId = defaultAvatarFrameForUser(userId);
		expect(AVATAR_FRAMES.indexOf(frameId)).toBe(expectedIndex);
		expect(frameId).toBe(expectedId);
	});

	it('builds static and animated frame urls', () => {
		expect(avatarFrameUrl('edu_2', false)).toBe('/assets/images/avatar-frames/edu_2.png');
		expect(avatarFrameUrl('edu_2', true)).toBe('/assets/images/avatar-frames/edu_2.webp');
	});

	it.each([
		[false, 5, undefined],
		[true, 0, undefined],
		[true, 1, 'edu_1'],
		[true, 18, 'food_2'],
		[true, 19, undefined],
		[true, -1, undefined],
		[true, undefined, undefined]
	])('clanFrameId(%s, %s) returns %s', (proPlan, frame, expected) => {
		expect(clanFrameId(proPlan, frame)).toBe(expected);
	});
});
