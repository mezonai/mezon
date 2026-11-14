export type NoticeSocketStatus = 'connected' | 'disconnected' | 'connecting';

export const RECONNECT_NOTICE_DELAY_MS = 5000;

type ReconnectNoticeOptions = {
	subscribe: (listener: (status: NoticeSocketStatus) => void) => () => void;
	isConnected: () => boolean;
	isRecovering: () => boolean;
	show: () => void;
	hide: () => void;
	delayMs?: number;
};

export function watchReconnectNotice({
	subscribe,
	isConnected,
	isRecovering,
	show,
	hide,
	delayMs = RECONNECT_NOTICE_DELAY_MS
}: ReconnectNoticeOptions): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const clearTimer = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};

	const unsubscribe = subscribe((status) => {
		if (status === 'connected') {
			clearTimer();
			hide();
			return;
		}
		if (timer !== undefined || !isRecovering()) {
			return;
		}
		timer = setTimeout(() => {
			timer = undefined;
			if (!isConnected() && isRecovering()) {
				show();
			}
		}, delayMs);
	});

	return () => {
		clearTimer();
		unsubscribe();
	};
}
