import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

export function useAppParams() {
	const { clanId, channelId, directId, type } = useParams();
	// const { pathname: currentURL, search } = useLocation();
	const currentURL = "";

	// const query = useMemo(() => new URLSearchParams(search), [search]);

	// const messageId = query.get('messageId');
	const messageId = "";

	return useMemo(
		() => ({
			clanId,
			channelId,
			directId,
			type,
			currentURL,
			messageId,
		}),
		[clanId, channelId, directId, type, currentURL, messageId],
	);
}