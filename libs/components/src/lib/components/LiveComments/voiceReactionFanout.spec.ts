import { describe, expect, it, jest } from '@jest/globals';
import type { VoiceReactionSend } from 'mezon-js';
import { subscribeVoiceReaction, type VoiceReactionSocket } from './voiceReactionFanout';

const createMockSocket = (): VoiceReactionSocket => ({
	onvoicereactionmessage: () => undefined
});

const makeEvent = (channelId: string, token: string): VoiceReactionSend => ({
	emojis: [token],
	channel_id: channelId,
	sender_id: 'user-1',
	media_type: 0
});

describe('voiceReactionFanout', () => {
	it('delivers events to multiple subscribers and restores a no-op on last unsubscribe', () => {
		const socket = createMockSocket();
		const first = jest.fn();
		const second = jest.fn();

		const unsubscribeFirst = subscribeVoiceReaction(socket, first);
		const unsubscribeSecond = subscribeVoiceReaction(socket, second);

		const firstEvent = makeEvent('stream-1', 'comment:hello');
		socket.onvoicereactionmessage(firstEvent);

		expect(first).toHaveBeenCalledTimes(1);
		expect(first).toHaveBeenCalledWith(firstEvent);
		expect(second).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledWith(firstEvent);

		unsubscribeFirst();
		unsubscribeFirst();

		const secondEvent = makeEvent('voice-1', 'emoji-1');
		socket.onvoicereactionmessage(secondEvent);

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(2);
		expect(second).toHaveBeenCalledWith(secondEvent);

		unsubscribeSecond();

		expect(typeof socket.onvoicereactionmessage).toBe('function');
		expect(() => socket.onvoicereactionmessage(makeEvent('stream-1', 'comment:ignored'))).not.toThrow();
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(2);
	});

	it('isolates exceptions in one subscriber and isolates separate sockets', () => {
		const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const socketA = createMockSocket();
		const socketB = createMockSocket();
		const failing = jest.fn(() => {
			throw new Error('boom');
		});
		const healthy = jest.fn();
		const otherSocketSub = jest.fn();

		const unsubFailing = subscribeVoiceReaction(socketA, failing);
		const unsubHealthy = subscribeVoiceReaction(socketA, healthy);
		const unsubOther = subscribeVoiceReaction(socketB, otherSocketSub);

		const event = makeEvent('stream-1', 'comment:ping');
		socketA.onvoicereactionmessage(event);

		expect(failing).toHaveBeenCalledTimes(1);
		expect(healthy).toHaveBeenCalledTimes(1);
		expect(otherSocketSub).not.toHaveBeenCalled();

		unsubFailing();
		unsubHealthy();
		unsubOther();
		errorSpy.mockRestore();
	});
});
