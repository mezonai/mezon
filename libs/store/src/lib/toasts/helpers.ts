import type { ToastPayload } from './types';

export function withToast(payload: Partial<ToastPayload> & { message: string }) {
	return {
		toast: {
			...payload
		}
	};
}
