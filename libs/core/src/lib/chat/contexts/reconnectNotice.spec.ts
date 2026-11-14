import type { NoticeSocketStatus } from './reconnectNotice';
import { watchReconnectNotice } from './reconnectNotice';

function fakeSocket(initial: NoticeSocketStatus = 'connected') {
	let status = initial;
	const listeners = new Set<(next: NoticeSocketStatus) => void>();
	return {
		get status() {
			return status;
		},
		set(next: NoticeSocketStatus) {
			status = next;
			listeners.forEach((listener) => listener(next));
		},
		subscribe(listener: (next: NoticeSocketStatus) => void) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		}
	};
}

describe('watchReconnectNotice', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	function setup(recovering = true) {
		const socket = fakeSocket();
		const show = jest.fn();
		const hide = jest.fn();
		const state = { recovering };
		const stop = watchReconnectNotice({
			subscribe: (listener) => socket.subscribe(listener),
			isConnected: () => socket.status === 'connected',
			isRecovering: () => state.recovering,
			show,
			hide,
			delayMs: 5000
		});
		return { socket, show, hide, state, stop };
	}

	it('shows one notice when a reconnect is still failing after the delay', () => {
		const { socket, show } = setup();
		socket.set('connecting');
		socket.set('disconnected');
		socket.set('connecting');
		jest.advanceTimersByTime(4999);
		expect(show).not.toHaveBeenCalled();
		jest.advanceTimersByTime(1);
		expect(show).toHaveBeenCalledTimes(1);
	});

	it('shows nothing when the socket comes back before the delay', () => {
		const { socket, show, hide } = setup();
		socket.set('connecting');
		jest.advanceTimersByTime(3000);
		socket.set('connected');
		jest.advanceTimersByTime(10000);
		expect(show).not.toHaveBeenCalled();
		expect(hide).toHaveBeenCalledTimes(1);
	});

	it('hides the notice once the socket is connected again', () => {
		const { socket, show, hide } = setup();
		socket.set('connecting');
		jest.advanceTimersByTime(5000);
		expect(show).toHaveBeenCalledTimes(1);
		socket.set('connected');
		expect(hide).toHaveBeenCalledTimes(1);
	});

	it('stays quiet while no reconnect is in progress', () => {
		const { socket, show } = setup(false);
		socket.set('connecting');
		jest.advanceTimersByTime(10000);
		expect(show).not.toHaveBeenCalled();
	});

	it('does not show after it is stopped', () => {
		const { socket, show, stop } = setup();
		socket.set('connecting');
		stop();
		jest.advanceTimersByTime(10000);
		expect(show).not.toHaveBeenCalled();
	});
});
