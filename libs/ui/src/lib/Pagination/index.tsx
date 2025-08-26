import React from 'react';

type PaginationProps = {
	totalPages: number;
	currentPage: number;
	onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({ totalPages, currentPage, onPageChange }) => {
	if (totalPages <= 1) return null;

	const createPageNumbers = () => {
		const pages: (number | string)[] = [];
		const delta = 2;

		for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
			pages.push(i);
		}

		if (currentPage - delta > 2) pages.unshift('...');
		if (currentPage + delta < totalPages - 1) pages.push('...');

		pages.unshift(1);
		if (totalPages > 1) pages.push(totalPages);

		return pages;
	};

	const pages = createPageNumbers();

	const baseBtn = 'px-3 py-1 rounded-md border text-sm transition-colors duration-200';
	const activeBtn = 'bg-active-button text-theme-primary-active';
	const normalBtn = ' text-theme-primary border-theme-primary btn-primary btn-primary-hover';
	const disabledBtn = 'opacity-50 cursor-not-allowed';

	return (
		<div className="flex gap-2 items-center">
			{/* Previous */}
			<button
				className={`${baseBtn} ${normalBtn} ${currentPage === 1 ? disabledBtn : ''}`}
				disabled={currentPage === 1}
				onClick={() => onPageChange(currentPage - 1)}
			>
				Previous
			</button>

			{/* Pages */}
			{pages.map((p, idx) =>
				typeof p === 'number' ? (
					<button key={idx} className={`${baseBtn} ${p === currentPage ? activeBtn : normalBtn}`} onClick={() => onPageChange(p)}>
						{p}
					</button>
				) : (
					<span key={idx} className="px-2 text-gray-500">
						{p}
					</span>
				)
			)}

			{/* Next */}
			<button
				className={`${baseBtn} ${normalBtn} ${currentPage === totalPages ? disabledBtn : ''}`}
				disabled={currentPage === totalPages}
				onClick={() => onPageChange(currentPage + 1)}
			>
				Next
			</button>
		</div>
	);
};

export default Pagination;
