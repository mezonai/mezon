import { describe, expect, it, jest } from '@jest/globals';
import { isSelfMuteShortcut, runSelfMuteShortcut, type SelfMuteShortcutEvent } from './selfMuteShortcut';

const keyEvent = (overrides: Partial<SelfMuteShortcutEvent> = {}): SelfMuteShortcutEvent => ({
	key: 'd',
	ctrlKey: false,
	metaKey: false,
	altKey: false,
	shiftKey: false,
	...overrides
});

describe('isSelfMuteShortcut', () => {
	it('matches Ctrl+D and Cmd+D', () => {
		expect(isSelfMuteShortcut(keyEvent({ ctrlKey: true }))).toBe(true);
		expect(isSelfMuteShortcut(keyEvent({ metaKey: true }))).toBe(true);
	});

	it('matches the D key regardless of letter case reported by the layout', () => {
		expect(isSelfMuteShortcut(keyEvent({ key: 'D', ctrlKey: true }))).toBe(true);
	});

	it('does not match plain D or other letters with Ctrl', () => {
		expect(isSelfMuteShortcut(keyEvent())).toBe(false);
		expect(isSelfMuteShortcut(keyEvent({ key: 's', ctrlKey: true }))).toBe(false);
	});

	it('does not match when Alt or Shift is also held', () => {
		expect(isSelfMuteShortcut(keyEvent({ ctrlKey: true, altKey: true }))).toBe(false);
		expect(isSelfMuteShortcut(keyEvent({ ctrlKey: true, shiftKey: true }))).toBe(false);
	});
});

describe('runSelfMuteShortcut', () => {
	it('requests microphone permission before enabling a muted microphone', () => {
		const onMute = jest.fn();
		const onRequestMicrophonePermission = jest.fn();

		runSelfMuteShortcut(false, onMute, onRequestMicrophonePermission);

		expect(onMute).not.toHaveBeenCalled();
		expect(onRequestMicrophonePermission).toHaveBeenCalledTimes(1);
	});

	it('mutes an enabled microphone without requesting permission again', () => {
		const onMute = jest.fn();
		const onRequestMicrophonePermission = jest.fn();

		runSelfMuteShortcut(true, onMute, onRequestMicrophonePermission);

		expect(onMute).toHaveBeenCalledTimes(1);
		expect(onRequestMicrophonePermission).not.toHaveBeenCalled();
	});
});
