import { useEffect, useMemo, useState } from 'react';

export const useSfuGridLayout = (containerRef: React.RefObject<HTMLElement>, totalItems: number) => {
	const [layout, setLayout] = useState({ columns: 1, rows: 1, maxTiles: 0 });

	useEffect(() => {
		const element = containerRef.current;
		if (!element) return;

		const updateLayout = () => {
			const gap = 12;
			const minimumTileWidth = 240;
			const minimumTileHeight = 135;
			const maximumTilesPerPage = 12;
			const width = element.clientWidth - 32;
			const height = element.clientHeight - 80;
			if (width <= 0 || height <= 0) return;

			const count = Math.max(1, totalItems);
			const maximumColumns = Math.min(4, count);
			let bestLayout = { columns: 1, rows: 1, maxTiles: 1, tileArea: 0 };

			for (let columns = 1; columns <= maximumColumns; columns++) {
				const tileWidth = (width - gap * (columns - 1)) / columns;
				if (columns > 1 && tileWidth < minimumTileWidth) continue;
				const maximumRows = Math.min(
					Math.ceil(count / columns),
					Math.ceil(maximumTilesPerPage / columns),
					Math.max(1, Math.floor((height + gap) / (minimumTileHeight + gap)))
				);
				for (let rows = 1; rows <= maximumRows; rows++) {
					const tileHeight = (height - gap * (rows - 1)) / rows;
					if (rows > 1 && tileHeight < minimumTileHeight) continue;
					const maxTiles = Math.min(count, columns * rows);
					const videoWidth = Math.min(tileWidth, tileHeight * (16 / 9));
					const videoHeight = Math.min(tileHeight, tileWidth * (9 / 16));
					const tileArea = videoWidth * videoHeight;
					if (maxTiles > bestLayout.maxTiles || (maxTiles === bestLayout.maxTiles && tileArea > bestLayout.tileArea)) {
						bestLayout = { columns, rows, maxTiles, tileArea };
					}
				}
			}
			setLayout({ columns: bestLayout.columns, rows: bestLayout.rows, maxTiles: bestLayout.maxTiles });
		};

		updateLayout();
		const observer = new ResizeObserver(updateLayout);
		observer.observe(element);
		return () => observer.disconnect();
	}, [containerRef, totalItems]);

	return layout;
};

export const useSfuPagination = <T>(maxTiles: number, items: T[]) => {
	const [currentPage, setCurrentPage] = useState(1);
	const safeMaxTiles = Math.max(1, maxTiles);
	const totalPageCount = Math.max(1, Math.ceil(items.length / safeMaxTiles));
	const safePage = Math.min(currentPage, totalPageCount);
	const pageItems = useMemo(() => {
		const start = (safePage - 1) * safeMaxTiles;
		return items.slice(start, start + safeMaxTiles);
	}, [items, safePage, safeMaxTiles]);

	return {
		currentPage: safePage,
		totalPageCount,
		pageItems,
		nextPage: () => setCurrentPage((page) => Math.min(totalPageCount, page + 1)),
		prevPage: () => setCurrentPage((page) => Math.max(1, page - 1)),
		setPage: (page: number) => setCurrentPage(Math.min(totalPageCount, Math.max(1, page)))
	};
};
