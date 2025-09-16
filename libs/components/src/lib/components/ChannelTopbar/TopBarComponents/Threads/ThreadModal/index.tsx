import { useAppNavigation, useEscapeKeyClose, useOnClickOutside, usePermissionChecker, useReference } from '@mezon/core';
import {
	ChannelsEntity,
	hasGrandchildModal,
	searchMessagesActions,
	selectCurrentChannel,
	selectCurrentClanId,
	selectSearchedThreadResult,
	selectThreadsByParentChannelId,
	threadsActions,
	topicsActions,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EOverriddenPermission, LIMIT, checkIsThread, generateE2eId } from '@mezon/utils';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import EmptyThread from './EmptyThread';
import GroupThreads from './GroupThreads';
import SearchThread from './SearchThread';
import ThreadList from './ThreadList';

type ThreadsProps = {
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
};

const ThreadModal = ({ onClose, rootRef }: ThreadsProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { toChannelPage } = useAppNavigation();

	const currentChannel = useSelector(selectCurrentChannel);
	const currentClanId = useSelector(selectCurrentClanId);
	const isThread = checkIsThread(currentChannel as ChannelsEntity);
	const currentChannelId = isThread ? (currentChannel?.parent_id ?? '') : (currentChannel?.channel_id ?? '');

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean, channelId?: string) => {
			channelId && dispatch(threadsActions.setIsShowCreateThread({ channelId: channelId, isShowCreateThread }));
			dispatch(topicsActions.setIsShowCreateTopic(false));
		},
		[currentChannel]
	);

	const { setOpenThreadMessageState } = useReference();
	const hasChildModal = useSelector(hasGrandchildModal);
	const [canManageThread] = usePermissionChecker([EOverriddenPermission.manageThread], currentChannel?.id ?? '');

	const handleCreateThread = () => {
		setOpenThreadMessageState(false);
		if (currentChannel && currentChannel?.parent_id !== '0') {
			navigate(toChannelPage(currentChannel.parent_id as string, currentChannel.clan_id as string));
		}
		onClose();
		setIsShowCreateThread(true, currentChannel?.parent_id !== '0' ? currentChannel?.parent_id : currentChannel.channel_id);
		dispatch(threadsActions.setNameThreadError(''));
		dispatch(threadsActions.setMessageThreadError(''));
		dispatch(searchMessagesActions.setIsSearchMessage({ channelId: currentChannel?.channel_id as string, isSearchMessage: false }));
	};

	const modalRef = useRef<HTMLDivElement>(null);
	const preventClosePannel = useRef<boolean>(false);
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

	const threadFetched = useSelector((state) => selectThreadsByParentChannelId(state, currentChannelId));
	const threadsSearched = useSelector((state) => selectSearchedThreadResult(state, currentChannelId));
	const noResultSearched = threadsSearched?.length === 0;

	const showThreadList = threadFetched.length > 0 && !threadsSearched;
	const showEmpty = noResultSearched || threadFetched.length === 0;
	const showThreadSearch = threadsSearched && threadsSearched?.length > 0;
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const fetchThreads = async (pageNumber: number) => {
		setIsLoading(true);
		try {
			const body = {
				channelId: currentChannelId,
				clanId: currentClanId ?? '',
				page: pageNumber
			};

			const payload = await dispatch(threadsActions.fetchThreads(body)).unwrap();
			const isLastPage = payload?.threads?.length < LIMIT;
			setHasMore(!isLastPage);
		} catch (error) {
			console.error('Error fetching threads:', error);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		fetchThreads(1);
	}, []);

	const loadMore = useCallback(() => {
		if (hasMore) {
			setPage((prevPage) => {
				const nextPage = prevPage + 1;
				fetchThreads(nextPage);
				return nextPage;
			});
		}
	}, [hasMore]);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 right-0  rounded-md shadow-shadowInbox z-30 origin-top-right bg-theme-setting-primary text-theme-message"
		>
			<div className="flex flex-col rounded-md min-h-[400px] md:w-[480px] lg:w-[540px] shadow-shadowBorder max-h-[calc(100vh_-_180px)] overflow-hidden">
				<div className="bg-theme-setting-nav flex flex-row items-center justify-between border-b-theme-primary p-[16px] h-12">
					<div className="flex flex-row items-center border-r-[1px] border-color-theme pr-[16px] gap-4">
						<Icons.ThreadIcon />
						<span className="text-base font-semibold cursor-default ">Threads</span>
					</div>
					<SearchThread channelId={currentChannelId} />
					{canManageThread && (
						<div className="flex flex-row items-center gap-4">
							<button
								onClick={handleCreateThread}
								className=" px-3  text-center text-sm font-medium h-6 rounded-lg btn-primary btn-primary-hover"
								data-e2e={generateE2eId('chat.channel_message.header.button.thread.modal.thread_management.button.create_thread')}
							>
								Create
							</button>
							<button onClick={onClose} className="text-color-theme-hover">
								<Icons.Close defaultSize="w-4 h-4 " />
							</button>
						</div>
					)}
				</div>
				{showThreadSearch && (
					<ul className="pb-4 pr-4 pl-4 h-[500px] overflow-y-auto app-scroll">
						<GroupThreads preventClosePannel={preventClosePannel} title="Results" threads={threadsSearched} />
					</ul>
				)}
				{showThreadList && (
					<div className="h-[500px]">
						<ThreadList preventClosePannel={preventClosePannel} isLoading={isLoading} loadMore={loadMore} threads={threadFetched} />
					</div>
				)}
				{showEmpty && <EmptyThread onClick={handleCreateThread} />}
			</div>
		</div>
	);
};

export default ThreadModal;
