import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { getScrollBarWidth } from '@livekit/components-core';
import { TrackLoop, useVisualStableUpdate } from '@livekit/components-react';
import { useWindowSize } from '@mezon/utils';
import type { HTMLAttributes, ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_WIDTH = 140;
const MIN_VISIBLE_TILES = 1;
const ASPECT_RATIO = 16 / 10;
export interface CarouselLayoutProps extends HTMLAttributes<HTMLMediaElement> {
	tracks: TrackReferenceOrPlaceholder[];
	children: ReactNode;
}

export function CarouselLayout({ tracks, ...props }: CarouselLayoutProps) {
	const asideEl = useRef<HTMLDivElement>(null);
	const [prevTiles, setPrevTiles] = useState(0);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	const updateDimensions = () => {
		if (asideEl.current) {
			setDimensions({
				width: asideEl.current.offsetWidth,
				height: asideEl.current.offsetHeight
			});
		}
	};

	useEffect(() => {
		updateDimensions();
	}, []);

	useWindowSize(() => {
		updateDimensions();
	});

	const { width, height } = dimensions;

	const scrollBarWidth = getScrollBarWidth();

	const tilesThatFit = Math.max((width - scrollBarWidth) / Math.max(height * ASPECT_RATIO, MIN_WIDTH), MIN_VISIBLE_TILES);

	let maxVisibleTiles = Math.round(tilesThatFit);
	if (Math.abs(tilesThatFit - prevTiles) < 0.5) {
		maxVisibleTiles = Math.round(prevTiles);
	} else if (prevTiles !== tilesThatFit) {
		setPrevTiles(tilesThatFit);
	}

	const sortedTiles = useVisualStableUpdate(tracks, maxVisibleTiles);

	useLayoutEffect(() => {
		if (asideEl.current) {
			asideEl.current.style.setProperty('--lk-max-visible-tiles', maxVisibleTiles.toString());
			updateDimensions();
		}
	}, [maxVisibleTiles]);

	const handleWheelScroll = (event: React.WheelEvent<HTMLElement>) => {
		if (asideEl.current) {
			event.stopPropagation();
			asideEl.current.scrollLeft += event.deltaY;
		}
	};

	const justifyClass = width === 0 || height === 0 ? '!justify-center' : tracks.length <= maxVisibleTiles ? '!justify-center' : '!justify-start';

	return (
		<aside className={`lk-carousel pb-1 cursor-pointer ${justifyClass} !overflow-x-auto`} ref={asideEl} onWheel={handleWheelScroll} {...props}>
			<style>
				{`
        .lk-carousel::-webkit-scrollbar {
          	height: 6px;
        }
        .lk-carousel::-webkit-scrollbar-thumb {
          	background-color: #6d6f77;
          	border-radius: 4px;
        }
        .lk-carousel::-webkit-scrollbar-track {
          	background: transparent;
        }
      `}
			</style>
			<TrackLoop tracks={sortedTiles}>{props.children}</TrackLoop>
		</aside>
	);
}
