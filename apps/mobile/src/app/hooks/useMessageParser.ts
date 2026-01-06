import { IMessageWithUser, convertDateString, convertTimeHour, convertTimeString, getTimeDifferenceDate } from '@mezon/utils';
import { useMemo } from 'react';

export function useMessageParser(message: IMessageWithUser) {
	const attachments = useMemo(() => {
		return message.attachments;
	}, [message]);

	const mentions = useMemo(() => {
		return message.mentions;
	}, [message]);

	const content = useMemo(() => {
		return message.content;
	}, [message]);

	const lines = useMemo(() => {
		const values = content?.t;
		return values;
	}, [content]);

	const messageTime = useMemo(() => {
		if (!message?.createTime) return '';
		return convertTimeString(message?.createTime as string);
	}, [message]);

	const messageDate = useMemo(() => {
		if (!message?.createTime) return '';
		return convertDateString(message?.createTime as string);
	}, [message]);

	const messageHour = useMemo(() => {
		if (!message?.createTime) return '';
		return convertTimeHour(message?.createTime || ('' as string));
	}, [message]);

	const messageTimeDifference = useMemo(() => {
		if (!message?.createTime) return '';
		return getTimeDifferenceDate(message?.createTime as string);
	}, [message]);

	return {
		content,
		messageTime,
		messageHour,
		attachments,
		mentions,
		lines,
		messageDate,
		messageTimeDifference
	};
}
