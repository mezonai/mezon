import { useAppNavigation, useEscapeKeyClose, useOnClickOutside, usePermissionChecker, useReference } from '@mezon/core';
import {
	ChannelsEntity,
	ThreadsEntity,
	hasGrandchildModal,
	searchMessagesActions,
	selectActiveThreads,
	selectCurrentChannel,
	selectJoinedThreadsWithinLast30Days,
	selectShowEmptyStatus,
	selectTheme,
	selectThreadsOlderThan30Days,
	threadsActions,
	topicsActions,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EOverriddenPermission, checkIsThread } from '@mezon/utils';
import { Button } from 'flowbite-react';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import EmptyThread from './EmptyThread';
import GroupThreads from './GroupThreads';
import SearchThread from './SearchThread';
import ThreadItem from './ThreadItem';

type ThreadsProps = {
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
};

const ThreadModal = ({ onClose, rootRef }: ThreadsProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { toChannelPage } = useAppNavigation();

	const currentChannel = useSelector(selectCurrentChannel);

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean, channelId?: string) => {
			channelId && dispatch(threadsActions.setIsShowCreateThread({ channelId: channelId, isShowCreateThread }));
			dispatch(topicsActions.setIsShowCreateTopic(false));
		},
		[currentChannel]
	);

	const { setOpenThreadMessageState } = useReference();
	const hasChildModal = useSelector(hasGrandchildModal);
	const appearanceTheme = useSelector(selectTheme);
	const [canManageThread] = usePermissionChecker([EOverriddenPermission.manageThread], currentChannel?.id ?? '');

	const isEmpty = useSelector(selectShowEmptyStatus());
	const [keywordSearch, setKeywordSearch] = useState('');

	const getActiveThreads = useSelector(selectActiveThreads(keywordSearch));
	const getJoinedThreadsWithinLast30Days = useSelector(selectJoinedThreadsWithinLast30Days(keywordSearch));
	const getThreadsOlderThan30Days = useSelector(selectThreadsOlderThan30Days(keywordSearch));

	useEffect(() => {
		const fetchThreads = async () => {
			const isThread = checkIsThread(currentChannel as ChannelsEntity);
			const channelId = isThread ? (currentChannel?.parrent_id ?? '') : (currentChannel?.channel_id ?? '');
			const clanId = currentChannel?.clan_id ?? '';

			if (channelId && clanId) {
				const body = {
					channelId,
					clanId
				};
				await dispatch(threadsActions.fetchThreads(body));
			}
		};
		fetchThreads();
	}, [currentChannel]);

	const handleCreateThread = () => {
		setOpenThreadMessageState(false);
		if (currentChannel && currentChannel?.parrent_id !== '0') {
			navigate(toChannelPage(currentChannel.parrent_id as string, currentChannel.clan_id as string));
		}
		onClose();
		setIsShowCreateThread(true, currentChannel?.parrent_id !== '0' ? currentChannel?.parrent_id : currentChannel.channel_id);
		dispatch(threadsActions.setNameThreadError(''));
		dispatch(threadsActions.setMessageThreadError(''));
		dispatch(searchMessagesActions.setIsSearchMessage({ channelId: currentChannel?.channel_id as string, isSearchMessage: false }));
	};

	const modalRef = useRef<HTMLDivElement>(null);
	const preventClosePannel = useRef(false);
	useEscapeKeyClose(modalRef, onClose);
	useOnClickOutside(
		modalRef,
		() => {
			if (!hasChildModal && !preventClosePannel.current) {
				onClose();
			}
		},
		rootRef
	);
	///
	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 right-0 rounded-md dark:shadow-shadowBorder shadow-shadowInbox z-30 origin-top-right"
		>
			<div className="flex flex-col rounded-md min-h-[400px] md:w-[480px] lg:w-[540px] shadow-sm max-h-[calc(100vh_-_180px)] overflow-hidden">
				<div className="dark:bg-bgTertiary bg-bgLightTertiary flex flex-row items-center justify-between p-[16px] h-12">
					<div className="flex flex-row items-center border-r-[1px] dark:border-r-[#6A6A6A] border-r-[#E1E1E1] pr-[16px] gap-4">
						<Icons.ThreadIcon />
						<span className="text-base font-semibold cursor-default dark:text-white text-black">Threads</span>
					</div>
					<SearchThread setKeywordSearch={setKeywordSearch} />
					{canManageThread && (
						<div className="flex flex-row items-center gap-4">
							<Button
								onClick={handleCreateThread}
								size="sm"
								className="h-6 rounded focus:ring-transparent bg-bgSelectItem dark:bg-bgSelectItem hover:!bg-bgSelectItemHover items-center"
							>
								Create
							</Button>
							<button onClick={onClose}>
								<Icons.Close defaultSize="w-4 h-4 dark:text-[#CBD5E0] text-colorTextLightMode" />
							</button>
						</div>
					)}
				</div>
				<div
					className={`flex flex-col dark:bg-bgSecondary bg-bgLightSecondary px-[16px] min-h-full flex-1 overflow-y-auto ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}
				>
					{/* Joined threads */}
					{getJoinedThreadsWithinLast30Days.length > 0 && (
						<GroupThreads
							title={
								getJoinedThreadsWithinLast30Days.length > 1
									? `${getJoinedThreadsWithinLast30Days.length} joined threads`
									: `${getJoinedThreadsWithinLast30Days.length} joined thread`
							}
						>
							{getJoinedThreadsWithinLast30Days.map((thread: ThreadsEntity) => (
								<ThreadItem
									thread={thread}
									key={`${thread.id}-joined-threads`}
									setIsShowThread={onClose}
									preventClosePannel={preventClosePannel}
								/>
							))}
						</GroupThreads>
					)}
					{/* Active threads */}
					{getActiveThreads.length > 0 && (
						<GroupThreads
							title={
								getActiveThreads.length > 1
									? `${getActiveThreads.length} other active threads`
									: `${getActiveThreads.length} other active thread`
							}
						>
							{getActiveThreads.map((thread: ThreadsEntity) => (
								<ThreadItem
									isPublicThread={true}
									thread={thread}
									key={`${thread.id}-other-active-threads`}
									setIsShowThread={onClose}
									isHasContext={false}
									preventClosePannel={preventClosePannel}
								/>
							))}
						</GroupThreads>
					)}
					{/* Order threads */}
					{getThreadsOlderThan30Days.length > 0 && (
						<GroupThreads
							title={
								getThreadsOlderThan30Days.length > 1
									? `${getThreadsOlderThan30Days.length} older threads`
									: `${getThreadsOlderThan30Days.length} older thread`
							}
						>
							{getThreadsOlderThan30Days.map((thread: ThreadsEntity) => (
								<ThreadItem
									thread={thread}
									key={`${thread.id}-older-threads`}
									setIsShowThread={onClose}
									isHasContext={false}
									preventClosePannel={preventClosePannel}
								/>
							))}
						</GroupThreads>
					)}

					{isEmpty && <EmptyThread onClick={handleCreateThread} />}
				</div>
			</div>
		</div>
	);
};

export default ThreadModal;
