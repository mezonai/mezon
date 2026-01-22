import React from 'react';

type Props = {
	active?: boolean;
	payload?: any[];
	label?: React.ReactNode;
};

export default function ChartTooltip({ active, payload, label }: Props) {
	if (!active || !payload || !payload.length) return null;
	const item = payload[0];
	return (
		<div className="bg-white dark:bg-[#1e1f22] dark:border-[#3d3f43] border rounded p-2 text-sm text-gray-900 dark:text-gray-100">
			<div className="text-[12px] text-gray-500 dark:text-gray-300 mb-1">{label}</div>
			<div className="font-medium">
				{item.name}: {item.value}
			</div>
		</div>
	);
}
