import type { ClanData } from '../../pages/dashboard/types';
import Pagination from '../Pagination';

interface ClansTableProps {
	data: ClanData[];
	showSkeleton: boolean;
	selectedColumns: string[];
	isExportingCSV: boolean;
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	onClanClick: (clanId: string) => void;
	onExportCSV: () => void;
	onToggleColumn: (col: string) => void;
	onPageChange: (page: number) => void;
	tableRef: React.RefObject<HTMLDivElement>;
}

function ClansTable({
	data,
	showSkeleton,
	selectedColumns,
	isExportingCSV,
	page,
	limit,
	total,
	totalPages,
	onClanClick,
	onExportCSV,
	onToggleColumn,
	onPageChange,
	tableRef
}: ClansTableProps) {
	return (
		<div ref={tableRef} className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-xl font-semibold">Detailed Activity Data</h3>
				<button
					onClick={onExportCSV}
					disabled={isExportingCSV}
					className="px-4 py-2 border dark:border-[#4d4f52] rounded-md hover:bg-gray-50 dark:hover:bg-[#1e1f22] text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isExportingCSV ? (
						<>
							<div className="inline-block h-3 w-3 animate-spin rounded-full border border-solid border-current border-r-transparent"></div>
							Exporting...
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
							Export CSV
						</>
					)}
				</button>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead className="bg-gray-50 dark:bg-[#1e1f22]">
						<tr>
							<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
								<div className="flex items-center">
									<span>Clan ID</span>
									<input
										aria-label="Select Clan ID column"
										type="checkbox"
										className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
										checked={selectedColumns.includes('clan_id')}
										onChange={() => onToggleColumn('clan_id')}
									/>
								</div>
							</th>
							<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
								<div className="flex items-center">
									<span>Active users</span>
									<input
										aria-label="Select Active users column"
										type="checkbox"
										className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
										checked={selectedColumns.includes('active_users')}
										onChange={() => onToggleColumn('active_users')}
									/>
								</div>
							</th>
							<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
								<div className="flex items-center">
									<span>Active channels</span>
									<input
										aria-label="Select Active channels column"
										type="checkbox"
										className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
										checked={selectedColumns.includes('active_channels')}
										onChange={() => onToggleColumn('active_channels')}
									/>
								</div>
							</th>
							<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
								<div className="flex items-center">
									<span>Messages</span>
									<input
										aria-label="Select Messages column"
										type="checkbox"
										className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
										checked={selectedColumns.includes('messages')}
										onChange={() => onToggleColumn('messages')}
									/>
								</div>
							</th>
						</tr>
					</thead>
					<tbody>
						{showSkeleton ? (
							// Skeleton rows
							Array.from({ length: limit }).map((_, index) => (
								<tr key={`skeleton-${index}`}>
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
										<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse"></div>
									</td>
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
										<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-16"></div>
									</td>
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
										<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-16"></div>
									</td>
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
										<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-20"></div>
									</td>
								</tr>
							))
						) : (data?.length || 0) === 0 ? (
							// Data loading
							<tr>
								<td colSpan={4}>
									<div className="text-center py-12">
										<div className="text-lg font-medium dark:text-textSecondary">
											You don't own any clan to generate analytics.
										</div>
									</div>
								</td>
							</tr>
						) : (
							data.map((row, index) => (
								<tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#1e1f22]">
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
										<button onClick={() => onClanClick(row.clanId)} className="text-blue-600 dark:text-blue-400 hover:underline">
											{row.clanId}
										</button>
									</td>
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.totalActiveUsers}</td>
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.totalActiveChannels}</td>
									<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.totalMessages}</td>
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

export default ClansTable;
