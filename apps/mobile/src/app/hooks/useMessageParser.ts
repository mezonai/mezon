import type { IMessageWithUser } from '@mezon/utils';
import { convertDateString, convertTimeHour, convertTimeString, getTimeDifferenceDate } from '@mezon/utils';
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
		if (!message?.createTimeSeconds) return '';
		return convertTimeString(new Date(message.createTimeSeconds * 1000).toISOString());
	}, [message]);

	const messageDate = useMemo(() => {
		if (!message?.createTimeSeconds) return '';
		return convertDateString(new Date(message.createTimeSeconds * 1000).toISOString());
	}, [message]);

	const messageHour = useMemo(() => {
		if (!message?.createTimeSeconds) return '';
		return convertTimeHour(message.createTimeSeconds * 1000);
	}, [message]);

	const messageTimeDifference = useMemo(() => {
		if (!message?.createTimeSeconds) return '';
		return getTimeDifferenceDate(new Date(message.createTimeSeconds * 1000).toISOString());
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
