import React from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
	page: number;
	totalPages: number;
	total: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, total, pageSize, onPageChange, className = '' }) => {
	const { t } = useTranslation('dashboard');

	const pageItems = React.useMemo(() => {
		const pages = totalPages || 1;
		const maxButtons = 7;
		if (pages <= maxButtons) return Array.from({ length: pages }, (_, i) => i + 1) as (number | string)[];

		const items: (number | string)[] = [];
		items.push(1);

		const start = Math.max(2, page - 2);
		const end = Math.min(pages - 1, page + 2);

		if (start > 2) items.push('...');
		for (let i = start; i <= end; i++) items.push(i);
		if (end < pages - 1) items.push('...');

		items.push(pages);
		return items;
	}, [page, totalPages]);

	if (total <= pageSize) return null;

	return (
		<div className={`mt-4 pt-4 border-t dark:border-[#4d4f52] flex items-center justify-between ${className}`}>
			<div className="text-sm dark:text-textSecondary">
				{`${t('pagination.showing')} ${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} ${t('pagination.of')} ${total} ${t('pagination.clans')}`}
			</div>

			<div className="flex items-center space-x-3">
				<button
					onClick={() => onPageChange(Math.max(1, page - 1))}
					disabled={page === 1}
					className="px-3 py-1 border dark:border-[#3d3f43] rounded disabled:opacity-60 bg-[#f6f7ff] dark:bg-[#2b273f] text-[#5865F2] hover:bg-[#e7e1ff] dark:hover:bg-[#3e3a66] text-sm"
				>
					{t('pagination.previous')}
				</button>

				<div className="flex items-center space-x-1">
					{pageItems.map((pItem, idx) =>
						typeof pItem === 'string' ? (
							<span key={`sep-${idx}`} className="px-2 text-sm dark:text-textSecondary">
								{pItem}
							</span>
						) : (
							<button
								key={`p-${pItem}`}
								onClick={() => onPageChange(Number(pItem))}
								aria-current={pItem === page}
								className={`px-3 py-1 border dark:border-[#3d3f43] rounded text-sm ${
									pItem === page
										? 'bg-[#5865F2] dark:bg-[#4546a6] text-white font-medium'
										: 'bg-[#f6f7ff] dark:bg-[#2b273f] text-[#5865F2] hover:bg-[#e7e1ff] dark:hover:bg-[#3e3a66]'
								}`}
							>
								{pItem}
							</button>
						)
					)}
				</div>

				<button
					onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
					disabled={page === totalPages || totalPages === 0}
					className="px-3 py-1 border dark:border-[#3d3f43] rounded disabled:opacity-50 bg-white dark:bg-[#2b2d31] hover:bg-gray-50 dark:hover:bg-[#35373c] text-sm"
				>
					{t('pagination.next')}
				</button>
			</div>
		</div>
	);
};

export default Pagination;
