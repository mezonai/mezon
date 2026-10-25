import { createImgproxyUrl, getCdnFallbackUrl, getSrcEmoji, getSrcSticker, markCdnPrimaryFailed } from './index';

jest.mock('@mezon/transport', () => ({ CustomFile: class {}, uploadFileToPath: jest.fn() }), { virtual: true });
jest.mock('mezon-js', () => ({ ChannelStreamMode: {}, ChannelType: {}, safeJSONParse: JSON.parse }));
jest.mock('react-image-file-resizer', () => ({ imageFileResizer: jest.fn() }));
jest.mock('../constant', () => ({ CURRENCY: { CODE: 'VND' }, ID_MENTION_HERE: 'here', INVITE_URL_REGEX: 'https://mezon.ai/invite/' }));
jest.mock('../types', () => ({ ActionLog: {}, EBacktickType: {}, EMimeTypes: {}, EUserStatus: {}, TypeSearch: {} }));
jest.mock('../helper/videoPoster', () => ({ captureVideoPosterFromUrl: jest.fn() }));
jest.mock('./calculateAlbumLayout', () => ({}));
jest.mock('./mediaDimensions', () => ({}));
jest.mock('./windowEnvironment', () => ({}));
jest.mock('./windowSize', () => ({}));

beforeEach(() => {
	process.env.NX_MEZON_CDN_URL = 'https://cdn.mezon.ai';
	process.env.NX_CLOUDFLARE_CDN_URL = 'https://cdn.komu.vn';
	process.env.NX_IMGPROXY_BASE_URL = 'https://imgproxy.mezon.ai';
	process.env.NX_IMGPROXY_KEY = 'key';
});

it('builds unknown emoji urls on the primary CDN with a Cloudflare imgproxy fallback and switches after failure', () => {
	const id = '2114038967333556224';
	const expectedPrimary = createImgproxyUrl(`https://cdn.mezon.ai/emojis/${id}.webp`, { width: 100, height: 100, resizeType: 'fit' });
	const expectedFallback = createImgproxyUrl(`https://cdn.komu.vn/emojis/${id}.webp`, { width: 100, height: 100, resizeType: 'fit' });

	const primary = getSrcEmoji(id);
	expect(primary).toBe(expectedPrimary);
	expect(getCdnFallbackUrl(primary)).toBe(expectedFallback);

	markCdnPrimaryFailed(primary);
	expect(getSrcEmoji(id)).toBe(expectedFallback);
});

it('returns a known Mezon emoji source through imgproxy without registering a fallback', () => {
	const known = 'https://cdn.mezon.ai/emojis/1840654634100854784.webp';
	const result = getSrcEmoji('1840654634100854784', known);

	expect(result).toBe(createImgproxyUrl(known, { width: 100, height: 100, resizeType: 'fit' }));
	expect(getCdnFallbackUrl(result)).toBeUndefined();
});

it('builds sticker urls on the primary CDN with a Cloudflare fallback without imgproxy and switches after failure', () => {
	const id = '2114038967333556225';
	const expectedPrimary = `https://cdn.mezon.ai/stickers/${id}.webp`;
	const expectedFallback = `https://cdn.komu.vn/stickers/${id}.webp`;

	const primary = getSrcSticker(id);
	expect(primary).toBe(expectedPrimary);
	expect(getCdnFallbackUrl(primary)).toBe(expectedFallback);

	markCdnPrimaryFailed(primary);
	expect(getSrcSticker(id)).toBe(expectedFallback);
});

it('registers the fallback under the wrapped sticker url the image actually loads', () => {
	const id = '2114038967333556226';
	const wrap = (source: string) => createImgproxyUrl(source);
	const primary = getSrcSticker(id, wrap);

	expect(primary).toBe(wrap(`https://cdn.mezon.ai/stickers/${id}.webp`));
	expect(getCdnFallbackUrl(primary)).toBe(wrap(`https://cdn.komu.vn/stickers/${id}.webp`));
});
