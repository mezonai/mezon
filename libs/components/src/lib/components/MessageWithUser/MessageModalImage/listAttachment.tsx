import type { AttachmentEntity } from '@mezon/store';
import { formatDateI18n } from '@mezon/utils';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '../../virtual-core/useVirtualizer';
import ItemAttachment from './itemAttachment';

const HORIZONTAL_LIST_MEDIA_QUERY = '(max-width: 479.98px)';
const HORIZONTAL_LIST_HEIGHT = 80;

type ListAttachmentProps = {
	attachments: AttachmentEntity[];
	channelId: string;
	urlImg: string;
	setUrlImg: React.Dispatch<React.SetStateAction<string>>;
	handleDrag: (e: any) => void;
	setScale: React.Dispatch<React.SetStateAction<number>>;
	setPosition: React.Dispatch<
		React.SetStateAction<{
			x: number;
			y: number;
		}>
	>;
	setCurrentIndexAtt: React.Dispatch<React.SetStateAction<number>>;
	currentIndexAtt: number;
	onLoadMore?: (direction: 'before' | 'after') => void;
	isLoading?: boolean;
	hasMoreBefore?: boolean;
	hasMoreAfter?: boolean;
};

const useIsHorizontalList = () => {
	const [isHorizontal, setIsHorizontal] = useState(() => window.matchMedia(HORIZONTAL_LIST_MEDIA_QUERY).matches);

	useEffect(() => {
		const mediaQuery = window.matchMedia(HORIZONTAL_LIST_MEDIA_QUERY);
		const handleChange = (event: MediaQueryListEvent) => setIsHorizontal(event.matches);
		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	return isHorizontal;
};

const ListAttachment = (props: ListAttachmentProps) => {
	const horizontal = useIsHorizontalList();
	return <ListAttachmentContent key={horizontal ? 'horizontal' : 'vertical'} {...props} horizontal={horizontal} />;
};

const ListAttachmentContent = (props: ListAttachmentProps & { horizontal: boolean }) => {
	const {
		attachments,
		channelId,
		urlImg,
		setUrlImg,
		setScale,
		setPosition,
		handleDrag,
		setCurrentIndexAtt,
		currentIndexAtt,
		onLoadMore,
		isLoading = false,
		hasMoreBefore = false,
		hasMoreAfter = false,
		horizontal
	} = props;

	const selectedImageRef = useRef<HTMLDivElement | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const previousScrollSizeRef = useRef<number>(0);
	const previousScrollOffsetRef = useRef<number>(0);
	const isFirstRenderRef = useRef<boolean>(true);
	const previousIndexRef = useRef<number>(currentIndexAtt);
	const previousAttachmentsLengthRef = useRef<number>(attachments.length);
	const lastBeforeTriggerLengthRef = useRef<number>(-1);
	const lastAfterTriggerLengthRef = useRef<number>(-1);

	const scrollSizeKey = horizontal ? 'scrollWidth' : 'scrollHeight';
	const scrollOffsetKey = horizontal ? 'scrollLeft' : 'scrollTop';

	const reversedAttachments = useMemo(() => [...attachments].reverse(), [attachments]);

	const virtualizer = useVirtualizer({
		count: reversedAttachments.length,
		getScrollElement: () => scrollContainerRef.current,
		estimateSize: () => (horizontal ? 72 : 94),
		horizontal,
		overscan: 3
	});

	const virtualItems = virtualizer.getVirtualItems();

	useEffect(() => {
		if (isFirstRenderRef.current) return;

		if (!onLoadMore || isLoadingMore || isLoading) return;

		const virtualItemsList = [...virtualItems];
		if (virtualItemsList.length === 0) return;

		const firstItem = virtualItemsList[0];
		if (firstItem && firstItem.index === 0 && hasMoreBefore) {
			if (lastBeforeTriggerLengthRef.current === reversedAttachments.length) return;
			lastBeforeTriggerLengthRef.current = reversedAttachments.length;
			setIsLoadingMore(true);
			if (scrollContainerRef.current) {
				previousScrollSizeRef.current = scrollContainerRef.current[scrollSizeKey];
				previousScrollOffsetRef.current = scrollContainerRef.current[scrollOffsetKey];
			}
			onLoadMore('before');
			return;
		}

		const lastItem = virtualItemsList[virtualItemsList.length - 1];
		if (lastItem && lastItem.index >= reversedAttachments.length - 1 && hasMoreAfter) {
			if (lastAfterTriggerLengthRef.current === reversedAttachments.length) return;
			lastAfterTriggerLengthRef.current = reversedAttachments.length;
			setIsLoadingMore(true);
			onLoadMore('after');
		}
	}, [virtualItems, hasMoreBefore, hasMoreAfter, onLoadMore, isLoadingMore, isLoading, reversedAttachments.length, scrollSizeKey, scrollOffsetKey]);

	useEffect(() => {
		if (isFirstRenderRef.current && reversedAttachments.length > 0 && currentIndexAtt !== undefined && scrollContainerRef.current) {
			const reversedIndex = attachments.length - 1 - currentIndexAtt;

			if (scrollContainerRef.current && virtualizer) {
				virtualizer.scrollToIndex(reversedIndex, { align: 'center' });
				setTimeout(() => {
					isFirstRenderRef.current = false;
				}, 300);
			}
		}
	}, [reversedAttachments.length, currentIndexAtt, attachments.length, virtualizer]);

	useEffect(() => {
		const indexChanged = previousIndexRef.current !== currentIndexAtt;
		const lengthChanged = previousAttachmentsLengthRef.current !== attachments.length;

		if (!isFirstRenderRef.current && indexChanged && !lengthChanged && currentIndexAtt !== undefined && currentIndexAtt >= 0) {
			const reversedIndex = attachments.length - 1 - currentIndexAtt;
			if (virtualizer && reversedIndex >= 0 && reversedIndex < reversedAttachments.length) {
				virtualizer.scrollToIndex(reversedIndex, { align: 'center', behavior: 'smooth' });
			}
		}

		previousIndexRef.current = currentIndexAtt;
		previousAttachmentsLengthRef.current = attachments.length;
	}, [currentIndexAtt, attachments.length, reversedAttachments.length, virtualizer]);

	useLayoutEffect(() => {
		if (isLoadingMore && !isLoading) {
			if (scrollContainerRef.current && previousScrollSizeRef.current > 0) {
				const newScrollSize = scrollContainerRef.current[scrollSizeKey];
				const sizeDifference = newScrollSize - previousScrollSizeRef.current;

				if (sizeDifference > 0) {
					scrollContainerRef.current[scrollOffsetKey] = previousScrollOffsetRef.current + sizeDifference;
				}

				previousScrollSizeRef.current = 0;
				previousScrollOffsetRef.current = 0;
			}

			setTimeout(() => {
				setIsLoadingMore(false);
			}, 100);
		}
	}, [isLoading, isLoadingMore, scrollSizeKey, scrollOffsetKey]);

	return (
		<div ref={scrollContainerRef} className={horizontal ? 'w-full shrink-0 overflow-x-auto overflow-y-hidden' : 'thread-scroll w-[140px]'}>
			<div
				style={{
					...(horizontal
						? { width: `${virtualizer.getTotalSize()}px`, height: `${HORIZONTAL_LIST_HEIGHT}px` }
						: { height: `${virtualizer.getTotalSize()}px`, width: '100%' }),
					position: 'relative'
				}}
			>
				{hasMoreBefore && (isLoadingMore || isLoading) && (
					<div
						className={`flex items-center justify-center text-white text-xs absolute z-10 ${
							horizontal ? 'px-2 top-0 bottom-0 left-0' : 'py-2 top-0 left-0 right-0'
						}`}
					>
						<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
						Loading
					</div>
				)}

				{virtualItems.map((virtualItem) => {
					const attachment = reversedAttachments[virtualItem.index];
					const originalIndex = attachments.length - 1 - virtualItem.index;

					const currentDate = formatDateI18n(new Date(attachment.create_time || ''), 'en', 'dd/MM/yyyy');
					const nextAttachment = reversedAttachments[virtualItem.index + 1];
					const nextDate = nextAttachment ? formatDateI18n(new Date(nextAttachment.create_time || ''), 'en', 'dd/MM/yyyy') : '';
					const showDate = nextDate !== currentDate;

					return (
						<div
							key={attachment.id}
							data-index={virtualItem.index}
							ref={virtualizer.measureElement}
							className={horizontal ? 'flex items-end px-0.5 pb-1' : undefined}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								...(horizontal
									? { height: '100%', transform: `translateX(${virtualItem.start}px)` }
									: { width: '100%', transform: `translateY(${virtualItem.start}px)` })
							}}
						>
							<ItemAttachment
								key={attachment.id}
								attachment={attachment}
								channelId={channelId}
								previousDate={currentDate}
								selectedImageRef={selectedImageRef}
								showDate={showDate}
								setUrlImg={setUrlImg}
								handleDrag={handleDrag}
								index={originalIndex}
								setCurrentIndexAtt={setCurrentIndexAtt}
								currentIndexAtt={currentIndexAtt}
							/>
						</div>
					);
				})}

				{hasMoreAfter && (isLoadingMore || isLoading) && (
					<div
						className={`flex items-center justify-center text-white text-xs absolute z-10 ${
							horizontal ? 'px-2 top-0 bottom-0 right-0' : 'py-2 bottom-0 left-0 right-0'
						}`}
					>
						<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
						Loading
					</div>
				)}
			</div>
		</div>
	);
};

export default ListAttachment;
