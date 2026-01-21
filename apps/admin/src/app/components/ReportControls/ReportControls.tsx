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
	return (
		<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
			<div className="flex flex-wrap gap-4 items-end">
				<div>
					<h2 className="text-xl font-semibold mb-1">Time Period</h2>
					<select
						value={dateRange}
						onChange={(e) => {
							const val = e.target.value;
							setDateRange(val);
							if (onDateRangeChange) onDateRangeChange(val);
							if (val === 'custom') {
								const today = new Date().toISOString().split('T')[0];
								setCustomStartDate(customStartDate || today);
								setCustomEndDate(customEndDate || today);
							}
						}}
						className="w-full sm:w-[200px] px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="7">Last 7 days</option>
						<option value="30">Last 30 days</option>
						<option value="90">Last 90 days</option>
						<option value="custom">Custom date range</option>
					</select>
				</div>

				{dateRange === 'custom' && (
					<>
						<div>
							<label className="block text-sm font-medium dark:text-textSecondary mb-2">Start Date</label>
							<input
								type="date"
								value={customStartDate}
								onChange={(e) => {
									const v = e.target.value;
									setCustomStartDate(v);
									if (customEndDate && v > customEndDate) {
										setCustomEndDate(v);
									}
								}}
								max={customEndDate ? customEndDate : new Date().toISOString().split('T')[0]}
								className="px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium dark:text-textSecondary mb-2">End Date</label>
							<input
								type="date"
								value={customEndDate}
								onChange={(e) => {
									const v = e.target.value;
									setCustomEndDate(v);
									if (customStartDate && v < customStartDate) {
										setCustomStartDate(v);
									}
								}}
								min={customStartDate || undefined}
								max={new Date().toISOString().split('T')[0]}
								className="px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</>
				)}

				<div>
					{allowedGranularities.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold mb-1">Range Type</h2>
							<select
								value={periodFilter}
								onChange={(e) => setPeriodFilter(e.target.value as Granularity)}
								className="w-full sm:w-[200px] px-3 py-2 border dark:border-[#4d4f52] bg-white dark:bg-[#1e1f22] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								{allowedGranularities.map((g) => (
									<option key={g} value={g}>
										{g.charAt(0).toUpperCase() + g.slice(1)}
									</option>
								))}
							</select>
						</div>
					)}
				</div>

				<button
					onClick={onRun}
					className="w-full sm:w-36 px-6 py-2 bg-[#5865F2] text-white rounded-md hover:bg-[#4752c4] focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Run report
				</button>
				<button
					onClick={onReset}
					className="w-full sm:w-36 px-6 py-2 bg-[#5865F2] text-white rounded-md hover:bg-[#4752c4] focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Reset
				</button>
			</div>
		</div>
	);
}
