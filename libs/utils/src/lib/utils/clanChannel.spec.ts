import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { isDMStreamMode, isDmOrGroupChannelType, isRealClanId, normalizeClanId } from './clanChannel';

jest.mock('mezon-js', () => ({
	ChannelType: {
		CHANNEL_TYPE_CHANNEL: 1,
		CHANNEL_TYPE_GROUP: 2,
		CHANNEL_TYPE_DM: 3,
		CHANNEL_TYPE_MEZON_VOICE: 4,
		CHANNEL_TYPE_STREAMING: 5,
		CHANNEL_TYPE_THREAD: 7,
		CHANNEL_TYPE_APP: 8
	},
	ChannelStreamMode: {
		STREAM_MODE_CHANNEL: 2,
		STREAM_MODE_GROUP: 3,
		STREAM_MODE_DM: 4,
		STREAM_MODE_THREAD: 6
	}
}));

describe('clanChannel helpers', () => {
	describe('isDmOrGroupChannelType', () => {
		it('returns true for DM and Group channel types', () => {
			expect(isDmOrGroupChannelType(ChannelType.CHANNEL_TYPE_DM)).toBe(true);
			expect(isDmOrGroupChannelType(ChannelType.CHANNEL_TYPE_GROUP)).toBe(true);
		});

		it('returns false for clan channel types and unset values', () => {
			expect(isDmOrGroupChannelType(ChannelType.CHANNEL_TYPE_CHANNEL)).toBe(false);
			expect(isDmOrGroupChannelType(ChannelType.CHANNEL_TYPE_THREAD)).toBe(false);
			expect(isDmOrGroupChannelType(ChannelType.CHANNEL_TYPE_MEZON_VOICE)).toBe(false);
			expect(isDmOrGroupChannelType(ChannelType.CHANNEL_TYPE_STREAMING)).toBe(false);
			expect(isDmOrGroupChannelType(ChannelType.CHANNEL_TYPE_APP)).toBe(false);
			expect(isDmOrGroupChannelType(0)).toBe(false);
			expect(isDmOrGroupChannelType(undefined)).toBe(false);
			expect(isDmOrGroupChannelType(null)).toBe(false);
		});
	});

	describe('isDMStreamMode', () => {
		it('returns true for DM and Group stream modes', () => {
			expect(isDMStreamMode(ChannelStreamMode.STREAM_MODE_DM)).toBe(true);
			expect(isDMStreamMode(ChannelStreamMode.STREAM_MODE_GROUP)).toBe(true);
		});

		it('returns false for STREAM_MODE_CHANNEL (2) and STREAM_MODE_THREAD (6)', () => {
			expect(isDMStreamMode(ChannelStreamMode.STREAM_MODE_CHANNEL)).toBe(false);
			expect(isDMStreamMode(ChannelStreamMode.STREAM_MODE_THREAD)).toBe(false);
			expect(isDMStreamMode(0)).toBe(false);
			expect(isDMStreamMode(undefined)).toBe(false);
			expect(isDMStreamMode(null)).toBe(false);
		});
	});

	describe('isRealClanId', () => {
		it('returns true for positive snowflake clan IDs', () => {
			expect(isRealClanId('1840654629384729600')).toBe(true);
			expect(isRealClanId('1')).toBe(true);
			expect(isRealClanId('42')).toBe(true);
		});

		it('returns false for negative synthetic Citus shard keys', () => {
			expect(isRealClanId('-1')).toBe(false);
			expect(isRealClanId('-999001')).toBe(false);
			expect(isRealClanId('-1840654629384729600')).toBe(false);
			expect(isRealClanId('-0')).toBe(false);
			expect(isRealClanId(' -999001 ')).toBe(false);
		});

		it('returns false for zero, empty, whitespace, null, and undefined', () => {
			expect(isRealClanId('0')).toBe(false);
			expect(isRealClanId(' 0 ')).toBe(false);
			expect(isRealClanId('')).toBe(false);
			expect(isRealClanId('   ')).toBe(false);
			expect(isRealClanId(null)).toBe(false);
			expect(isRealClanId(undefined)).toBe(false);
		});
	});

	describe('normalizeClanId', () => {
		it('preserves real clan IDs and normalizes unset/zero/negative synthetic IDs to "0"', () => {
			expect(normalizeClanId('1840654629384729600')).toBe('1840654629384729600');
			expect(normalizeClanId('0')).toBe('0');
			expect(normalizeClanId('')).toBe('0');
			expect(normalizeClanId(undefined)).toBe('0');
			expect(normalizeClanId(null)).toBe('0');
			expect(normalizeClanId('-999001')).toBe('0');
			expect(normalizeClanId('-1840654629384729600')).toBe('0');
		});
	});
});
