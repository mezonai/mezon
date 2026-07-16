import type { AppDispatch, Room } from '@mezon/store';
import { fetchRooms, selectRooms, selectRoomsLoading, selectRoomsPagination } from '@mezon/store';
import { Icons } from '@mezon/ui';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { PAGE_SIZE, STATUS_BADGE, getStatusOptions, getTimeOptions } from '../../constants/dashboard';
import { formatDate, formatStatus, getDateRangeFromTimeFilter } from '../../utils/dashboard/format';
import Pagination from '../Pagination';
import SelectControl from '../controls/SelectControl';
import { NoDataState } from './StateComponents';

interface MeetingRoomsTableProps {
	onViewDetails?: (room: Room) => void;
}

const MeetingRoomsTable: React.FC<MeetingRoomsTableProps> = ({ onViewDetails }) => {
	const navigate = useNavigate();
	const { t } = useTranslation('dashboard');
	const { t: tCommon } = useTranslation('common');
	const dispatch = useDispatch<AppDispatch>();
	const rooms = useSelector(selectRooms);
	const loading = useSelector(selectRoomsLoading);
	const { total } = useSelector(selectRoomsPagination);

	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [timeFilter, setTimeFilter] = useState('');
	const [inputValue, setInputValue] = useState('');
	const [page, setPage] = useState(1);
	const [refreshTick, setRefreshTick] = useState(0);

	const STATUS_OPTIONS = getStatusOptions(t);
	const TIME_OPTIONS = getTimeOptions(t);

	const handleSearch = useDebouncedCallback((value: string) => {
		setSearch(value);
		setPage(1);
	}, 400);

	useEffect(() => {
		const { startDate, endDate } = getDateRangeFromTimeFilter(timeFilter);
		dispatch(
			fetchRooms({
				search: search || undefined,
				status: statusFilter || undefined,
				startDate,
				endDate,
				page,
				limit: PAGE_SIZE
			})
		);
	}, [dispatch, search, statusFilter, timeFilter, page, refreshTick]);

	const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

	const handleStatusChange = (val: string) => {
		setStatusFilter(val);
		setPage(1);
	};

	const handleTimeChange = (val: string) => {
		setTimeFilter(val);
		setPage(1);
	};

	const handleRefresh = () => {
		setRefreshTick((t) => t + 1);
	};

	return (
		<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
			<h1 className="text-xl font-semibold mb-4">{t('page.meetingRooms')}</h1>

			<div className="flex flex-wrap gap-3 mb-6 items-center">
				<div className="relative flex-1 min-w-[220px]">
					<Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
					<input
						type="text"
						value={inputValue}
						onChange={(e) => {
							setInputValue(e.target.value);
							handleSearch(e.target.value);
						}}
						placeholder={t('meetingRoomsFilter.searchByRoomNameOrParticipant')}
						className="w-full h-[40px] pl-9 pr-3 rounded-md border border-gray-200 dark:border-[#3d3f43] bg-white dark:bg-[#1e1f22] text-gray-800 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400"
					/>
				</div>

				<div className="w-[160px]">
					<SelectControl
						value={statusFilter}
						onChange={handleStatusChange}
						options={STATUS_OPTIONS}
						className="w-full px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<div className="w-[160px]">
					<SelectControl
						value={timeFilter}
						onChange={handleTimeChange}
						options={TIME_OPTIONS}
						className="w-full px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<button
					onClick={handleRefresh}
					className="h-[40px] px-4 bg-[#5865F2] hover:bg-blue-700 text-white text-sm font-medium rounded-md flex items-center gap-2 transition-colors"
				>
					{tCommon('refresh')}
				</button>
			</div>

			<div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#3d3f43]">
				{rooms.length === 0 ? (
					<NoDataState className="border-none" />
				) : (
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-200 dark:border-[#3d3f43]">
								{[
									t('meetingRoomsTable.roomName'),
									t('meetingRoomsTable.status'),
									t('meetingRoomsTable.createdAt'),
									t('meetingRoomsTable.completedAt'),
									t('meetingRoomsTable.actions')
								].map((col) => (
									<th
										key={col}
										className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
									>
										{col}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{loading
								? Array.from({ length: PAGE_SIZE }).map((_, index) => (
										<tr key={`skeleton-${index}`} className="border-b last:border-b-0 border-gray-100 dark:border-[#2e3035]">
											<td className="px-4 py-4">
												<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-32"></div>
											</td>
											<td className="px-4 py-4">
												<div className="h-6 bg-gray-200 dark:bg-[#4d4f52] rounded-full animate-pulse w-20"></div>
											</td>
											<td className="px-4 py-4">
												<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-28"></div>
											</td>
											<td className="px-4 py-4">
												<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-28"></div>
											</td>
											<td className="px-4 py-4">
												<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-16"></div>
											</td>
										</tr>
									))
								: rooms.map((room) => (
										<tr
											key={`${room.id}-${room.createdAt}`}
											className="border-b last:border-b-0 border-gray-100 dark:border-[#2e3035] hover:bg-gray-50 dark:hover:bg-[#25272b] transition-colors"
										>
											<td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">
												{room.channelName ?? room.roomName}
											</td>
											<td className="px-4 py-4">
												<span
													className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[room.status] ?? 'bg-gray-100 text-gray-600'}`}
												>
													{formatStatus(room.status)}
												</span>
											</td>
											<td className="px-4 py-4 text-gray-500 dark:text-gray-400">{formatDate(room.createdAt)}</td>
											<td className="px-4 py-4 text-gray-500 dark:text-gray-400">
												{room.finalizedAt ? formatDate(room.finalizedAt) : 'N/A'}
											</td>
											<td className="px-4 py-4">
												<button
													onClick={() => {
														onViewDetails?.(room);
														navigate(`/developers/transcript-calls/${room.id}`);
													}}
													className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-medium"
												>
													{t('meetingRoomsTable.viewDetails')}
												</button>
											</td>
										</tr>
									))}
						</tbody>
					</table>
				)}
			</div>

			<Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
		</div>
	);
};

export default MeetingRoomsTable;
