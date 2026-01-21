import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SingleLineChart({
	data,
	dataKey,
	stroke,
	name,
	height = 350
}: {
	data: any[];
	dataKey: string;
	stroke: string;
	name: string;
	height?: number;
}) {
	// detect dark mode (Tailwind 'dark' class or system preference)
	const isDark =
		typeof window !== 'undefined' &&
		(document.documentElement.classList.contains('dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));
	return (
		<ResponsiveContainer width="100%" height={height}>
			<LineChart data={data}>
				<CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
				<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
				<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
				<Tooltip
					contentStyle={
						isDark
							? {
									backgroundColor: '#1e1f22',
									border: '1px solid #3d3f43',
									borderRadius: '4px',
									fontSize: '12px',
									color: '#e5e7eb'
								}
							: {
									backgroundColor: 'white',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '12px',
									color: '#111'
								}
					}
					itemStyle={isDark ? { color: '#e5e7eb' } : { color: '#111' }}
					labelStyle={isDark ? { color: '#c7c9cc' } : { color: '#666' }}
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
	);
}
