export const POST_LOGIN_REDIRECT_STORAGE_KEY = 'mezon_post_login_redirect';

const DEVELOPER_SINGULAR_PREFIX_RE = /^\/developer(\/.*)?$/i;
const DEVELOPERS_PREFIX_RE = /^\/developers(\/.*)?$/i;
const UNSAFE_REDIRECT_CHARS_RE = /[\r\n\\]/;

function splitPathParts(url: string): { pathname: string; search: string; hash: string } {
	const hashIndex = url.indexOf('#');
	const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
	const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
	const queryIndex = beforeHash.indexOf('?');
	const pathname = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
	const search = queryIndex === -1 ? '' : beforeHash.slice(queryIndex);
	return { pathname, search, hash };
}

export function getDeveloperPortalRedirect(pathname: string, search = '', hash = ''): string | null {
	const match = DEVELOPER_SINGULAR_PREFIX_RE.exec(pathname);
	if (!match) return null;
	const suffix = match[1] || '/';
	return `/developers${suffix}${search}${hash}`;
}

export function isDeveloperPortalPath(path?: string | null): boolean {
	if (!path) return false;
	const trimmed = path.trim();
	if (!trimmed.startsWith('/') || trimmed.startsWith('//') || UNSAFE_REDIRECT_CHARS_RE.test(trimmed)) return false;
	const { pathname } = splitPathParts(trimmed);
	return DEVELOPERS_PREFIX_RE.test(pathname);
}

export function sanitizePostLoginRedirect(path?: string | null): string | null {
	if (!path) return null;
	const trimmed = path.trim();
	if (!trimmed.startsWith('/') || trimmed.startsWith('//') || UNSAFE_REDIRECT_CHARS_RE.test(trimmed)) return null;
	const { pathname, search, hash } = splitPathParts(trimmed);
	return getDeveloperPortalRedirect(pathname, search, hash) ?? trimmed;
}

export function savePostLoginRedirect(path?: string | null): void {
	const safe = sanitizePostLoginRedirect(path);
	if (!safe || typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.setItem(POST_LOGIN_REDIRECT_STORAGE_KEY, safe);
	} catch {
		return;
	}
}

export function consumePostLoginRedirect(): string | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const raw = sessionStorage.getItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
		sessionStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
		return sanitizePostLoginRedirect(raw);
	} catch {
		return null;
	}
}
