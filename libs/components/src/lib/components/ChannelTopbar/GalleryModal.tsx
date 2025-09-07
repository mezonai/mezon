import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from '@floating-ui/react';
import { getCurrentChatData, useEscapeKeyClose } from '@mezon/core';
import {
  AttachmentEntity,
  attachmentActions,
  galleryActions,
  getStore,
  selectCurrentChannel,
  selectCurrentChannelId,
  selectCurrentClanId,
  selectCurrentDM,
  selectGalleryAttachmentsByChannel,
  selectGalleryPaginationByChannel,
  useAppDispatch,
  useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ETypeLinkMedia, IImageWindowProps, LoadMoreDirection, createImgproxyUrl, formatGalleryDate, getAttachmentDataForWindow } from '@mezon/utils';
import isElectron from 'is-electron';
import { RefObject, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import InfiniteScroll from './InfiniteScroll';

const DatePickerWrapper = lazy(() => import('../ChannelList/EventChannelModal/ModalCreate/DatePickerWrapper'));

const DatePickerPlaceholder = () => <div className="w-full h-[32px] bg-theme-surface animate-pulse rounded"></div>;

interface DateHeaderItem {
	type: 'dateHeader';
	dateKey: string;
	date: Date;
	count: number;
}

interface ImagesGridItem {
	type: 'imagesGrid';
	dateKey: string;
	attachments: AttachmentEntity[];
}

type VirtualDataItem = DateHeaderItem | ImagesGridItem;

interface GalleryModalProps {
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
}

export function GalleryModal({ onClose, rootRef }: GalleryModalProps) {
	const { i18n } = useTranslation();
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId) ?? '';
	const currentClanId = useSelector(selectCurrentClanId) ?? '';
	const attachments = useAppSelector((state) => selectGalleryAttachmentsByChannel(state, currentChannelId));
	const paginationState = useAppSelector((state) => selectGalleryPaginationByChannel(state, currentChannelId));

	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

	const modalRef = useRef<HTMLDivElement>(null);

	const { refs, floatingStyles, context } = useFloating({
		open: isDateDropdownOpen,
		onOpenChange: setIsDateDropdownOpen,
		middleware: [offset(5), flip(), shift({ padding: 5 })],
		whileElementsMounted: autoUpdate
	});

	const click = useClick(context);
	const dismiss = useDismiss(context, {
		enabled: false
	});
	const role = useRole(context);

	const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

	useEffect(() => {
		if (!isDateDropdownOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element;

			if (target.closest('.react-datepicker') ||
			    target.closest('.react-datepicker-popper') ||
			    target.closest('[class*="react-datepicker"]')) {
				return;
			}

			if (target.closest('[data-floating-dropdown="true"]')) {
				return;
			}

			const referenceElement = refs.reference.current;
			if (referenceElement && 'contains' in referenceElement && referenceElement.contains(target as Node)) {
				return;
			}

			setIsDateDropdownOpen(false);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsDateDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isDateDropdownOpen, refs.floating, refs.reference]);

	useEscapeKeyClose(modalRef, onClose);

	const handleLoadMoreAttachments = useCallback(
		async (direction: 'before' | 'after') => {
			if (paginationState.isLoading || !currentChannelId) {
				return;
			}

			if (direction === 'before' && !paginationState.hasMoreBefore) {
				return;
			}
			if (direction === 'after' && !paginationState.hasMoreAfter) {
				return;
			}

			dispatch(galleryActions.setGalleryLoading({ channelId: currentChannelId, isLoading: true }));

			try {
				const timestamp = direction === 'before' ? attachments?.[attachments.length - 1]?.create_time : attachments?.[0]?.create_time;
				const timestampNumber = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : undefined;

				const startTimestamp = startDate ? Math.floor(startDate.getTime() / 1000) : undefined;
				const endTimestamp = endDate ? Math.floor(endDate.getTime() / 1000) : undefined;

				await dispatch(
					galleryActions.fetchGalleryAttachments({
						clanId: currentClanId,
						channelId: currentChannelId,
						limit: paginationState.limit,
						direction,
						...(direction === 'before' ? { before: timestampNumber } : { after: timestampNumber }),
						...(startTimestamp && { after: startTimestamp }),
						...(endTimestamp && { before: endTimestamp })
					})
				);
			} catch (error) {
				console.error('Error loading more attachments:', error);
				dispatch(galleryActions.setGalleryLoading({ channelId: currentChannelId, isLoading: false }));
			}
		},
		[
			paginationState.isLoading,
			paginationState.limit,
			paginationState.hasMoreBefore,
			paginationState.hasMoreAfter,
			currentChannelId,
			currentClanId,
			attachments,
			startDate,
			endDate,
			dispatch
		]
	);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element;

			if (
				target.closest('[data-floating-dropdown="true"]') ||
				target.closest('.react-datepicker') ||
				target.closest('.react-datepicker-popper')
			) {
				return;
			}

			if (modalRef.current?.contains(target as Node)) {
				return;
			}

			if (rootRef?.current?.contains(target as Node)) {
				return;
			}

			onClose();
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [onClose, rootRef]);

	const groupedAttachments = (attachments || []).reduce(
		(groups, attachment) => {
			if (!attachment.create_time) return groups;

			const date = new Date(attachment.create_time);
			const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

			if (!groups[dateKey]) {
				groups[dateKey] = {
					date: date,
					attachments: []
				};
			}

			groups[dateKey].attachments.push(attachment);
			return groups;
		},
		{} as Record<string, { date: Date; attachments: AttachmentEntity[] }>
	);

	const sortedDateGroups = Object.entries(groupedAttachments);

	const virtualData: VirtualDataItem[] = sortedDateGroups.flatMap(([dateKey, group]) => {
		const items: VirtualDataItem[] = [];
		items.push({
			type: 'dateHeader',
			dateKey,
			date: group.date,
			count: group.attachments.length
		});
		items.push({
			type: 'imagesGrid',
			dateKey,
			attachments: group.attachments
		});
		return items;
	});

	const formatDate = useCallback(
		(date: Date) => {
			return formatGalleryDate(date, i18n.language);
		},
		[i18n.language]
	);

	const handleStartDateChange = useCallback((date: Date) => {
		setStartDate(date);
	}, []);

	const handleEndDateChange = useCallback((date: Date) => {
		setEndDate(date);
	}, []);

	const handleApplyDateFilter = useCallback(() => {
		if (currentChannelId && currentClanId) {
			const startTimestamp = startDate ? Math.floor(startDate.getTime() / 1000) : undefined;
			const endTimestamp = endDate ? Math.floor(new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime() / 1000) : undefined;

			dispatch(galleryActions.clearGalleryChannel({ channelId: currentChannelId }));
			dispatch(
				galleryActions.fetchGalleryAttachments({
					clanId: currentClanId,
					channelId: currentChannelId,
					limit: 50,
					direction: 'initial',
					...(startTimestamp && { after: startTimestamp }),
					...(endTimestamp && { before: endTimestamp })
				})
			);
		}
		setIsDateDropdownOpen(false);
	}, [currentChannelId, currentClanId, startDate, endDate, dispatch]);

	const clearDateFilter = useCallback(() => {
		setStartDate(null);
		setEndDate(null);
		if (currentChannelId && currentClanId) {
			dispatch(
				galleryActions.fetchGalleryAttachments({
					clanId: currentClanId,
					channelId: currentChannelId,
					limit: 50,
					direction: 'initial'
				})
			);
		}
	}, [currentChannelId, currentClanId, dispatch]);

	const getDateRangeText = useCallback(() => {
		if (!startDate && !endDate) return 'Sent Date';
		if (startDate && !endDate) return `From ${startDate.getDate()}/${startDate.getMonth() + 1}`;
		if (!startDate && endDate) return `To ${endDate.getDate()}/${endDate.getMonth() + 1}`;
		if (startDate && endDate) {
			return `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
		}
		return 'Sent Date';
	}, [startDate, endDate]);

	const handleImageClick = useCallback(async (attachment: AttachmentEntity) => {
		const state = getStore()?.getState();
		const currentClanId = selectCurrentClanId(state);
		const currentDm = selectCurrentDM(state);
		const currentChannel = selectCurrentChannel(state);
		const currentChannelId = currentChannel?.id;
		const currentDmGroupId = currentDm?.id;
		const attachmentData = attachment;
		if (!attachmentData) return;
		const enhancedAttachmentData = {
			...attachmentData,
			create_time: attachmentData.create_time || new Date().toISOString()
		};

		if (isElectron()) {
      const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
      const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentDmGroupId as string);

        const messageTimestamp = enhancedAttachmentData.create_time ? Math.floor(new Date(enhancedAttachmentData.create_time).getTime() / 1000) : undefined;
        const beforeTimestamp = messageTimestamp ? messageTimestamp + 1 : undefined;

       const data = await dispatch(attachmentActions.fetchChannelAttachments({
          clanId,
          channelId,
          limit: 50,
          before: beforeTimestamp
          })
        ).unwrap();
        const currentChatUsersEntities = getCurrentChatData()?.currentChatUsersEntities;
        const currentImageUploader = currentChatUsersEntities?.[attachmentData.uploader as string];
        const listAttachmentsByChannel = data?.attachments?.filter((att) => att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX))
        .map((attachmentRes) => ({
          ...attachmentRes,
          id: attachmentRes.id || '',
          channelId,
          clanId
        }))
        .sort((a, b) => {
          if (a.create_time && b.create_time) {
            return Date.parse(b.create_time) - Date.parse(a.create_time);
          }
          return 0;
        });
         if(!listAttachmentsByChannel) return;
          window.electron.openImageWindow({
            ...enhancedAttachmentData,
            url: createImgproxyUrl(enhancedAttachmentData.url || '', {
              width: enhancedAttachmentData.width ? (enhancedAttachmentData.width > 1600 ? 1600 : enhancedAttachmentData.width) : 0,
              height: enhancedAttachmentData.height ? (enhancedAttachmentData.height > 900 ? 900 : enhancedAttachmentData.height) : 0,
              resizeType: 'fit'
            }),
            uploaderData: {
              name:
                currentImageUploader?.clan_nick ||
                currentImageUploader?.user?.display_name ||
                currentImageUploader?.user?.username ||
                'Anonymous',
              avatar: (currentImageUploader?.clan_avatar ||
                currentImageUploader?.user?.avatar_url ||
                window.location.origin + '/assets/images/anonymous-avatar.png') as string
            },
            realUrl: enhancedAttachmentData.url || '',
            channelImagesData: {
              channelLabel: (currentChannelId ? currentChannel?.channel_label : currentDm.channel_label) as string,
              images: [],
              selectedImageIndex: 0
            }
          });

          if (listAttachmentsByChannel) {
            const imageListWithUploaderInfo = getAttachmentDataForWindow(listAttachmentsByChannel, currentChatUsersEntities);
            const selectedImageIndex = listAttachmentsByChannel.findIndex((image) => image.url === enhancedAttachmentData.url);
            const channelImagesData: IImageWindowProps = {
              channelLabel: (currentChannelId ? currentChannel?.channel_label : currentDm.channel_label) as string,
              images: imageListWithUploaderInfo,
              selectedImageIndex: selectedImageIndex
            };

            window.electron.openImageWindow({
              ...enhancedAttachmentData,
              url: createImgproxyUrl(enhancedAttachmentData.url || '', {
                width: enhancedAttachmentData.width ? (enhancedAttachmentData.width > 1600 ? 1600 : enhancedAttachmentData.width) : 0,
                height: enhancedAttachmentData.height
                  ? (enhancedAttachmentData.width || 0) > 1600
                    ? Math.round((1600 * enhancedAttachmentData.height) / (enhancedAttachmentData.width || 1))
                    : enhancedAttachmentData.height
                  : 0,
                resizeType: 'fill'
              }),
              uploaderData: {
                name:
                  currentImageUploader?.clan_nick ||
                  currentImageUploader?.user?.display_name ||
                  currentImageUploader?.user?.username ||
                  'Anonymous',
                avatar: (currentImageUploader?.clan_avatar ||
                  currentImageUploader?.user?.avatar_url ||
                  window.location.origin + '/assets/images/anonymous-avatar.png') as string
              },
              realUrl: enhancedAttachmentData.url || '',
              channelImagesData
            });
            return;
          }

		}

		dispatch(
			attachmentActions.setCurrentAttachment({
				id: enhancedAttachmentData.message_id as string,
				uploader: enhancedAttachmentData.uploader ,
				create_time: enhancedAttachmentData.create_time
			})
		);

		dispatch(attachmentActions.setOpenModalAttachment(true));
		dispatch(attachmentActions.setAttachment(enhancedAttachmentData.url));

		if ((currentClanId && currentChannelId) || currentDmGroupId) {
			const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
			const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentDmGroupId as string);
			const messageTimestamp = enhancedAttachmentData.create_time ? Math.floor(new Date(enhancedAttachmentData.create_time).getTime() / 1000) : undefined;
			const beforeTimestamp = messageTimestamp ? messageTimestamp + 1 : undefined;

			dispatch(attachmentActions.fetchChannelAttachments({
				clanId,
				channelId,
				state: undefined,
				limit: 50,
				before: beforeTimestamp
			}));
		}

	}, []);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 right-0 rounded-md dark:shadow-shadowBorder shadow-shadowInbox z-[9999] origin-top-right"
		>
			<div className="flex bg-theme-setting-primary flex-col rounded-md min-h-[400px] md:w-[480px] max-h-[80vh] lg:w-[540px] shadow-sm overflow-hidden">
				<div className="bg-theme-setting-nav flex flex-row items-center justify-between p-[16px] h-12">
					<div className="flex flex-row items-center border-r-[1px] border-color-theme pr-[16px] gap-4">
						<Icons.ImageThumbnail defaultSize="w-4 h-4" />
						<span className="text-base font-semibold cursor-default">Gallery</span>
					</div>
					<div className="flex-1 max-w-md mx-4">
						<button
							ref={refs.setReference}
							{...getReferenceProps()}
							className="flex items-center gap-2 px-3 py-1.5 bg-theme-surface text-sm text-theme-primary hover:bg-theme-surface-hover transition-colors focus:outline-none"
						>
							<span>{getDateRangeText()}</span>
							<Icons.ArrowDown className={`w-3 h-3 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
						</button>

						{isDateDropdownOpen && (
							<FloatingPortal>
								<FloatingFocusManager context={context} modal={false}>
									<div
										ref={refs.setFloating}
										style={floatingStyles}
										{...getFloatingProps()}
										className="bg-theme-surface rounded-lg shadow-lg z-[10000] p-4 border border-theme-border min-w-[300px]"
										data-floating-dropdown="true"
									>
										<div className="space-y-4">
											<div>
												<label className="block text-xs font-medium text-theme-secondary mb-2">From Date</label>
												<Suspense fallback={<DatePickerPlaceholder />}>
													<DatePickerWrapper
														className="w-full bg-theme-surface border border-theme-primary rounded px-3 py-2 text-sm text-theme-primary outline-none"
														wrapperClassName="w-full"
														selected={startDate || new Date()}
														onChange={handleStartDateChange}
														dateFormat="dd/MM/yyyy"
													/>
												</Suspense>
											</div>
											<div>
												<label className="block text-xs font-medium text-theme-secondary mb-2">To Date</label>
												<Suspense fallback={<DatePickerPlaceholder />}>
													<DatePickerWrapper
														className="w-full bg-theme-surface border border-theme-primary rounded px-3 py-2 text-sm text-theme-primary outline-none"
														wrapperClassName="w-full"
														selected={endDate || new Date()}
														onChange={handleEndDateChange}
														dateFormat="dd/MM/yyyy"
													/>
												</Suspense>
											</div>
											<div className="flex justify-between items-center">
												<button
													onClick={clearDateFilter}
													className="text-theme-secondary text-xs focus:outline-none hover:underline"
												>
													Clear all
												</button>
												<button
													onClick={handleApplyDateFilter}
													className="btn-primary btn-primary-hover text-white px-3 py-1 text-xs rounded"
												>
													Apply
												</button>
											</div>
										</div>
									</div>
								</FloatingFocusManager>
							</FloatingPortal>
						)}
					</div>
					<div className="flex flex-row items-center gap-4 text-theme-primary-hover">
						<button onClick={onClose}>
							<Icons.Close defaultSize="w-4 h-4" />
						</button>
					</div>
				</div>

				<div className="flex flex-col gap-4 py-4 px-[16px] min-h-full flex-1 overflow-hidden">
					{virtualData.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-64 text-center">
							<Icons.ImageThumbnail defaultSize="w-12 h-12" className="text-theme-secondary opacity-50 mb-4" />
							<p className="text-theme-secondary text-sm">
								{startDate || endDate ? 'No media files found for the selected date range' : 'No media files found'}
							</p>
							{(startDate || endDate) && (
								<button
									onClick={clearDateFilter}
									className="text-theme-primary hover:text-theme-primary-active text-sm underline mt-2"
								>
									Clear date filter
								</button>
							)}
						</div>
					) : (
						<GalleryContent
							virtualData={virtualData}
							handleImageClick={handleImageClick}
							formatDate={formatDate}
							onLoadMore={handleLoadMoreAttachments}
							isLoading={paginationState.isLoading}
							hasMoreBefore={paginationState.hasMoreBefore}
							hasMoreAfter={paginationState.hasMoreAfter}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

interface GalleryContentProps {
	virtualData: VirtualDataItem[];
	handleImageClick: (attachment: AttachmentEntity) => void;
	formatDate: (date: Date) => string;
	onLoadMore?: (direction: 'before' | 'after') => void;
	isLoading?: boolean;
	hasMoreBefore?: boolean;
	hasMoreAfter?: boolean;
}

const GalleryContent = ({
	virtualData,
	handleImageClick,
	formatDate,
	onLoadMore,
	isLoading = false,
	hasMoreBefore = false,
	hasMoreAfter = false
}: GalleryContentProps) => {
	const [isLoadingMore, setIsLoadingMore] = useState(false);



	useEffect(() => {
		if (isLoadingMore && !isLoading) {
			setIsLoadingMore(false);
		}
	}, [isLoading, isLoadingMore]);



	return (
		<InfiniteScroll
			className="h-full overflow-y-auto thread-scroll"
			items={virtualData}
      itemSelector=".gallery-item"
			onLoadMore={({ direction }) => {
				if (isLoadingMore || isLoading) {
					return;
				}
				if (!onLoadMore) return;
				setIsLoadingMore(true);
				onLoadMore(direction === LoadMoreDirection.Backwards ? 'before' : 'after');
			}}
		>
			{hasMoreBefore && (isLoadingMore || isLoading) && (
				<div className="flex items-center justify-center py-4 text-theme-secondary text-sm">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-theme-primary mr-2"></div>
					Loading older images...
				</div>
			)}

			<div className="px-4 py-4 space-y-6">
				{virtualData.map((item, index) => {
					if (item.type === 'dateHeader') {
						return (
							<div key={`${item.dateKey}-header`} className="flex items-center gap-3">
								<h3 className="text-base font-semibold text-theme-primary">{formatDate(item.date)}</h3>
								<div className="flex-1 h-px bg-theme-border"></div>
								<span className="text-xs text-theme-secondary">{item.count} files</span>
							</div>
						);
					}

					if (item.type === 'imagesGrid') {
						return (
							<div key={`${item.dateKey}-grid`} className="gallery-item grid grid-cols-3 gap-3">
								{item.attachments.map((attachment: AttachmentEntity, attachmentIndex: number) => (
									<div
										key={attachment.url || `${item.dateKey}-${attachmentIndex}`}
										className="aspect-square relative group cursor-pointer rounded-lg overflow-hidden border border-theme-border hover:border-theme-primary transition-all duration-200 hover:shadow-lg"
										onClick={() => handleImageClick(attachment)}
									>
										<div className="absolute inset-0 bg-gray-300 dark:bg-gray-600"></div>
										<img
											src={createImgproxyUrl(attachment.url || '', { width: 120, height: 120, resizeType: 'fill' })}
											alt={attachment.filename || 'Media'}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 relative z-10"
										/>
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 z-20" />
										<div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
											<p className="text-white text-xs truncate">{attachment.filename || 'Image'}</p>
										</div>
									</div>
								))}
							</div>
						);
					}

					return null;
				})}
			</div>

			{hasMoreAfter && (isLoadingMore || isLoading) && (
				<div className="flex items-center justify-center py-4 text-theme-secondary text-sm">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-theme-primary mr-2"></div>
					Loading newer images...
				</div>
			)}
		</InfiniteScroll>
	);
};
