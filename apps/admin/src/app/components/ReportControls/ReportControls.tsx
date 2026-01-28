import { DatePickerWrapper } from '@mezon/components';
import Button from '../controls/Button';
import SelectControl from '../controls/SelectControl';

export type Granularity = 'daily' | 'weekly' | 'monthly';

interface Props {
	dateRange: string;
	setDateRange: (v: string) => void;
	customStartDate: string;
	setCustomStartDate: (v: string) => void;
	customEndDate: string;
	setCustomEndDate: (v: string) => void;
	periodFilter: Granularity;
	setPeriodFilter: (v: Granularity) => void;
	allowedGranularities: Granularity[];
	onRun: () => void;
	onReset: () => void;
	onDateRangeChange?: (v: string) => void;
}

export default function ReportControls({
	dateRange,
	setDateRange,
	customStartDate,
	setCustomStartDate,
	customEndDate,
	setCustomEndDate,
	periodFilter,
	setPeriodFilter,
	allowedGranularities,
	onRun,
	onReset,
	onDateRangeChange
}: Props) {
	const formatDate = (d: Date) => d.toISOString().split('T')[0];

	const handleStartDateChange = (date: Date) => {
		const v = formatDate(date);
		setCustomStartDate(v);
		if (customEndDate && v > customEndDate) setCustomEndDate(v);
	};

	const handleEndDateChange = (date: Date) => {
		const v = formatDate(date);
		setCustomEndDate(v);
		if (customStartDate && v < customStartDate) setCustomStartDate(v);
	};

	return (
		<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
			<div className="flex flex-wrap gap-4 items-end">
				<div>
					<h2 className="text-xl font-semibold mb-1">Time Period</h2>
					<SelectControl
						value={dateRange}
						onChange={(val) => {
							setDateRange(val);
							if (onDateRangeChange) onDateRangeChange(val);
							if (val === 'custom') {
								const today = new Date().toISOString().split('T')[0];
								setCustomStartDate(customStartDate || today);
								setCustomEndDate(customEndDate || today);
							}
						}}
						options={[
							{ value: '7', label: 'Last 7 days' },
							{ value: '30', label: 'Last 30 days' },
							{ value: '90', label: 'Last 90 days' },
							{ value: 'custom', label: 'Custom date range' }
						]}
						className="w-full sm:w-[200px] px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				{dateRange === 'custom' && (
					<>
						<div>
							<label className="block text-sm font-medium dark:text-textSecondary mb-2">Start Date</label>
							<DatePickerWrapper
								selected={customStartDate ? new Date(customStartDate) : new Date()}
								onChange={handleStartDateChange}
								dateFormat="yyyy-MM-dd"
								maxDate={customEndDate ? new Date(customEndDate) : new Date()}
								className="px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium dark:text-textSecondary mb-2">End Date</label>
							<DatePickerWrapper
								selected={customEndDate ? new Date(customEndDate) : new Date()}
								onChange={handleEndDateChange}
								dateFormat="yyyy-MM-dd"
								minDate={customStartDate ? new Date(customStartDate) : undefined}
								maxDate={new Date()}
								className="px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</>
				)}

				<div>
					{allowedGranularities.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold mb-1">Range Type</h2>
							<SelectControl
								value={periodFilter}
								onChange={(val) => setPeriodFilter(val as Granularity)}
								options={allowedGranularities.map((g) => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) }))}
								className="w-full sm:w-[200px] px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					)}
				</div>

				<Button onClick={onRun}>Run report</Button>
				<Button onClick={onReset}>Reset</Button>
			</div>
		</div>
	);
}
