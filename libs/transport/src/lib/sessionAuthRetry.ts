import type { ApiSession } from 'mezon-js';

const GRPC_UNAUTHENTICATED = 16;

export function isMezonUnauthorizedError(error: unknown): boolean {
	if (!error) {
		return false;
	}

	if (error instanceof Response) {
		return error.status === 401;
	}

	if (typeof error === 'string') {
		return /401|unauthenticated|unauthorized/i.test(error);
	}

	if (typeof error !== 'object') {
		return false;
	}

	const record = error as Record<string, unknown>;

	if (record.status === 401 || record.statusCode === 401) {
		return true;
	}

	const code = record.code;
	if (typeof code === 'number') {
		if (code === 401 || code === GRPC_UNAUTHENTICATED) {
			return true;
		}

		const responseCode = (code >>> 16) & 0xffff;
		if (responseCode === 401 || responseCode === GRPC_UNAUTHENTICATED) {
			return true;
		}
	}

	const message = String(record.message ?? record.error ?? '');
	if (/401|unauthenticated|unauthorized/i.test(message)) {
		return true;
	}

	if (record.error && typeof record.error === 'object') {
		return isMezonUnauthorizedError(record.error);
	}

	return false;
}

type SessionAuthRetryHandlers = {
	getSession: () => ApiSession | null;
	refreshSession: () => Promise<ApiSession | null>;
};

let handlers: SessionAuthRetryHandlers | null = null;

export function configureSessionAuthRetry(next: SessionAuthRetryHandlers | null): void {
	handlers = next;
}

export async function withSessionAuthRetry<T>(session: ApiSession, fn: (session: ApiSession) => Promise<T>): Promise<T> {
	const resolveSession = () => handlers?.getSession?.() ?? session;

	const run = () => fn(resolveSession() as ApiSession);

	try {
		return await run();
	} catch (error) {
		if (!handlers?.refreshSession || !isMezonUnauthorizedError(error)) {
			throw error;
		}

		const refreshed = await handlers.refreshSession();
		if (!refreshed) {
			throw error;
		}

		return await fn(refreshed);
	}
}
