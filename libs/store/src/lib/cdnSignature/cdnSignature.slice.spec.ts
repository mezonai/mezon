import { captureSentryError } from '@mezon/logger';
import { configureStore } from '@reduxjs/toolkit';
import {
	CDN_SIGNATURE_FEATURE_KEY,
	cdnSignatureActions,
	cdnSignatureReducer,
	fetchCdnSignature,
	selectCdnSignatureByChannelId,
	selectCdnSignatureEntry,
	selectCdnSignatureExpiresAt,
	selectIsCdnSignaturePending
} from './cdnSignature.slice';

const mockGenerateCDNSignature = jest.fn();

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => jest.requireActual('../../../../utils/src/lib/utils/cdnSignature'));
jest.mock('../helpers', () => ({
	getMezonCtx: () => ({}),
	ensureSession: async () => ({ client: { generateCDNSignature: mockGenerateCDNSignature }, session: { token: 'session' } })
}));

const {
	appendCdnSignature,
	getCdnSignatureChannelId,
	getCdnSignatureTtlMs,
	needsCdnSignature,
	parseSignedCdnMediaSrc,
	CDN_SIGNATURE_TTL_MS: TTL_MS
} = jest.requireActual('../../../../utils/src/lib/utils/cdnSignature');

const createStore = () => configureStore({ reducer: { [CDN_SIGNATURE_FEATURE_KEY]: cdnSignatureReducer } });

beforeEach(() => {
	jest.useRealTimers();
	mockGenerateCDNSignature.mockReset();
	jest.mocked(captureSentryError).mockClear();
});

it('requests a signature for the channel and reuses it until the TTL runs out', async () => {
	const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
	mockGenerateCDNSignature.mockResolvedValue({ signature: '1791259679-abc' });
	const store = createStore();

	await store.dispatch(fetchCdnSignature({ channelId: '42' }));
	await store.dispatch(fetchCdnSignature({ channelId: '42' }));

	expect(mockGenerateCDNSignature).toHaveBeenCalledTimes(1);
	expect(mockGenerateCDNSignature).toHaveBeenCalledWith({ token: 'session' }, { channel_id: '42' });
	expect(selectCdnSignatureByChannelId(store.getState(), '42')).toBe('1791259679-abc');
	expect(selectCdnSignatureExpiresAt(store.getState(), '42')).toBe(1_000 + getCdnSignatureTtlMs('1791259679-abc', 1_000));

	now.mockReturnValue(1_000 + TTL_MS);
	mockGenerateCDNSignature.mockResolvedValue({ signature: '1791270479-def' });
	await store.dispatch(fetchCdnSignature({ channelId: '42' }));

	expect(mockGenerateCDNSignature).toHaveBeenCalledTimes(2);
	expect(selectCdnSignatureByChannelId(store.getState(), '42')).toBe('1791270479-def');
	now.mockRestore();
});

it('keeps one request in flight per channel and ignores channels without an id', async () => {
	mockGenerateCDNSignature.mockResolvedValue({ signature: '1791259679-sig' });
	const store = createStore();

	await Promise.all([
		store.dispatch(fetchCdnSignature({ channelId: '7' })),
		store.dispatch(fetchCdnSignature({ channelId: '7' })),
		store.dispatch(fetchCdnSignature({ channelId: '0' })),
		store.dispatch(fetchCdnSignature({ channelId: '' }))
	]);

	expect(mockGenerateCDNSignature).toHaveBeenCalledTimes(1);
	expect(selectCdnSignatureByChannelId(store.getState(), '7')).toBe('1791259679-sig');
});

it('refetches on noCache and keeps the last signature when a refresh fails', async () => {
	mockGenerateCDNSignature.mockResolvedValueOnce({ signature: '1791259679-first' }).mockRejectedValueOnce(new Error('offline'));
	const store = createStore();

	await store.dispatch(fetchCdnSignature({ channelId: '9' }));
	await store.dispatch(fetchCdnSignature({ channelId: '9', noCache: true }));

	expect(mockGenerateCDNSignature).toHaveBeenCalledTimes(2);
	expect(selectCdnSignatureByChannelId(store.getState(), '9')).toBe('1791259679-first');
	expect(selectCdnSignatureExpiresAt(store.getState(), '9')).toBeLessThan(Date.now() + TTL_MS);
});

it('marks a channel the server refuses to sign as denied and drops its signature', async () => {
	mockGenerateCDNSignature.mockResolvedValueOnce({ signature: '1791259679-first' }).mockRejectedValueOnce({ code: 7, error: 'permission denied' });
	const store = createStore();

	await store.dispatch(fetchCdnSignature({ channelId: '10' }));
	const refused = await store.dispatch(fetchCdnSignature({ channelId: '10', noCache: true }));

	// Fulfilled, not rejected: the error listener turns every rejected thunk into an error toast.
	expect(fetchCdnSignature.fulfilled.match(refused)).toBe(true);
	expect(selectCdnSignatureEntry(store.getState(), '10')).toMatchObject({ signature: '', denied: true });
	expect(selectCdnSignatureByChannelId(store.getState(), '10')).toBeUndefined();
	expect(selectIsCdnSignaturePending(store.getState(), '10')).toBe(false);
});

