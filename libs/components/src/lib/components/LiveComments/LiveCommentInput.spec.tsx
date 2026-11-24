import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import { createElement } from 'react';
import { LiveCommentInput } from './LiveCommentInput';

jest.mock(
	'@mezon/ui',
	() => ({
		MezonIcon: () => null,
		MzIcons16: { mzSend: 'mzSend' }
	}),
	{ virtual: true }
);

jest.mock(
	'@mezon/utils',
	() => ({
		getNameForPrioritize: () => undefined,
		getAvatarForPrioritize: () => undefined
	}),
	{ virtual: true }
);

type Act = {
	(callback: () => Promise<unknown>): Promise<void>;
	(callback: () => void): void;
};

type InputProps = {
	value: string;
	onChange: (event: { target: { value: string } }) => void;
	onKeyDown: (event: { key: string; shiftKey: boolean; nativeEvent: { isComposing: boolean }; preventDefault: () => void }) => void;
};

type ButtonProps = {
	disabled: boolean;
	onClick: () => void;
};

type TestInstance<P> = {
	props: P;
};

type TestRenderer = {
	unmount: () => void;
	root: {
		findByType(type: 'input'): TestInstance<InputProps>;
		findByType(type: 'button'): TestInstance<ButtonProps>;
	};
};

const { act, create } = jest.requireActual<{ act: Act; create: (element: ReactElement) => TestRenderer }>('react-test-renderer');

let renderer: TestRenderer | undefined;

const flushAsync = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const renderInput = (onSend: (text: string) => boolean | Promise<boolean>) => {
	act(() => {
		renderer = create(
			createElement(LiveCommentInput, {
				onSend,
				placeholder: 'Write a comment',
				sendLabel: 'Send'
			})
		);
	});
	return renderer as TestRenderer;
};

const typeText = (instance: TestRenderer, value: string) => {
	act(() => {
		instance.root.findByType('input').props.onChange({ target: { value } });
	});
};

const clickSend = (instance: TestRenderer) => {
	act(() => {
		instance.root.findByType('button').props.onClick();
	});
};

afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
});

describe('LiveCommentInput', () => {
	it('keeps newer draft text when an in-flight async send resolves true', async () => {
		let resolveSend!: (sent: boolean) => void;
		const onSend = jest.fn(
			() =>
				new Promise<boolean>((resolve) => {
					resolveSend = resolve;
				})
		);
		const instance = renderInput(onSend);

		typeText(instance, 'a');
		clickSend(instance);
		expect(onSend).toHaveBeenCalledTimes(1);
		expect(onSend).toHaveBeenCalledWith('a');

		typeText(instance, 'ab');
		expect(instance.root.findByType('input').props.value).toBe('ab');

		await act(async () => {
			resolveSend(true);
			await flushAsync();
		});

		expect(instance.root.findByType('input').props.value).toBe('ab');
	});

	it('clears the draft when an in-flight async send resolves true with no typing in between', async () => {
		let resolveSend!: (sent: boolean) => void;
		const onSend = jest.fn(
			() =>
				new Promise<boolean>((resolve) => {
					resolveSend = resolve;
				})
		);
		const instance = renderInput(onSend);

		typeText(instance, 'a');
		clickSend(instance);
		expect(onSend).toHaveBeenCalledTimes(1);
		expect(onSend).toHaveBeenCalledWith('a');

		await act(async () => {
			resolveSend(true);
			await flushAsync();
		});

		expect(instance.root.findByType('input').props.value).toBe('');
	});

	it('keeps the draft when an in-flight async send resolves false', async () => {
		let resolveSend!: (sent: boolean) => void;
		const onSend = jest.fn(
			() =>
				new Promise<boolean>((resolve) => {
					resolveSend = resolve;
				})
		);
		const instance = renderInput(onSend);

		typeText(instance, 'a');
		clickSend(instance);
		expect(onSend).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveSend(false);
			await flushAsync();
		});

		expect(instance.root.findByType('input').props.value).toBe('a');
	});
});
