import { configureStore } from '@reduxjs/toolkit';
import {
	CDN_SIGNATURE_FEATURE_KEY,
	cdnSignatureActions,
	cdnSignatureReducer,
	fetchCdnSignature,
	selectCdnSignatureByChannelId,
	selectCdnSignatureExpiresAt,
	selectIsCdnSignaturePending
} from './cdnSignature.slice';

const mockGenerateCDNSignature = jest.fn();

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({
	CDN_SIGNATURE_TTL_MS: jest.requireActual('../../../../utils/src/lib/utils/cdnSignature').CDN_SIGNATURE_TTL_MS
}));
jest.mock('../helpers', () => ({
	getMezonCtx: () => ({}),
	ensureSession: async () => ({ client: { generateCDNSignature: mockGenerateCDNSignature }, session: { token: 'session' } })
}));

const { appendCdnSignature, needsCdnSignature, CDN_SIGNATURE_TTL_MS: TTL_MS } = jest.requireActual('../../../../utils/src/lib/utils/cdnSignature');

const createStore = () => configureStore({ reducer: { [CDN_SIGNATURE_FEATURE_KEY]: cdnSignatureReducer } });

beforeEach(() => {
	jest.useRealTimers();
	mockGenerateCDNSignature.mockReset();
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
	expect(selectCdnSignatureExpiresAt(store.getState(), '42')).toBe(1_000 + TTL_MS);

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

describe('needsCdnSignature', () => {
	it('is true only for Mezon CDN urls that are not signed yet', () => {
		expect(needsCdnSignature('https://cdn.mezon.ai/abc.png')).toBe(true);
		expect(needsCdnSignature('https://cdn.mezon.ai/abc.png?1791271179-x')).toBe(false);
		expect(needsCdnSignature('https://example.com/abc.png')).toBe(false);
		expect(needsCdnSignature('blob:http://localhost/1')).toBe(false);
		expect(needsCdnSignature(undefined)).toBe(false);
	});
});

describe('appendCdnSignature', () => {
	it('appends the signature as the query of a CDN url', () => {
		expect(appendCdnSignature('https://cdn.mezon.ai/abc.png', '1791271179-9a%2BRIdL%2FTX8x1c%3D')).toBe(
			'https://cdn.mezon.ai/abc.png?1791271179-9a%2BRIdL%2FTX8x1c%3D'
		);
		expect(appendCdnSignature('https://cdn.mezon.ai/abc.png', 'Expires=1&Signature=x')).toBe(
			'https://cdn.mezon.ai/abc.png?Expires=1&Signature=x'
		);
		expect(appendCdnSignature('https://cdn.mezon.ai/abc.png', '?sig=1')).toBe('https://cdn.mezon.ai/abc.png?sig=1');
	});

	it('leaves non-CDN, already signed and unsigned urls alone', () => {
		expect(appendCdnSignature('https://example.com/abc.png', 'sig=1')).toBe('https://example.com/abc.png');
		expect(appendCdnSignature('blob:http://localhost/123', 'sig=1')).toBe('blob:http://localhost/123');
		expect(appendCdnSignature('https://cdn.mezon.ai/abc.png?sig=1', 'sig=2')).toBe('https://cdn.mezon.ai/abc.png?sig=1');
		expect(appendCdnSignature('https://cdn.mezon.ai/abc.png', undefined)).toBe('https://cdn.mezon.ai/abc.png');
		expect(appendCdnSignature(undefined, 'sig=1')).toBeUndefined();
	});
});
