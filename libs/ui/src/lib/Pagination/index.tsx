import React from 'react';
import { Icons } from '../Icons';
import { paginationItems } from './paginationItems';

type PaginationProps = {
	totalPages: number;
	currentPage: number;
	onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({ totalPages, currentPage, onPageChange }) => {
	if (totalPages <= 1) return null;

	const pages = paginationItems(currentPage, totalPages);

	// Fixed-width slots: with a constant slot count, paging only relabels them.
	const baseBtn = 'py-1 rounded-md border text-sm transition-colors duration-200 w-10 shrink-0';
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
				<Icons.ArrowRight className="rotate-180" />
			</button>

			{pages.map((p, idx) =>
				p !== null ? (
					<button key={idx} className={`${baseBtn} ${p === currentPage ? activeBtn : normalBtn}`} onClick={() => onPageChange(p)}>
						{p}
					</button>
				) : (
					<span key={idx} className="w-10 shrink-0 text-gray-500 flex items-center justify-center">
						...
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
