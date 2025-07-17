import * as Sentry from '@sentry/react';

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

	Sentry.addBreadcrumb({
		message: `Error in ${actionName}`,
		level: 'error',
		data: {
			action: actionName,
			context: context || {},
			timestamp
		}
	});

	Sentry.setTags({
		action: actionName,
		errorType: error instanceof Error ? error.constructor.name : typeof error,
		component: context?.component || 'unknown'
	});

	if (context) {
		Sentry.setContext('error_context', {
			...context,
			timestamp,
			action: actionName
		});
	}

	if (context?.userId) {
		Sentry.setUser({
			id: context.userId
		});
	}

	const logTitle = new Error(errorLabel);
	logTitle.name = errorLabel;

	Sentry.captureException(logTitle, {
		level: 'error',
		extra: {
			errorDetail,
			originalError: error,
			context: context || {}
		},
		tags: {
			action: actionName,
			errorType: error instanceof Error ? error.constructor.name : typeof error,
			component: context?.component || 'unknown'
		},
		fingerprint: [actionName, error instanceof Error ? error.constructor.name : 'unknown']
	});
}

async function getErrorMessage(error: unknown): Promise<string> {
	if (error instanceof Error) {
		return JSON.stringify(
			{
				name: error.name,
				message: error.message,
				stack: error.stack,
				...Object.getOwnPropertyNames(error).reduce(
					(acc, prop) => {
						acc[prop] = (error as any)[prop];
						return acc;
					},
					{} as Record<string, any>
				)
			},
			null,
			2
		);
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

		return JSON.stringify(
			{
				status: response.status,
				statusText: response.statusText,
				url: response.url,
				headers: {
					'content-type': response.headers.get('content-type'),
					'content-length': response.headers.get('content-length')
				},
				body: errorData
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
			return value;
		},
		2
	);
}
