import { showSelfXssWarning } from './selfXssWarning';

describe('showSelfXssWarning', () => {
	it('prints the self-XSS warning as separate styled entries', () => {
		const logSpy = jest.spyOn(console, 'log').mockImplementation();

		showSelfXssWarning();

		expect(logSpy).toHaveBeenCalledTimes(4);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			'%c%s',
			'color: red; font-family: sans-serif; font-size: 64px; font-weight: 700; text-shadow: 1px 1px #000;',
			'Protect your Mezon account!'
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			2,
			'%c%s',
			'font-family: sans-serif; font-size: 18px;',
			'Developer Tools are intended for trusted development and debugging. Do not paste or run code here unless you wrote it yourself and fully understand what it does.'
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			3,
			'%c%s',
			'font-family: sans-serif; font-size: 18px;',
			'Scammers may claim that a script can unlock Mezon features, give you rewards, grant clan permissions, verify or recover your account, or "hack" another user. Running it can let them use your Mezon session, access data available to your account, send messages as you, or change your account settings.'
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			4,
			'%c%s',
			'font-family: sans-serif; font-size: 18px; font-weight: 700;',
			'Mezon staff, moderators, and bots will never ask you to paste code into DevTools. If someone sent you these instructions, stop now, close DevTools, and report the message or account through an official Mezon support channel.'
		);

		logSpy.mockRestore();
	});
});
