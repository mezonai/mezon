import type { ApiChannelDescription } from 'mezon-js';
import { SEARCH_CTRL_K_MAX_TEXT_BYTES, forwardServerChannelQuery, forwardServerQueryKey, forwardableServerChannels } from './forwardSearch';

const TEXT = 1;
const VOICE = 4;
const THREAD = 7;

const channel = (channelId: string, clanId: string, type: number): ApiChannelDescription => ({
	channel_id: channelId,
	clan_id: clanId,
	type,
	channel_label: 'general'
});

describe('forwardServerChannelQuery', () => {
	it('sends channel searches as typed and never member searches', () => {
		expect(forwardServerChannelQuery('  gen ')).toBe('gen');
		expect(forwardServerChannelQuery('# gen')).toBe('gen');
		expect(forwardServerChannelQuery('Đà')).toBe('Đà');
		expect(forwardServerChannelQuery('@gen')).toBeNull();
		expect(forwardServerChannelQuery('#  ')).toBeNull();
		expect(forwardServerChannelQuery('')).toBeNull();
	});

	it('skips text the server rejects for length', () => {
		expect(forwardServerChannelQuery('a'.repeat(SEARCH_CTRL_K_MAX_TEXT_BYTES))).not.toBeNull();
		expect(forwardServerChannelQuery('a'.repeat(SEARCH_CTRL_K_MAX_TEXT_BYTES + 1))).toBeNull();
		expect(forwardServerChannelQuery('đ'.repeat(128))).toBeNull();
	});
});

describe('forwardServerQueryKey', () => {
	it('treats an ASCII case change as the same search but not a non-ASCII one', () => {
		expect(forwardServerQueryKey('Gen')).toBe(forwardServerQueryKey('gen'));
		expect(forwardServerQueryKey('Đà')).not.toBe(forwardServerQueryKey('đà'));
	});
});

describe('forwardableServerChannels', () => {
	it('keeps text channels and threads of known clans that the local list does not hold', () => {
		const rows = [
			channel('10', '1', TEXT),
			channel('20', '2', TEXT),
			channel('30', '3', TEXT),
			channel('21', '2', VOICE),
			channel('22', '2', THREAD),
			channel('', '2', TEXT)
		];

		const kept = forwardableServerChannels(
			rows,
			new Set([TEXT, THREAD]),
			(clanId) => clanId !== '3',
			(channelId) => channelId === '10'
		);

		expect(kept.map((row) => row.channel_id)).toEqual(['20', '22']);
	});
});
