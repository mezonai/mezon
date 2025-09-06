import { usePermissionChecker } from '@mezon/core';
import {
	ClansEntity,
	FAVORITE_CATEGORY_ID,
	categoriesActions,
	listChannelRenderAction,
	selectCtrlKFocusChannel,
	selectCurrentChannelId,
	selectCurrentClan,
	selectCurrentUserId,
	selectIsElectronDownloading,
	selectIsElectronUpdateAvailable,
	selectIsOpenCreateNewChannel,
	selectIsShowEmptyCategory,
	selectListChannelRenderByClanId,
	selectStatusStream,
	selectVoiceJoined,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import {
	ChannelThreads,
	EPermission,
	ICategoryChannel,
	IChannel,
	createImgproxyUrl,
	isLinuxDesktop,
	isWindowsDesktop,
	toggleDisableHover,
	useSyncEffect
} from '@mezon/utils';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { CreateNewChannelModal } from '../CreateChannelModal';
import { MentionFloatButton } from '../MentionFloatButton';
import { ThreadLinkWrapper } from '../ThreadListChannel';
import { useVirtualizer } from '../virtual-core/useVirtualizer';
import CategorizedItem, { IChannelLinkPermission } from './CategorizedChannels';
import { Events } from './ChannelListComponents';
import ChannelListItem from './ChannelListItem';
export type ChannelListProps = { className?: string };
export type CategoriesState = Record<string, boolean>;
const clanTopbarEle = 50;

function ChannelList() {
	const isOpenModal = useAppSelector((state) => selectIsOpenCreateNewChannel(state));
	const [openCreateChannel, closeCreateChannel] = useModal(() => <CreateNewChannelModal />, []);
	const currentClan = useSelector(selectCurrentClan);
	const listChannelRender = useAppSelector((state) => selectListChannelRenderByClanId(state, currentClan?.clan_id));

	const userId = useSelector(selectCurrentUserId);
	const [hasAdminPermission, hasClanPermission, hasChannelManagePermission] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.manageChannel
	]);
	const isClanOwner = currentClan?.creator_id === userId;
	const permissions = useMemo(
		() => ({
			hasAdminPermission,
			hasClanPermission,
			hasChannelManagePermission,
			isClanOwner
		}),
		[hasAdminPermission, hasClanPermission, hasChannelManagePermission, isClanOwner]
	);

	useEffect(() => {
		if (isOpenModal) {
			openCreateChannel();
		} else {
			closeCreateChannel();
		}
	}, [isOpenModal]);

	const shouldShowSkeleton = !listChannelRender || listChannelRender?.length === 0;

	return (
		<div onContextMenu={(event) => event.preventDefault()} id="channelList" className="contain-strict h-full">
			<div className={`flex-1 relative`}>
				<div
					className={`absolute inset-0 transition-opacity duration-300 ${shouldShowSkeleton ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
				>
					<ChannelListSkeleton />
				</div>

				<div
					className={`transition-opacity duration-300 ${shouldShowSkeleton ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
				>
					<RowVirtualizerDynamic permissions={permissions} />
				</div>
			</div>
		</div>
	);
}

const ChannelBannerAndEvents = memo(({ currentClan }: { currentClan: ClansEntity | null }) => {
	return (
		<>
			{currentClan?.banner && (
				<div className="h-[136px]">
					<img
						src={createImgproxyUrl(currentClan?.banner ?? '', { width: 300, height: 300, resizeType: 'fit' })}
						alt="imageCover"
						className="h-full w-full object-cover"
					/>
				</div>
			)}
			<div id="channel-list-top" className="self-stretch h-fit flex-col justify-start items-start gap-1 p-2 flex">
				<Events />
				<hr className="w-full ml-[3px] border-t-theme-primary"></hr>
			</div>
		</>
	);
});

const RowVirtualizerDynamic = memo(({ permissions }: { permissions: IChannelLinkPermission }) => {
	const currentClan = useSelector(selectCurrentClan);
	const [showFullList, setShowFullList] = useState(false);
	const prevClanIdRef = useRef<string | null>(null);

	useSyncEffect(() => {
		const currentClanId = currentClan?.clan_id ?? null;
		if (prevClanIdRef.current !== currentClanId) {
			prevClanIdRef.current = currentClanId;
			if (showFullList) {
				setShowFullList(false);
			}
		}
	}, [currentClan]);

	const isShowEmptyCategory = useSelector(selectIsShowEmptyCategory);
	const streamPlay = useSelector(selectStatusStream);
	const isVoiceJoined = useSelector(selectVoiceJoined);
	const isElectronUpdateAvailable = useSelector(selectIsElectronUpdateAvailable);
	const IsElectronDownloading = useSelector(selectIsElectronDownloading);
	const ctrlKFocusChannel = useSelector(selectCtrlKFocusChannel);
	const dispatch = useAppDispatch();

	const listChannelRender = useAppSelector((state) => selectListChannelRenderByClanId(state, currentClan?.clan_id));
	const firstChannelWithBadgeCount = useMemo(() => {
		return listChannelRender?.find((item) => (item as IChannel)?.count_mess_unread && ((item as IChannel)?.count_mess_unread || 0) > 0) || null;
	}, [listChannelRender]);

	const [height, setHeight] = useState(0);

	const data = useMemo(() => {
		const filteredChannels = listChannelRender
			? isShowEmptyCategory
				? listChannelRender
				: listChannelRender.filter(
						(item) =>
							((item as ICategoryChannel).channels && (item as ICategoryChannel).channels.length > 0) ||
							(item as ICategoryChannel).channels === undefined
					)
			: [];

		const countItems = Math.round(height / 36);

		const limitedChannels =
			!showFullList && filteredChannels.length > 20 ? filteredChannels.slice(0, countItems > 20 ? countItems : 20) : filteredChannels;
		return [{ type: 'bannerAndEvents' }, ...limitedChannels];
	}, [listChannelRender, isShowEmptyCategory, showFullList]) as ICategoryChannel[];

	useEffect(() => {
		const calculateHeight = () => {
			const clanFooterEle = document.getElementById('clan-footer');
			const rect = clanFooterEle?.getBoundingClientRect();
			const distanceFromBottom = window.innerHeight - (rect?.bottom || 0);
			const totalHeight = clanTopbarEle + (clanFooterEle?.clientHeight || 0) + 8 + distanceFromBottom;
			const outsideHeight = totalHeight;
			const titleBarHeight = isWindowsDesktop || isLinuxDesktop ? 21 : 0;
			setHeight(window.innerHeight - outsideHeight - titleBarHeight);
		};
		calculateHeight();
		window.addEventListener('resize', calculateHeight);
		return () => window.removeEventListener('resize', calculateHeight);
	}, [data, streamPlay, IsElectronDownloading, isElectronUpdateAvailable, isVoiceJoined]);

	useEffect(() => {
		const idleCallback = window.requestIdleCallback(
			() => {
				setShowFullList(true);
			},
			{ timeout: 3000 }
		);

		return () => {
			window.cancelIdleCallback(idleCallback);
		};
	}, [listChannelRender]);

	const currentChannelId = useSelector(selectCurrentChannelId);

	const parentRef = useRef<HTMLDivElement>(null);
	const count = data.length;
	const virtualizer = useVirtualizer({
		count,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 36
	});

	const items = virtualizer.getVirtualItems();

	const findScrollIndex = () => {
		const channelId = firstChannelWithBadgeCount?.id;
		const index = data.findIndex((item) => item.id === channelId && item.category_id !== FAVORITE_CATEGORY_ID);
		const currentScrollIndex = virtualizer.getVirtualItems().findIndex((item) => item.index === index);
		const currentScrollPosition = virtualizer.scrollElement?.scrollTop;
		const targetScrollPosition = virtualizer.getVirtualItems()[currentScrollIndex]?.start;

		return { index, currentScrollIndex, currentScrollPosition, targetScrollPosition };
	};

	useLayoutEffect(() => {
		if (!ctrlKFocusChannel?.id) return;
		if (!virtualizer.getVirtualItems().length) return;

		const focusChannel = ctrlKFocusChannel;
		const { id } = focusChannel as { id: string; parentId: string };
		const index = data.findIndex((item) => item.id === id && item.category_id !== FAVORITE_CATEGORY_ID);
		if (index <= 0) return;

		const currentScrollIndex = virtualizer.getVirtualItems().findIndex((item) => item.index === index);
		const currentScrollPosition = virtualizer.scrollElement?.scrollTop;
		const targetScrollPosition = virtualizer.getVirtualItems()[currentScrollIndex]?.start;
		if (currentScrollIndex === -1 || targetScrollPosition !== currentScrollPosition) {
			virtualizer.scrollToIndex(index, { align: 'center' });
		}

		dispatch(categoriesActions.setCtrlKFocusChannel(null));
	});

	const scrollTimeoutId2 = useRef<NodeJS.Timeout | null>(null);

	const handleScrollChannelIntoView = () => {
		const { index, currentScrollIndex, currentScrollPosition, targetScrollPosition } = findScrollIndex();
		if (currentScrollIndex === -1 || targetScrollPosition !== currentScrollPosition) {
			virtualizer.scrollToIndex(index, { align: 'center' });
		}
	};

	const isChannelRefOutOfViewport = () => {
		const { currentScrollIndex } = findScrollIndex();
		return currentScrollIndex === -1;
	};
	const dragItemIndex = useRef<{ idElement: string; indexEnd: number } | null>(null);
	const dragInfor = useRef<ICategoryChannel | null>(null);
	const isDraggingRef = useRef(false);

	const handleDragStart = useCallback(
		(index: number, e: React.DragEvent<HTMLDivElement>, id: string) => {
			setTimeout(() => {
				isDraggingRef.current = true;
			}, 100);

			dragItemIndex.current = {
				idElement: id,
				indexEnd: index
			};
			dragInfor.current = data[index];
		},
		[data]
	);

	const handleDragEnter = useCallback(
		(index: number, e: React.DragEvent<HTMLDivElement>, id: string) => {
			const target = e.target as HTMLDivElement;
			if (!target.id || dragItemIndex.current?.idElement === target.id || dragInfor.current?.category_id !== data[index]?.category_id) return;
			const currentEl = document.getElementById(id);
			const previousEl = document.getElementById(dragItemIndex.current!.idElement);
			if (currentEl) currentEl.style.borderBottom = '3px solid #22c55e';
			if (previousEl) previousEl.style.borderBottom = 'none';
			dragItemIndex.current = {
				idElement: id,
				indexEnd: index
			};
		},
		[data]
	);

	const handleDragEnd = useCallback(
		(dragIndex: number) => {
			setTimeout(() => {
				isDraggingRef.current = false;
			}, 50);

			const el = document.getElementById(dragItemIndex.current!.idElement);
			if (el) el.style.borderBottom = 'none';

			if (dragItemIndex.current!.indexEnd === dragIndex) {
				dragItemIndex.current = null;
				return;
			}
			let countEmptyCategory = 0;

			if (!isShowEmptyCategory && listChannelRender) {
				for (let index = 0; index < listChannelRender.length - 1; index++) {
					if (index === dragIndex + countEmptyCategory) {
						break;
					}

					const current = listChannelRender[index] as ICategoryChannel;
					const next = listChannelRender[index + 1] as ICategoryChannel;

					if (current?.channels !== undefined && next?.channels !== undefined) {
						countEmptyCategory++;
					}
				}
			}

			if (dragIndex - dragItemIndex.current!.indexEnd >= 2 || dragIndex < dragItemIndex.current!.indexEnd) {
				dispatch(
					listChannelRenderAction.sortChannelInCategory({
						categoryId: data[dragIndex].category_id as string,
						clanId: data[dragIndex].clan_id as string,
						indexEnd: dragItemIndex.current!.indexEnd - 1 + countEmptyCategory,
						indexStart: dragIndex - 1 + countEmptyCategory
					})
				);
			}
		},
		[data, isShowEmptyCategory, listChannelRender, dispatch]
	);

	const handleChannelClick = useCallback((e: React.MouseEvent) => {
		if (isDraggingRef.current) {
			e.preventDefault();
			e.stopPropagation();
		}
	}, []);

	return (
		<div
			ref={parentRef}
			style={{
				height: height
			}}
			className={`thread-scroll`}
			onWheelCapture={() => {
				toggleDisableHover(parentRef.current, scrollTimeoutId2);
			}}
		>
			<div
				style={{
					height: virtualizer.getTotalSize(),
					width: '100%',
					position: 'relative'
				}}
			>
				{firstChannelWithBadgeCount && isChannelRefOutOfViewport() && (
					<div className={'sticky top-0 z-10 w-full flex justify-center'}>
						<MentionFloatButton onClick={handleScrollChannelIntoView} />
					</div>
				)}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						transform: `translateY(${items[0]?.start ?? 0}px)`
					}}
					className="channel-wrap"
				>
					{items.map((virtualRow, index) => {
						const item = data[virtualRow.index];
						if (virtualRow.index === 0) {
							return (
								<div key={virtualRow.key} data-index={virtualRow.index} ref={virtualizer.measureElement}>
									<ChannelBannerAndEvents currentClan={currentClan} />
								</div>
							);
						} else if (item.channels) {
							return (
								<div
									style={{ padding: '10px 0 6px' }}
									key={virtualRow.key}
									data-index={virtualRow.index}
									ref={virtualizer.measureElement}
									id={`${item.category_id}-${item.id}`}
									onDragEnter={(e) => handleDragEnter(virtualRow.index, e, `${item.category_id}-${item.id}`)}
									onDragEnd={() => handleDragEnd(virtualRow.index)}
								>
									<CategorizedItem key={item.id} category={item} />
								</div>
							);
						} else {
							if (!(item as IChannel)?.parent_id || (item as IChannel).parent_id === '0') {
								return (
									<div
										key={virtualRow.key}
										data-index={virtualRow.index}
										draggable
										onClick={handleChannelClick}
										onDragStart={(e) => handleDragStart(virtualRow.index, e, `${item.category_id}-${item.id}`)}
										onDragEnter={(e) => handleDragEnter(virtualRow.index, e, `${item.category_id}-${item.id}`)}
										onDragEnd={() => handleDragEnd(virtualRow.index)}
										ref={virtualizer.measureElement}
									>
										<ChannelListItem
											isActive={currentChannelId === (item as IChannel).channel_id && !(item as IChannel).isFavor}
											key={item.id}
											channel={item as ChannelThreads}
											permissions={permissions}
											dragStart={(e) => handleDragStart(virtualRow.index, e, `${item.category_id}-${item.id}`)}
											dragEnter={(e) => handleDragEnter(virtualRow.index, e, `${item.category_id}-${item.id}`)}
										/>
									</div>
								);
							} else {
								return (
									<div key={virtualRow.key} data-index={virtualRow.index} ref={virtualizer.measureElement}>
										<ThreadLinkWrapper
											key={item.id}
											isActive={currentChannelId === item.id}
											thread={item}
											notLastThread={
												(data[virtualRow.index + 1] && (data[virtualRow.index + 1] as IChannel))?.parent_id !== '0' &&
												!(data[virtualRow.index + 1] as ICategoryChannel)?.channels
											}
										/>
									</div>
								);
							}
						}
					})}
				</div>
			</div>
		</div>
	);
});

