export const APP_TYPES = {
	APPLICATION: 'application',
	BOT: 'bot'
} as const;

export type AppType = (typeof APP_TYPES)[keyof typeof APP_TYPES];
