export type MeetMetadata = { username: string; avatar: string };

export const parseMeetMetadata = (metadata?: string): MeetMetadata => {
	try {
		const value: unknown = metadata ? JSON.parse(metadata) : null;
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			const fields = value as Record<string, unknown>;
			return {
				username: typeof fields.username === 'string' ? fields.username.trim() : '',
				avatar: typeof fields.avatar === 'string' ? fields.avatar.trim() : ''
			};
		}
	} catch {} // eslint-disable-line no-empty
	return { username: '', avatar: '' };
};
