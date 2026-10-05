import { useMezon } from '@mezon/transport';
import { forwardServerChannelQuery, forwardServerQueryKey } from '@mezon/utils';
import type { ApiChannelDescription } from 'mezon-js';
import { useEffect, useMemo, useRef, useState } from 'react';

const SERVER_SEARCH_DEBOUNCE_MS = 300;
const SEARCH_TYPE_CHANNELS = 2;
const NO_CHANNELS: ApiChannelDescription[] = [];

export function useForwardChannelSearch(searchText: string) {
	const { clientRef, sessionRef } = useMezon();
	const query = useMemo(() => forwardServerChannelQuery(searchText), [searchText]);
	const queryKey = query === null ? null : forwardServerQueryKey(query);
	const queryRef = useRef(query);
	queryRef.current = query;
	const [channels, setChannels] = useState<ApiChannelDescription[]>(NO_CHANNELS);
	const [settledKey, setSettledKey] = useState<string | null>(null);

	useEffect(() => {
		const text = queryRef.current;
		if (text === null) {
			setChannels(NO_CHANNELS);
			setSettledKey(null);
			return;
		}
		let cancelled = false;
		const timer = setTimeout(async () => {
			const client = clientRef.current;
			const session = sessionRef.current;
			try {
				if (client && session) {
					const response = await client.searchCtrlK(session, { text, type: SEARCH_TYPE_CHANNELS });
					if (!cancelled) {
						setChannels(response?.channels ?? NO_CHANNELS);
					}
				}
			} catch (error) {
				console.warn('[forward] SearchCtrlK channels failed', error);
			} finally {
				if (!cancelled) {
					setSettledKey(queryKey);
				}
			}
		}, SERVER_SEARCH_DEBOUNCE_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [queryKey, clientRef, sessionRef]);

	return {
		channels: queryKey === null ? NO_CHANNELS : channels,
		pending: queryKey !== null && queryKey !== settledKey
	};
}
