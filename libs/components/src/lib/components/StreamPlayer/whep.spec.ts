import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WhepError, startWhep, stopWhep, waitConnected } from './whep';

class FakePeerConnection extends EventTarget {
	static created: FakePeerConnection[] = [];
	connectionState: RTCPeerConnectionState = 'new';
	localDescription: { type: string; sdp: string } | null = null;
	ontrack: ((event: { track: unknown }) => void) | null = null;
	addTransceiver = jest.fn();
	close = jest.fn();
	createOffer = jest.fn(async () => ({ type: 'offer', sdp: 'offer-sdp' }));
	setLocalDescription = jest.fn(async (description: { type: string; sdp: string }) => {
		this.localDescription = description;
	});
	setRemoteDescription = jest.fn(async () => undefined);

	constructor() {
		super();
		FakePeerConnection.created.push(this);
	}
}

class FakeMediaStream {
	addTrack = jest.fn();
}

const WHEP_URL = 'http://node:8089/whep/42';
const ANSWER = 'v=0\r\nm=audio 40000 UDP/TLS/RTP/SAVPF 111\r\nm=video 40000 UDP/TLS/RTP/SAVPF 102\r\n';

const response = (status: number, body = '', location = '/resource/3.1.abc') => ({
	status,
	headers: { get: (name: string) => (name === 'Location' ? location : null) },
	text: async () => body
});

let fetchMock: jest.Mock<(input: unknown, init?: RequestInit) => Promise<unknown>>;

beforeEach(() => {
	FakePeerConnection.created = [];
	fetchMock = jest.fn(async () => response(200));
	Object.assign(globalThis, { RTCPeerConnection: FakePeerConnection, MediaStream: FakeMediaStream, fetch: fetchMock });
});

afterEach(() => {
	jest.useRealTimers();
});

describe('startWhep', () => {
	it('posts the offer with the token and resolves the resource against the WHEP URL', async () => {
		fetchMock.mockResolvedValueOnce(response(201, ANSWER));

		const session = await startWhep(WHEP_URL, 'view-token', 'high');

		const [target, init] = fetchMock.mock.calls[0];
		expect(String(target)).toBe('http://node:8089/whep/42?layer=high');
		expect(init).toMatchObject({
			method: 'POST',
			headers: { 'Content-Type': 'application/sdp', Authorization: 'Bearer view-token' },
			body: 'offer-sdp'
		});
		expect(session.resource).toBe('http://node:8089/resource/3.1.abc');
		expect(FakePeerConnection.created[0].setRemoteDescription).toHaveBeenCalledWith({ type: 'answer', sdp: ANSWER });
	});

	it('throws the HTTP status and closes the connection when the channel is not open', async () => {
		fetchMock.mockResolvedValueOnce(response(404));

		const error = await startWhep(WHEP_URL, 'view-token', 'auto').catch((reason: unknown) => reason);

		expect(error).toBeInstanceOf(WhepError);
		expect((error as WhepError).status).toBe(404);
		expect(FakePeerConnection.created[0].close).toHaveBeenCalled();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('ends the session when the node answers without video', async () => {
		fetchMock.mockResolvedValueOnce(response(201, ANSWER.replace('m=video 40000', 'm=video 0')));

		const error = await startWhep(WHEP_URL, 'view-token', 'auto').catch((reason: unknown) => reason);

		expect((error as WhepError).status).toBe(406);
		expect(fetchMock).toHaveBeenLastCalledWith('http://node:8089/resource/3.1.abc', { method: 'DELETE', keepalive: false });
		expect(FakePeerConnection.created[0].close).toHaveBeenCalled();
		expect(FakePeerConnection.created[0].setRemoteDescription).not.toHaveBeenCalled();
	});
});

describe('stopWhep', () => {
	it('deletes the resource, since closing the connection does not end the session', () => {
		const pc = new FakePeerConnection();
		stopWhep(
			{ pc: pc as unknown as RTCPeerConnection, stream: new FakeMediaStream() as unknown as MediaStream, resource: 'http://node/r' },
			true
		);

		expect(fetchMock).toHaveBeenCalledWith('http://node/r', { method: 'DELETE', keepalive: true });
		expect(pc.close).toHaveBeenCalled();
	});
});

describe('waitConnected', () => {
	it('resolves true once the connection is up', async () => {
		const pc = new FakePeerConnection();
		const result = waitConnected(pc as unknown as RTCPeerConnection, 5000);
		pc.connectionState = 'connected';
		pc.dispatchEvent(new Event('connectionstatechange'));

		await expect(result).resolves.toBe(true);
	});

	it('resolves false when the connection never comes up', async () => {
		jest.useFakeTimers();
		const pc = new FakePeerConnection();
		const result = waitConnected(pc as unknown as RTCPeerConnection, 5000);
		jest.advanceTimersByTime(5000);

		await expect(result).resolves.toBe(false);
	});
});
