import type { MediaWorkerApi } from '../mediaWorker/index.worker';
import type { Connector } from '../worker/PostMessageConnector';
import { createConnector } from '../worker/PostMessageConnector';

export const MAX_WORKERS = Math.min(navigator.hardwareConcurrency || 4, 4);

let instances:
	| {
			worker: Worker;
			connector: Connector<MediaWorkerApi>;
	  }[]
	| undefined;

function createWorkerCode() {
	return `
  // Define utility functions
  const callbackState = new Map();
  const pendingPayloads = [];
  const pendingTransferables = [];

  // Throttle function implementation
  function throttleWithTickEnd(fn) {
    let queued = false;
    return () => {
      if (!queued) {
        queued = true;
        setTimeout(() => {
          queued = false;
          fn();
        }, 0);
      }
    };
  }

  // Send to origin function
  const sendToOriginOnTickEnd = throttleWithTickEnd(() => {
    const data = { channel: 'media', payloads: [...pendingPayloads] };
    const transferables = [...pendingTransferables];

    pendingPayloads.length = 0;
    pendingTransferables.length = 0;

    if (transferables.length) {
      self.postMessage(data, transferables);
    } else {
      self.postMessage(data);
    }
  });

  function sendToOrigin(payload, transferables) {
    pendingPayloads.push(payload);

    if (transferables) {
      pendingTransferables.push(...transferables);
    }

    sendToOriginOnTickEnd();
  }

  // API implementation
   async function blurThumb(canvas, thumbData) {
      const { width, height } = canvas;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(width, height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 200;
        imageData.data[i + 1] = 200;
        imageData.data[i + 2] = 200;
        imageData.data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
  }

  async function getAppendixColorFromImage(blobUrl, isOwn) {
    const imageBitmap = await blobUrlToImageBitmap(blobUrl);
    const { width, height } = imageBitmap;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(imageBitmap, 0, 0, width, height);

    const x = isOwn ? width - 1 : 0;
    const y = height - 1;

    const pixel = Array.from(ctx.getImageData(x, y, 1, 1).data);
    return \`rgba(\${pixel.join(',')})\`;
  }

  function dataUriToImageBitmap(dataUri) {
    const byteString = atob(dataUri.split(',')[1]);
    const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
    const buffer = new ArrayBuffer(byteString.length);
    const dataArray = new Uint8Array(buffer);

    for (let i = 0; i < byteString.length; i++) {
      dataArray[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([buffer], { type: mimeString });
    return createImageBitmap(blob);
  }

  async function blobUrlToImageBitmap(blobUrl) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return createImageBitmap(blob);
  }

  // API object
  const api = {
    'offscreen-canvas:blurThumb': blurThumb,
    'offscreen-canvas:getAppendixColorFromImage': getAppendixColorFromImage
  };

  // Message handler
  self.onmessage = async function(event) {
    const { data } = event;

    if (data.channel === 'media') {
      data.payloads.forEach(async (payload) => {
        switch (payload.type) {
          case 'callMethod': {
            const { messageId, name, args, withCallback } = payload;

            try {
              if (!api[name]) return;

              if (messageId && withCallback) {
                const callback = (...callbackArgs) => {
                  const lastArg = callbackArgs[callbackArgs.length - 1];
                  const isTransferable = lastArg instanceof ArrayBuffer || lastArg instanceof ImageBitmap;

                  sendToOrigin(
                    {
                      type: 'methodCallback',
                      messageId,
                      callbackArgs
                    },
                    isTransferable ? [lastArg] : undefined
                  );
                };

                callback.isCanceled = false;
                callbackState.set(messageId, callback);
                args.push(callback);
              }

              const response = await api[name](...args);

              if (messageId) {
                sendToOrigin({
                  type: 'methodResponse',
                  messageId,
                  response
                });
              }
            } catch (error) {
              if (messageId) {
                sendToOrigin({
                  type: 'methodResponse',
                  messageId,
                  error: { message: error.message || 'Unknown error' }
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
  };

  // Error handling
  self.onerror = (e) => {
    console.error(e);
    sendToOrigin({
      type: 'unhandledError',
      error: { message: e.message || 'Uncaught exception in worker' }
    });
  };

  self.addEventListener('unhandledrejection', (e) => {
    console.error(e);
    sendToOrigin({
      type: 'unhandledError',
      error: { message: e.reason?.message || 'Uncaught rejection in worker' }
    });
  });
`;
}

export default function launchMediaWorkers() {
	if (!instances) {
		const workerCode = createWorkerCode();

		instances = new Array(MAX_WORKERS).fill(undefined).map(() => {
			const blob = new Blob([workerCode], { type: 'application/javascript' });
			// const worker = new Worker(new URL('./index.worker.ts', import.meta.url));
			const worker = new Worker(URL.createObjectURL(blob));
			const connector = createConnector<MediaWorkerApi>(worker, undefined, 'media');
			return { worker, connector };
		});
	}

	return instances;
}

export function requestMediaWorker(payload: Parameters<Connector<MediaWorkerApi>['request']>[0], index: number) {
	return launchMediaWorkers()[index].connector.request(payload);
}
