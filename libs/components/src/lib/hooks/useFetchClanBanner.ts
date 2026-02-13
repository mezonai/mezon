import { useCallback } from 'react';

/**
 * Custom hook to fetch clan banner by ID
 * @returns A function that fetches the clan banner by clan ID
 */
export const useFetchClanBanner = () => {
	const fetchClanBannerById = useCallback(async (clanId: string): Promise<string> => {
		const host = process.env.NX_CHAT_APP_API_GW_HOST;
		const port = process.env.NX_CHAT_APP_API_GW_PORT;
		const candidates = [`https://${host}/clans/${clanId}`, `https://${host}:${port}/clans/${clanId}`];

		for (const endpoint of candidates) {
			try {
				const res = await fetch(endpoint, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				});
				if (!res.ok) continue;
				const body = await res.json();
				const resolved = body?.banner || body?.clan_banner || body?.data?.banner || body?.data?.clan_banner || '';
				if (resolved) return resolved;
			} catch {
				// ignore and try next endpoint
			}
		}

		return '';
	}, []);

	return { fetchClanBannerById };
};
