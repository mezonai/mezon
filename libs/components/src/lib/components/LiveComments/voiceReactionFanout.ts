import type { VoiceReactionSend } from 'mezon-js';

export type VoiceReactionHandler = (message: VoiceReactionSend) => void;

export interface VoiceReactionSocket {
	onvoicereactionmessage: VoiceReactionHandler;
}

type FanoutEntry = {
	subscribers: Set<VoiceReactionHandler>;
	dispatch: VoiceReactionHandler;
};

const noopVoiceReactionHandler: VoiceReactionHandler = () => undefined;
const fanoutBySocket = new WeakMap<VoiceReactionSocket, FanoutEntry>();

export const subscribeVoiceReaction = (socket: VoiceReactionSocket, cb: VoiceReactionHandler): (() => void) => {
	let entry = fanoutBySocket.get(socket);
	if (!entry) {
		const subscribers = new Set<VoiceReactionHandler>();
		const dispatch: VoiceReactionHandler = (message: VoiceReactionSend) => {
			for (const subscriber of [...subscribers]) {
				try {
					subscriber(message);
				} catch (error) {
					console.error(error);
				}
			}
		};
		entry = { subscribers, dispatch };
		fanoutBySocket.set(socket, entry);
	}

	entry.subscribers.add(cb);
	if (socket.onvoicereactionmessage !== entry.dispatch) {
		socket.onvoicereactionmessage = entry.dispatch;
	}

	let subscribed = true;
	return () => {
		if (!subscribed) return;
		subscribed = false;
		const current = fanoutBySocket.get(socket);
		if (!current) return;
		current.subscribers.delete(cb);
		if (current.subscribers.size === 0) {
			fanoutBySocket.delete(socket);
			if (socket.onvoicereactionmessage === current.dispatch) {
				socket.onvoicereactionmessage = noopVoiceReactionHandler;
			}
		}
	};
};
