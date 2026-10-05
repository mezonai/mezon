import type { ApiChannelDescription } from 'mezon-js';

export const SEARCH_CTRL_K_MAX_TEXT_BYTES = 255;

export function forwardServerChannelQuery(searchText: string): string | null {
	const text = searchText.trim();
	if (text.startsWith('@')) {
		return null;
	}
	const needle = (text.startsWith('#') ? text.slice(1) : text).trim();
	if (!needle || new TextEncoder().encode(needle).length > SEARCH_CTRL_K_MAX_TEXT_BYTES) {
		return null;
	}
	return needle;
}

export function forwardServerQueryKey(query: string): string {
	return query.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
}

export function forwardableServerChannels(
	channels: ApiChannelDescription[],
	forwardTypes: ReadonlySet<number>,
	isKnownClan: (clanId: string) => boolean,
	isListedLocally: (channelId: string) => boolean
): ApiChannelDescription[] {
	return channels.filter((channel) => {
		const channelId = channel.channel_id ?? '';
		return channelId !== '' && forwardTypes.has(channel.type ?? -1) && isKnownClan(channel.clan_id ?? '') && !isListedLocally(channelId);
	});
}
