import { useMezon } from '@mezon/transport';
import { forwardServerChannelQuery, forwardServerQueryKey } from '@mezon/utils';
import type { ApiChannelDescription } from 'mezon-js';
import { useEffect, useMemo, useRef, useState } from 'react';

const SERVER_SEARCH_DEBOUNCE_MS = 300;
const SEARCH_TYPE_CHANNELS = 2;

export function useForwardChannelSearch(searchText: string) {
	const { clientRef, sessionRef } = useMezon();
	const query = useMemo(() => forwardServerChannelQuery(searchText), [searchText]);
	const queryKey = query === null ? null : forwardServerQueryKey(query);
	const queryRef = useRef(query);
	queryRef.current = query;
	const [channels, setChannels] = useState<ApiChannelDescription[]>([]);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		const text = queryRef.current;
		if (text === null) {
			setPending(false);
			setChannels([]);
			return;
		}
		setPending(true);
		let cancelled = false;
		const timer = setTimeout(async () => {
			const client = clientRef.current;
			const session = sessionRef.current;
			try {
				if (!client || !session) {
					return;
				}
				const response = await client.searchCtrlK(session, { text, type: SEARCH_TYPE_CHANNELS });
				if (!cancelled) {
					setChannels(response?.channels ?? []);
				}
			} catch (error) {
				console.warn('[forward] SearchCtrlK channels failed', error);
			} finally {
				if (!cancelled) {
					setPending(false);
				}
			}
		}, SERVER_SEARCH_DEBOUNCE_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [queryKey, clientRef, sessionRef]);

	return { channels, pending };
}
