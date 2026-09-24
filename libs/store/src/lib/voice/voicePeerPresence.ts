/** A peer identifies one connection; the sidebar still renders one row per user. */
export const voicePeerId = (value: unknown): number | undefined => {
	const id = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
	return Number.isInteger(id) && id > 0 ? id : undefined;
};

export const addVoicePeer = (peers: number[] | undefined, value: unknown): number[] | undefined => {
	const peer = voicePeerId(value);
	return peer === undefined ? peers : [...new Set([...(peers ?? []), peer])];
};

/** Missing peer IDs use legacy user presence only when no identified peers are known. */
export const removeVoicePeer = (peers: number[] | undefined, value: unknown): number[] => {
	const peer = voicePeerId(value);
	return (peers ?? []).filter((id) => id !== peer);
};

/** ListChannelVoiceUsers returns parallel user_ids / peer_ids, with repeated users for multiple sessions. */
export const voicePeersFromSnapshot = (users: string[], values?: number[]): Record<string, number[]> => {
	const result: Record<string, number[]> = {};
	// Never guess associations from a partial or legacy response.
	if (!values || users.length !== values.length) return result;
	users.forEach((user, index) => {
		const peers = addVoicePeer(result[user], values[index]);
		if (peers) result[user] = peers;
	});
	return result;
};
