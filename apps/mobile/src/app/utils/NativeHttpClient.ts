import { fromUint8Array, toUint8Array } from 'js-base64';
import { NativeModules, Platform } from 'react-native';

interface NativeHttpResponse {
	statusCode: number;
	body: string;
}

interface NativeHttpClientInterface {
	get(url: string, headers: Record<string, string> | null): Promise<NativeHttpResponse>;
	post(url: string, body: string | null, headers: Record<string, string> | null): Promise<NativeHttpResponse>;
	request(method: string, url: string, body: string | null, headers: Record<string, string> | null): Promise<NativeHttpResponse>;
	requestBinary(method: string, url: string, bodyBase64: string | null, headers: Record<string, string> | null): Promise<NativeHttpResponse>;
}

const { CronetClient: NativeCronetClient, URLSessionClient: NativeURLSessionClient } = NativeModules;

const NativeClient: NativeHttpClientInterface | null =
	Platform.OS === 'android' ? NativeCronetClient : Platform.OS === 'ios' ? NativeURLSessionClient : null;

/**
 * NativeHttpClient - Cross-platform native networking
 *
 * Android: Uses Google Cronet (HTTP/2, QUIC, Brotli)
 * iOS: Uses URLSession (HTTP/2, HTTP/3)
 */
class NativeHttpClientWrapper {
	private isNativeAvailable = !!NativeClient;

	isAvailable(): boolean {
		return this.isNativeAvailable;
	}

	getClientName(): string {
		if (Platform.OS === 'android') return 'Cronet';
		if (Platform.OS === 'ios') return 'URLSession';
		return 'fetch';
	}

	async get(url: string, headers?: Record<string, string>): Promise<NativeHttpResponse> {
		if (!NativeClient) {
			return this.fallbackFetch('GET', url, null, headers);
		}
		return await NativeClient.get(url, headers || null);
	}

	async post(url: string, body?: string | object, headers?: Record<string, string>): Promise<NativeHttpResponse> {
		if (!NativeClient) {
			return this.fallbackFetch('POST', url, body, headers);
		}
		const bodyString = typeof body === 'object' ? JSON.stringify(body) : body || null;
		return await NativeClient.post(url, bodyString, headers || null);
	}

	async request(method: string, url: string, body?: string | object, headers?: Record<string, string>): Promise<NativeHttpResponse> {
		if (!NativeClient) {
			return this.fallbackFetch(method, url, body, headers);
		}
		const bodyString = typeof body === 'object' ? JSON.stringify(body) : body || null;
		return await NativeClient.request(method, url, bodyString, headers || null);
	}

	/**
	 * Request with binary body support (for protobuf)
	 * Body should be Uint8Array, response body will be base64 encoded
	 */
	async requestBinary(
		method: string,
		url: string,
		body?: Uint8Array,
		headers?: Record<string, string>
	): Promise<{ statusCode: number; bodyBase64: string }> {
		const bodyBase64 = body ? fromUint8Array(body) : null;

		if (!NativeClient || !NativeClient.requestBinary) {
			// Fallback to regular fetch for binary
			const response = await fetch(url, {
				method,
				headers: headers || {},
				body
			});
			const buffer = await response.arrayBuffer();
			const bytes = new Uint8Array(buffer);
			const responseBase64 = fromUint8Array(bytes);
			return {
				statusCode: response.status,
				bodyBase64: responseBase64
			};
		}

		const response = await NativeClient.requestBinary(method, url, bodyBase64, headers || null);
		return {
			statusCode: response.statusCode,
			bodyBase64: response.body // Native returns base64 encoded response
		};
	}

	private async fallbackFetch(
		method: string,
		url: string,
		body?: string | object | null,
		headers?: Record<string, string>
	): Promise<NativeHttpResponse> {
		const response = await fetch(url, {
			method,
			headers: headers || {},
			body: body ? (typeof body === 'object' ? JSON.stringify(body) : body) : undefined
		});

		return {
			statusCode: response.status,
			body: await response.text()
		};
	}

	parseJSON<T>(response: NativeHttpResponse): T {
		return JSON.parse(response.body) as T;
	}
}

export const NativeHttpClient = new NativeHttpClientWrapper();
export type { NativeHttpResponse };

/**
 * Fetch-compatible Response wrapper for native HTTP responses
 * Supports both text and binary (base64) responses
 */
class NativeResponse implements Response {
	private _body: string;
	private _bodyBytes: Uint8Array | null;
	private _status: number;
	private _headers: Headers;
	private _url: string;
	private _bodyUsed = false;
	private _isBinary: boolean;

