export const CLAN_EVENTS_REFRESH_DELAY_MS = 500;

type ClanEventsRefresherOptions = {
	refresh: (clanId: string) => void;
	delayMs?: number;
};

export type ClanEventsRefresher = {
	schedule: (clanId: string) => void;
	cancelAll: () => void;
};

export function createClanEventsRefresher({ refresh, delayMs = CLAN_EVENTS_REFRESH_DELAY_MS }: ClanEventsRefresherOptions): ClanEventsRefresher {
	const timers = new Map<string, ReturnType<typeof setTimeout>>();

	const schedule = (clanId: string) => {
		if (!clanId || clanId === '0') {
			return;
		}
		const existing = timers.get(clanId);
		if (existing !== undefined) {
			clearTimeout(existing);
		}
		const timer = setTimeout(() => {
			timers.delete(clanId);
			refresh(clanId);
		}, delayMs);
		timers.set(clanId, timer);
	};

	const cancelAll = () => {
		timers.forEach((timer) => clearTimeout(timer));
		timers.clear();
	};

	return { schedule, cancelAll };
}
