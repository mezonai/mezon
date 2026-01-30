import { fetchClansList, useAppDispatch } from '@mezon/store';
import { useEffect, useState } from 'react';
import { getDateRangeFromPreset } from './reportUtils';

export const usePagination = (
	dateRange: string,
	customStartDate: string,
	customEndDate: string,
	periodFilter: 'daily' | 'weekly' | 'monthly',
	refreshTrigger: number
) => {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const dispatch = useAppDispatch();

	useEffect(() => {
		const fetchTable = async () => {
			const { startStr, endStr } = getDateRangeFromPreset(dateRange, customStartDate, customEndDate);
			const action = await dispatch(fetchClansList({ start: startStr, end: endStr, page, limit, rangeType: periodFilter }));
			if (fetchClansList.fulfilled.match(action)) {
				const payload = action.payload as {
					success?: boolean;
					data?: { pagination?: { total?: number; totalPages?: number; page?: number } };
				};
				if (payload?.success && payload.data?.pagination) {
					setTotal(payload.data.pagination.total || 0);
					setTotalPages(payload.data.pagination.totalPages || 0);
					setPage(payload.data.pagination.page || page);
				}
			} else {
				setTotal(0);
				setTotalPages(0);
			}
		};
		fetchTable();
	}, [refreshTrigger, page, limit, dateRange, customStartDate, customEndDate, periodFilter, dispatch]);

	return { page, setPage, limit, setLimit, total, totalPages };
};

export const useTableSkeleton = (isLoading: boolean) => {
	const [showSkeleton, setShowSkeleton] = useState(false);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		if (isLoading) {
			timeoutId = setTimeout(() => setShowSkeleton(true), 300);
		} else {
			setShowSkeleton(false);
		}
		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [isLoading]);

	return showSkeleton;
};
