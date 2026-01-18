import type { PreloadedRootState } from '@mezon/store';

const preloadedState = {
	app: {
		theme: 'light',
		loadingStatus: 'loaded'
	},
	account: {
		loadingStatus: 'loaded'
	},
	threads: {
		loadingStatus: 'loaded',
		entities: {},
		ids: []
	}
} as unknown as PreloadedRootState;

export { preloadedState };
