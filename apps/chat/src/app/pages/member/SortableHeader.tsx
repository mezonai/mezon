import type { SortField } from '@mezon/core';
import { useMemberContext } from '@mezon/core';
import { MezonIcon, MzIcons20 } from '@mezon/ui';

interface SortableHeaderProps {
	field: SortField;
	label: string;
	className?: string;
}

export const SortableHeader = ({ field, label, className }: SortableHeaderProps) => {
	const { sortField, sortDirection, setSort } = useMemberContext();

	const isActive = sortField === field;
	const direction = !isActive ? 'desc' : sortDirection;

	return (
		<div
			className={`flex flex-row gap-1 p-1 items-center cursor-pointer select-none ${isActive ? 'text-theme-primary-active' : 'text-theme-primary'} ${className}`}
			onClick={() => setSort(field)}
		>
			<span className={`inline-block text-xs font-bold uppercase transition-transform duration-200 ${isActive ? 'scale-105' : 'scale-100'}`}>
				{label}
			</span>

			<MezonIcon
				icon={MzIcons20.mzFilter}
				className={`${direction === 'desc' ? 'rotate-180' : ''} ${isActive ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}`}
			/>
		</div>
	);
};
