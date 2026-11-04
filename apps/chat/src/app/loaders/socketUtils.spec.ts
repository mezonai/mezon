import { connectSocketWithBackoff } from './socketUtils';

describe('connectSocketWithBackoff', () => {
	it('returns true immediately without sleeping or connecting when already connected', async () => {
		const sleeps: number[] = [];
		const sleep = jest.fn(async (ms: number) => {
			sleeps.push(ms);
		});
		const connect = jest.fn(async () => undefined);

		const result = await connectSocketWithBackoff({
			connect,
			isConnected: () => true,
			isCancelled: () => false,
			sleep
		});

		expect(result).toBe(true);
		expect(connect).not.toHaveBeenCalled();
		expect(sleep).not.toHaveBeenCalled();
		expect(sleeps).toEqual([]);
	});

	it('stops and returns true when the socket connects on the second attempt', async () => {
		let connected = false;
		const sleeps: number[] = [];
		const sleep = jest.fn(async (ms: number) => {
			sleeps.push(ms);
		});
		const connect = jest.fn(async () => {
			if (connect.mock.calls.length === 2) {
				connected = true;
			}
		});

		const result = await connectSocketWithBackoff({
			connect,
			isConnected: () => connected,
			isCancelled: () => false,
			sleep
		});

		expect(result).toBe(true);
		expect(connect).toHaveBeenCalledTimes(2);
		expect(sleeps).toEqual([2000, 4000]);
	});

	it('attempts five times with bounded backoff and returns false when it never connects', async () => {
		const sleeps: number[] = [];
		const sleep = jest.fn(async (ms: number) => {
			sleeps.push(ms);
		});
		const connect = jest.fn(async () => undefined);

		const result = await connectSocketWithBackoff({
			connect,
			isConnected: () => false,
			isCancelled: () => false,
			sleep
		});

		expect(result).toBe(false);
		expect(connect).toHaveBeenCalledTimes(5);
		expect(sleeps).toEqual([2000, 4000, 8000, 16000, 30000]);
	});

	it('resolves to false after five attempts when connect rejects every time', async () => {
		const sleeps: number[] = [];
		const sleep = jest.fn(async (ms: number) => {
			sleeps.push(ms);
		});
		const connect = jest.fn(async () => {
			throw new Error('Connection closed before receiving a handshake');
		});

		await expect(
			connectSocketWithBackoff({
				connect,
				isConnected: () => false,
				isCancelled: () => false,
				sleep
			})
		).resolves.toBe(false);

		expect(connect).toHaveBeenCalledTimes(5);
		expect(sleeps).toEqual([2000, 4000, 8000, 16000, 30000]);
	});

	it('does not call connect and returns false when cancelled during the first sleep', async () => {
		let cancelled = false;
		const sleeps: number[] = [];
		const sleep = jest.fn(async (ms: number) => {
			sleeps.push(ms);
			cancelled = true;
		});
		const connect = jest.fn(async () => undefined);

		const result = await connectSocketWithBackoff({
			connect,
			isConnected: () => false,
			isCancelled: () => cancelled,
			sleep
		});

		expect(result).toBe(false);
		expect(connect).not.toHaveBeenCalled();
		expect(sleeps).toEqual([2000]);
	});
});
