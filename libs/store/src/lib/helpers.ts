import { MezonContextValue } from '@mezon/transport';
import { IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';
import { GetThunkAPI } from '@reduxjs/toolkit';
import { Client, Friend, Session, safeJSONParse } from 'mezon-js';
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
	zkClient: ZkClient | null;
	mmnClient: MmnClient | null;
	indexerClient: IndexerClient | null;
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
		session: mezon.sessionRef.current,
		zkClient: mezon.zkRef.current,
		mmnClient: mezon.mmnRef?.current || null,
		indexerClient: mezon.indexerRef?.current || null
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

export interface SocketDataRequest {
	api_name: string;
	[key: string]: any;
}

export async function fetchDataWithSocketFallback<T>(
	mezon: MezonValueContext,
	socketRequest: SocketDataRequest,
	restApiFallback: () => Promise<T>,
	responseKey?: string
): Promise<T> {
	const socket = mezon.socketRef?.current;
	let response: T | undefined;

	if (socket?.isOpen()) {
		try {
			const data = await socket.listDataSocket(socketRequest);

			if (socketRequest.api_name === 'ListFriends') {
				if (responseKey && data?.[responseKey]?.friends) {
					data[responseKey].friends = data[responseKey]?.friends?.map((item: Friend) => ({
						...item,
						user: {
							...item.user,
							metadata: item.user?.metadata ? safeJSONParse(item.user?.metadata as string) : {}
						}
					}));
				}

				// refactor later
			}

			if (socketRequest.api_name === 'ListClanUsers') {
				if (responseKey && data?.[responseKey]?.clan_users) {
					data[responseKey].clan_users = data[responseKey]?.clan_users?.map((item: Friend) => ({
						...item,
						user: {
							...item.user,
							metadata: item.user?.metadata ? safeJSONParse(item.user?.metadata as string) : {}
						}
					}));
				}

				// refactor later
			}

			response = responseKey ? data?.[responseKey] : data;

			// if (socketRequest.api_name === 'ListClanDescs') {
			// }
		} catch (err) {
			console.log(err, socketRequest);
			// ignore socket errors and fallback to REST API
		}
	}

	if (!response) {
		response = await restApiFallback();
	}

	return response;
}
