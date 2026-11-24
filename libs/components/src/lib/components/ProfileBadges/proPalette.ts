import type { CSSProperties } from 'react';

export type ProPalette = {
	start: string;
	end: string;
	accent: string;
};

export type ProfileBadgeKind = 'pro' | 'quest' | 'clan';

export type ProfileBadgeItem = {
	kind: ProfileBadgeKind;
};

export const DEFAULT_PRO_PALETTE: ProPalette = {
	start: '#8b5cf6',
	end: '#ec4899',
	accent: '#ec4899'
};

export const PRO_PALETTES: Record<string, ProPalette> = {
	dark: { start: '#8b5cf6', end: '#ec4899', accent: '#ec4899' },
	light: { start: '#8b5cf6', end: '#ec4899', accent: '#ec4899' },
	purple_haze: { start: '#a78bfa', end: '#f472b6', accent: '#f472b6' },
	sunrise: { start: '#9f4175', end: '#db2777', accent: '#db2777' },
	redDark: { start: '#e11d48', end: '#fb7185', accent: '#fb7185' },
	abyss_dark: { start: '#3b82f6', end: '#8b5cf6', accent: '#a78bfa' },
	berrynade: { start: '#db2777', end: '#e7a525', accent: '#e7a525' },
	cisher: { start: '#f3b336', end: '#ee8558', accent: '#d9622b' },
	sunset: { start: '#8b5cf6', end: '#db7f4b', accent: '#db7f4b' }
};

export const getProPalette = (theme?: string | null): ProPalette => (theme && PRO_PALETTES[theme]) || DEFAULT_PRO_PALETTE;

export const hexToRgba = (hex: string, alpha: number): string => {
	const cleaned = hex.replace('#', '');
	if (cleaned.length !== 6) {
		return hex;
	}
	const r = parseInt(cleaned.slice(0, 2), 16);
	const g = parseInt(cleaned.slice(2, 4), 16);
	const b = parseInt(cleaned.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const proCardStyle = (palette: ProPalette): CSSProperties => ({
	border: `1px solid ${hexToRgba(palette.accent, 0.55)}`,
	boxShadow: `-6px -6px 28px ${hexToRgba(palette.start, 0.45)}, 6px 6px 28px ${hexToRgba(palette.end, 0.45)}`
});
