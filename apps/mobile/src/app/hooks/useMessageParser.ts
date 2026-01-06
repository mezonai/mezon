import { convertDateString, convertTimeHour, convertTimeString, getTimeDifferenceDate, IMessageWithUser } from '@mezon/utils';
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
		if (!message?.create_time_seconds) return '';
		return convertTimeString(new Date(message.create_time_seconds * 1000).toISOString());
	}, [message]);

	const messageDate = useMemo(() => {
		if (!message?.create_time_seconds) return '';
		return convertDateString(new Date(message.create_time_seconds * 1000).toISOString());
	}, [message]);

	const messageHour = useMemo(() => {
		if (!message?.create_time_seconds) return '';
		return convertTimeHour(new Date(message.create_time_seconds * 1000).toISOString());
	}, [message]);

	const messageTimeDifference = useMemo(() => {
		if (!message?.create_time_seconds) return '';
		return getTimeDifferenceDate(new Date(message.create_time_seconds * 1000).toISOString());
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
