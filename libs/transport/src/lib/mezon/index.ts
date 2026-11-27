import { Client } from 'mezon-js';
import { SfuBreakoutMergeRequest, SfuBreakoutRoomRequest, SfuBreakoutRoomResponse } from 'mezon-js-protobuf';
import { DongClient, IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';

export interface SfuBreakoutRoomEventPayload {
	channel_id?: string;
	token?: string;
	self_select_ids?: string[];
}

export interface VoiceJoinWaitingUserPayload {
	user_id: string;
	username?: string;
	display_name?: string;
	avatar?: string;
	create_time_seconds?: string;
}

export interface VoiceJoinWaitingEventPayload {
	clan_id?: string;
	channel_id?: string;
	user_id?: string;
	username?: string;
	display_name?: string;
	avatar?: string;
	create_time_seconds?: string;
	action?: number;
}

export interface VoiceJoinReviewedEventPayload {
	clan_id?: string;
	channel_id?: string;
	user_id?: string;
	reviewer_id?: string;
	approved?: boolean;
	token?: string;
	url?: string;
}

export interface ReviewVoiceJoinResponsePayload {
	channel_id?: string;
	user_id?: string;
	approved?: boolean;
}

export class SfuBreakoutApiError extends Error {
	readonly code?: number;

	constructor(message: string, code?: number) {
		super(message);
		this.name = 'SfuBreakoutApiError';
		this.code = code;
	}
}

export type PatchedMezonClient = Client & {
	onsfubreakoutroomevent?: (event: SfuBreakoutRoomEventPayload) => void;
	onvoicejoinwaiting?: (event: VoiceJoinWaitingEventPayload) => void;
	onvoicejoinreviewed?: (event: VoiceJoinReviewedEventPayload) => void;
	reviewVoiceJoin?: (
		session: unknown,
		request: { channel_id: string; user_id: string; approve: boolean }
	) => Promise<ReviewVoiceJoinResponsePayload>;
};

type BreakoutApiName = 'SfuBreakoutRoom' | 'SfuBreakoutMerge';

const SFU_BREAKOUT_API_INDEX = new Map<string, number>([
	['SfuBreakoutRoom', 215],
	['SfuBreakoutMerge', 216],
	['ReviewVoiceJoin', 225]
]);
const DEFAULT_BREAKOUT_TIMEOUT_MS = 30000;

type TransportHandlers = {
	onMessage: (
		cid: number,
		code: number,
		envelope: {
			cid?: string;
			sfu_breakout_room_event?: SfuBreakoutRoomEventPayload;
			voice_join_waiting_event?: VoiceJoinWaitingEventPayload;
			voice_join_reviewed_event?: VoiceJoinReviewedEventPayload;
		}
	) => Promise<void>;
};

type PatchedTransport = {
	getApiFromPath?: (apiName: string) => number | undefined;
	connect?: (url: string, sessionId: string, createStatus: boolean, verbose: boolean, handlers: TransportHandlers, ...rest: unknown[]) => void;
	send?: (
		request: { urlPath: string; fetchOptions: { method: string; headers: Record<string, string>; body: Uint8Array } },
		timeoutMs?: number
	) => Promise<{ code: number; message: Uint8Array }>;
	timeoutMs?: number;
};

function getTransport(client: Client): PatchedTransport | undefined {
	return (client as unknown as { transport?: PatchedTransport }).transport;
}

export function grpcCodeFromEnvelopeStatus(status: number): number {
	switch (status) {
		case 400:
			return 3;
		case 401:
			return 16;
		case 403:
			return 7;
		case 404:
			return 5;
		case 429:
			return 8;
		case 500:
			return 13;
		default:
			return 2;
	}
}

function toBreakoutApiError(apiName: BreakoutApiName, error: unknown): SfuBreakoutApiError {
	if (error instanceof SfuBreakoutApiError) {
		return error;
	}
	if (typeof error === 'string') {
		return new SfuBreakoutApiError(error);
	}
	if (error instanceof Error) {
		return new SfuBreakoutApiError(error.message);
	}
	const obj = error as { code?: number; error?: { code?: number; message?: string } } | null;
	if (obj?.error && typeof obj.error.code === 'number') {
		return new SfuBreakoutApiError(obj.error.message || `${apiName} failed`, grpcCodeFromEnvelopeStatus(obj.error.code));
	}
	if (typeof obj?.code === 'number' && obj.code !== 0) {
		return new SfuBreakoutApiError(`${apiName} failed`, obj.code);
	}
	return new SfuBreakoutApiError(`${apiName} failed`);
}

function patchClientBreakoutSupport(client: Client): PatchedMezonClient {
	const patched = client as PatchedMezonClient;
	const transport = getTransport(client);
	if (!transport) {
		return patched;
	}

	const { getApiFromPath, connect } = transport;
	if (getApiFromPath) {
		transport.getApiFromPath = (apiName) => SFU_BREAKOUT_API_INDEX.get(apiName) ?? getApiFromPath.call(transport, apiName);
	}
	if (connect) {
		transport.connect = (url, sessionId, createStatus, verbose, handlers, ...rest) =>
			connect.call(
				transport,
				url,
				sessionId,
				createStatus,
				verbose,
				{
					...handlers,
					onMessage: async (cid, code, envelope) => {
						if (!envelope?.cid && envelope?.sfu_breakout_room_event) {
							patched.onsfubreakoutroomevent?.(envelope.sfu_breakout_room_event);
							return;
						}
						if (!envelope?.cid && envelope?.voice_join_waiting_event) {
							patched.onvoicejoinwaiting?.(envelope.voice_join_waiting_event);
							return;
						}
						if (!envelope?.cid && envelope?.voice_join_reviewed_event) {
							patched.onvoicejoinreviewed?.(envelope.voice_join_reviewed_event);
							return;
						}
						await handlers.onMessage(cid, code, envelope);
					}
				},
				...rest
			);
	}

	return patched;
}

async function sendSfuBreakoutApi(client: Client, apiName: BreakoutApiName, body: Uint8Array): Promise<Uint8Array> {
	const transport = getTransport(client);
	if (!transport?.send) {
		throw new SfuBreakoutApiError('Mezon transport is not initialized.');
	}
	try {
		const res = await transport.send(
			{
				urlPath: `/mezon.api.Mezon/${apiName}`,
				fetchOptions: {
					method: 'POST',
					headers: { Accept: 'application/proto', 'Content-Type': 'application/proto' },
					body
				}
			},
			transport.timeoutMs ?? DEFAULT_BREAKOUT_TIMEOUT_MS
		);
		if (res.code !== 0) {
			throw res;
		}
		return new Uint8Array(res.message);
	} catch (error) {
		throw toBreakoutApiError(apiName, error);
	}
}

export async function callSfuBreakoutRoom(client: Client, body: SfuBreakoutRoomRequest): Promise<SfuBreakoutRoomResponse> {
	const encoded = SfuBreakoutRoomRequest.encode(SfuBreakoutRoomRequest.fromPartial(body)).finish();
	return SfuBreakoutRoomResponse.decode(await sendSfuBreakoutApi(client, 'SfuBreakoutRoom', encoded));
}

export async function callSfuBreakoutMerge(client: Client, body: SfuBreakoutMergeRequest): Promise<void> {
	const encoded = SfuBreakoutMergeRequest.encode(SfuBreakoutMergeRequest.fromPartial(body)).finish();
	await sendSfuBreakoutApi(client, 'SfuBreakoutMerge', encoded);
}

export async function callReviewVoiceJoin(
	client: Client,
	session: unknown,
	request: { channel_id: string; user_id: string; approve: boolean }
): Promise<ReviewVoiceJoinResponsePayload> {
	const patched = client as PatchedMezonClient;
	if (typeof patched.reviewVoiceJoin === 'function') {
		return await patched.reviewVoiceJoin(session, request);
	}
	throw new Error('reviewVoiceJoin is not supported by the current mezon-js client');
}

export type CreateMezonClientOptions = {
	ssl: boolean;
	host: string;
	port: string;
	key: string;
};

export type CreateZkClientOptions = {
	endpoint: string;
	timeout?: number;
	headers?: Record<string, string>;
};

export type CreateDongClientOptions = {
	endpoint: string;
	timeout?: number;
	headers?: Record<string, string>;
};

export type CreateMmnClientOptions = {
	baseUrl: string;
	timeout?: number;
	headers?: Record<string, string>;
};

export type CreateIndexerClientOptions = {
	endpoint: string;
	chainId: string;
	timeout?: number;
};

export type CreateVoiceClientOptions = {
	appID: string;
	roomName: string;
	token: string;
};

export type VoiceConnectionCBFunction = () => void;

let clientInstance: Client;
let zkClientInstance: ZkClient;
let dongClientInstance: DongClient;
let mmnClientInstance: MmnClient;
let indexerClientInstance: IndexerClient;

export function getClient() {
	return clientInstance;
}

export function getZkClient() {
	return zkClientInstance;
}

export function getDongClient() {
	return dongClientInstance;
}

export function getMmnClient() {
	return mmnClientInstance;
}

export function getIndexerClient() {
	return indexerClientInstance;
}

export function createClient(options: CreateMezonClientOptions) {
	const { ssl, host, port, key } = options;
	const client = patchClientBreakoutSupport(new Client(key, host, port, ssl));
	clientInstance = client;
	return client;
}

export function createZkClient(options: CreateZkClientOptions) {
	const { endpoint, timeout = 30000, headers = { 'Content-Type': 'application/json' } } = options;
	const zkClient = new ZkClient({
		endpoint,
		timeout,
		headers
	});

	zkClientInstance = zkClient;

	return zkClient;
}

export function createDongClient(options: CreateDongClientOptions) {
	const { endpoint, timeout = 30000, headers = { 'Content-Type': 'application/json' } } = options;
	const dongClient = new DongClient({
		endpoint,
		timeout,
		headers
	});

	dongClientInstance = dongClient;

	return dongClient;
}

export function createMmnClient(options: CreateMmnClientOptions) {
	const { baseUrl, timeout = 30000, headers = { 'Content-Type': 'application/json' } } = options;
	const mmnClient = new MmnClient({
		baseUrl,
		timeout,
		headers
	});

	mmnClientInstance = mmnClient;

	return mmnClient;
}

export function createIndexerClient(options: CreateIndexerClientOptions) {
	const { endpoint, chainId, timeout = 10000 } = options;
	const indexerClient = new IndexerClient({
		endpoint,
		chainId,
		timeout
	});

	indexerClientInstance = indexerClient;

	return indexerClient;
}
