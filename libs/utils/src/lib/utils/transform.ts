export const isPublicChannel = (channel: { parentId?: string; channelPrivate?: number } | null) =>
	(!channel?.parentId || channel?.parentId === '0') && !channel?.channelPrivate;

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
		clanId: clanId,
		isPublic: isPublicChannel
	};

	if (!isClanView) {
		payload.clanId = '';
		payload.isPublic = false;
	}
	return payload;
}
