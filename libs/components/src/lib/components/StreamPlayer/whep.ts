export type WhepSession = { pc: RTCPeerConnection; stream: MediaStream; resource: string };

export class WhepError extends Error {
	constructor(readonly status: number) {
		super(`WHEP request failed with HTTP ${status}`);
	}
}

const deleteResource = (resource: string, keepalive: boolean) => fetch(resource, { method: 'DELETE', keepalive }).catch(() => undefined);

export async function startWhep(url: string, token: string, layer: string): Promise<WhepSession> {
	const pc = new RTCPeerConnection();
	const stream = new MediaStream();
	pc.ontrack = (event) => stream.addTrack(event.track);
	pc.addTransceiver('audio', { direction: 'recvonly' });
	pc.addTransceiver('video', { direction: 'recvonly' });
	let resource = '';
	try {
		await pc.setLocalDescription(await pc.createOffer());
		const target = new URL(url);
		target.searchParams.set('layer', layer);
		const response = await fetch(target, {
			method: 'POST',
			headers: { 'Content-Type': 'application/sdp', Authorization: `Bearer ${token}` },
			body: pc.localDescription?.sdp
		});
		if (response.status !== 201) throw new WhepError(response.status);
		resource = new URL(response.headers.get('Location') ?? '', url).href;
		const answer = await response.text();
		if (/^m=video 0 /m.test(answer)) throw new WhepError(406);
		await pc.setRemoteDescription({ type: 'answer', sdp: answer });
		return { pc, stream, resource };
	} catch (error) {
		if (resource) void deleteResource(resource, false);
		pc.close();
		throw error;
	}
}

export function stopWhep({ pc, resource }: WhepSession, keepalive = false) {
	void deleteResource(resource, keepalive);
	pc.close();
}

export const setWhepLayer = (resource: string, layer: string) => fetch(`${resource}/layer?layer=${layer}`, { method: 'POST' }).catch(() => undefined);

export const waitConnected = (pc: RTCPeerConnection, timeoutMs: number) =>
	new Promise<boolean>((resolve) => {
		const finish = (connected: boolean) => {
			clearTimeout(timer);
			pc.removeEventListener('connectionstatechange', check);
			resolve(connected);
		};
		const check = () => {
			if (pc.connectionState === 'connected') finish(true);
			else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') finish(false);
		};
		const timer = setTimeout(() => finish(false), timeoutMs);
		pc.addEventListener('connectionstatechange', check);
		check();
	});
