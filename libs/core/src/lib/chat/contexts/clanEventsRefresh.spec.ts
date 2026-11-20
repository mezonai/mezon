import { CLAN_EVENTS_REFRESH_DELAY_MS, createClanEventsRefresher } from './clanEventsRefresh';

describe('createClanEventsRefresher', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('collapses five schedules for the same clan within the delay into one trailing refresh', () => {
		const refresh = jest.fn();
		const refresher = createClanEventsRefresher({ refresh });

		refresher.schedule('A');
		jest.advanceTimersByTime(100);
		refresher.schedule('A');
		jest.advanceTimersByTime(100);
		refresher.schedule('A');
		jest.advanceTimersByTime(100);
		refresher.schedule('A');
		jest.advanceTimersByTime(100);
		refresher.schedule('A');

		jest.advanceTimersByTime(CLAN_EVENTS_REFRESH_DELAY_MS - 1);
		expect(refresh).not.toHaveBeenCalled();

		jest.advanceTimersByTime(1);
		expect(refresh).toHaveBeenCalledTimes(1);
		expect(refresh).toHaveBeenCalledWith('A');
	});

	it('refreshes different clans independently', () => {
		const refresh = jest.fn();
		const refresher = createClanEventsRefresher({ refresh });

		refresher.schedule('A');
		refresher.schedule('B');

		jest.advanceTimersByTime(CLAN_EVENTS_REFRESH_DELAY_MS);
		expect(refresh).toHaveBeenCalledTimes(2);
		expect(refresh).toHaveBeenCalledWith('A');
		expect(refresh).toHaveBeenCalledWith('B');
	});

	it('ignores empty and DM/group clan ids', () => {
		const refresh = jest.fn();
		const refresher = createClanEventsRefresher({ refresh });

		refresher.schedule('0');
		refresher.schedule('');

		jest.advanceTimersByTime(CLAN_EVENTS_REFRESH_DELAY_MS * 2);
		expect(refresh).not.toHaveBeenCalled();
	});

	it('does not refresh after cancelAll is called before the delay', () => {
		const refresh = jest.fn();
		const refresher = createClanEventsRefresher({ refresh });

		refresher.schedule('A');
		refresher.schedule('B');
		jest.advanceTimersByTime(CLAN_EVENTS_REFRESH_DELAY_MS - 1);
		refresher.cancelAll();

		jest.advanceTimersByTime(CLAN_EVENTS_REFRESH_DELAY_MS * 2);
		expect(refresh).not.toHaveBeenCalled();
	});

	it('refreshes again on a second burst after the first has fired', () => {
		const refresh = jest.fn();
		const refresher = createClanEventsRefresher({ refresh });

		refresher.schedule('A');
		jest.advanceTimersByTime(CLAN_EVENTS_REFRESH_DELAY_MS);
		expect(refresh).toHaveBeenCalledTimes(1);
		expect(refresh).toHaveBeenLastCalledWith('A');

		refresher.schedule('A');
		refresher.schedule('A');
		jest.advanceTimersByTime(CLAN_EVENTS_REFRESH_DELAY_MS - 1);
		expect(refresh).toHaveBeenCalledTimes(1);

		jest.advanceTimersByTime(1);
		expect(refresh).toHaveBeenCalledTimes(2);
		expect(refresh).toHaveBeenLastCalledWith('A');
	});
});
