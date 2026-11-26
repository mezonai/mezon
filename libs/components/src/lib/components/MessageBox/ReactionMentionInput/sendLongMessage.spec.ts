import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { IMessageSendPayload } from '@mezon/utils';
import type { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js';
import type { OnSendArgs, OnSendFn } from './sendLongMessage';
import { sendMessageInParts } from './sendLongMessage';

const ID_MENTION_HERE = '1775731111020111321';
const mockSplitMessagePayload = jest.fn();
const mockT = jest.fn((key: string, options?: Record<string, unknown>) => `${key}:${JSON.stringify(options)}`);
const mockToastError = jest.fn();

jest.mock('i18next', () => ({
	t: (key: string, options?: Record<string, unknown>) => mockT(key, options)
}));

jest.mock('react-toastify', () => ({
	toast: {
		error: (message: unknown) => mockToastError(message)
	}
}));

jest.mock(
	'@mezon/utils',
	() => ({
		ID_MENTION_HERE: '1775731111020111321',
		MESSAGE_MAX_PART_BYTES: 3072,
		splitMessagePayload: (...args: unknown[]) => mockSplitMessagePayload(...args)
	}),
	{ virtual: true }
);

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

describe('sendMessageInParts', () => {
	beforeEach(() => {
		mockSplitMessagePayload.mockReset();
		mockT.mockClear();
		mockToastError.mockClear();
	});

	it('calls onSend once with identical arguments and returns its result unchanged for a single part', async () => {
		const content: IMessageSendPayload = { t: 'hello' };
		const mentions: ApiMessageMention[] = [{ user_id: 'u1', s: 0, e: 5 }];
		const attachments: ApiMessageAttachment[] = [{ filename: 'a.png', url: 'https://cdn/a.png' }];
		const references: ApiMessageRef[] = [{ message_ref_id: 'ref-1', has_attachment: false }];
		const threadValue = { nameValueThread: 'Thread', isPrivate: 1 };
		const users = ['u2'];

		mockSplitMessagePayload.mockReturnValue([{ content, mentions }]);

		const onSendSync = jest.fn<OnSendFn>().mockReturnValue(undefined);
		const args: OnSendArgs = [content, mentions, attachments, references, threadValue, true, true, 'Display', 'Nick', 'ephem-1', users];

		const syncResult = sendMessageInParts(onSendSync, args, 2048);

		expect(syncResult).toBeUndefined();
		expect(mockSplitMessagePayload).toHaveBeenCalledWith(content, mentions, 2048, 3072);
		expect(onSendSync).toHaveBeenCalledTimes(1);
		expect(onSendSync).toHaveBeenCalledWith(...args);

		const asyncReturn = Promise.resolve(false);
		const onSendAsync = jest.fn<OnSendFn>().mockReturnValue(asyncReturn);
		const asyncResult = sendMessageInParts(onSendAsync, args, 2048);

		expect(asyncResult).toBe(asyncReturn);
		expect(await asyncResult).toBe(false);
	});

	it('sends parts in order, awaits each call before starting the next, and returns the last result', async () => {
		const d1 = createDeferred<boolean>();
		const d2 = createDeferred<boolean>();
		const d3 = createDeferred<boolean>();
		const callOrder: string[] = [];

		const p1 = { content: { t: 'part-1' }, mentions: [] };
		const p2 = { content: { t: 'part-2' }, mentions: [] };
		const p3 = { content: { t: 'part-3' }, mentions: [] };
		mockSplitMessagePayload.mockReturnValue([p1, p2, p3]);

		const onSend = jest.fn<OnSendFn>((content) => {
			callOrder.push(content.t ?? '');
			if (content.t === 'part-1') return d1.promise;
			if (content.t === 'part-2') return d2.promise;
			return d3.promise;
		});

		const resultPromise = sendMessageInParts(onSend, [{ t: 'full' }, []], 2048);

		expect(onSend).toHaveBeenCalledTimes(1);
		expect(callOrder).toEqual(['part-1']);

		d1.resolve(true);
		await Promise.resolve();
		await Promise.resolve();
		expect(onSend).toHaveBeenCalledTimes(2);
		expect(callOrder).toEqual(['part-1', 'part-2']);

		d2.resolve(true);
		await Promise.resolve();
		await Promise.resolve();
		expect(onSend).toHaveBeenCalledTimes(3);
		expect(callOrder).toEqual(['part-1', 'part-2', 'part-3']);

		d3.resolve(true);
		await expect(resultPromise).resolves.toBe(true);
	});

	it('puts references and usersNotExistingInThread on part 1 only, attachments on the last part only, and forwards other args to all parts', async () => {
		const attachments: ApiMessageAttachment[] = [{ filename: 'doc.pdf', url: 'https://cdn/doc.pdf' }];
		const references: ApiMessageRef[] = [{ message_ref_id: 'ref-1', has_attachment: false }];
		const threadValue = { nameValueThread: 'Topic', isPrivate: 0 };
		const users = ['u-new'];

		const p1 = { content: { t: 'p1' }, mentions: [{ user_id: 'u1', s: 0, e: 2 }] };
		const p2 = { content: { t: 'p2' }, mentions: [] };
		const p3 = { content: { t: 'p3' }, mentions: [{ user_id: 'u2', s: 0, e: 2 }] };
		mockSplitMessagePayload.mockReturnValue([p1, p2, p3]);

		const onSend = jest.fn<(...args: OnSendArgs) => Promise<boolean | void>>().mockResolvedValue(true);

		await sendMessageInParts(onSend, [{ t: 'all' }, [], attachments, references, threadValue, true, false, 'Disp', 'Clan', 'ephem', users], 2048);

		expect(onSend).toHaveBeenCalledTimes(3);
		expect(onSend).toHaveBeenNthCalledWith(1, p1.content, p1.mentions, [], references, threadValue, true, false, 'Disp', 'Clan', 'ephem', users);
		expect(onSend).toHaveBeenNthCalledWith(
			2,
			p2.content,
			p2.mentions,
			[],
			undefined,
			threadValue,
			true,
			false,
			'Disp',
			'Clan',
			'ephem',
			undefined
		);
		expect(onSend).toHaveBeenNthCalledWith(
			3,
			p3.content,
			p3.mentions,
			attachments,
			undefined,
			threadValue,
			true,
			false,
			'Disp',
			'Clan',
			'ephem',
			undefined
		);
	});

	it('keeps attachments undefined on all earlier parts when original attachments is undefined', async () => {
		mockSplitMessagePayload.mockReturnValue([
			{ content: { t: 'p1' }, mentions: [] },
			{ content: { t: 'p2' }, mentions: [] }
		]);
		const onSend = jest.fn<(...args: OnSendArgs) => Promise<boolean | void>>().mockResolvedValue(undefined);

		await sendMessageInParts(onSend, [{ t: 'all' }, [], undefined], 2048);

		expect(onSend.mock.calls[0][2]).toBeUndefined();
		expect(onSend.mock.calls[1][2]).toBeUndefined();
	});

	it('applies mentionEveryone only to parts with ID_MENTION_HERE, or to the first part if none contain it', async () => {
		mockSplitMessagePayload.mockReturnValue([
			{ content: { t: 'p1' }, mentions: [{ user_id: 'u1', s: 0, e: 2 }] },
			{ content: { t: 'p2' }, mentions: [{ user_id: ID_MENTION_HERE, s: 0, e: 5 }] },
			{ content: { t: 'p3' }, mentions: [{ user_id: ID_MENTION_HERE, s: 0, e: 5 }] }
		]);

		const onSendWithHere = jest.fn<(...args: OnSendArgs) => Promise<boolean | void>>().mockResolvedValue(true);
		await sendMessageInParts(onSendWithHere, [{ t: 'all' }, [], [], undefined, undefined, false, true], 2048);

		expect(onSendWithHere.mock.calls.map((call) => call[6])).toEqual([false, true, true]);

		mockSplitMessagePayload.mockReturnValue([
			{ content: { t: 'p1' }, mentions: [{ user_id: 'u1', s: 0, e: 2 }] },
			{ content: { t: 'p2' }, mentions: [] },
			{ content: { t: 'p3' }, mentions: [] }
		]);

		const onSendWithoutHere = jest.fn<(...args: OnSendArgs) => Promise<boolean | void>>().mockResolvedValue(true);
		await sendMessageInParts(onSendWithoutHere, [{ t: 'all' }, [], [], undefined, undefined, false, true], 2048);

		expect(onSendWithoutHere.mock.calls.map((call) => call[6])).toEqual([true, false, false]);
	});

	it('stops immediately and returns false when a part resolves to false', async () => {
		mockSplitMessagePayload.mockReturnValue([
			{ content: { t: 'p1' }, mentions: [] },
			{ content: { t: 'p2' }, mentions: [] },
			{ content: { t: 'p3' }, mentions: [] }
		]);

		const onSend = jest
			.fn<(...args: OnSendArgs) => Promise<boolean | void>>()
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(false)
			.mockResolvedValueOnce(true);

		const result = await sendMessageInParts(onSend, [{ t: 'all' }, []], 2048);

		expect(result).toBe(false);
		expect(onSend).toHaveBeenCalledTimes(2);
	});

	it('stops the chain, returns false, and shows one toast when onSend throws on part 2 of 3', async () => {
		mockSplitMessagePayload.mockReturnValue([
			{ content: { t: 'p1' }, mentions: [] },
			{ content: { t: 'p2' }, mentions: [] },
			{ content: { t: 'p3' }, mentions: [] }
		]);

		const onSend = jest
			.fn<(...args: OnSendArgs) => Promise<boolean | void>>()
			.mockResolvedValueOnce(true)
			.mockRejectedValueOnce(new Error('network error'))
			.mockResolvedValueOnce(true);

		const result = await sendMessageInParts(onSend, [{ t: 'all' }, []], 2048);

		expect(result).toBe(false);
		expect(onSend).toHaveBeenCalledTimes(2);
		expect(mockT).toHaveBeenCalledWith('message:longMessagePartFailed', { failed: 2, total: 3 });
		expect(mockToastError).toHaveBeenCalledTimes(1);
	});

	it('stops on part 1 of 3 when onSend resolves false and shows one toast with failed 1 total 3', async () => {
		mockSplitMessagePayload.mockReturnValue([
			{ content: { t: 'p1' }, mentions: [] },
			{ content: { t: 'p2' }, mentions: [] },
			{ content: { t: 'p3' }, mentions: [] }
		]);

		const onSend = jest.fn<(...args: OnSendArgs) => Promise<boolean | void>>().mockResolvedValueOnce(false);

		const result = await sendMessageInParts(onSend, [{ t: 'all' }, []], 2048);

		expect(result).toBe(false);
		expect(onSend).toHaveBeenCalledTimes(1);
		expect(mockT).toHaveBeenCalledWith('message:longMessagePartFailed', { failed: 1, total: 3 });
		expect(mockToastError).toHaveBeenCalledTimes(1);
	});

	it('sends attachments with empty text when splitting whitespace-only text yields 0 parts, and returns undefined without attachments', async () => {
		mockSplitMessagePayload.mockReturnValue([]);
		const attachments: ApiMessageAttachment[] = [{ filename: 'pic.png', url: 'https://cdn/pic.png' }];
		const references: ApiMessageRef[] = [{ message_ref_id: 'ref-1', has_attachment: false }];
		const threadValue = { nameValueThread: 'Topic', isPrivate: 0 };
		const users = ['u-new'];
		const onSend = jest.fn<(...args: OnSendArgs) => Promise<boolean | void>>().mockResolvedValue(true);

		const result = await sendMessageInParts(
			onSend,
			[{ t: '   \n\n   ' }, [{ user_id: 'u1', s: 0, e: 2 }], attachments, references, threadValue, true, true, 'Disp', 'Clan', 'ephem', users],
			2048
		);

		expect(result).toBe(true);
		expect(onSend).toHaveBeenCalledTimes(1);
		expect(onSend).toHaveBeenCalledWith({ t: '' }, [], attachments, references, threadValue, true, true, 'Disp', 'Clan', 'ephem', users);

		onSend.mockClear();
		const noAttachResult = sendMessageInParts(onSend, [{ t: '   \n\n   ' }, []], 2048);
		expect(noAttachResult).toBeUndefined();
		expect(onSend).not.toHaveBeenCalled();
	});
});
