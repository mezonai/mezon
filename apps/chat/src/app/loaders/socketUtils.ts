import { createAsyncThunk } from '@reduxjs/toolkit';

let globalSocketPromise: Promise<void> | null = null;

export const waitForSocketConnection = createAsyncThunk('socket/waitForConnection', async (_, { extra }) => {
	const { mezon } = extra as any;
	if (!mezon) {
		return;
	}

	if (globalSocketPromise) {
		return globalSocketPromise;
	}

	globalSocketPromise = new Promise<void>((resolve, reject) => {
		const interval = setInterval(() => {
			if (mezon.socketRef.current && (mezon.socketRef.current as any).adapter && (mezon.socketRef.current as any).adapter.isOpen()) {
				clearInterval(interval);
				clearTimeout(deadline);
				resolve();
			}
		}, 100);

		const deadline = setTimeout(() => {
			clearInterval(interval);
			reject(new Error('[waitForSocketConnection] Timed out waiting for socket to open'));
		}, 5000);
	});

	return globalSocketPromise;
});

export const resetSocketConnection = () => {
	globalSocketPromise = null;
};
