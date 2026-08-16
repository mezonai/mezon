/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly NX_CHAT_APP_API_GW_HOST: string;
	readonly NX_CHAT_APP_API_GW_PORT: string;
	readonly NX_CHAT_APP_API_SECURE: string;
	readonly NX_CHAT_APP_ANALYTIC_ID: string;
	readonly NX_CHAT_APP_SENTRY_ENVIRONMENT: string;
	readonly NX_CHAT_APP_STREAM_WS_URL: string;
	readonly NX_WEBRTC_ICESERVERS_URL: string;
	readonly NX_WEBRTC_ICESERVERS_USERNAME: string;
	readonly NX_WEBRTC_ICESERVERS_CREDENTIAL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
