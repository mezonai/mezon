import type { ApiSession, ApiUploadAttachment, ApiUploadAttachmentRequest } from 'mezon-js';
import { UploadAttachment, UploadAttachmentRequest } from 'mezon-js-protobuf';
import { withSessionAuthRetry } from './sessionAuthRetry';

const RPC_TIMEOUT_MS = 30_000;

export type MezonHttpRpcSpec<T> = {
	path: string;
	encodeBody: () => Uint8Array;
	decodeBody: (bytes: Uint8Array) => T;
};

export function resolveMezonApiBaseUrl(session: ApiSession | null | undefined): string {
	const fromSession = session?.api_url?.trim();
	if (fromSession) {
		return fromSession.replace(/\/$/, '');
	}

	const ssl = process.env.NX_CHAT_APP_API_SECURE === 'true';
	const scheme = ssl ? 'https' : 'http';
	const host = process.env.NX_CHAT_APP_API_HOST;
	const port = process.env.NX_CHAT_APP_API_PORT;

	if (!host || !port) {
		throw new Error('Missing NX_CHAT_APP_API_HOST or NX_CHAT_APP_API_PORT');
	}

	return `${scheme}://${host}:${port}`;
}

export async function mezonHttpProtobufCall<T>(session: ApiSession, spec: MezonHttpRpcSpec<T>): Promise<T> {
	const run = async (activeSession: ApiSession): Promise<T> => {
		const token = activeSession?.token?.trim();
		if (!token) {
			throw new Error('Mezon API called without session credentials');
		}

		const apiBaseUrl = resolveMezonApiBaseUrl(activeSession);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

		try {
			const response = await fetch(`${apiBaseUrl}${spec.path}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/proto',
					'Content-Type': 'application/proto'
				},
				body: Uint8Array.from(spec.encodeBody()),
				signal: controller.signal
			});

			if (response.status === 401) {
				const err = new Error(`Mezon HTTP ${spec.path} 401`) as Error & { status: number };
				err.status = 401;
				throw err;
			}

			if (!response.ok) {
				const detail = (await response.text().catch(() => '')).trim();
				const message = detail || `Mezon HTTP ${spec.path} ${response.status}`;
				const err = new Error(message) as Error & { status: number };
				err.status = response.status;
				throw err;
			}

			const buffer = await response.arrayBuffer();
			return spec.decodeBody(new Uint8Array(buffer));
		} finally {
			clearTimeout(timeout);
		}
	};

	return withSessionAuthRetry(session, run);
}

export function uploadAttachmentFileHttpRpc(body: ApiUploadAttachmentRequest): MezonHttpRpcSpec<ApiUploadAttachment> {
	return {
		path: '/mezon.api.Mezon/UploadAttachmentFile',
		encodeBody: () => UploadAttachmentRequest.encode(UploadAttachmentRequest.fromPartial(body)).finish(),
		decodeBody: (bytes) => UploadAttachment.decode(bytes) as ApiUploadAttachment
	};
}

export function uploadOauthFileHttpRpc(body: ApiUploadAttachmentRequest): MezonHttpRpcSpec<ApiUploadAttachment> {
	return {
		path: '/mezon.api.Mezon/UploadOauthFile',
		encodeBody: () => UploadAttachmentRequest.encode(UploadAttachmentRequest.fromPartial(body)).finish(),
		decodeBody: (bytes) => UploadAttachment.decode(bytes) as ApiUploadAttachment
	};
}
