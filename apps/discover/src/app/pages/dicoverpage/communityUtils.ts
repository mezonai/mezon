import { parseHashtags } from '@mezon/store';
import type { ApiClanDiscover } from 'mezon-js';
import type { DiscoverSort } from '../../constants/constants';

export type DiscoverClan = ApiClanDiscover;

export function clanMatchesId(clan: DiscoverClan, id?: string | null): boolean {
	if (!id) return false;
	return clan.clan_id === id || clan.short_url === id;
}

export function isSameClan(a?: DiscoverClan | null, b?: DiscoverClan | null): boolean {
	if (!a || !b) return false;
	if (a.clan_id && b.clan_id && a.clan_id === b.clan_id) return true;
	if (a.short_url && b.short_url && a.short_url === b.short_url) return true;
	return false;
}

export function getClanHref(clan: DiscoverClan): string {
	const id = clan.short_url || clan.clan_id;
	return id ? `/clans/${id}` : '/clans';
}

export function getClanInitials(name?: string): string {
	if (!name?.trim()) return 'MZ';
	const parts = name.trim().split(/\s+/).slice(0, 2);
	return parts
		.map((part) => part.charAt(0))
		.join('')
		.toUpperCase();
}

export function formatCompactNumber(value: number | undefined, locale?: string): string {
	const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
	return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(safe);
}

export function formatExactNumber(value: number | undefined, locale?: string): string {
	const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
	return new Intl.NumberFormat(locale).format(safe);
}

export function matchesQuery(clan: DiscoverClan, query: string): boolean {
	const normalized = query.trim().toLowerCase();
	if (normalized.length < 2) return true;
	const haystack = `${clan.clan_name || ''} ${clan.description || ''} ${clan.about || ''} ${getClanHashtags(clan).join(' ')}`.toLowerCase();
	return haystack.includes(normalized);
}

export function sortClans(clans: DiscoverClan[], sort: DiscoverSort): DiscoverClan[] {
	if (sort === 'largest') {
		return [...clans].sort((a, b) => getMemberCount(b) - getMemberCount(a));
	}
	if (sort === 'newest') {
		return [...clans].sort((a, b) => (getCreatedAtMs(b) || 0) - (getCreatedAtMs(a) || 0));
	}
	return clans;
}

export function pickFeaturedClans(clans: DiscoverClan[], limit = 3): DiscoverClan[] {
	const verified = clans.filter((clan) => clan.verified);
	const rest = [...clans].filter((clan) => !clan.verified).sort((a, b) => getMemberCount(b) - getMemberCount(a));
	const merged = [...verified, ...rest];
	const seen = new Set<string>();
	const unique: DiscoverClan[] = [];
	for (const clan of merged) {
		const id = clan.clan_id || clan.short_url;
		if (!id || seen.has(id)) continue;
		seen.add(id);
		unique.push(clan);
		if (unique.length >= limit) break;
	}
	return unique;
}

export function trackDiscoverEvent(eventName: string, params?: Record<string, unknown>): void {
	const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
	if (typeof gtag === 'function') {
		gtag('event', eventName, params);
	}
}

export function getInviteUrl(clan: DiscoverClan): string | null {
	if (!clan.invite_id) return null;
	return `https://mezon.ai/invite/${clan.invite_id}`;
}

export function copyTextToClipboard(text: string): boolean {
	const textArea = document.createElement('textarea');
	textArea.value = text;
	textArea.setAttribute('readonly', '');
	textArea.style.position = 'fixed';
	textArea.style.top = '0';
	textArea.style.left = '0';
	textArea.style.opacity = '0';
	textArea.style.pointerEvents = 'none';
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	textArea.setSelectionRange(0, text.length);
	try {
		return document.execCommand('copy');
	} catch {
		return false;
	} finally {
		document.body.removeChild(textArea);
	}
}

export async function copyText(text: string): Promise<boolean> {
	try {
		if (window.isSecureContext && navigator.clipboard) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		// HTTP / LAN hosts are not a secure context.
	}
	return copyTextToClipboard(text);
}

function asFiniteCount(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed) && parsed >= 0) return parsed;
	}
	return undefined;
}

export function getMemberCount(clan: DiscoverClan): number {
	return asFiniteCount(clan.total_members) ?? 0;
}

export function getOnlineCount(clan: DiscoverClan): number {
	const record = clan as DiscoverClan & { onlineMembers?: number };
	return asFiniteCount(clan.online_members ?? record.onlineMembers) ?? 0;
}

export type TextSegment = { type: 'text'; value: string } | { type: 'link'; value: string; href: string };

const URL_FINDER = /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
const TRAILING_PUNCT = /[),.;:!?]+$/;

function toSafeHttpHref(raw: string): string | null {
	const value = raw.trim();
	if (!value) return null;
	const candidate = /^https?:\/\//i.test(value) ? value : /^www\./i.test(value) ? `https://${value}` : null;
	if (!candidate) return null;
	try {
		const url = new URL(candidate);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		if (!url.hostname || !url.hostname.includes('.')) return null;
		return url.href;
	} catch {
		return null;
	}
}

export function splitLinkifiedText(text: string): TextSegment[] {
	if (!text) return [];
	const segments: TextSegment[] = [];
	const matcher = new RegExp(URL_FINDER.source, 'gi');
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = matcher.exec(text)) !== null) {
		const raw = match[0];
		const punct = raw.match(TRAILING_PUNCT)?.[0] ?? '';
		const core = punct ? raw.slice(0, -punct.length) : raw;
		const href = toSafeHttpHref(core);
		if (match.index > lastIndex) {
			segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
		}
		if (href && core) {
			segments.push({ type: 'link', value: core, href });
			if (punct) segments.push({ type: 'text', value: punct });
		} else {
			segments.push({ type: 'text', value: raw });
		}
		lastIndex = match.index + raw.length;
	}
	if (lastIndex < text.length) {
		segments.push({ type: 'text', value: text.slice(lastIndex) });
	}
	return segments.length ? segments : [{ type: 'text', value: text }];
}

export function getCreatedAtMs(clan: DiscoverClan): number | null {
	const seconds = asFiniteCount(clan.create_time_seconds);
	if (seconds === undefined || seconds <= 0) return null;
	return seconds * 1000;
}

export function getClanHashtags(clan: DiscoverClan): string[] {
	return parseHashtags(clan.hashtags);
}

export function splitClanStory(clan: DiscoverClan): { lede: string; body: string } {
	const description = (clan.description || '').trim();
	const about = (clan.about || '').trim();
	if (description && about && description !== about) {
		if (description.length <= 280) return { lede: description, body: about };
		return { lede: '', body: `${description}\n\n${about}` };
	}
	if (description.length > 0 && description.length <= 280 && !about) {
		return { lede: description, body: '' };
	}
	return { lede: '', body: about || description };
}
