/** Slots the page-number strip draws once there are more pages than fit. */
export const PAGINATION_MAX_SLOTS = 7;

/**
 * Page numbers (1-based) to draw, `null` for an ellipsis. Past `PAGINATION_MAX_SLOTS` pages
 * this is MUI's rule with one boundary page and one sibling on each side: always exactly
 * seven entries, and an ellipsis never stands in for a single page — that page is drawn
 * instead. A slot count that depended on the current page would change the strip's width,
 * sliding prev/next and the page buttons under the pointer while paging.
 */
export const paginationItems = (currentPage: number, totalPages: number): Array<number | null> => {
	if (totalPages <= PAGINATION_MAX_SLOTS) {
		return Array.from({ length: Math.max(0, totalPages) }, (_, index) => index + 1);
	}
	const page = Math.min(Math.max(1, currentPage), totalPages);
	const siblingsStart = Math.max(Math.min(page - 1, totalPages - 4), 3);
	const siblingsEnd = Math.min(Math.max(page + 1, 5), totalPages - 2);
	const items: Array<number | null> = [1, siblingsStart > 3 ? null : 2];
	for (let sibling = siblingsStart; sibling <= siblingsEnd; sibling++) {
		items.push(sibling);
	}
	items.push(siblingsEnd < totalPages - 2 ? null : totalPages - 1);
	items.push(totalPages);
	return items;
};
