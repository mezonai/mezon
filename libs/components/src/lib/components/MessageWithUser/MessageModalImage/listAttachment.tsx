/* eslint-disable prettier/prettier */
import type { AttachmentEntity } from '@mezon/store';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '../../virtual-core/useVirtualizer';
import ItemAttachment from './itemAttachment';

type ListAttachmentProps = {
	attachments: AttachmentEntity[];
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

const ListAttachment = (props: ListAttachmentProps) => {
	const {
		attachments,
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
		hasMoreAfter = false
	} = props;

	const selectedImageRef = useRef<HTMLDivElement | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const previousScrollHeightRef = useRef<number>(0);
	const previousScrollTopRef = useRef<number>(0);
	const isFirstRenderRef = useRef<boolean>(true);

	const reversedAttachments = useMemo(() => [...attachments].reverse(), [attachments]);

	const virtualizer = useVirtualizer({
		count: reversedAttachments.length,
		getScrollElement: () => scrollContainerRef.current,
		estimateSize: () => 88,
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
			setIsLoadingMore(true);
			if (scrollContainerRef.current) {
				previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
				previousScrollTopRef.current = scrollContainerRef.current.scrollTop;
			}
			onLoadMore('before');
			return;
		}

		const lastItem = virtualItemsList[virtualItemsList.length - 1];
		if (lastItem && lastItem.index >= reversedAttachments.length - 1 && hasMoreAfter) {
			setIsLoadingMore(true);
			onLoadMore('after');
		}
	}, [virtualItems, hasMoreBefore, hasMoreAfter, onLoadMore, isLoadingMore, isLoading, reversedAttachments.length]);

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

	useLayoutEffect(() => {
		if (isLoadingMore && !isLoading) {
			if (scrollContainerRef.current && previousScrollHeightRef.current > 0) {
				const newScrollHeight = scrollContainerRef.current.scrollHeight;
				const heightDifference = newScrollHeight - previousScrollHeightRef.current;

				if (heightDifference > 0) {
					scrollContainerRef.current.scrollTop = previousScrollTopRef.current + heightDifference;
				}

				previousScrollHeightRef.current = 0;
				previousScrollTopRef.current = 0;
			}

			setTimeout(() => {
				setIsLoadingMore(false);
			}, 100);
		}
	}, [isLoading, isLoadingMore]);

	return (
		<div ref={scrollContainerRef} style={{ width: 100 }} className="thread-scroll">
			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative'
				}}
			>
				{hasMoreBefore && (isLoadingMore || isLoading) && (
					<div className="flex items-center justify-center py-2 text-white text-xs absolute top-0 left-0 right-0 z-10">
						<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
						Loading
					</div>
				)}

				{virtualItems.map((virtualItem) => {
					const attachment = reversedAttachments[virtualItem.index];
					const originalIndex = attachments.length - 1 - virtualItem.index;

					const currentDate = new Date(attachment.create_time || '').toLocaleDateString();
					const nextAttachment = reversedAttachments[virtualItem.index + 1];
					const nextDate = nextAttachment ? new Date(nextAttachment.create_time || '').toLocaleDateString() : '';
					const showDate = nextDate !== currentDate;

					return (
						<div
							key={attachment.id}
							data-index={virtualItem.index}
							ref={virtualizer.measureElement}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								transform: `translateY(${virtualItem.start}px)`
							}}
						>
							<ItemAttachment
								key={attachment.id}
								attachment={attachment}
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
					<div className="flex items-center justify-center py-2 text-white text-xs absolute bottom-0 left-0 right-0 z-10">
						<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
						Loading
					</div>
				)}
			</div>
		</div>
	);
};

export default ListAttachment;
