import { useOnScreen } from '@mezon/core';
import { ThreadsEntity } from '@mezon/store';
import { useEffect, useRef } from 'react';
import GroupThreads from './GroupThreads';
import { getActiveThreads, getJoinedThreadsWithinLast30Days, getThreadsOlderThan30Days } from './hepler';

type ThreadListProps = {
	isLoading: boolean;
	loadMore: () => void | undefined | null;
	threads: ThreadsEntity[];
	preventClosePannel: React.MutableRefObject<boolean>;
};

export default function ThreadList({ isLoading, threads, loadMore, preventClosePannel }: ThreadListProps) {
	const ulRef = useRef<HTMLUListElement | null>(null);
	const activeThreads = getActiveThreads(threads);
	const joinedThreads = getJoinedThreadsWithinLast30Days(threads);
	const oldThreads = getThreadsOlderThan30Days(threads);

	const { measureRef, isIntersecting, observer } = useOnScreen({ root: ulRef.current });

	const lastThread = threads[threads.length - 1];

	const isLastInActive = activeThreads.includes(lastThread);
	const isLastInJoined = joinedThreads.includes(lastThread);
	const isLastInOld = oldThreads.includes(lastThread);

	useEffect(() => {
		if (isIntersecting) {
			loadMore();
			observer?.disconnect();
		}
	}, [isIntersecting, loadMore]);

	return (
		<ul ref={ulRef} className="pb-4 pr-4 pl-4  overflow-y-auto h-[500px]">
			<GroupThreads
				preventClosePannel={preventClosePannel}
				title="Active Threads"
				threads={activeThreads}
				measureRef={isLastInActive ? measureRef : undefined}
			/>
			<GroupThreads
				preventClosePannel={preventClosePannel}
				title="Joined Threads (Last 30 Days)"
				threads={joinedThreads}
				measureRef={isLastInJoined ? measureRef : undefined}
			/>
			<GroupThreads
				preventClosePannel={preventClosePannel}
				title="Older Threads"
				threads={oldThreads}
				measureRef={isLastInOld ? measureRef : undefined}
			/>
			{isLoading && <li>Loading...</li>}
		</ul>
	);
}
