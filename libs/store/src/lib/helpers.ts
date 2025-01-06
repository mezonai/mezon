import { MezonContextValue } from '@mezon/transport';
import { GetThunkAPI } from '@reduxjs/toolkit';
import { Client, Session } from 'mezon-js';
import { GetThunkAPIWithMezon } from './typings';

export const getMezonCtx = (thunkAPI: GetThunkAPI<any>) => {
	if (!isMezonThunk(thunkAPI)) {
		throw new Error('Not Mezon Thunk');
	}
	return thunkAPI.extra.mezon;
};

export type MezonValueContext = MezonContextValue & {
	client: Client;
	session: Session;
};

export async function ensureSession(mezon: MezonContextValue): Promise<MezonValueContext> {
	return new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			if (mezon?.clientRef?.current && mezon?.sessionRef?.current) {
				clearInterval(interval);
				resolve(ensureClient(mezon));
			}
		}, 100);
	});
}

export async function ensureSocket(mezon: MezonContextValue): Promise<MezonValueContext> {
	return new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if (mezon.socketRef.current && (mezon.socketRef.current as any).adapter && (mezon.socketRef.current as any).adapter.isOpen()) {
				clearInterval(interval);
				resolve(ensureClient(mezon));
			}
		}, 100);
	});
}

export async function ensureClientAsync(mezon: MezonContextValue): Promise<MezonValueContext> {
	return new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			if (mezon?.clientRef?.current) {
				clearInterval(interval);
				resolve(ensureClient(mezon));
			}
		}, 100);
	});
}

export function ensureClient(mezon: MezonContextValue): MezonValueContext {
	if (!mezon?.clientRef?.current) {
		throw new Error('Error');
	}

	return {
		...mezon,
		client: mezon?.clientRef?.current,
		session: mezon.sessionRef.current
	} as MezonValueContext;
}

export function isMezonThunk(thunkAPI: GetThunkAPI<any>): thunkAPI is GetThunkAPIWithMezon {
	if (thunkAPI === undefined || thunkAPI.extra === undefined) {
		return false;
	}
	if ('extra' in thunkAPI === false || typeof thunkAPI.extra !== 'object' || thunkAPI.extra === null) {
		return false;
	}
	if ('mezon' in thunkAPI.extra === false) {
		return false;
	}
	return typeof thunkAPI?.extra?.mezon !== 'undefined';
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const restoreLocalStorage = (keys: string[]) => {
	const data: Record<string, string | null> = {};
	keys.forEach((key) => {
		data[key] = localStorage.getItem(key);
	});
	localStorage.clear();
	keys.forEach((key) => {
		if (data[key]) {
			localStorage.setItem(key, data[key]!);
		}
	});
};
