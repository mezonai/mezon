import { ChannelStreamMode, ChannelType } from 'mezon-js';

/**
 * Returns true when `channelType` is a DM (`CHANNEL_TYPE_DM = 3`) or Group (`CHANNEL_TYPE_GROUP = 2`).
 * Never confuse `ChannelType.CHANNEL_TYPE_GROUP` (2) with `ChannelStreamMode.STREAM_MODE_CHANNEL` (2).
 */
export const isDmOrGroupChannelType = (channelType?: number | null): channelType is ChannelType.CHANNEL_TYPE_DM | ChannelType.CHANNEL_TYPE_GROUP =>
	channelType === ChannelType.CHANNEL_TYPE_DM || channelType === ChannelType.CHANNEL_TYPE_GROUP;

/**
 * Returns true when `mode` is a DM (`STREAM_MODE_DM = 4`) or Group (`STREAM_MODE_GROUP = 3`) stream mode.
 */
export const isDMStreamMode = (mode?: number | null): mode is ChannelStreamMode.STREAM_MODE_DM | ChannelStreamMode.STREAM_MODE_GROUP =>
	mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP;

/**
 * Returns true when `clanId` represents a real clan (non-empty, not `'0'`, and not a
 * negative synthetic Citus shard key such as `"-999001"` assigned to DM/Group channels).
 */
export const isRealClanId = (clanId?: string | null): clanId is string => {
	if (clanId === null || clanId === undefined) return false;
	const trimmed = String(clanId).trim();
	return trimmed.length > 0 && trimmed !== '0' && !trimmed.startsWith('-');
};

/**
 * Normalizes a clan ID for DM/Group Redux buckets and normalized message/socket sentinels:
 * returns `clanId` for a real clan, or `'0'` for unset/`'0'`/negative synthetic DM/Group clan IDs.
 */
export const normalizeClanId = (clanId?: string | null): string => (isRealClanId(clanId) ? String(clanId).trim() : '0');
