// import * as Sentry from '@sentry/react';

const warningsToSkip = [
	/does not exist in local storage/g,
	/silence detected on local audio track/g,
	/this browser does not support desktop notification/g,
	/already attempting reconnect, returning early/g,
	/server unreachable from heartbeat/g
];

const errorsToSkip = [/permission denied/g, /server unreachable from heartbeat/g];

if (process.env.NX_ENABLE_SENTRY !== 'true') {
	console.log('Sentry is disabled');
} else {
	// Sentry.init({
	// 	dsn: process.env.NX_CHAT_SENTRY_DNS,
	// 	environment: process.env.NODE_ENV || 'development',
	// 	release: process.env.NX_APP_VERSION || '1.0.0',
	// 	integrations: [
	// 		Sentry.browserTracingIntegration({
	// 			enableLongTask: true,
	// 			enableInp: true
	// 		}),
	// 		Sentry.captureConsoleIntegration({
	// 			levels: ['error', 'warn']
	// 		}),
	// 		Sentry.contextLinesIntegration(),
	// 		Sentry.httpClientIntegration(),
	// 		Sentry.replayIntegration()
	// 	],
	// 	normalizeDepth: 10,
	// 	maxValueLength: 5000,
	// 	maxBreadcrumbs: 2,
	// 	tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
	// 	tracePropagationTargets: ['localhost'],
	// 	replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.1,
	// 	replaysOnErrorSampleRate: 1.0,
	// 	initialScope: {
	// 		tags: {
	// 			app: 'chat',
	// 			component: 'frontend'
	// 		}
	// 	},
	// 	beforeSend(event) {
	// 		if (event.level === 'warning' && event.message) {
	// 			for (const warningToSkip of warningsToSkip) {
	// 				if (event.message.match(warningToSkip)) {
	// 					return null;
	// 				}
	// 			}
	// 		}
	// 		if (event.level === 'error' && event.message) {
	// 			for (const errorToSkip of errorsToSkip) {
	// 				if (event.message.match(errorToSkip)) {
	// 					return null;
	// 				}
	// 			}
	// 		}
	// 		return event;
	// 	},
	// 	beforeSendTransaction(event) {
	// 		if (event.transaction?.includes('heartbeat') || event.transaction?.includes('ping')) {
	// 			return null;
	// 		}
	// 		return event;
	// 	}
	// });
}
