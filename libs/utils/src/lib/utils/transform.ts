export const isPublicChannel = (channel: { parent_id?: string; channel_private?: number } | null) =>
	(!channel?.parent_id || channel?.parent_id === '0') && !channel?.channel_private;

export function transformPayloadWriteSocket({
	clanId,
	isPublicChannel,
	isClanView
}: {
	clanId: string;
	isPublicChannel: boolean;
	isClanView: boolean;
}) {
	const payload = {
		clan_id: clanId,
		is_public: isPublicChannel
	};

	if (!isClanView) {
		payload.clan_id = '';
		payload.is_public = false;
	}
	return payload;
}
