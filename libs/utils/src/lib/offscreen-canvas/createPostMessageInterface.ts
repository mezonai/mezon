import { createCallbackManager, throttleWithTickEnd } from '../utils';
import { ApiUpdate, CancellableCallback, OriginMessageData, OriginMessageEvent, WorkerPayload } from '../worker/PostMessageConnector';

// Add WorkerGlobalScope interface if it's not available in the TypeScript lib
interface WorkerGlobalScope {
	self: WorkerGlobalScope;
	onmessage: (this: WorkerGlobalScope, ev: MessageEvent) => any;
	postMessage: (message: any, transfer?: Transferable[]) => void; // This is correct for workers
	onerror: (this: WorkerGlobalScope, ev: ErrorEvent) => any;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}
declare const self: WorkerGlobalScope;

const callbackState = new Map<string, CancellableCallback>();

type ApiConfig = ((name: string, ...args: any[]) => any | [any, ArrayBuffer[]]) | Record<string, any>;
type SendToOrigin = (data: WorkerPayload, transferables?: Transferable[]) => void;

const messageHandlers = createCallbackManager();
onmessage = messageHandlers.runCallbacks;

export function createWorkerInterface(api: ApiConfig, channel?: string) {
	let pendingPayloads: WorkerPayload[] = [];
	let pendingTransferables: Transferable[] = [];

	const sendToOriginOnTickEnd = throttleWithTickEnd(() => {
		const data = { channel, payloads: pendingPayloads };
		const transferables = pendingTransferables;

		pendingPayloads = [];
		pendingTransferables = [];

		if (transferables.length) {
			postMessage(data, transferables as any);
		} else {
			postMessage(data);
		}
	});

	function sendToOrigin(payload: WorkerPayload, transferables?: Transferable[]) {
		pendingPayloads.push(payload);

		if (transferables) {
			pendingTransferables.push(...transferables);
		}

		sendToOriginOnTickEnd();
	}

	handleErrors(sendToOrigin);

	messageHandlers.addCallback((message: OriginMessageEvent) => {
		if (message.data?.channel === channel) {
			onMessage(api, message.data, sendToOrigin);
		}
	});
}

function onMessage(api: ApiConfig, data: OriginMessageData, sendToOrigin: SendToOrigin, onUpdate?: (update: ApiUpdate) => void) {
	if (!onUpdate) {
		onUpdate = (update: ApiUpdate) => {
			sendToOrigin({
				type: 'update',
				update
			});
		};
	}

	data.payloads.forEach(async (payload: any) => {
		switch (payload.type) {
			case 'init': {
				const { args } = payload;
				if (typeof api === 'function') {
					await api('init', onUpdate, ...args);
				} else {
					await api.init?.(onUpdate, ...args);
				}

				break;
			}

			case 'callMethod': {
				const { messageId, name, args, withCallback } = payload;

				try {
					if (typeof api !== 'function' && !api[name]) return;

					if (messageId && withCallback) {
						const callback = (...callbackArgs: any[]) => {
							const lastArg = callbackArgs[callbackArgs.length - 1];

							sendToOrigin(
								{
									type: 'methodCallback',
									messageId,
									callbackArgs
								},
								isTransferable(lastArg) ? [lastArg] : undefined
							);
						};

						callbackState.set(messageId, callback);

						args.push(callback as never);
					}

					const response = typeof api === 'function' ? await api(name, ...args) : await api[name](...args);
					const { arrayBuffer } = (typeof response === 'object' && 'arrayBuffer' in response && response) || {};
					if (messageId) {
						sendToOrigin(
							{
								type: 'methodResponse',
								messageId,
								response
							},
							arrayBuffer ? [arrayBuffer] : undefined
						);
					}
				} catch (error: any) {
					if (messageId) {
						sendToOrigin({
							type: 'methodResponse',
							messageId,
							error: { message: error.message }
						});
					}
				}

				if (messageId) {
					callbackState.delete(messageId);
				}

				break;
			}

			case 'cancelProgress': {
				const callback = callbackState.get(payload.messageId);
				if (callback) {
					callback.isCanceled = true;
				}

				break;
			}
		}
	});
}

function isTransferable(obj: any) {
	return obj instanceof ArrayBuffer || obj instanceof ImageBitmap;
}

function handleErrors(sendToOrigin: SendToOrigin) {
	self.onerror = (e) => {
		// eslint-disable-next-line no-console
		console.error(e);
		sendToOrigin({ type: 'unhandledError', error: { message: e.error.message || 'Uncaught exception in worker' } });
	};

	self.addEventListener('unhandledrejection', (e: any) => {
		// eslint-disable-next-line no-console
		console.error(e);
		sendToOrigin({ type: 'unhandledError', error: { message: e.reason.message || 'Uncaught rejection in worker' } });
	});
}
