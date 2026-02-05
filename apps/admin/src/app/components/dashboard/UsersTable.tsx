import { useTranslation } from 'react-i18next';
import type { UserData } from '../../pages/dashboard/types';
import Pagination from '../Pagination';

interface UsersTableProps {
	data: UserData[];
	selectedColumns: string[];
	isExportingCSV: boolean;
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	sortBy?: string;
	sort?: 'asc' | 'desc';
	onExportCSV: () => void;
	onToggleColumn: (col: string) => void;
	onPageChange: (page: number) => void;
	onSort?: (column: string) => void;
}

function UsersTable({
	data,
	selectedColumns,
	isExportingCSV,
	page,
	limit,
	total,
	totalPages,
	sortBy,
	sort,
	onExportCSV,
	onToggleColumn,
	onPageChange,
	onSort
}: UsersTableProps) {
	const { t } = useTranslation('dashboard');

	const getSortIcon = (column: string) => {
		if (sortBy !== column) {
			return (
				<svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="-my-1">
					<path d="M5 2L8 6H2L5 2Z" fill="#5865F2" />
					<path d="M5 14L2 10H8L5 14Z" fill="#5865F2" />
				</svg>
			);
		}
		if (sort === 'asc') {
			return (
				<svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="-my-1">
					<path d="M5 2L8 6H2L5 2Z" fill="#5865F2" />
					<path d="M5 14L2 10H8L5 14Z" fill="#5865F2" opacity="0.3" />
				</svg>
			);
		}
		return (
			<svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="-my-1">
				<path d="M5 2L8 6H2L5 2Z" fill="#5865F2" opacity="0.3" />
				<path d="M5 14L2 10H8L5 14Z" fill="#5865F2" />
			</svg>
		);
	};

	return (
		<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-xl font-semibold">{t('table.userActivityData')}</h3>
				<button
					onClick={onExportCSV}
					disabled={isExportingCSV}
					className="px-4 py-2 border dark:border-[#4d4f52] rounded-md hover:bg-gray-50 dark:hover:bg-[#1e1f22] text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isExportingCSV ? (
						<>
							<div className="inline-block h-3 w-3 animate-spin rounded-full border border-solid border-current border-r-transparent"></div>
							{t('table.exporting')}
						</>
					) : (
						<>
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline">
								<path
									d="M7 1V9M7 9L4 6M7 9L10 6M1 13H13"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							{t('table.exportCSV')}
						</>
					)}
				</button>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead className="bg-gray-50 dark:bg-[#1e1f22]">
						<tr>
							<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
								<div className="flex items-center gap-2">
									<span>{t('table.userName')}</span>
									<button
										onClick={() => onSort?.('user_name')}
										className="inline-flex flex-col items-center justify-center cursor-pointer h-4 w-4"
									>
										{getSortIcon('user_name')}
									</button>
									<input
										aria-label="Select User name column"
										type="checkbox"
										className="h-4 w-4 rounded border dark:border-[#4d4f52] accent-[#5865F2] cursor-pointer"
										checked={selectedColumns.includes('user_name')}
										onChange={() => onToggleColumn('user_name')}
									/>
								</div>
							</th>
							<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
								<div className="flex items-center gap-2">
									<span>{t('table.messages')}</span>
									<button
										onClick={() => onSort?.('messages')}
										className="inline-flex flex-col items-center justify-center cursor-pointer h-4 w-4"
									>
										{getSortIcon('messages')}
									</button>
									<input
										aria-label="Select Messages column"
										type="checkbox"
										className="h-4 w-4 rounded border dark:border-[#4d4f52] accent-[#5865F2] cursor-pointer"
										checked={selectedColumns.includes('messages')}
										onChange={() => onToggleColumn('messages')}
									/>
								</div>
							</th>
						</tr>
					</thead>
					<tbody>
						{data.length === 0 ? (
							<tr>
								<td colSpan={2} className="px-4 py-6 text-sm text-center border-b dark:border-[#4d4f52] text-gray-500">
									{t('table.noActiveUsers')}
								</td>
							</tr>
						) : (
							data.map((row, index) => (
								<tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#1e1f22]">
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.userName}</td>
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.messages}</td>
								</tr>
							))
						)}
					</tbody>
				</table>

				{/* Pagination controls */}
				{total > limit && (
					<>
						{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
						{/* @ts-ignore */}
						<Pagination page={page} totalPages={totalPages} total={total} pageSize={limit} onPageChange={onPageChange} />
					</>
				)}
			</div>
		</div>
	);
}

export default UsersTable;
