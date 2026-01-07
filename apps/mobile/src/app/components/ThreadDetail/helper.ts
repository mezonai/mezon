import { ThreadsEntity } from '@mezon/store-mobile';
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
// is thread joined and last message within 30days
export const getJoinedThreadsWithinLast30Days = (threads: ThreadsEntity[]): ThreadsEntity[] => {
	const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
	const currentTime = Math.floor(Date.now() / 1000);

	return threads.filter(
		(thread) =>
			thread.active === ThreadStatus.joined &&
			thread.lastSentMessage?.timestampSeconds &&
			currentTime - Number(thread.lastSentMessage.timestampSeconds) < thirtyDaysInSeconds
	);
};
// is thread joined/public and last message over 30days
export const getThreadsOlderThan30Days = (threads: ThreadsEntity[]): ThreadsEntity[] => {
	const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
	const currentTime = Math.floor(Date.now() / 1000);

	const result = threads.filter(
		(thread) =>
			thread.lastSentMessage?.timestampSeconds && currentTime - Number(thread.lastSentMessage.timestampSeconds) > thirtyDaysInSeconds
	);

	return result;
};
