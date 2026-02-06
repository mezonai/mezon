interface SortIconProps {
	column: string;
	sortBy?: string;
	sort?: 'asc' | 'desc';
}

function SortIcon({ column, sortBy, sort }: SortIconProps) {
	if (sortBy !== column) {
		// Not sorted - both arrows enabled
		return (
			<svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="-my-1">
				<path d="M5 2L8 6H2L5 2Z" fill="#5865F2" />
				<path d="M5 14L2 10H8L5 14Z" fill="#5865F2" />
			</svg>
		);
	}
	if (sort === 'asc') {
		// Ascending - only top arrow enabled
		return (
			<svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="-my-1">
				<path d="M5 2L8 6H2L5 2Z" fill="#5865F2" />
				<path d="M5 14L2 10H8L5 14Z" fill="#5865F2" opacity="0.3" />
			</svg>
		);
	}
	// Descending - only bottom arrow enabled
	return (
		<svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="-my-1">
			<path d="M5 2L8 6H2L5 2Z" fill="#5865F2" opacity="0.3" />
			<path d="M5 14L2 10H8L5 14Z" fill="#5865F2" />
		</svg>
	);
}

export default SortIcon;
