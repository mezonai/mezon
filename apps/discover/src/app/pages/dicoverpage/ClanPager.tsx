import { PAGINATION } from '../../constants/constants';

interface ClanPagerProps {
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

function getPageWindow(current: number, total: number, size = PAGINATION.MAX_PAGE_NUMBERS) {
	if (total <= size) return Array.from({ length: total }, (_, index) => index + 1);
	let start = Math.max(1, current - Math.floor(size / 2));
	let end = start + size - 1;
	if (end > total) {
		end = total;
		start = Math.max(1, end - size + 1);
	}
	return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function ClanPager({ page, pageCount, onPageChange, disabled }: ClanPagerProps) {
	if (pageCount <= 1) return null;
	const pages = getPageWindow(page, pageCount);

	return (
		<nav className="mt-16 pt-10 border-t border-[#131221]/10 flex items-center justify-between gap-4" aria-label="Pagination">
			<button
				type="button"
				onClick={() => onPageChange(page - 1)}
				disabled={disabled || page <= 1}
				className="min-h-[48px] min-w-[48px] px-5 rounded-full bg-[#8960e0] text-white font-semibold hover:bg-[#7a52d4] disabled:bg-[#131221]/8 disabled:text-[#131221]/30 disabled:cursor-not-allowed"
				aria-label="Previous page"
			>
				←
			</button>
			<ol className="flex items-end justify-center gap-4 md:gap-6">
				{pages.map((item) => {
					const current = item === page;
					return (
						<li key={item}>
							<button
								type="button"
								onClick={() => onPageChange(item)}
								disabled={disabled || current}
								aria-current={current ? 'page' : undefined}
								className={`tabular-nums tracking-[-0.05em] leading-none transition-colors ${
									current
										? 'text-4xl md:text-5xl font-extrabold text-[#5865f2]'
										: 'text-2xl md:text-3xl font-light text-[#131221]/30 hover:text-[#8960e0]'
								}`}
							>
								{String(item).padStart(2, '0')}
							</button>
						</li>
					);
				})}
			</ol>
			<button
				type="button"
				onClick={() => onPageChange(page + 1)}
				disabled={disabled || page >= pageCount}
				className="min-h-[48px] min-w-[48px] px-5 rounded-full bg-[#8960e0] text-white font-semibold hover:bg-[#7a52d4] disabled:bg-[#131221]/8 disabled:text-[#131221]/30 disabled:cursor-not-allowed"
				aria-label="Next page"
			>
				→
			</button>
		</nav>
	);
}
