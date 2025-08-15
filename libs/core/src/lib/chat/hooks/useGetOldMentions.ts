import { selectMessagesEntityById, useAppSelector } from '@mezon/store';
import { useCallback } from 'react';

export function useGetOldMentions(channelId: string) {
	const messagesEntities = useAppSelector((state) => selectMessagesEntityById(state, channelId));

	const getOldMentions = useCallback(
		(messageId: string) => {
			const currentMessage = messagesEntities?.[messageId];
			return currentMessage?.mentions ? JSON.stringify(currentMessage.mentions) : '';
		},
		[messagesEntities]
	);

	return getOldMentions;
}
