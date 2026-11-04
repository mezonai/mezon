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

export const connectSocketWithBackoff = async ({
	connect,
	isConnected,
	isCancelled,
	delaysMs = [2000, 4000, 8000, 16000, 30000],
	sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
}: {
	connect: () => Promise<unknown>;
	isConnected: () => boolean;
	isCancelled: () => boolean;
	delaysMs?: number[];
	sleep?: (ms: number) => Promise<void>;
}): Promise<boolean> => {
	for (const delay of delaysMs) {
		if (isConnected() || isCancelled()) {
			break;
		}
		await sleep(delay);
		if (isCancelled()) {
			break;
		}
		await connect().catch(() => undefined);
	}
	return isConnected();
};
