import { createInteractingObservable, type TrackReferenceOrPlaceholder } from '@livekit/components-core';
import type { UseParticipantsOptions } from '@livekit/components-react';
import { TrackLoop, useGridLayout, usePagination, useSwipe } from '@livekit/components-react';
import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';
import { createRef, forwardRef, useEffect, useState } from 'react';

export interface GridLayoutProps extends HTMLAttributes<HTMLDivElement>, Pick<UseParticipantsOptions, 'updateOnlyOn'> {
	children: ReactNode;
	tracks: TrackReferenceOrPlaceholder[];
	isExternalCalling?: boolean;
}

export function GridLayout({ tracks, isExternalCalling, ...props }: GridLayoutProps) {
	const gridEl = createRef<HTMLDivElement>();
	const { layout } = useGridLayout(gridEl, tracks.length);
	const pagination = usePagination(layout.maxTiles, tracks);

	const [interactive, setInteractive] = useState(false);

	useEffect(() => {
		let subscription: ReturnType<ReturnType<typeof createInteractingObservable>['subscribe']> | undefined;
		if (gridEl.current) {
			subscription = createInteractingObservable(gridEl.current, 2000).subscribe(setInteractive);
		}
		return () => {
			subscription?.unsubscribe();
		};
	}, [gridEl]);

	useEffect(() => {
		const handleScroll = (event: WheelEvent) => {
			if (event.deltaY > 0 && pagination.currentPage < pagination.totalPageCount) {
				pagination.nextPage();
			} else if (event.deltaY < 0 && pagination.currentPage > 1) {
				pagination.prevPage();
			}
		};

		const container = gridEl.current;
		if (container) {
			container.addEventListener('wheel', handleScroll);
		}

		return () => {
			container?.removeEventListener('wheel', handleScroll);
		};
	}, [pagination, gridEl]);

	useSwipe(gridEl, {
		onLeftSwipe: pagination.nextPage,
		onRightSwipe: pagination.prevPage
	});

	return (
		<div
			ref={gridEl}
			data-lk-pagination={pagination.totalPageCount > 1}
			className={`lk-grid-layout  ${isExternalCalling && '[&>*]:aspect-[16/9] gap-6 p-12 w-auto'}`}
			data-lk-user-interaction={interactive}
		>
			{tracks.length > layout.maxTiles && (
				<PaginationIndicator totalPageCount={pagination.totalPageCount} currentPage={pagination.currentPage} />
			)}
			<TrackLoop tracks={pagination.tracks}>{props.children}</TrackLoop>
			{Array.from({ length: Math.max(0, layout.maxTiles - pagination.tracks.length) }).map((_, index) => (
				<div key={`placeholder-${index}`} />
			))}
		</div>
	);
}

interface PaginationIndicatorProps {
	totalPageCount: number;
	currentPage: number;
}

const PaginationIndicator: (props: PaginationIndicatorProps & RefAttributes<HTMLDivElement>) => ReactNode = forwardRef<
	HTMLDivElement,
	PaginationIndicatorProps
>(function PaginationIndicator({ totalPageCount, currentPage }: PaginationIndicatorProps, ref) {
	const bubbles = new Array(totalPageCount).fill('').map((_, index) => {
		if (index + 1 === currentPage) {
			return <span data-lk-active key={index} />;
		} else {
			return <span key={index} />;
		}
	});

	return (
		<div ref={ref} className="lk-pagination-indicator !bottom-[68px]">
			{bubbles}
		</div>
	);
});
