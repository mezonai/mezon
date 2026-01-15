/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly NX_CHAT_APP_API_GW_HOST: string;
	readonly NX_CHAT_APP_API_GW_PORT: string;
	readonly NX_CHAT_APP_API_SECURE: string;
	readonly NX_CHAT_APP_ANALYTIC_ID: string;
	readonly NX_CHAT_APP_SENTRY_ENVIRONMENT: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
