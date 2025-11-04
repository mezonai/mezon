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
import type { AttachmentEntity } from '@mezon/store';
import {
	attachmentActions,
	galleryActions,
	getStore,
	selectCurrentChannelId,
	selectCurrentChannelLabel,
	selectCurrentClanId,
	selectCurrentDM,
	selectGalleryAttachmentsByChannel,
	selectGalleryPaginationByChannel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IImageWindowProps } from '@mezon/utils';
import { ETypeLinkMedia, LoadMoreDirection, convertDateStringI18n, createImgproxyUrl, getAttachmentDataForWindow } from '@mezon/utils';
import { endOfDay, format, getUnixTime, isSameDay, startOfDay } from 'date-fns';
import isElectron from 'is-electron';
import type { RefObject } from 'react';
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
	const { t, i18n } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId) ?? '';
	const currentClanId = useSelector(selectCurrentClanId) ?? '';
	const attachments = useAppSelector((state) => selectGalleryAttachmentsByChannel(state, currentChannelId));
	const paginationState = useAppSelector((state) => selectGalleryPaginationByChannel(state, currentChannelId));

	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
	const [dateValidationError, setDateValidationError] = useState<string | null>(null);

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

			if (target.closest('.react-datepicker') || target.closest('.react-datepicker-popper') || target.closest('[class*="react-datepicker"]')) {
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

	const calculateTimestamps = useCallback((startDate: Date | null, endDate: Date | null) => {
		let startTimestamp: number | undefined;
		let endTimestamp: number | undefined;

		if (startDate && endDate && isSameDay(startDate, endDate)) {
			const dayStart = startOfDay(startDate);
			const dayEnd = endOfDay(startDate);
			startTimestamp = getUnixTime(dayStart);
			endTimestamp = getUnixTime(dayEnd);
		} else {
			if (startDate) {
				const dayStart = startOfDay(startDate);
				startTimestamp = getUnixTime(dayStart);
			}

			if (endDate) {
				const dayEnd = endOfDay(endDate);
				endTimestamp = getUnixTime(dayEnd);
			}
		}

		return { startTimestamp, endTimestamp };
	}, []);

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

				const { startTimestamp, endTimestamp } = calculateTimestamps(startDate, endDate);

				let beforeParam: number | undefined;
				let afterParam: number | undefined;

				if (startDate || endDate) {
					if (direction === 'before') {
						beforeParam = timestampNumber;
						if (startTimestamp && timestampNumber && timestampNumber < startTimestamp) {
							beforeParam = startTimestamp;
						}
					} else {
						afterParam = timestampNumber;
						if (endTimestamp && timestampNumber && timestampNumber > endTimestamp) {
							afterParam = endTimestamp;
						}
					}

					if (startTimestamp && (!afterParam || afterParam < startTimestamp)) {
						afterParam = startTimestamp;
					}
					if (endTimestamp && (!beforeParam || beforeParam > endTimestamp)) {
						beforeParam = endTimestamp;
					}
				} else {
					if (direction === 'before') {
						beforeParam = timestampNumber;
					} else {
						afterParam = timestampNumber;
					}
				}

				await dispatch(
					galleryActions.fetchGalleryAttachments({
						clanId: currentClanId,
						channelId: currentChannelId,
						limit: paginationState.limit,
						direction,
						...(beforeParam && { before: beforeParam }),
						...(afterParam && { after: afterParam })
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
			dispatch,
			calculateTimestamps
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

	const virtualData: VirtualDataItem[] = useMemo(() => {
		if (!attachments || attachments.length === 0) {
			return [];
		}

		const groupedAttachments = attachments.reduce(
			(groups, attachment) => {
				if (!attachment.create_time) return groups;

				const date = new Date(attachment.create_time);
				const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

				if (!groups[dateKey]) {
					groups[dateKey] = {
						date,
						attachments: []
					};
				}

				groups[dateKey].attachments.push(attachment);
				return groups;
			},
			{} as Record<string, { date: Date; attachments: AttachmentEntity[] }>
		);

		const sortedDateGroups = Object.entries(groupedAttachments);

		return sortedDateGroups.flatMap(([dateKey, group]) => {
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
	}, [attachments]);

	const formatDate = useCallback(
		(date: Date) => {
			return convertDateStringI18n(date.toISOString(), t, i18n.language, { dateOnly: true });
		},
		[t, i18n.language]
	);

	const validateDateRange = useCallback(
		(start: Date | null, end: Date | null): string | null => {
			if (!start && !end) return null;
			if (start && !end) return null;
			if (!start && end) return null;

			if (start && end) {
				const startDay = startOfDay(start);
				const endDay = startOfDay(end);

				if (startDay.getTime() > endDay.getTime()) {
					return t('gallery.validation.startDateBeforeEnd');
				}
			}

			return null;
		},
		[t]
	);

	const handleStartDateChange = useCallback(
		(date: Date) => {
			setStartDate(date);
			const error = validateDateRange(date, endDate);
			setDateValidationError(error);
		},
		[endDate, validateDateRange]
	);

	const handleEndDateChange = useCallback(
		(date: Date) => {
			setEndDate(date);
			const error = validateDateRange(startDate, date);
			setDateValidationError(error);
		},
		[startDate, validateDateRange]
	);

	const handleApplyDateFilter = useCallback(() => {
		const validationError = validateDateRange(startDate, endDate);
		if (validationError) {
			setDateValidationError(validationError);
			return;
		}

		if (!currentChannelId || !currentClanId) {
			return;
		}

		const { startTimestamp, endTimestamp } = calculateTimestamps(startDate, endDate);

		dispatch(galleryActions.clearGalleryChannel({ channelId: currentChannelId }));
		dispatch(galleryActions.resetGalleryPagination({ channelId: currentChannelId }));
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

		setDateValidationError(null);
		setIsDateDropdownOpen(false);
	}, [currentChannelId, currentClanId, startDate, endDate, dispatch, validateDateRange, calculateTimestamps]);

	const clearDateFilter = useCallback(() => {
		setStartDate(null);
		setEndDate(null);
		setDateValidationError(null);
		if (currentChannelId && currentClanId) {
			dispatch(galleryActions.resetGalleryPagination({ channelId: currentChannelId }));
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
		if (!startDate && !endDate) return t('gallery.sentDate');

		const formatDateText = (date: Date) => format(date, 'dd/MM/yyyy');

		if (startDate && !endDate) return t('gallery.dateRange.from', { date: formatDateText(startDate) });
		if (!startDate && endDate) return t('gallery.dateRange.to', { date: formatDateText(endDate) });

		if (startDate && endDate) {
			if (isSameDay(startDate, endDate)) {
				return formatDateText(startDate);
			}

			return t('gallery.dateRange.range', {
				startDate: formatDateText(startDate),
				endDate: formatDateText(endDate)
			});
		}

		return t('gallery.sentDate');
	}, [startDate, endDate, t]);

	const handleImageClick = useCallback(
		async (attachment: AttachmentEntity) => {
			const state = getStore()?.getState();
			const currentClanId = selectCurrentClanId(state);
			const currentDm = selectCurrentDM(state);
			const currentChannelId = selectCurrentChannelId(state);
			const currentChannelLabel = selectCurrentChannelLabel(state);
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

				const messageTimestamp = enhancedAttachmentData.create_time
					? Math.floor(new Date(enhancedAttachmentData.create_time).getTime() / 1000)
					: undefined;
				const beforeTimestamp = messageTimestamp ? messageTimestamp + 1 : undefined;

				const data = await dispatch(
					attachmentActions.fetchChannelAttachments({
						clanId,
						channelId,
						limit: 50,
						before: beforeTimestamp
					})
				).unwrap();
				const currentChatUsersEntities = getCurrentChatData()?.currentChatUsersEntities;
				const currentImageUploader = currentChatUsersEntities?.[attachmentData.uploader as string];
				const listAttachmentsByChannel = data?.attachments
					?.filter((att) => att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX))
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
				if (!listAttachmentsByChannel) return;
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
							`${window.location.origin}/assets/images/anonymous-avatar.png`) as string
					},
					realUrl: enhancedAttachmentData.url || '',
					channelImagesData: {
						channelLabel: (currentChannelId ? currentChannelLabel : currentDm.channel_label) as string,
						images: [],
						selectedImageIndex: 0
					}
				});

				if (listAttachmentsByChannel) {
					const imageListWithUploaderInfo = getAttachmentDataForWindow(listAttachmentsByChannel, currentChatUsersEntities);
					const selectedImageIndex = listAttachmentsByChannel.findIndex((image) => image.url === enhancedAttachmentData.url);
					const channelImagesData: IImageWindowProps = {
						channelLabel: (currentChannelId ? currentChannelLabel : currentDm.channel_label) as string,
						images: imageListWithUploaderInfo,
						selectedImageIndex
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
								`${window.location.origin}/assets/images/anonymous-avatar.png`) as string
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
					uploader: enhancedAttachmentData.uploader,
					create_time: enhancedAttachmentData.create_time
				})
			);

			dispatch(attachmentActions.setOpenModalAttachment(true));
			dispatch(attachmentActions.setAttachment(enhancedAttachmentData.url));

			if ((currentClanId && currentChannelId) || currentDmGroupId) {
				const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
				const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentDmGroupId as string);
				const messageTimestamp = enhancedAttachmentData.create_time
					? Math.floor(new Date(enhancedAttachmentData.create_time).getTime() / 1000)
					: undefined;
				const beforeTimestamp = messageTimestamp ? messageTimestamp + 1 : undefined;

				dispatch(
					attachmentActions.fetchChannelAttachments({
						clanId,
						channelId,
						state: undefined,
						limit: 50,
						before: beforeTimestamp
					})
				);
			}
		},
		[dispatch]
	);

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
						<span className="text-base font-semibold cursor-default">{t('gallery.title')}</span>
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
												<label className="block text-xs font-medium text-theme-secondary mb-2">{t('gallery.fromDate')}</label>
												<Suspense fallback={<DatePickerPlaceholder />}>
													<DatePickerWrapper
														className={`w-full bg-theme-surface border rounded px-3 py-2 text-sm text-theme-primary outline-none ${
															dateValidationError ? 'border-red-500' : 'border-theme-primary'
														}`}
														wrapperClassName="w-full"
														selected={startDate || new Date()}
														onChange={handleStartDateChange}
														dateFormat="dd/MM/yyyy"
														minDate={endDate ? undefined : new Date(2020, 0, 1)}
													/>
												</Suspense>
											</div>
											<div>
												<label className="block text-xs font-medium text-theme-secondary mb-2">{t('gallery.toDate')}</label>
												<Suspense fallback={<DatePickerPlaceholder />}>
													<DatePickerWrapper
														className={`w-full bg-theme-surface border rounded px-3 py-2 text-sm text-theme-primary outline-none ${
															dateValidationError ? 'border-red-500' : 'border-theme-primary'
														}`}
														wrapperClassName="w-full"
														selected={endDate || new Date()}
														onChange={handleEndDateChange}
														dateFormat="dd/MM/yyyy"
														minDate={startDate || undefined}
													/>
												</Suspense>
											</div>

											{dateValidationError && (
												<div className="text-red-500 text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded px-2 py-1">
													{dateValidationError}
												</div>
											)}

											<div className="flex justify-between items-center">
												<button
													onClick={clearDateFilter}
													className="text-theme-secondary text-xs focus:outline-none hover:underline"
												>
													{t('gallery.buttons.clearAll')}
												</button>
												<button
													onClick={handleApplyDateFilter}
													disabled={!!dateValidationError}
													className={`px-3 py-1 text-xs rounded transition-colors ${
														dateValidationError
															? 'bg-gray-300 text-gray-500 cursor-not-allowed'
															: 'btn-primary btn-primary-hover text-white'
													}`}
												>
													{t('gallery.buttons.apply')}
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
								{startDate || endDate ? t('gallery.emptyState.noMediaFilesDateRange') : t('gallery.emptyState.noMediaFiles')}
							</p>
							{(startDate || endDate) && (
								<button
									onClick={clearDateFilter}
									className="text-theme-primary hover:text-theme-primary-active text-sm underline mt-2"
								>
									{t('gallery.buttons.clearDateFilter')}
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
							t={t}
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
	t: (key: string, options?: any) => string;
}

interface ImageWithLoadingProps {
	src: string;
	alt: string;
	className?: string;
	onClick?: () => void;
	cacheKey?: string;
	t?: (key: string, options?: any) => string;
}

const ImageWithLoading = React.memo<ImageWithLoadingProps>(
	({ src, alt, className, onClick, cacheKey, t }) => {
		const [isLoading, setIsLoading] = useState(true);
		const [hasError, setHasError] = useState(false);

		useEffect(() => {
			setIsLoading(true);
			setHasError(false);
		}, [src, cacheKey]);

		const handleLoad = () => {
			setIsLoading(false);
		};

		const handleError = () => {
			setIsLoading(false);
			setHasError(true);
		};

		return (
			<div className="aspect-square relative cursor-pointer" onClick={onClick}>
				{isLoading && (
					<div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
						<svg
							className="w-8 h-8 text-gray-400 dark:text-gray-500"
							fill="currentColor"
							viewBox="0 0 20 20"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fillRule="evenodd"
								d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
				)}

				{hasError && (
					<div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
						<div className="text-center">
							<svg
								className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-1"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
							<span className="text-xs text-gray-500">{t?.('gallery.imageError') || 'Error'}</span>
						</div>
					</div>
				)}

				<img
					src={src}
					alt={alt}
					className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
					onLoad={handleLoad}
					onError={handleError}
				/>
			</div>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.cacheKey && nextProps.cacheKey) {
			return prevProps.cacheKey === nextProps.cacheKey;
		}
		return (
			prevProps.src === nextProps.src &&
			prevProps.alt === nextProps.alt &&
			prevProps.className === nextProps.className &&
			prevProps.cacheKey === nextProps.cacheKey &&
			prevProps.t === nextProps.t
		);
	}
);

ImageWithLoading.displayName = 'ImageWithLoading';

const GalleryContent = ({
	virtualData,
	handleImageClick,
	formatDate,
	onLoadMore,
	isLoading = false,
	hasMoreBefore = false,
	hasMoreAfter = false,
	t
}: GalleryContentProps) => {
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const lastVirtualDataLength = useRef<number>(0);

	useEffect(() => {
		lastVirtualDataLength.current = virtualData.length;
	}, [virtualData.length]);

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
			cacheBuster={virtualData.length}
			noScrollRestore={false}
			noScrollRestoreOnTop={false}
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
					{t('gallery.loading.olderImages')}
				</div>
			)}

			<div className="px-4 py-4 space-y-6">
				{virtualData.map((item, _index) => {
					if (item.type === 'dateHeader') {
						return (
							<div key={`${item.dateKey}-header`} className="flex items-center gap-3">
								<h3 className="text-base font-semibold text-theme-primary">{formatDate(item.date)}</h3>
								<div className="flex-1 h-px bg-theme-border"></div>
								<span className="text-xs text-theme-secondary">{t('gallery.filesCount', { count: item.count })}</span>
							</div>
						);
					}

					if (item.type === 'imagesGrid') {
						return (
							<div key={`${item.dateKey}-grid`} className="gallery-item grid grid-cols-3 gap-3">
								{item.attachments.map((attachment: AttachmentEntity, attachmentIndex: number) => {
									const cacheKey = attachment.id || attachment.message_id || `${item.dateKey}-${attachment.url}-${attachmentIndex}`;
									return (
										<ImageWithLoading
											key={cacheKey}
											cacheKey={cacheKey}
											src={createImgproxyUrl(attachment.url || '', { width: 120, height: 120, resizeType: 'fill' })}
											alt={attachment.filename || 'Media'}
											onClick={() => handleImageClick(attachment)}
											t={t}
										/>
									);
								})}
							</div>
						);
					}

					return null;
				})}
			</div>

			{hasMoreAfter && (isLoadingMore || isLoading) && (
				<div className="flex items-center justify-center py-4 text-theme-secondary text-sm">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-theme-primary mr-2"></div>
					{t('gallery.loading.newerImages')}
				</div>
			)}
		</InfiniteScroll>
	);
};
