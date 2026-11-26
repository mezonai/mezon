export type SelfMuteShortcutEvent = {
	key: string;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
	shiftKey: boolean;
};

// Ctrl+D (Windows/Linux) or Cmd+D (macOS) toggles the self mute in a voice room.
// Matches on the produced key rather than the physical key code so the shortcut follows the layout's "D".
export const isSelfMuteShortcut = (event: SelfMuteShortcutEvent): boolean =>
	(event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'd';
