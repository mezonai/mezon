import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Client } from 'mezon-js';

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
			if (mezon.clientRef.current && (mezon.clientRef.current as Client).isOpen()) {
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
