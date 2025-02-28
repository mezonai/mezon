import {
	ChannelsEntity,
	selectActiveThreads,
	selectCurrentClanId,
	selectJoinedThreadsWithinLast30Days,
	selectSearchedThreadResult,
	selectShowEmptyStatus,
	selectTheme,
	selectThreadsOlderThan30Days,
	threadsActions,
	ThreadsEntity,
	useAppDispatch
} from '@mezon/store';
import { customTheme } from '@mezon/ui';
import { checkIsThread, LIMIT } from '@mezon/utils';
import { Pagination } from 'flowbite-react';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import EmptyThread from './EmptyThread';
import GroupThreads from './GroupThreads';
import ThreadItem from './ThreadItem';

interface ThreadPaginationProps {
	channel: ChannelsEntity;
	onClose: () => void;
	preventClosePannel: React.MutableRefObject<boolean>;
	handleCreateThread: () => void;
}

const ThreadPagination: React.FC<ThreadPaginationProps> = ({ channel, onClose, preventClosePannel, handleCreateThread }) => {
	const dispatch = useAppDispatch();
	const isEmpty = useSelector(selectShowEmptyStatus());
	const currentClanId = useSelector(selectCurrentClanId);
	const appearanceTheme = useSelector(selectTheme);
	const [currentPage, setCurrentPage] = useState(1);
	const isThread = checkIsThread(channel as ChannelsEntity);
	const getActiveThreads = useSelector(selectActiveThreads()); // is thread public and last message within 30days
	const getJoinedThreadsWithinLast30Days = useSelector(selectJoinedThreadsWithinLast30Days()); // is thread joined and last message within 30days
	const getThreadsOlderThan30Days = useSelector(selectThreadsOlderThan30Days()); // is thread joined/public and last message over 30days
	const totalCountThread = getActiveThreads.length + getJoinedThreadsWithinLast30Days.length + getThreadsOlderThan30Days.length;
	const isNotFullPage = totalCountThread < LIMIT;
	const firstPageNotFull = isNotFullPage && currentPage === 1;

	const threadsSearched = useSelector(selectSearchedThreadResult);
	const noResultSearched = threadsSearched?.length === 0;

	const showEmpty = isEmpty || noResultSearched;

	const onPageChange = useCallback(
		async (page: number) => {
			if (!channel?.channel_id || !currentClanId) {
				return;
			}
			setCurrentPage(page);
			const body = {
				channelId: isThread ? (channel?.parent_id ?? '') : (channel?.channel_id ?? ''),
				clanId: channel?.clan_id ?? '',
				page: page,
				noCache: true
			};
			await dispatch(threadsActions.fetchThreads(body));
		},
		[dispatch, channel?.channel_id, currentClanId, totalCountThread, currentPage]
	);
	return (
		<>
			<div
				className={`flex flex-col dark:bg-bgSecondary bg-bgLightSecondary px-[16px] min-h-full flex-1 overflow-y-auto ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}
			>
				{threadsSearched && (
					<GroupThreads title={threadsSearched?.length > 1 ? `${threadsSearched.length} results` : `${threadsSearched.length} result`}>
						{threadsSearched.map((thread: ThreadsEntity, index: number) => (
							<ThreadItem
								thread={thread}
								key={`${thread.id}-result-${index}`}
								setIsShowThread={onClose}
								isHasContext={false}
								preventClosePannel={preventClosePannel}
							/>
						))}
					</GroupThreads>
				)}
				{/* Joined threads */}
				{!threadsSearched && getJoinedThreadsWithinLast30Days.length > 0 && (
					<GroupThreads
						title={
							getJoinedThreadsWithinLast30Days.length > 1
								? `${getJoinedThreadsWithinLast30Days.length} joined threads`
								: `${getJoinedThreadsWithinLast30Days.length} joined thread`
						}
					>
						{getJoinedThreadsWithinLast30Days.map((thread: ThreadsEntity, index: number) => (
							<ThreadItem
								thread={thread}
								key={`${thread.id}-joined-threads-${index}`}
								setIsShowThread={onClose}
								preventClosePannel={preventClosePannel}
							/>
						))}
					</GroupThreads>
				)}
				{/* Active threads */}
				{!threadsSearched && getActiveThreads.length > 0 && (
					<GroupThreads
						title={
							getActiveThreads.length > 1
								? `${getActiveThreads.length} other active threads`
								: `${getActiveThreads.length} other active thread`
						}
					>
						{getActiveThreads.map((thread: ThreadsEntity, index: number) => (
							<ThreadItem
								isPublicThread={true}
								thread={thread}
								key={`${thread.id}-other-active-threads-${index}`}
								setIsShowThread={onClose}
								isHasContext={false}
								preventClosePannel={preventClosePannel}
							/>
						))}
					</GroupThreads>
				)}
				{/* Older threads */}
				{!threadsSearched && getThreadsOlderThan30Days.length > 0 && (
					<GroupThreads
						title={
							getThreadsOlderThan30Days.length > 1
								? `${getThreadsOlderThan30Days.length} older threads`
								: `${getThreadsOlderThan30Days.length} older thread`
						}
					>
						{getThreadsOlderThan30Days.map((thread: ThreadsEntity, index: number) => (
							<ThreadItem
								thread={thread}
								key={`${thread.id}-older-threads-${index}`}
								setIsShowThread={onClose}
								isHasContext={false}
								preventClosePannel={preventClosePannel}
							/>
						))}
					</GroupThreads>
				)}

				{showEmpty && <EmptyThread onClick={handleCreateThread} />}
			</div>
			{threadsSearched || firstPageNotFull ? null : (
				<div className="py-2 dark:bg-[#2B2D31] bg-[#F2F3F5]">
					<Pagination
						layout="navigation"
						theme={customTheme(false)}
						currentPage={currentPage}
						totalPages={100}
						onPageChange={onPageChange}
						previousLabel=""
						nextLabel=""
						showIcons={true}
					/>
				</div>
			)}
		</>
	);
};

export default ThreadPagination;
