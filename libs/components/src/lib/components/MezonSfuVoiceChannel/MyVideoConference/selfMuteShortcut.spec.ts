import { describe, expect, it } from '@jest/globals';
import { isSelfMuteShortcut, type SelfMuteShortcutEvent } from './selfMuteShortcut';

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
