import type { ApiAddAppRequest, ApiApp, ApiAppList, ApiMezonOauthClient, MezonUpdateAppBody } from 'mezon-js';
import {
	AddAppRequest,
	App,
	AppClan,
	AppList,
	GetMezonOauthClientRequest,
	ListAppsRequest,
	MezonOauthClient,
	UpdateAppRequest
} from 'mezon-js-protobuf';

type MezonHttpRpcSpec<T> = {
	path: string;
	encodeBody: () => Uint8Array;
	decodeBody: (bytes: Uint8Array) => T;
};

export async function callApiAdmin<T>({
	path,
	data,
	token,
	decodeBody
}: {
	path: string;
	data: Uint8Array;
	token: string;
	decodeBody: (data: Uint8Array) => T;
}): Promise<T> {
	try {
		const response = await fetch(`https://${process.env.NX_CHAT_APP_API_HOST}:${process.env.NX_CHAT_APP_API_PORT}${path}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/proto',
				'Content-Type': 'application/proto'
			},
			body: Uint8Array.from(data)
		});

		if (response.status === 401) {
			const err = new Error(`HTTP ${path} 401`) as Error & {
				status: number;
			};

			err.status = 401;
			throw err;
		}

		if (!response.ok) {
			const detail = (await response.text().catch(() => '')).trim();
			const message = detail || `HTTP ${path} ${response.status}`;

			const err = new Error(message) as Error & {
				status: number;
			};

			err.status = response.status;
			throw err;
		}

		const buffer = await response.arrayBuffer();

		return decodeBody(new Uint8Array(buffer));
	} catch (error) {
		console.error('callApiAdmin error:', error);
		throw error;
	}
}

function normalizeAddAppRequest(request: ApiAddAppRequest) {
	const creatorId = request.creator_id?.trim();
	return AddAppRequest.fromPartial({
		...request,
		creator_id: creatorId && creatorId !== '0' ? creatorId : '0'
	});
}

export function addAppHttpRpc(request: ApiAddAppRequest): MezonHttpRpcSpec<ApiApp> {
	return {
		path: '/mezon.api.Mezon/AddApp',
		encodeBody: () => AddAppRequest.encode(normalizeAddAppRequest(request)).finish(),
		decodeBody: (bytes) => App.decode(bytes) as ApiApp
	};
}

export function listAppsHttpRpc(): MezonHttpRpcSpec<ApiAppList> {
	return {
		path: '/mezon.api.Mezon/ListApps',
		encodeBody: () => ListAppsRequest.encode(ListAppsRequest.fromPartial({})).finish(),
		decodeBody: (bytes) => AppList.decode(bytes) as ApiAppList
	};
}

export function getAppHttpRpc(appId: string): MezonHttpRpcSpec<ApiApp> {
	return {
		path: '/mezon.api.Mezon/GetApp',
		encodeBody: () => App.encode(App.fromPartial({ id: appId })).finish(),
		decodeBody: (bytes) => App.decode(bytes) as ApiApp
	};
}

export function updateAppHttpRpc(appId: string, body: MezonUpdateAppBody): MezonHttpRpcSpec<ApiApp> {
	return {
		path: '/mezon.api.Mezon/UpdateApp',
		encodeBody: () => UpdateAppRequest.encode(UpdateAppRequest.fromPartial({ ...body, id: appId })).finish(),
		decodeBody: (bytes) => App.decode(bytes) as ApiApp
	};
}

export function deleteAppHttpRpc(appId: string): MezonHttpRpcSpec<boolean> {
	return {
		path: '/mezon.api.Mezon/DeleteApp',
		encodeBody: () => App.encode(App.fromPartial({ id: appId })).finish(),
		decodeBody: () => true
	};
}

export function addAppToClanHttpRpc(appId: string, clanId: string): MezonHttpRpcSpec<unknown> {
	return {
		path: '/mezon.api.Mezon/AddAppToClan',
		encodeBody: () => AppClan.encode(AppClan.fromPartial({ app_id: appId, clan_id: clanId })).finish(),
		decodeBody: () => ({})
	};
}

export function getMezonOauthClientHttpRpc(appId: string, appName?: string): MezonHttpRpcSpec<ApiMezonOauthClient> {
	return {
		path: '/mezon.api.Mezon/GetMezonOauthClient',
		encodeBody: () =>
			GetMezonOauthClientRequest.encode(
				GetMezonOauthClientRequest.fromPartial({
					client_id: appId,
					client_name: appName
				})
			).finish(),
		decodeBody: (bytes) => MezonOauthClient.decode(bytes) as ApiMezonOauthClient
	};
}

export function updateMezonOauthClientHttpRpc(body: ApiMezonOauthClient): MezonHttpRpcSpec<ApiMezonOauthClient> {
	return {
		path: '/mezon.api.Mezon/UpdateMezonOauthClient',
		encodeBody: () => MezonOauthClient.encode(MezonOauthClient.fromPartial(body)).finish(),
		decodeBody: (bytes) => MezonOauthClient.decode(bytes) as ApiMezonOauthClient
	};
}
