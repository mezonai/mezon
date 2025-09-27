import { IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';
import { Client } from 'mezon-js';

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
let mmnClientInstance: MmnClient;
let indexerClientInstance: IndexerClient;

export function getClient() {
	return clientInstance;
}

export function getZkClient() {
	return zkClientInstance;
}

export function getMmnClient() {
	return mmnClientInstance;
}

export function getIndexerClient() {
	return indexerClientInstance;
}

export function createClient(options: CreateMezonClientOptions) {
	const { ssl, host, port, key } = options;
	const client = new Client(key, host, port, ssl);

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
