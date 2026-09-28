import { describe, expect, it } from '@jest/globals';
import { sfuCloseAction, sfuReconnectDelay } from './sfuReconnect';

describe('SFU reconnect contract', () => {
	it.each([1000, 4006, 4011, 4012])('stops on %i', (code) => {
		expect(sfuCloseAction(code)).toBe('stop');
	});
	it.each([4003, 4004, 4005])('refreshes the token on %i', (code) => {
		expect(sfuCloseAction(code)).toBe('refresh-token');
	});
	it('discards the failed DTLS transport on 4013', () => {
		expect(sfuCloseAction(4013)).toBe('reset-transport');
	});
	it.each([0, 1001, 1006, 1011, 4001, 4008, 4999])('retries %i', (code) => {
		expect(sfuCloseAction(code)).toBe('retry');
	});
	it('uses bounded exponential backoff with equal jitter', () => {
		for (let attempt = 0; attempt < 32; attempt++) {
			const cap = 1000 * 2 ** Math.min(attempt, 3);
			expect(sfuReconnectDelay(attempt, 0)).toBe(cap / 2);
			expect(sfuReconnectDelay(attempt, 1)).toBe(cap);
			expect(sfuReconnectDelay(attempt, 0.5)).toBe(cap * 0.75);
		}
	});
});
