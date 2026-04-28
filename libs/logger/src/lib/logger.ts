// import * as Sentry from '@sentry/react';

const SKIP_LOG = 'skip_log';

export interface LogContext {
	userId?: string;
	channelId?: string;
	guildId?: string;
	component?: string;
	action?: string;
	metadata?: Record<string, any>;
}

export function logger(): string {
	return 'logger';
}

export async function captureSentryError(error: unknown, actionName: string, context?: LogContext): Promise<void> {
	const errorDetail = await getErrorMessage(error);
	if (errorDetail === SKIP_LOG) return;

	const timestamp = new Date().toISOString();
	const errorLabel = `${actionName} - ${timestamp}`;

	// Sentry.addBreadcrumb({
	// 	message: `Error in ${actionName}`,
	// 	level: 'error',
	// 	data: {
	// 		action: actionName,
	// 		context: context || {},
	// 		timestamp
	// 	}
	// });

	// Sentry.setTags({
	// 	action: actionName,
	// 	errorType: error instanceof Error ? error.constructor.name : typeof error,
	// 	component: context?.component || 'unknown'
	// });

	// if (context) {
	// 	Sentry.setContext('error_context', {
	// 		...context,
	// 		timestamp,
	// 		action: actionName
	// 	});
	// }

	// if (context?.userId) {
	// 	Sentry.setUser({
	// 		id: context.userId
	// 	});
	// }

	// const logTitle = new Error(errorLabel);
	// logTitle.name = errorLabel;

	// Sentry.captureException(logTitle, {
	// 	level: 'error',
	// 	extra: {
	// 		errorDetail,
	// 		originalError: error,
	// 		context: context || {}
	// 	},
	// 	tags: {
	// 		action: actionName,
	// 		errorType: error instanceof Error ? error.constructor.name : typeof error,
	// 		component: context?.component || 'unknown'
	// 	},
	// 	fingerprint: [actionName, error instanceof Error ? error.constructor.name : 'unknown']
	// });
}

// Sensitive keys should never reach Sentry/log sinks. Pattern-matches case-insensitively.
const SENSITIVE_KEY_RE = /(token|authorization|auth|password|passwd|secret|api[_-]?key|refresh[_-]?token|session|cookie|bearer)/i;

function redactValue(key: string, value: unknown): unknown {
	if (typeof value === 'string' && SENSITIVE_KEY_RE.test(key)) {
		return '[REDACTED]';
	}
	return value;
}

async function getErrorMessage(error: unknown): Promise<string> {
	if (error instanceof Error) {
		const base: Record<string, unknown> = {
			name: error.name,
			message: error.message,
			stack: error.stack
		};
		for (const prop of Object.getOwnPropertyNames(error)) {
			base[prop] = redactValue(prop, (error as any)[prop]);
		}
		return safeJSONStringify(base);
	} else if (error instanceof Response) {
		return await handleResponseError(error);
	} else if (typeof error === 'object' && error !== null) {
		return safeJSONStringify(error);
	} else if (typeof error === 'string') {
		return error;
	} else {
		return `An unknown error occurred: ${String(error)}`;
	}
}

const MAX_BODY_SNIPPET = 500;

async function handleResponseError(response: Response): Promise<string> {
	try {
		const clonedResponse = response.clone();
		const contentType = response.headers.get('content-type');

		let errorData: any;
		if (contentType && contentType.includes('application/json')) {
			errorData = await clonedResponse.json();
		} else {
			errorData = await clonedResponse.text();
		}

		// Strip query string (tokens can leak there) and cap body size to avoid spamming sinks with PII.
		let sanitizedUrl = response.url;
		try {
			const u = new URL(response.url);
			u.search = '';
			sanitizedUrl = u.toString();
		} catch {
			// ignore parse failure
		}

		let body: unknown = errorData;
		if (typeof body === 'string' && body.length > MAX_BODY_SNIPPET) {
			body = body.slice(0, MAX_BODY_SNIPPET) + '…[truncated]';
		} else if (body && typeof body === 'object') {
			body = safeJSONStringify(body).slice(0, MAX_BODY_SNIPPET);
		}

		return JSON.stringify(
			{
				status: response.status,
				statusText: response.statusText,
				url: sanitizedUrl,
				headers: {
					'content-type': response.headers.get('content-type'),
					'content-length': response.headers.get('content-length')
				},
				body
			},
			null,
			2
		);
	} catch (parseError) {
		return JSON.stringify(
			{
				status: response.status,
				statusText: response.statusText,
				url: response.url,
				error: `Failed to parse response: ${parseError}`
			},
			null,
			2
		);
	}
}

function safeJSONStringify(obj: unknown): string {
	try {
		return deepJSONStringify(obj);
	} catch (error) {
		return `Error stringifying object: ${error}`;
	}
}

function deepJSONStringify(obj: unknown): string {
	const seen = new WeakSet();
	return JSON.stringify(
		obj,
		function (key, value) {
			if (typeof value === 'object' && value !== null) {
				if (seen.has(value)) {
					return '[Circular]';
				}
				seen.add(value);
			}
			if (typeof value === 'function') {
				return `[Function: ${value.name || 'anonymous'}]`;
			}
			return redactValue(key, value);
		},
		2
	);
}
