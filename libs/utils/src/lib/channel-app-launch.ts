export type ChannelAppLaunchParams = {
	webAppData: string;
	clanId: string;
	clanName: string;
	params?: string;
};

export function buildChannelAppLaunchUrl(appUrl: string, payload: ChannelAppLaunchParams): string {
	try {
		const url = new URL(appUrl);
		url.searchParams.set('data', payload.webAppData);
		url.searchParams.set('clanId', payload.clanId);
		if (payload.clanName) {
			url.searchParams.set('clanName', payload.clanName);
		}
		return payload.params ? `${url.toString()}&${payload.params}` : url.toString();
	} catch {
		const sep = appUrl.includes('?') ? '&' : '?';
		const q = new URLSearchParams();
		q.set('data', payload.webAppData);
		q.set('clanId', payload.clanId);
		if (payload.clanName) {
			q.set('clanName', payload.clanName);
		}
		return `${appUrl}${sep}${q.toString()}`;
	}
}