const ChannelListMem = memo(ChannelList, () => true);

ChannelListMem.displayName = 'ChannelListMem';

export default ChannelListMem;

const ChannelListSkeleton = memo(() => {
	return (
		<div className="px-2 py-1 space-y-3">
			<div className="h-[136px] dark:bg-skeleton-dark bg-skeleton-white rounded-md" />

			<div className="space-y-2 p-2">
				<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded w-20" />
			</div>

			{Array.from({ length: 3 }).map((_, categoryIndex) => (
				<div key={`category-${categoryIndex}`} className="space-y-2">
					<div className="flex items-center justify-between px-2">
						<div className="flex items-center space-x-2">
							<div className="w-3 h-3 dark:bg-skeleton-dark bg-skeleton-white rounded" />
							<div className="h-3 dark:bg-skeleton-dark bg-skeleton-white rounded w-24" />
						</div>
					</div>

					{Array.from({ length: 4 }).map((_, channelIndex) => (
						<div key={`channel-${categoryIndex}-${channelIndex}`} className="flex items-center space-x-3 px-6 py-1">
							<div className="w-4 h-4 dark:bg-skeleton-dark bg-skeleton-white rounded" />
							<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
							<div className="w-5 h-4 dark:bg-skeleton-dark bg-skeleton-white rounded" />
						</div>
					))}
				</div>
			))}

			{Array.from({ length: 2 }).map((_, index) => (
				<div key={`single-channel-${index}`} className="flex items-center space-x-3 px-2 py-1">
					<div className="w-4 h-4 dark:bg-skeleton-dark bg-skeleton-white rounded" />
					<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded" style={{ width: `${50 + Math.random() * 30}%` }} />
				</div>
			))}
		</div>
	);
});
