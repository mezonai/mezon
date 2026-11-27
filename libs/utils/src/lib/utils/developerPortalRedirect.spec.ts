import {
	POST_LOGIN_REDIRECT_STORAGE_KEY,
	consumePostLoginRedirect,
	getDeveloperPortalRedirect,
	isDeveloperPortalPath,
	sanitizePostLoginRedirect,
	savePostLoginRedirect
} from './developerPortalRedirect';

describe('developerPortalRedirect', () => {
	it('maps singular /developer paths to /developers preserving subpath, query, and hash', () => {
		expect(getDeveloperPortalRedirect('/developer')).toBe('/developers/');
		expect(getDeveloperPortalRedirect('/developer/')).toBe('/developers/');
		expect(getDeveloperPortalRedirect('/Developer')).toBe('/developers/');
		expect(getDeveloperPortalRedirect('/developer/applications')).toBe('/developers/applications');
		expect(getDeveloperPortalRedirect('/developer/applications/123', '?tab=oauth2', '#section')).toBe(
			'/developers/applications/123?tab=oauth2#section'
		);
	});

	it('does not redirect plural /developers or unrelated paths', () => {
		expect(getDeveloperPortalRedirect('/developers')).toBeNull();
		expect(getDeveloperPortalRedirect('/developers/')).toBeNull();
		expect(getDeveloperPortalRedirect('/developers/dashboard')).toBeNull();
		expect(getDeveloperPortalRedirect('/developer-tools')).toBeNull();
		expect(getDeveloperPortalRedirect('/chat/direct/friends')).toBeNull();
	});

	it('identifies safe developer portal paths and rejects external or malformed URLs', () => {
		expect(isDeveloperPortalPath('/developers')).toBe(true);
		expect(isDeveloperPortalPath('/developers/')).toBe(true);
		expect(isDeveloperPortalPath('/developers/applications/123?tab=1#top')).toBe(true);
		expect(isDeveloperPortalPath('/developer')).toBe(false);
		expect(isDeveloperPortalPath('/chat/direct/friends')).toBe(false);
		expect(isDeveloperPortalPath('//evil.example/developers')).toBe(false);
		expect(isDeveloperPortalPath('https://mezon.ai/developers')).toBe(false);
		expect(isDeveloperPortalPath('/developers\\evil')).toBe(false);
		expect(isDeveloperPortalPath(null)).toBe(false);
	});

	it('sanitizes post-login redirects and normalizes singular /developer paths', () => {
		expect(sanitizePostLoginRedirect('/developers/dashboard')).toBe('/developers/dashboard');
		expect(sanitizePostLoginRedirect('/developer/applications?id=1#top')).toBe('/developers/applications?id=1#top');
		expect(sanitizePostLoginRedirect('/developer#frag?q=1')).toBe('/developers/#frag?q=1');
		expect(sanitizePostLoginRedirect('/chat/clans/1')).toBe('/chat/clans/1');
		expect(sanitizePostLoginRedirect('https://evil.example/developers')).toBeNull();
		expect(sanitizePostLoginRedirect('//evil.example/developers')).toBeNull();
		expect(sanitizePostLoginRedirect('/developers\r\nLocation: https://evil.example')).toBeNull();
		expect(sanitizePostLoginRedirect('')).toBeNull();
	});

	it('saves and consumes post-login redirects via sessionStorage once', () => {
		const store = new Map<string, string>();
		const mockStorage = {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => store.set(key, value),
			removeItem: (key: string) => store.delete(key)
		};
		const prev = (globalThis as { sessionStorage?: unknown }).sessionStorage;
		Object.defineProperty(globalThis, 'sessionStorage', { value: mockStorage, configurable: true, writable: true });
		try {
			savePostLoginRedirect('/developer/applications?tab=oauth');
			expect(store.get(POST_LOGIN_REDIRECT_STORAGE_KEY)).toBe('/developers/applications?tab=oauth');
			expect(consumePostLoginRedirect()).toBe('/developers/applications?tab=oauth');
			expect(consumePostLoginRedirect()).toBeNull();

			savePostLoginRedirect('https://evil.example');
			expect(store.has(POST_LOGIN_REDIRECT_STORAGE_KEY)).toBe(false);
		} finally {
			Object.defineProperty(globalThis, 'sessionStorage', { value: prev, configurable: true, writable: true });
		}
	});
});
