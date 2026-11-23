import type { MentionReactInputProps } from '@mezon/utils';
import { ID_MENTION_HERE, splitMessagePayload } from '@mezon/utils';

export type OnSendFn = MentionReactInputProps['onSend'];
export type OnSendArgs = Parameters<OnSendFn>;

async function sendPartsSequentially(
	onSend: OnSendFn,
	args: OnSendArgs,
	parts: ReturnType<typeof splitMessagePayload<NonNullable<OnSendArgs[1]>[number]>>
): Promise<boolean | void> {
	const [
		,
		,
		attachments,
		references,
		value,
		anonymousMessage,
		mentionEveryone,
		displayName,
		clanNick,
		ephemeralReceiverId,
		usersNotExistingInThread
	] = args;

	const hasHereInAnyPart = Boolean(mentionEveryone) && parts.some((part) => part.mentions.some((mention) => mention.user_id === ID_MENTION_HERE));

	let lastResult: boolean | void = undefined;
	for (let index = 0; index < parts.length; index += 1) {
		const part = parts[index];
		const isFirst = index === 0;
		const isLast = index === parts.length - 1;
		const partAttachments = isLast ? attachments : attachments ? [] : undefined;
		const partReferences = isFirst ? references : undefined;
		const partUsersNotExistingInThread = isFirst ? usersNotExistingInThread : undefined;
		const partMentionEveryone = mentionEveryone
			? hasHereInAnyPart
				? part.mentions.some((mention) => mention.user_id === ID_MENTION_HERE)
				: isFirst
			: mentionEveryone;

		lastResult = await onSend(
			part.content,
			part.mentions,
			partAttachments,
			partReferences,
			value,
			anonymousMessage,
			partMentionEveryone,
			displayName,
			clanNick,
			ephemeralReceiverId,
			partUsersNotExistingInThread
		);

		if (lastResult === false) {
			return false;
		}
	}

	return lastResult;
}

export function sendMessageInParts(onSend: OnSendFn, args: OnSendArgs, limit: number): void | Promise<boolean | void> {
	const [content, mentions] = args;
	const parts = splitMessagePayload(content, mentions, limit);

	if (parts.length === 0) {
		return undefined;
	}

	if (parts.length === 1 && parts[0].content === content) {
		return onSend(...args);
	}

	return sendPartsSequentially(onSend, args, parts);
}
