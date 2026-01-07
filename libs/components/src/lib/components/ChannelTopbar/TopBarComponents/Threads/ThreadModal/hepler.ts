import type { ThreadsEntity } from '@mezon/store';
import { ThreadStatus } from '@mezon/utils';

// is thread public and last message within 30days
export const getActiveThreads = (threads: ThreadsEntity[]): ThreadsEntity[] => {
	const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
	const currentTime = Math.floor(Date.now() / 1000);

	const result = threads.filter((thread) => {
		const lastMessageTimestamp = thread?.lastSentMessage?.timestampSeconds;
		const isWithin30Days = lastMessageTimestamp && currentTime - Number(lastMessageTimestamp) < thirtyDaysInSeconds;
		return thread.active === ThreadStatus.activePublic && isWithin30Days;
	});

	return result;
};
export const getJoinedThreadsWithinLast30Days = (threads: ThreadsEntity[]): ThreadsEntity[] => {
	const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
	const currentTime = Math.floor(Date.now() / 1000);

	const result = threads.filter((thread) => {
		const isWithin30Days =
			thread.lastSentMessage?.timestampSeconds && currentTime - Number(thread.lastSentMessage.timestampSeconds) < thirtyDaysInSeconds;

		if (!thread.channelPrivate) {
			return thread.active === ThreadStatus.joined && isWithin30Days;
		} else {
			return (thread.active === ThreadStatus.joined || thread.active === ThreadStatus.activePrivate) && isWithin30Days;
		}
	});

	return result;
};

export const getThreadsOlderThan30Days = (threads: ThreadsEntity[]): ThreadsEntity[] => {
	const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
	const currentTime = Math.floor(Date.now() / 1000);

	const result = threads.filter(
		(thread) =>
			thread.lastSentMessage?.timestampSeconds && currentTime - Number(thread.lastSentMessage.timestampSeconds) > thirtyDaysInSeconds
	);

	return result;
};
