const WARNING_TITLE = 'Protect your Mezon account!';
const DEVELOPER_TOOLS_WARNING =
	'Developer Tools are intended for trusted development and debugging. Do not paste or run code here unless you wrote it yourself and fully understand what it does.';
const SCAM_WARNING =
	'Scammers may claim that a script can unlock Mezon features, give you rewards, grant clan permissions, verify or recover your account, or "hack" another user. Running it can let them use your Mezon session, access data available to your account, send messages as you, or change your account settings.';
const RESPONSE_WARNING =
	'Mezon staff, moderators, and bots will never ask you to paste code into DevTools. If someone sent you these instructions, stop now, close DevTools, and report the message or account through an official Mezon support channel.';

const TITLE_STYLE = 'color: red; font-family: sans-serif; font-size: 64px; font-weight: 700; text-shadow: 1px 1px #000;';
const WARNING_STYLE = 'font-family: sans-serif; font-size: 18px;';
const RESPONSE_STYLE = 'font-family: sans-serif; font-size: 18px; font-weight: 700;';

export function showSelfXssWarning(): void {
	// Separate neutral log entries produce the Facebook-like DevTools layout without a warning icon.
	// eslint-disable-next-line no-console
	console.log('%c%s', TITLE_STYLE, WARNING_TITLE);
	// eslint-disable-next-line no-console
	console.log('%c%s', WARNING_STYLE, DEVELOPER_TOOLS_WARNING);
	// eslint-disable-next-line no-console
	console.log('%c%s', WARNING_STYLE, SCAM_WARNING);
	// eslint-disable-next-line no-console
	console.log('%c%s', RESPONSE_STYLE, RESPONSE_WARNING);
}
