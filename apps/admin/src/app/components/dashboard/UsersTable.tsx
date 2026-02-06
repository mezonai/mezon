import { useTranslation } from 'react-i18next';
import type { UserData } from '../../pages/dashboard/types';
import Pagination from '../Pagination';
import ColumnToggle from './ColumnToggle';
import SortIcon from './SortIcon';

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
										<SortIcon column="user_name" sortBy={sortBy} sort={sort} />
									</button>
									<ColumnToggle
										ariaLabel="Select User name column"
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
										<SortIcon column="messages" sortBy={sortBy} sort={sort} />
									</button>
									<ColumnToggle
										ariaLabel="Select Messages column"
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
