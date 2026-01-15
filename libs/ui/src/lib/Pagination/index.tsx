import React from 'react';
import { Icons } from '../Icons';

type PaginationProps = {
	totalPages: number;
	currentPage: number;
	onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({ totalPages, currentPage, onPageChange }) => {
	if (totalPages <= 1) return null;

	const createPageNumbers = () => {
		const pages: (number | string)[] = [];

		if (totalPages <= 5) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (currentPage <= 3) {
				pages.push(1, 2, 3, 4, 5);
				if (totalPages > 5) {
					pages.push('...', totalPages);
				}
			} else if (currentPage >= totalPages - 2) {
				pages.push(1, '...', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
			} else {
				pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
			}
		}

		return pages;
	};

	const pages = createPageNumbers();

	const baseBtn = 'px-3 py-1 rounded-md border text-sm transition-colors duration-200 min-w-[40px]';
	const activeBtn = 'bg-active-button text-theme-primary-active';
	const normalBtn = ' text-theme-primary border-theme-primary btn-primary btn-primary-hover';
	const disabledBtn = 'opacity-50 cursor-not-allowed';

	return (
		<div className="flex gap-2 items-center flex-wrap justify-center py-1">
			<button
				className={`${baseBtn} ${normalBtn} ${currentPage === 1 ? disabledBtn : ''} items-center flex justify-center`}
				disabled={currentPage === 1}
				onClick={() => onPageChange(currentPage - 1)}
			>
				<Icons.ArrowRight defaultSize="rotate-180 w-5 h-5 min-w-4" />
			</button>

			{pages.map((p, idx) =>
				typeof p === 'number' ? (
					<button key={idx} className={`${baseBtn} ${p === currentPage ? activeBtn : normalBtn}`} onClick={() => onPageChange(p)}>
						{p}
					</button>
				) : (
					<span key={idx} className="px-2 text-gray-500 flex items-center">
						{p}
					</span>
				)
			)}

			<button
				className={`${baseBtn} ${normalBtn} ${currentPage === totalPages ? disabledBtn : ''} items-center flex justify-center`}
				disabled={currentPage === totalPages}
				onClick={() => onPageChange(currentPage + 1)}
			>
				<Icons.ArrowRight />
			</button>
		</div>
	);
};

export default Pagination;
