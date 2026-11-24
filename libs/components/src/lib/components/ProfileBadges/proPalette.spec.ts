import { describe, expect, it } from '@jest/globals';
import { DEFAULT_PRO_PALETTE, getProPalette, proCardStyle } from './proPalette';

describe('proPalette', () => {
	it.each([
		['dark', { start: '#8b5cf6', end: '#ec4899', accent: '#ec4899' }],
		['light', { start: '#8b5cf6', end: '#ec4899', accent: '#ec4899' }],
		['purple_haze', { start: '#a78bfa', end: '#f472b6', accent: '#f472b6' }],
		['sunrise', { start: '#9f4175', end: '#db2777', accent: '#db2777' }],
		['redDark', { start: '#e11d48', end: '#fb7185', accent: '#fb7185' }],
		['abyss_dark', { start: '#3b82f6', end: '#8b5cf6', accent: '#a78bfa' }],
		['berrynade', { start: '#db2777', end: '#e7a525', accent: '#e7a525' }],
		['cisher', { start: '#f3b336', end: '#ee8558', accent: '#d9622b' }],
		['sunset', { start: '#8b5cf6', end: '#db7f4b', accent: '#db7f4b' }]
	])('returns the expected palette for %s', (theme, expected) => {
		expect(getProPalette(theme)).toEqual(expected);
	});

	it.each(['unknown', '', null, undefined])('falls back to the default palette for %s', (theme) => {
		expect(getProPalette(theme)).toEqual(DEFAULT_PRO_PALETTE);
	});

	it('builds card border and dual glow shadows from the palette', () => {
		const style = proCardStyle({ start: '#8b5cf6', end: '#ec4899', accent: '#ec4899' });
		expect(style).toEqual({
			border: '1px solid rgba(236, 72, 153, 0.55)',
			boxShadow: '-6px -6px 28px rgba(139, 92, 246, 0.45), 6px 6px 28px rgba(236, 72, 153, 0.45)'
		});
	});
});
