import { formatChartDate } from '@mezon/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './controls/ChartTooltip';

function SingleLineChart({
	data,
	dataKey,
	stroke = '#5865F2',
	name,
	height = 350
}: {
	data: any[];
	dataKey: string;
	stroke?: string;
	name: string;
	height?: number;
}) {
	const { i18n } = useTranslation();
	const lang = i18n?.language || 'en';
	return (
		<div className="text-gray-600 dark:text-textSecondary">
			<ResponsiveContainer width="100%" height={height}>
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
					<XAxis
						dataKey="date"
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 12, fill: 'currentColor' }}
						tickFormatter={(value) => {
							try {
								return formatChartDate(new Date(value), lang, { withYear: false });
							} catch (e) {
								return String(value);
							}
						}}
					/>
					<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
					<Tooltip
						content={<ChartTooltip />}
						labelFormatter={(label) => {
							try {
								return formatChartDate(new Date(label), lang, { withYear: false });
							} catch (e) {
								return String(label);
							}
						}}
					/>
					<Line
						type="monotone"
						dataKey={dataKey as any}
						stroke={stroke}
						strokeWidth={2.5}
						dot={{ r: 4 }}
						activeDot={{ r: 6 }}
						name={name}
						strokeLinecap="round"
						strokeLinejoin="round"
						connectNulls
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

const MemoizedSingleLineChart = React.memo(SingleLineChart);
MemoizedSingleLineChart.displayName = 'SingleLineChart';

export default MemoizedSingleLineChart;
