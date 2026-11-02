import { describe, expect, it, jest } from '@jest/globals';
import { isRefreshRefused } from './healthyEndpoint';

jest.mock('mezon-js-protobuf', () => ({}));

describe('isRefreshRefused', () => {
	it('counts 400, 401 and 403 as the api turning the refresh token down', () => {
		expect([400, 401, 403].map(isRefreshRefused)).toEqual([true, true, true]);
	});

	it('does not count a 500, a timeout or a proxy error', () => {
		expect([500, 0, 408, 429, 502, 503, 504].map(isRefreshRefused)).toEqual([false, false, false, false, false, false, false]);
	});
});
