export interface Toast {
	id: string;
	message?: string;
	position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	autoClose?: number | false; // milliseconds
	hideProgressBar?: boolean;
	code?: number;
	closeOnClick?: boolean;
	pauseOnHover?: boolean;
	draggable?: boolean;
	type?: 'success' | 'error' | 'info' | 'warning' | 'default';
	theme?: 'light' | 'dark';
}

export type ToastPayload = {
	id?: string;
	message?: string;
	type?: 'success' | 'error' | 'info' | 'warning' | 'default';
	position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	autoClose?: number | false;
	hideProgressBar?: boolean;
	closeOnClick?: boolean;
	pauseOnHover?: boolean;
	draggable?: boolean;
	theme?: 'light' | 'dark';
};

export type ThunkToastConfig = {
	toast?: ToastPayload;
};

export type ThunkConfigWithToast = {
	fulfilledMeta: ThunkToastConfig;
};
