import { getPublicAboutImageSrc } from './aboutImage';

describe('getPublicAboutImageSrc', () => {
	it.each([
		'https://profile.mezon.ai/clan/qr.png',
		'https://profile.mezon.ai/clan/qr.png?width=320&name=QR',
		'https://profile.mezon.ai/clan/QR%20code.png'
	])('allows public image URLs: %s', (src) => {
		expect(getPublicAboutImageSrc(src)).toBe(src);
	});

	it('normalizes allowed URLs before rendering', () => {
		expect(getPublicAboutImageSrc(' HTTPS://PROFILE.MEZON.AI:443/clan/qr.png ')).toBe('https://profile.mezon.ai/clan/qr.png');
	});

	it.each([
		'https://tracker.example/pixel.png',
		'https://cdn.mezon.ai/clan/qr.png',
		'https://cdn.komu.vn/clan/qr.png',
		'https://profile.mezon.ai.tracker.example/qr.png',
		'https://tracker.example/profile.mezon.ai/qr.png',
		'https://profile.mezon.ai@tracker.example/qr.png',
		'https://tracker.example/?src=https://profile.mezon.ai/qr.png',
		'https://user:password@profile.mezon.ai/qr.png',
		'https://profile.mezon.ai:8443/qr.png',
		'https://profile.mezon.ai./qr.png',
		'http://profile.mezon.ai/qr.png',
		'//profile.mezon.ai/qr.png',
		'/qr.png',
		'qr.png',
		'data:image/png;base64,aGVsbG8=',
		'blob:https://profile.mezon.ai/image',
		// eslint-disable-next-line no-script-url -- Verify that script URLs are rejected.
		'javascript:alert(1)',
		'not a URL',
		''
	])('rejects URLs outside the public image origin: %s', (src) => {
		expect(getPublicAboutImageSrc(src)).toBeNull();
	});
});