it('does not take a timeout for a refusal', async () => {
	mockGenerateCDNSignature.mockRejectedValueOnce(new Error('Request timed out.'));
	const store = createStore();

	await store.dispatch(fetchCdnSignature({ channelId: '13' }));

	expect(selectCdnSignatureEntry(store.getState(), '13')?.denied).toBeFalsy();
});

it('settles a server without the API (404) quietly as a failure, not as a private channel', async () => {
	mockGenerateCDNSignature.mockRejectedValueOnce({ code: 404, error: 'Not found' });
	const store = createStore();

	const failed = await store.dispatch(fetchCdnSignature({ channelId: '14' }));

	expect(fetchCdnSignature.fulfilled.match(failed)).toBe(true);
	expect(selectCdnSignatureEntry(store.getState(), '14')).toMatchObject({ signature: '', denied: false });
	expect(selectIsCdnSignaturePending(store.getState(), '14')).toBe(false);
	expect(captureSentryError).not.toHaveBeenCalled();
});

it('stops waiting after 5s so the media loads unsigned, and ignores the late reply', async () => {
	jest.useFakeTimers();
	let resolveRequest!: (value: { signature: string }) => void;
	mockGenerateCDNSignature.mockReturnValueOnce(new Promise((resolve) => (resolveRequest = resolve)));
	const store = createStore();

	const request = store.dispatch(fetchCdnSignature({ channelId: '15' }));
	await jest.advanceTimersByTimeAsync(4_999);
	expect(selectIsCdnSignaturePending(store.getState(), '15')).toBe(true);

	await jest.advanceTimersByTimeAsync(1);
	await request;
	resolveRequest({ signature: '1791259679-late' });
	await jest.advanceTimersByTimeAsync(0);

	expect(selectIsCdnSignaturePending(store.getState(), '15')).toBe(false);
	expect(selectCdnSignatureByChannelId(store.getState(), '15')).toBeUndefined();
});

describe('after the CDN refuses media', () => {
	const signFirst = async (store: ReturnType<typeof createStore>) => {
		mockGenerateCDNSignature.mockResolvedValueOnce({ signature: '1791259679-old' });
		await store.dispatch(fetchCdnSignature({ channelId: '16' }));
	};

	it('makes one request for N refused images, and none for images still on the replaced signature', async () => {
		const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
		const store = createStore();
		await signFirst(store);

		now.mockReturnValue(31_000);
		mockGenerateCDNSignature.mockResolvedValueOnce({ signature: '1791259679-new' });
		await Promise.all([1, 2, 3].map(() => store.dispatch(fetchCdnSignature({ channelId: '16', failedSignature: '1791259679-old' }))));
		await store.dispatch(fetchCdnSignature({ channelId: '16', failedSignature: '1791259679-old' }));

		expect(mockGenerateCDNSignature).toHaveBeenCalledTimes(2);
		expect(selectCdnSignatureByChannelId(store.getState(), '16')).toBe('1791259679-new');
		now.mockRestore();
	});

	it('keeps a signature younger than 30s', async () => {
		const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
		const store = createStore();
		await signFirst(store);

		now.mockReturnValue(30_999);
		await store.dispatch(fetchCdnSignature({ channelId: '16', failedSignature: '1791259679-old' }));

		expect(mockGenerateCDNSignature).toHaveBeenCalledTimes(1);
		now.mockRestore();
	});
});

it('forgets every signature on removeAll', async () => {
	mockGenerateCDNSignature.mockResolvedValue({ signature: '1791259679-sig' });
	const store = createStore();

	await store.dispatch(fetchCdnSignature({ channelId: '5' }));
	store.dispatch(cdnSignatureActions.removeAll());

	expect(selectCdnSignatureByChannelId(store.getState(), '5')).toBeUndefined();
});

it('stores the signature exactly as returned and treats an empty one as a failure', async () => {
	mockGenerateCDNSignature
		.mockResolvedValueOnce({ signature: '1791271179-9a%2BRIdLbHDV7EBzQ7rxqlgvqxUPiG7Ljrq6V%2FTX8x1c%3D' })
		.mockResolvedValueOnce({ signature: '' });
	const store = createStore();

	await store.dispatch(fetchCdnSignature({ channelId: '11' }));
	await store.dispatch(fetchCdnSignature({ channelId: '12' }));

	expect(selectCdnSignatureByChannelId(store.getState(), '11')).toBe('1791271179-9a%2BRIdLbHDV7EBzQ7rxqlgvqxUPiG7Ljrq6V%2FTX8x1c%3D');
	expect(selectCdnSignatureByChannelId(store.getState(), '12')).toBeUndefined();
});

