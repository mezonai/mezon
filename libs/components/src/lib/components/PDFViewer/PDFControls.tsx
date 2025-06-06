import { Icons } from '@mezon/ui';
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon } from './icons';
import type { PDFControlsProps } from './types';

export const PDFControls: React.FC<PDFControlsProps> = ({
	pageNumber,
	numPages,
	scale,
	onPrevPage,
	onNextPage,
	onZoomIn,
	onZoomOut,
	onResetZoom
}) => (
	<div className="flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#202225] bg-gray-50 dark:bg-[#2f3136]">
		<div className="flex items-center space-x-2">
			<button
				onClick={onPrevPage}
				disabled={pageNumber <= 1}
				className="p-2 rounded transition-colors duration-200 text-gray-600 dark:text-[#b9bbbe] hover:bg-gray-300 dark:hover:bg-[#40444b] disabled:opacity-50 disabled:cursor-not-allowed"
				title="Previous page (←)"
			>
				<ChevronLeftIcon className="w-4 h-4" />
			</button>
			<span className="px-3 py-1 text-sm text-gray-600 dark:text-[#b9bbbe]">
				{pageNumber} / {numPages || 1}
			</span>
			<button
				onClick={onNextPage}
				disabled={pageNumber >= (numPages || 1)}
				className="p-2 rounded transition-colors duration-200 text-gray-600 dark:text-[#b9bbbe] hover:bg-gray-300 dark:hover:bg-[#40444b] disabled:opacity-50 disabled:cursor-not-allowed"
				title="Next page (→)"
			>
				<ChevronRightIcon className="w-4 h-4" />
			</button>
		</div>

		<div className="flex items-center space-x-2">
			<button
				onClick={onZoomOut}
				className="p-2 rounded transition-colors duration-200 text-gray-600 dark:text-[#b9bbbe] hover:bg-gray-300 dark:hover:bg-[#40444b]"
				title="Zoom out (Ctrl + -)"
			>
				<MinusIcon className="w-4 h-4" />
			</button>
			<span className="px-3 py-1 text-sm min-w-[60px] text-center text-gray-600 dark:text-[#b9bbbe]">{Math.round(scale * 100)}%</span>
			<button
				onClick={onZoomIn}
				className="p-2 rounded transition-colors duration-200 text-gray-600 dark:text-[#b9bbbe] hover:bg-gray-300 dark:hover:bg-[#40444b]"
				title="Zoom in (Ctrl + +)"
			>
				<Icons.PlusIcon defaultSize="w-4 h-4" />
			</button>
		</div>
	</div>
);
