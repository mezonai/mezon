import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WhipError, classifyWhip, deleteWhip, publishWhip } from './whip';

const WHIP_URL = 'https://stream.example.com/whip/2115742638345818112';
const ANSWER_SDP = 'v=0\r\nm=video 40000 UDP/TLS/RTP/SAVPF 96\r\nm=audio 40000 UDP/TLS/RTP/SAVPF 111\r\n';

const mockResponse = (status: number, body = '', headersMap: Record<string, string> = {}) => {
	const lower = Object.fromEntries(Object.entries(headersMap).map(([k, v]) => [k.toLowerCase(), v]));
	return {
		status,
		headers: {
			get: (name: string) => lower[name.toLowerCase()] ?? null
		} as unknown as Headers,
		text: async () => body
	} as Response;
};

let fetchMock: jest.Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

beforeEach(() => {
	fetchMock = jest.fn(async () => mockResponse(200));
	Object.assign(globalThis, { fetch: fetchMock });
});

describe('classifyWhip', () => {
	it('maps terminal HTTP statuses and defaults others to retry', () => {
		expect(classifyWhip(409)).toBe('busy');
		expect(classifyWhip(401)).toBe('forbidden');
		expect(classifyWhip(403)).toBe('forbidden');
		expect(classifyWhip(400)).toBe('unsupported');
		expect(classifyWhip(406)).toBe('unsupported');
		expect(classifyWhip(503)).toBe('retry');
		expect(classifyWhip(500)).toBe('retry');
		expect(classifyWhip(404)).toBe('retry');
		expect(classifyWhip(0)).toBe('retry');
	});
});

describe('publishWhip', () => {
	it('posts SDP with Bearer auth and resolves relative and absolute Location headers', async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(201, ANSWER_SDP, { Location: '/resource/0.1.abcdef' }));

		const first = await publishWhip(WHIP_URL, 'secret-token', 'v=0\r\n');

		expect(fetchMock).toHaveBeenCalledWith(
			WHIP_URL,
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/sdp', Authorization: 'Bearer secret-token' },
				body: 'v=0\r\n'
			})
		);
		expect(first).toEqual({
			resource: 'https://stream.example.com/resource/0.1.abcdef',
			answer: ANSWER_SDP
		});

		fetchMock.mockResolvedValueOnce(mockResponse(201, ANSWER_SDP, { Location: 'https://edge2.example.com:8443/resource/2.5.1234' }));

		const second = await publishWhip(WHIP_URL, 'secret-token', 'v=0\r\n');
		expect(second.resource).toBe('https://edge2.example.com:8443/resource/2.5.1234');
	});

	it('throws WhipError when Location is missing/invalid or answer SDP is empty', async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(201, ANSWER_SDP));
		await expect(publishWhip(WHIP_URL, 'secret-token', 'v=0\r\n')).rejects.toEqual(expect.objectContaining({ status: 201 }));

		fetchMock.mockResolvedValueOnce(mockResponse(201, ANSWER_SDP, { Location: 'ftp://stream.example.com/resource/1' }));
		await expect(publishWhip(WHIP_URL, 'secret-token', 'v=0\r\n')).rejects.toEqual(expect.objectContaining({ status: 201 }));

		fetchMock.mockResolvedValueOnce(mockResponse(201, '   ', { Location: '/resource/0.1.abcdef' }));
		await expect(publishWhip(WHIP_URL, 'secret-token', 'v=0\r\n')).rejects.toEqual(expect.objectContaining({ status: 201 }));
	});

	it('preserves Retry-After on 503 capped at 16 s and ignores invalid headers', async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(503, '', { 'Retry-After': '5' }));
		const err5 = (await publishWhip(WHIP_URL, 'secret-token', 'v=0\r\n').catch((e: unknown) => e)) as WhipError;
		expect(err5).toBeInstanceOf(WhipError);
		expect(err5.status).toBe(503);
		expect(err5.retryAfterMs).toBe(5000);

		fetchMock.mockResolvedValueOnce(mockResponse(503, '', { 'Retry-After': '60' }));
		const errCapped = (await publishWhip(WHIP_URL, 'secret-token', 'v=0\r\n').catch((e: unknown) => e)) as WhipError;
		expect(errCapped.retryAfterMs).toBe(16000);

		fetchMock.mockResolvedValueOnce(mockResponse(503, '', { 'Retry-After': 'soon' }));
		const errInvalid = (await publishWhip(WHIP_URL, 'secret-token', 'v=0\r\n').catch((e: unknown) => e)) as WhipError;
		expect(errInvalid.retryAfterMs).toBeUndefined();
	});
});

describe('deleteWhip', () => {
	it('sends Bearer token with keepalive and retries once after 150 ms on 503', async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(503)).mockResolvedValueOnce(mockResponse(200));

		const startedAt = Date.now();
		const status = await deleteWhip('https://stream.example.com/resource/1', 'secret-token', true);
		const elapsed = Date.now() - startedAt;

		expect(status).toBe(200);
		expect(elapsed).toBeGreaterThanOrEqual(130);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			'https://stream.example.com/resource/1',
			expect.objectContaining({
				method: 'DELETE',
				headers: { Authorization: 'Bearer secret-token' },
				keepalive: true
			})
		);
	});

	it('returns status without retrying on non-503 and undefined on transport failure', async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(404));
		await expect(deleteWhip('https://stream.example.com/resource/1', 'secret-token')).resolves.toBe(404);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
		await expect(deleteWhip('https://stream.example.com/resource/1', 'secret-token')).resolves.toBeUndefined();
	});
});