it('is pending until the first request for the channel settles, even when it fails', async () => {
	let rejectRequest!: (error: Error) => void;
	mockGenerateCDNSignature.mockReturnValueOnce(new Promise((_, reject) => (rejectRequest = reject)));
	const store = createStore();

	expect(selectIsCdnSignaturePending(store.getState(), '21')).toBe(true);
	const request = store.dispatch(fetchCdnSignature({ channelId: '21' }));
	expect(selectIsCdnSignaturePending(store.getState(), '21')).toBe(true);

	rejectRequest(new Error('Not found.'));
	await request;

	expect(selectIsCdnSignaturePending(store.getState(), '21')).toBe(false);
	expect(selectCdnSignatureByChannelId(store.getState(), '21')).toBeUndefined();
});

it('never waits for a channel that cannot be signed or a store without the slice', () => {
	const store = createStore();

	expect(selectIsCdnSignaturePending(store.getState(), '0')).toBe(false);
	expect(selectIsCdnSignaturePending(store.getState(), undefined)).toBe(false);
	expect(selectIsCdnSignaturePending({}, '21')).toBe(false);
});

it('drops a result that arrives after logout cleared the store', async () => {
	let resolveRequest!: (value: { signature: string }) => void;
	mockGenerateCDNSignature.mockReturnValueOnce(new Promise((resolve) => (resolveRequest = resolve)));
	const store = createStore();

	const request = store.dispatch(fetchCdnSignature({ channelId: '31' }));
	store.dispatch(cdnSignatureActions.removeAll());
	resolveRequest({ signature: '1791259679-old-session' });
	await request;

	expect(selectCdnSignatureByChannelId(store.getState(), '31')).toBeUndefined();
	expect(selectIsCdnSignaturePending(store.getState(), '31')).toBe(true);
});

it('keeps the new session signature when the old request settles after it', async () => {
	let resolveOldRequest!: (value: { signature: string }) => void;
	mockGenerateCDNSignature
		.mockReturnValueOnce(new Promise((resolve) => (resolveOldRequest = resolve)))
		.mockResolvedValueOnce({ signature: '1791259679-new-session' });
	const store = createStore();

	const oldRequest = store.dispatch(fetchCdnSignature({ channelId: '32' }));
	store.dispatch(cdnSignatureActions.removeAll());
	const newRequest = store.dispatch(fetchCdnSignature({ channelId: '32' }));
	await newRequest;
	resolveOldRequest({ signature: '1791259679-old-session' });
	await oldRequest;

	expect(mockGenerateCDNSignature).toHaveBeenCalledTimes(2);
	expect(selectCdnSignatureByChannelId(store.getState(), '32')).toBe('1791259679-new-session');
});

// `198b4ed087001000` and `18b1ffba86c01000` are channels 1840651530236071936 and 1779484504377790464 in hex.
const CHANNEL_FILE = 'https://cdn.mezon.ai/198b4ed087001000/1840651530236071937_abc.png';
const OTHER_CHANNEL_FILE = 'https://cdn.mezon.ai/18b1ffba86c01000/1779484504377790465_abc.png';

describe('getCdnSignatureChannelId', () => {
	it('reads the channel a file was uploaded to from its folder, whichever channel shows it', () => {
		expect(getCdnSignatureChannelId(CHANNEL_FILE)).toBe('1840651530236071936');
		expect(getCdnSignatureChannelId(OTHER_CHANNEL_FILE)).toBe('1779484504377790464');
		expect(getCdnSignatureChannelId('https://cdn.mezon.ai/198B4ED087001000/abc.png')).toBe('1840651530236071936');
	});

	it('is undefined for files that need no signature', () => {
		expect(getCdnSignatureChannelId('https://cdn.mezon.ai/0000000000000000/abc.png')).toBeUndefined();
		expect(getCdnSignatureChannelId('https://cdn.mezon.ai/1775731111020111321/abc.png')).toBeUndefined();
		expect(getCdnSignatureChannelId('https://cdn.mezon.ai/abc.png')).toBeUndefined();
		expect(getCdnSignatureChannelId(`${CHANNEL_FILE}?1791271179-x`)).toBeUndefined();
		expect(getCdnSignatureChannelId('https://example.com/198b4ed087001000/abc.png')).toBeUndefined();
		expect(getCdnSignatureChannelId(undefined)).toBeUndefined();
	});
});

