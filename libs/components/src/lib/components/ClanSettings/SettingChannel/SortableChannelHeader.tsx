import { Icons } from '@mezon/ui';

export type ChannelSortField = 'name' | 'members' | 'messagesCount' | 'lastSent' | 'creator';

export type ChannelSortDirection = 'asc' | 'desc';

interface SortableChannelHeaderProps {
	field: ChannelSortField;
	label: string;
	className?: string;
	sortField: ChannelSortField | null;
	sortDirection: ChannelSortDirection;
	setSort: (field: ChannelSortField) => void;
}

export const SortableChannelHeader = ({ field, label, className, sortField, sortDirection, setSort }: SortableChannelHeaderProps) => {
	const isActive = sortField === field;
	const direction = !isActive ? 'desc' : sortDirection;

	return (
		<div
			className={`flex flex-row gap-1 p-1 items-center cursor-pointer select-none ${isActive ? 'text-gray-200' : 'text-gray-400'} ${className}`}
			onClick={() => setSort(field)}
		>
			<span className="text-xs font-bold uppercase">{label}</span>

			<Icons.FiltersIcon className={`w-5 h-5 ${direction === 'desc' ? 'rotate-180' : ''}`} />
		</div>
	);
};
