export const voicePeerId = (value: unknown): number | undefined => {
	const id = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
	return Number.isInteger(id) && id > 0 ? id : undefined;
};

export const addVoicePeer = (peers: number[] | undefined, value: unknown): number[] | undefined => {
	const peer = voicePeerId(value);
	return peer === undefined ? peers : [...new Set([...(peers ?? []), peer])];
};

export const removeVoicePeer = (peers: number[] | undefined, value: unknown): number[] => {
	const peer = voicePeerId(value);
	return (peers ?? []).filter((id) => id !== peer);
};

export const voicePeersFromSnapshot = (users: string[], values?: number[]): Record<string, number[]> => {
	const result: Record<string, number[]> = {};
	if (!values || users.length !== values.length) return result;
	users.forEach((user, index) => {
		const peers = addVoicePeer(result[user], values[index]);
		if (peers) result[user] = peers;
	});
	return result;
};
