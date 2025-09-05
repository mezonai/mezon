import { getCurrentChatData, useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import {
  AttachmentEntity,
  attachmentActions,
  selectAllListAttachmentByChannel,
  selectCurrentChannel,
  selectCurrentChannelId,
  selectCurrentClanId,
  selectCurrentDM,
  useAppDispatch,
  useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IImageWindowProps, createImgproxyUrl, getAttachmentDataForWindow } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode } from 'mezon-js';
import { RefObject, Suspense, lazy, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useVirtualizer } from '../virtual-core/useVirtualizer';

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
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDM = useSelector(selectCurrentDM);
	const attachments = useAppSelector((state) => selectAllListAttachmentByChannel(state, currentChannelId));

	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

	const modalRef = useRef<HTMLDivElement>(null);

	useEscapeKeyClose(modalRef, onClose);
	useOnClickOutside(modalRef, onClose, rootRef);

	const filteredAttachments =
		attachments?.filter((attachment) => {
			if (!attachment.create_time) return true;

			const attachmentDate = new Date(attachment.create_time);

			if (startDate && attachmentDate < startDate) {
				return false;
			}

			if (endDate) {
				const endOfDay = new Date(endDate);
				endOfDay.setHours(23, 59, 59, 999);
				if (attachmentDate > endOfDay) {
					return false;
				}
			}

			return true;
		}) || [];

	const groupedAttachments = filteredAttachments.reduce(
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

	const sortedDateGroups = Object.entries(groupedAttachments).sort(([, a], [, b]) => b.date.getTime() - a.date.getTime());

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
			const currentLanguage = i18n.language;

			if (currentLanguage === 'vi') {
				const months = [
					'Tháng 1',
					'Tháng 2',
					'Tháng 3',
					'Tháng 4',
					'Tháng 5',
					'Tháng 6',
					'Tháng 7',
					'Tháng 8',
					'Tháng 9',
					'Tháng 10',
					'Tháng 11',
					'Tháng 12'
				];
				return `Ngày ${date.getDate()} ${months[date.getMonth()]}`;
			} else {
				const months = [
					'January',
					'February',
					'March',
					'April',
					'May',
					'June',
					'July',
					'August',
					'September',
					'October',
					'November',
					'December'
				];
				const day = date.getDate();
				const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
				return `${months[date.getMonth()]} ${day}${suffix}`;
			}
		},
		[i18n.language]
	);

	const handleStartDateChange = useCallback((date: Date) => {
		setStartDate(date);
	}, []);

	const handleEndDateChange = useCallback((date: Date) => {
		setEndDate(date);
	}, []);

	const clearDateFilter = useCallback(() => {
		setStartDate(null);
		setEndDate(null);
	}, []);

	const toggleDateDropdown = useCallback(() => {
		setIsDateDropdownOpen(!isDateDropdownOpen);
	}, [isDateDropdownOpen]);

	const getDateRangeText = useCallback(() => {
		if (!startDate && !endDate) return 'Sent Date';
		if (startDate && !endDate) return `From ${startDate.getDate()}/${startDate.getMonth() + 1}`;
		if (!startDate && endDate) return `To ${endDate.getDate()}/${endDate.getMonth() + 1}`;
		if (startDate && endDate) {
			return `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
		}
		return 'Sent Date';
	}, [startDate, endDate]);

	const handleImageClick = useCallback(
		(attachment: AttachmentEntity) => {
			const enhancedAttachmentData = {
				...attachment,
				create_time: attachment.create_time || new Date().toISOString()
			};

			if (isElectron()) {
				const currentChatUsersEntities = getCurrentChatData()?.currentChatUsersEntities;
				const listAttachmentsByChannel = attachments;

				const currentImageUploader = currentChatUsersEntities?.[(attachment as any).sender_id as string];

				if (listAttachmentsByChannel) {
					const imageListWithUploaderInfo = getAttachmentDataForWindow(listAttachmentsByChannel, currentChatUsersEntities);
					const selectedImageIndex = listAttachmentsByChannel.findIndex((image) => image.url === enhancedAttachmentData.url);
					const channelImagesData: IImageWindowProps = {
						channelLabel: (currentChannelId ? currentChannel?.channel_label : currentDM?.channel_label) as string,
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
			} else {
				dispatch(
					attachmentActions.setCurrentAttachment({
						id: enhancedAttachmentData.message_id as string,
						uploader: (enhancedAttachmentData as any).sender_id,
						create_time: enhancedAttachmentData.create_time
					})
				);

				dispatch(attachmentActions.setOpenModalAttachment(true));
				dispatch(attachmentActions.setAttachment(enhancedAttachmentData.url));
				dispatch(attachmentActions.setMode(ChannelStreamMode.STREAM_MODE_CHANNEL));

				if (currentClanId && currentChannelId) {
					const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
					const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentChannelId as string);
					dispatch(attachmentActions.fetchChannelAttachments({ clanId, channelId }));
				}
			}
		},
		[dispatch, attachments, currentChannelId, currentClanId, currentChannel, currentDM]
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
						<span className="text-base font-semibold cursor-default">Gallery</span>
					</div>
					<div className="relative flex-1 max-w-md mx-4">
						<button
							onClick={toggleDateDropdown}
							className="flex items-center gap-2 px-3 py-1.5 bg-theme-surface text-sm text-theme-primary hover:bg-theme-surface-hover transition-colors"
						>
							<span>{getDateRangeText()}</span>
							<Icons.ArrowDown className={`w-3 h-3 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
						</button>

						{isDateDropdownOpen && (
							<div className="absolute top-full mt-1 left-0 right-0 bg-theme-surface rounded-lg shadow-lg z-10 p-4">
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
										<button onClick={clearDateFilter} className="text-theme-secondary hover:text-theme-primary text-xs underline">
											Clear all
										</button>
										<button
											onClick={toggleDateDropdown}
											className="px-3 py-1 bg-theme-primary text-white text-xs rounded hover:bg-theme-primary-active"
										>
											Apply
										</button>
									</div>
								</div>
							</div>
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
						<VirtualizedGalleryContent virtualData={virtualData} handleImageClick={handleImageClick} formatDate={formatDate} />
					)}
				</div>
			</div>
		</div>
	);
}

interface VirtualizedGalleryContentProps {
	virtualData: VirtualDataItem[];
	handleImageClick: (attachment: AttachmentEntity) => void;
	formatDate: (date: Date) => string;
}

const VirtualizedGalleryContent = ({ virtualData, handleImageClick, formatDate }: VirtualizedGalleryContentProps) => {
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: virtualData.length,
		getScrollElement: () => parentRef.current,
		estimateSize: (index) => {
			const item = virtualData[index];
			if (item.type === 'dateHeader') return 40;
			if (item.type === 'imagesGrid') {
				const numRows = Math.ceil(item.attachments.length / 3);
				return numRows * 120 + (numRows - 1) * 12;
			}
			return 36;
		}
	});

	const items = virtualizer.getVirtualItems();

	return (
		<div ref={parentRef} className="h-full overflow-y-auto thread-scroll">
			<div
				style={{
					height: virtualizer.getTotalSize(),
					width: '100%',
					position: 'relative'
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						transform: `translateY(${items[0]?.start ?? 0}px)`
					}}
				>
					{items.map((virtualRow) => {
						const item = virtualData[virtualRow.index];

						if (item.type === 'dateHeader') {
							return (
								<div
									key={virtualRow.key}
									data-index={virtualRow.index}
									ref={virtualizer.measureElement}
									className="flex items-center gap-3 mb-3"
								>
									<h3 className="text-base font-semibold text-theme-primary">{formatDate(item.date)}</h3>
									<div className="flex-1 h-px bg-theme-border"></div>
									<span className="text-xs text-theme-secondary">{item.count} files</span>
								</div>
							);
						}

						if (item.type === 'imagesGrid') {
							return (
								<div
									key={virtualRow.key}
									data-index={virtualRow.index}
									ref={virtualizer.measureElement}
									className="grid grid-cols-3 gap-3 mb-6"
								>
									{item.attachments.map((attachment: AttachmentEntity, index: number) => (
										<div
											key={attachment.url || `${item.dateKey}-${index}`}
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
			</div>
		</div>
	);
};