describe('getCdnSignatureTtlMs', () => {
	const NOW = 1_791_259_679_000;
	const MARGIN = 5 * 60 * 1000;

	it('ends a margin before the expiry the signature starts with', () => {
		expect(getCdnSignatureTtlMs(`${NOW / 1000 + 3600}-x`, NOW)).toBe(3600 * 1000 - MARGIN);
	});

	it('never goes past the default lifetime', () => {
		expect(getCdnSignatureTtlMs(`${NOW / 1000 + 24 * 3600}-x`, NOW)).toBe(TTL_MS - MARGIN);
	});

	it('falls back to the default lifetime without a believable expiry', () => {
		expect(getCdnSignatureTtlMs('abc', NOW)).toBe(TTL_MS - MARGIN);
		expect(getCdnSignatureTtlMs(`${NOW / 1000 - 60}-x`, NOW)).toBe(TTL_MS - MARGIN);
		expect(getCdnSignatureTtlMs(`${NOW / 1000 + 6 * 60}-x`, NOW)).toBe(TTL_MS - MARGIN);
	});
});

describe('parseSignedCdnMediaSrc', () => {
	const SIGNATURE = '1791271179-9a%2BRIdL%2FTX8x1c%3D';
	const SIGNED = `${CHANNEL_FILE}?${SIGNATURE}`;
	const MEDIA = { url: CHANNEL_FILE, channelId: '1840651530236071936', signature: SIGNATURE };

	it('reads the file, channel and signature of a signed CDN url, also through imgproxy', () => {
		expect(parseSignedCdnMediaSrc(SIGNED)).toEqual(MEDIA);
		expect(parseSignedCdnMediaSrc(`https://imgproxy.mezon.ai/key/rs:fit:300:300:1/mb:2097152/plain/${encodeURIComponent(SIGNED)}@webp`)).toEqual(
			MEDIA
		);
	});

	it('is undefined for unsigned, channel-less and non-CDN media', () => {
		expect(parseSignedCdnMediaSrc(CHANNEL_FILE)).toBeUndefined();
		expect(parseSignedCdnMediaSrc(`https://imgproxy.mezon.ai/key/rs:fit:300:300:1/plain/${CHANNEL_FILE}@webp`)).toBeUndefined();
		expect(parseSignedCdnMediaSrc('https://cdn.mezon.ai/0000000000000000/abc.png?sig=1')).toBeUndefined();
		expect(parseSignedCdnMediaSrc('https://example.com/198b4ed087001000/abc.png?sig=1')).toBeUndefined();
		expect(parseSignedCdnMediaSrc(undefined)).toBeUndefined();
	});
});

describe('needsCdnSignature', () => {
	it('is true only for Mezon CDN files uploaded with a channel that are not signed yet', () => {
		expect(needsCdnSignature(CHANNEL_FILE)).toBe(true);
		expect(needsCdnSignature(`${CHANNEL_FILE}?1791271179-x`)).toBe(false);
		expect(needsCdnSignature('https://cdn.mezon.ai/0000000000000000/abc.png')).toBe(false);
		expect(needsCdnSignature('https://example.com/198b4ed087001000/abc.png')).toBe(false);
		expect(needsCdnSignature('blob:http://localhost/1')).toBe(false);
		expect(needsCdnSignature(undefined)).toBe(false);
	});
});

describe('appendCdnSignature', () => {
	it('appends the signature as the query of a CDN url', () => {
		expect(appendCdnSignature(CHANNEL_FILE, '1791271179-9a%2BRIdL%2FTX8x1c%3D')).toBe(`${CHANNEL_FILE}?1791271179-9a%2BRIdL%2FTX8x1c%3D`);
		expect(appendCdnSignature(CHANNEL_FILE, 'Expires=1&Signature=x')).toBe(`${CHANNEL_FILE}?Expires=1&Signature=x`);
		expect(appendCdnSignature(CHANNEL_FILE, '?sig=1')).toBe(`${CHANNEL_FILE}?sig=1`);
	});

	it('leaves non-CDN, already signed, channel-less and unsigned urls alone', () => {
		expect(appendCdnSignature('https://example.com/abc.png', 'sig=1')).toBe('https://example.com/abc.png');
		expect(appendCdnSignature('blob:http://localhost/123', 'sig=1')).toBe('blob:http://localhost/123');
		expect(appendCdnSignature(`${CHANNEL_FILE}?sig=1`, 'sig=2')).toBe(`${CHANNEL_FILE}?sig=1`);
		expect(appendCdnSignature('https://cdn.mezon.ai/0000000000000000/abc.png', 'sig=1')).toBe('https://cdn.mezon.ai/0000000000000000/abc.png');
		expect(appendCdnSignature(CHANNEL_FILE, undefined)).toBe(CHANNEL_FILE);
		expect(appendCdnSignature(undefined, 'sig=1')).toBeUndefined();
	});
});
