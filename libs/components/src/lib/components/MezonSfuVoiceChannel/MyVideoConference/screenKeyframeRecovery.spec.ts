import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ScreenKeyframeRecovery } from './screenKeyframeRecovery';

const createTrack = (id = 'screen') => ({ id, readyState: 'live' }) as MediaStreamTrack;
const setup = () => {
	let connected = true;
	let current = true;
	const send = jest.fn<(publisherId: number) => void>();
	const recovery = new ScreenKeyframeRecovery({
		canSend: () => connected,
		isCurrent: () => current,
		send,
		now: () => Date.now(),
		random: () => 0
	});
	const show = (id = '1002', track = createTrack(), focused = false) => {
		const token = Symbol(id);
		recovery.register(token, id, track, focused);
		recovery.setVisible(token, true);
		return { token, track };
	};
	return {
		recovery,
		send,
		show,
		setConnected: (value: boolean) => {
			connected = value;
		},
		setCurrent: (value: boolean) => {
			current = value;
		}
	};
};

beforeEach(() => {
	jest.useFakeTimers({ now: 0 });
});
afterEach(() => {
	jest.clearAllTimers();
	jest.useRealTimers();
});

describe('screen keyframe recovery', () => {
	it('waits for an actual frame before asking, then stops pending retries when that frame arrives', () => {
		const { recovery, send, show } = setup();
		const { token } = show();
		jest.advanceTimersByTime(300);
		expect(send).not.toHaveBeenCalled();
		recovery.reportFrame(token);
		jest.advanceTimersByTime(60_000);
		expect(send).not.toHaveBeenCalled();
		expect(jest.getTimerCount()).toBe(0);
	});

	it('sends at most three times without acknowledgements, even after remounting or pinning the same track', () => {
		const { recovery, send, show } = setup();
		const { token, track } = show();
		jest.advanceTimersByTime(60_000);
		expect(send.mock.calls).toEqual(Array(3).fill([1002]));
		recovery.unregister(token);
		show('1002', track, true);
		jest.advanceTimersByTime(60_000);
		expect(send).toHaveBeenCalledTimes(3);
		expect(jest.getTimerCount()).toBe(0);
	});

	it('prioritizes focused shares and caps every rolling one-second window at four requests', () => {
		const { send, show } = setup();
		for (let i = 0; i < 20; i++) show(String(1002 + i));
		show('2000', createTrack('focused'), true);
		expect(send.mock.calls[0]).toEqual([2000]);
		const counts: number[] = [];
		for (let tick = 0; tick < 200; tick++) {
			jest.advanceTimersByTime(100);
			counts.push(send.mock.calls.length);
			if (tick >= 10) expect(counts[tick] - counts[tick - 10]).toBeLessThanOrEqual(4);
		}
	});

	it('merges multiple renderers of a publisher instead of requesting once per renderer', () => {
		const { send, show } = setup();
		const track = createTrack();
		show('1002', track);
		show('1002', track, true);
		expect(send).toHaveBeenCalledTimes(1);
		jest.advanceTimersByTime(1000);
		expect(send).toHaveBeenCalledTimes(1);
	});

	it('promotes a missing screen on pin while retaining the per-publisher interval and retry budget', () => {
		const { recovery, send, show } = setup();
		const { token } = show();
		jest.advanceTimersByTime(350);
		expect(send).toHaveBeenCalledTimes(1);
		recovery.setFocused(token, true);
		jest.advanceTimersByTime(1499);
		expect(send).toHaveBeenCalledTimes(1);
		jest.advanceTimersByTime(1);
		expect(send).toHaveBeenCalledTimes(2);
	});

	it('cancels work for offscreen, departed and ended sources', () => {
		const { recovery, send, show, setCurrent } = setup();
		const { token } = show();
		recovery.setVisible(token, false);
		jest.advanceTimersByTime(5000);
		expect(send).not.toHaveBeenCalled();
		recovery.setVisible(token, true);
		setCurrent(false);
		recovery.wake();
		jest.advanceTimersByTime(5000);
		expect(send).not.toHaveBeenCalled();
		recovery.unregister(token);
		setCurrent(true);
		const ended = { id: 'ended', readyState: 'ended' } as MediaStreamTrack;
		show('1003', ended, true);
		expect(send).not.toHaveBeenCalled();
	});

	it('rejects slot IDs, missing IDs and IDs outside the numeric SFU range', () => {
		const { recovery, send } = setup();
		for (const id of [undefined, 'peer-3', '0', '-1', '1.5', '4294967296', '123456789012345678']) {
			const token = Symbol();
			recovery.register(token, id, createTrack(), true);
			recovery.setVisible(token, true);
		}
		jest.advanceTimersByTime(5000);
		expect(send).not.toHaveBeenCalled();
	});

	it('defers during negotiation/disconnection without burning attempts or running a polling loop', () => {
		const { recovery, send, show, setConnected } = setup();
		setConnected(false);
		show('1002', createTrack(), true);
		jest.advanceTimersByTime(60_000);
		expect(send).not.toHaveBeenCalled();
		expect(jest.getTimerCount()).toBe(0);
		setConnected(true);
		recovery.wake();
		expect(send).toHaveBeenCalledTimes(1);
	});

	it('preserves a static frame across a short hidden tab interval', () => {
		const { recovery, send, show } = setup();
		const { token } = show();
		recovery.reportFrame(token);
		recovery.setDocumentVisible(false);
		jest.advanceTimersByTime(2000);
		recovery.setDocumentVisible(true);
		jest.advanceTimersByTime(10_000);
		expect(send).not.toHaveBeenCalled();
	});

	it('gives BE replay 1.5 seconds on foreground and cancels a redundant request if a frame arrives', () => {
		const { recovery, send, show } = setup();
		const { token } = show();
		recovery.reportFrame(token);
		recovery.setDocumentVisible(false);
		jest.advanceTimersByTime(10_000);
		recovery.setDocumentVisible(true);
		jest.advanceTimersByTime(1000);
		expect(send).not.toHaveBeenCalled();
		recovery.reportFrame(token);
		jest.advanceTimersByTime(60_000);
		expect(send).not.toHaveBeenCalled();
	});

	it('recovers only the still-missing screen after foreground grace', () => {
		const { recovery, send, show } = setup();
		const good = show('1002');
		const missing = show('1003');
		recovery.reportFrame(good.token);
		recovery.reportFrame(missing.token);
		recovery.setDocumentVisible(false);
		jest.advanceTimersByTime(10_000);
		recovery.setDocumentVisible(true);
		recovery.reportFrame(good.token);
		jest.advanceTimersByTime(1499);
		expect(send).not.toHaveBeenCalled();
		jest.advanceTimersByTime(1);
		expect(send.mock.calls).toEqual([[1003]]);
	});

	it('keeps only PiP recovery eligible when the tab is hidden', () => {
		const { recovery, send, show } = setup();
		const pip = show('1002');
		show('1003');
		recovery.setPictureInPicture(pip.token, true);
		recovery.setDocumentVisible(false);
		jest.advanceTimersByTime(60_000);
		expect(send.mock.calls.every(([id]) => id === 1002)).toBe(true);
		expect(send).toHaveBeenCalledTimes(3);
	});

	it('backs off failed enqueue without consuming a retry attempt, and scopes recoverable errors to recent sends', () => {
		const { recovery, send, show } = setup();
		send.mockImplementationOnce(() => {
			throw new Error('closed');
		});
		show('1002', createTrack(), true);
		expect(recovery.isRecentRequestError('session_not_found')).toBe(false);
		jest.advanceTimersByTime(1499);
		expect(send).toHaveBeenCalledTimes(1);
		jest.advanceTimersByTime(1);
		expect(send).toHaveBeenCalledTimes(2);
		expect(recovery.isRecentRequestError('session_not_found')).toBe(true);
		expect(recovery.isRecentRequestError('invalid_token')).toBe(false);
		jest.advanceTimersByTime(5000);
		recovery.reset();
		expect(recovery.isRecentRequestError('session_not_found')).toBe(false);
	});

	it('recognizes replacement tracks with the same string ID without inheriting an exhausted budget', () => {
		const { recovery, send, show } = setup();
		const old = show('1002', createTrack('same-id'));
		jest.advanceTimersByTime(60_000);
		recovery.unregister(old.token);
		show('1002', createTrack('same-id'), true);
		expect(send).toHaveBeenCalledTimes(4);
	});
	it('retries a continuously loading screen with increasing delays and a hard three-send limit', () => {
		const { send, show } = setup();
		show();
		jest.advanceTimersByTime(350);
		expect(send).toHaveBeenCalledTimes(1);
		for (const [index, delay] of [1500, 3000].entries()) {
			jest.advanceTimersByTime(delay - 1);
			expect(send).toHaveBeenCalledTimes(index + 1);
			jest.advanceTimersByTime(1);
			expect(send).toHaveBeenCalledTimes(index + 2);
		}
		jest.advanceTimersByTime(60_000);
		expect(send).toHaveBeenCalledTimes(3);
		expect(jest.getTimerCount()).toBe(0);
	});

	it('resumes recovery when a displayed image is lost, and cancels it when another frame arrives', () => {
		const { recovery, send, show } = setup();
		const { token } = show();
		jest.advanceTimersByTime(350);
		recovery.reportFrame(token);
		jest.advanceTimersByTime(10_000);
		expect(send).toHaveBeenCalledTimes(1);
		recovery.reportFrameUnavailable(token);
		jest.advanceTimersByTime(1000);
		recovery.reportFrameUnavailable(token);
		jest.advanceTimersByTime(499);
		expect(send).toHaveBeenCalledTimes(1);
		jest.advanceTimersByTime(1);
		expect(send).toHaveBeenCalledTimes(2);
		recovery.reportFrame(token);
		jest.advanceTimersByTime(60_000);
		expect(send).toHaveBeenCalledTimes(2);
		expect(jest.getTimerCount()).toBe(0);
	});

	it('does not replenish an exhausted budget through repeated frame/loading transitions', () => {
		const { recovery, send, show } = setup();
		const { token } = show();
		jest.advanceTimersByTime(60_000);
		for (let i = 0; i < 10; i++) {
			recovery.reportFrame(token);
			recovery.reportFrameUnavailable(token);
			jest.advanceTimersByTime(5000);
		}
		expect(send).toHaveBeenCalledTimes(3);
		expect(jest.getTimerCount()).toBe(0);
	});

	it('defers image-loss recovery while offscreen and cancels it if a frame arrives there', () => {
		const { recovery, send, show } = setup();
		const { token } = show();
		recovery.reportFrame(token);
		recovery.setVisible(token, false);
		recovery.reportFrameUnavailable(token);
		jest.advanceTimersByTime(60_000);
		expect(send).not.toHaveBeenCalled();
		recovery.reportFrame(token);
		recovery.setVisible(token, true);
		jest.advanceTimersByTime(60_000);
		expect(send).not.toHaveBeenCalled();
	});
});
