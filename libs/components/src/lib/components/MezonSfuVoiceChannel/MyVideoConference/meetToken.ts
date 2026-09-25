export const TOKEN_EXPIRY_MARGIN_MS = 60_000;

export function meetTokenExpiresAtMs(token: string): number | undefined {
	const payload = token.split('.')[1];
	if (!payload) return undefined;
	try {
		const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
		const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
		const exp = (JSON.parse(atob(padded)) as { exp?: unknown }).exp;
		return typeof exp === 'number' ? exp * 1000 : undefined;
	} catch {
		return undefined;
	}
}

export function meetTokenNeedsRefresh(token: string): boolean {
	const expiresAt = meetTokenExpiresAtMs(token);
	return expiresAt !== undefined && expiresAt - Date.now() <= TOKEN_EXPIRY_MARGIN_MS;
}
