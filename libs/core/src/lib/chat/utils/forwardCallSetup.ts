import { Reader, Writer } from 'protobufjs/minimal';

type CallSetup = {
	receiverId: string;
	dataType: number;
	jsonData: string;
	channelId: string;
	callerId: string;
};

export async function forwardCallSetup(
	apiUrl: string,
	credential: string,
	signal: AbortSignal,
	{ receiverId, dataType, jsonData, channelId, callerId }: CallSetup
): Promise<boolean> {
	if (signal.aborted) throw new DOMException('Call setup ended', 'AbortError');
	// The SDK uses WebrtcSignalingFwd internally but does not export its protobuf codec.
	const body = Writer.create()
		.uint32(8)
		.int64(receiverId)
		.uint32(16)
		.int32(dataType)
		.uint32(26)
		.string(jsonData)
		.uint32(32)
		.int64(channelId)
		.uint32(40)
		.int64(callerId)
		.finish();
	const controller = new AbortController();
	const abort = () => controller.abort();
	const timeout = setTimeout(abort, 5000);
	signal.addEventListener('abort', abort, { once: true });

	try {
		const response = await fetch(`${apiUrl.replace(/\/+$/, '')}/mezon.api.Mezon/ForwardCallSetup`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/proto', Accept: 'application/proto' },
			body: new Uint8Array(body),
			redirect: 'error',
			signal: controller.signal
		});
		if ([401, 404, 405, 501].includes(response.status)) return false;
		if (!response.ok) throw new Error(`Call setup HTTP request failed (${response.status})`);

		const reader = Reader.create(new Uint8Array(await response.arrayBuffer()));
		let ackReceiverId = '';
		let ackDataType = 0;
		let ackChannelId = '';
		let ackCallerId = '';
		while (reader.pos < reader.len) {
			const tag = reader.uint32();
			switch (tag) {
				case 8:
					ackReceiverId = reader.int64().toString();
					break;
				case 16:
					ackDataType = reader.int32();
					break;
				case 32:
					ackChannelId = reader.int64().toString();
					break;
				case 40:
					ackCallerId = reader.int64().toString();
					break;
				default:
					reader.skipType(tag & 7);
			}
		}
		if (ackReceiverId !== receiverId || ackDataType !== dataType || ackChannelId !== channelId || ackCallerId !== callerId) {
			throw new Error('Invalid call setup acknowledgement');
		}
		return true;
	} finally {
		signal.removeEventListener('abort', abort);
		clearTimeout(timeout);
	}
}
