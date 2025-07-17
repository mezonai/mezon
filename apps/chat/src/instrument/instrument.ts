import * as Sentry from '@sentry/react';

Sentry.init({
	dsn: process.env.NX_CHAT_SENTRY_DNS,
	environment: process.env.NODE_ENV || 'development',
	release: process.env.NX_APP_VERSION || '1.0.0',
	integrations: [
		Sentry.browserTracingIntegration({
			enableLongTask: true,
			enableInp: true
		}),
		Sentry.captureConsoleIntegration({
			levels: ['error', 'warn']
		}),
		Sentry.contextLinesIntegration(),
		Sentry.httpClientIntegration()
	],
	tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
	tracePropagationTargets: ['localhost'],
	replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.1,
	replaysOnErrorSampleRate: 1.0,
	initialScope: {
		tags: {
			app: 'chat',
			component: 'frontend'
		}
	},
	beforeSend(event, hint) {
		if (event.exception) {
			const error = hint.originalException;
			if (error instanceof Error) {
				event.tags = {
					...event.tags,
					errorType: error.constructor.name
				};

				if (error.stack) {
					event.extra = {
						...event.extra,
						errorStack: error.stack
					};
				}
			}
		}

		if (typeof window !== 'undefined') {
			event.extra = {
				...event.extra,
				url: window.location.href,
				userAgent: navigator.userAgent
			};
		}

		return event;
	},
	beforeSendTransaction(event) {
		if (event.transaction?.includes('heartbeat') || event.transaction?.includes('ping')) {
			return null;
		}
		return event;
	}
});