	constructor(body: string, status: number, url: string, headers?: HeadersInit, isBinary = false) {
		this._body = body;
		this._status = status;
		this._url = url;
		this._headers = new Headers(headers);
		this._isBinary = isBinary;
		this._bodyBytes = null;

		// Pre-decode base64 for binary responses
		if (isBinary && body) {
			this._bodyBytes = toUint8Array(body);
		}
	}

	get ok(): boolean {
		return this._status >= 200 && this._status < 300;
	}

	get status(): number {
		return this._status;
	}

	get statusText(): string {
		return this.ok ? 'OK' : 'Error';
	}

	get headers(): Headers {
		return this._headers;
	}

	get url(): string {
		return this._url;
	}

	get redirected(): boolean {
		return false;
	}

	get type(): ResponseType {
		return 'basic';
	}

	get bodyUsed(): boolean {
		return this._bodyUsed;
	}

	get body(): ReadableStream<Uint8Array> | null {
		return null;
	}

	async text(): Promise<string> {
		this._bodyUsed = true;
		if (this._isBinary && this._bodyBytes) {
			return new TextDecoder().decode(this._bodyBytes);
		}
		return this._body;
	}

	async json(): Promise<any> {
		this._bodyUsed = true;
		const text = this._isBinary && this._bodyBytes ? new TextDecoder().decode(this._bodyBytes) : this._body;
		return JSON.parse(text);
	}

	async arrayBuffer(): Promise<ArrayBuffer> {
		this._bodyUsed = true;
		if (this._isBinary && this._bodyBytes) {
			return this._bodyBytes.buffer;
		}
		const encoder = new TextEncoder();
		return encoder.encode(this._body).buffer;
	}

	async blob(): Promise<Blob> {
		this._bodyUsed = true;
		if (this._isBinary && this._bodyBytes) {
			return new Blob([this._bodyBytes]);
		}
		return new Blob([this._body]);
	}

	async formData(): Promise<FormData> {
		throw new Error('formData() is not supported');
	}

	clone(): Response {
		const cloned = new NativeResponse(this._body, this._status, this._url, undefined, this._isBinary);
		return cloned;
	}
}

/**
 * Creates a fetch-compatible function that uses native HTTP clients
 * Can be used with setFetchStrategy from mezon-js
 *
 * Automatically detects binary requests (protobuf) and handles them correctly.
 *
 * Usage:
 * ```
 * import { setFetchStrategy } from 'mezon-js';
 * import { createNativeFetch } from './NativeHttpClient';
 *
 * setFetchStrategy(createNativeFetch());
 * ```
 */
export function createNativeFetch(): typeof fetch {
	return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
		const method = init?.method || 'GET';
		const headers: Record<string, string> = {};

		if (init?.headers) {
			if (init.headers instanceof Headers) {
				init.headers.forEach((value, key) => {
					headers[key] = value;
				});
			} else if (Array.isArray(init.headers)) {
				init.headers.forEach(([key, value]) => {
					headers[key] = value;
				});
			} else {
				Object.assign(headers, init.headers);
			}
		}

		// Detect if this is a binary request (protobuf)
		const contentType = headers['Content-Type'] || headers['content-type'] || '';
		const acceptType = headers['Accept'] || headers['accept'] || '';
		const isBinaryRequest =
			contentType.includes('application/proto') ||
			contentType.includes('application/octet-stream') ||
			acceptType.includes('application/proto') ||
			init?.body instanceof Uint8Array ||
			init?.body instanceof ArrayBuffer;

		try {
			if (url?.includes(`https://${process.env.NX_CHAT_APP_API_GW_HOST}:${process.env.NX_CHAT_APP_API_GW_PORT}`)) {
				return fetch(input, init);
			}

			if (isBinaryRequest) {
				// Handle binary (protobuf) request
				let bodyBytes: Uint8Array | undefined;
				if (init?.body) {
					if (init.body instanceof Uint8Array) {
						bodyBytes = init.body;
					} else if (init.body instanceof ArrayBuffer) {
						bodyBytes = new Uint8Array(init.body);
					}
				}

				const response = await NativeHttpClient.requestBinary(method, url, bodyBytes, headers);
				return new NativeResponse(response.bodyBase64, response.statusCode, url, headers, true);
			} else {
				// Handle text/JSON request
				let body: string | null = null;
				if (init?.body) {
					if (typeof init.body === 'string') {
						body = init.body;
					} else {
						body = String(init.body);
					}
				}

				console.log('lgo => NativeFetch', method, url, body, headers);

				const response = await NativeHttpClient.request(method, url, body || undefined, headers);
				return new NativeResponse(response.body, response.statusCode, url, headers, false);
			}
		} catch (error) {
			console.warn('NativeFetch failed, falling back to default fetch:', error);
			return fetch(input, init);
		}
	};
}
