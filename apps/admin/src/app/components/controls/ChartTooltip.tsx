import { formatChartDate } from '@mezon/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';

type TooltipPayloadItem = {
	name?: string;
	value?: string | number | null;
	[key: string]: unknown;
};

type Props = {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	label?: React.ReactNode;
};

export default function ChartTooltip({ active, payload, label }: Props) {
	const { i18n } = useTranslation();
	const lang = i18n?.language || 'en';

	if (!active || !payload || !payload.length) return null;
	const item = payload[0];

	let formattedLabel: React.ReactNode = label;
	if (label !== undefined && label !== null) {
		try {
			if (typeof label === 'string' || typeof label === 'number') {
				formattedLabel = formatChartDate(new Date(label as string | number), lang, { withYear: false });
			} else {
				formattedLabel = String(label);
			}
		} catch (e) {
			formattedLabel = String(label as any);
		}
	}

	return (
		<div className="bg-white dark:bg-[#1e1f22] dark:border-[#3d3f43] border rounded p-2 text-sm text-gray-900 dark:text-gray-100">
			<div className="text-[12px] text-gray-500 dark:text-gray-300 mb-1">{formattedLabel}</div>
			<div className="font-medium">
				{item.name}: {item.value}
			</div>
		</div>
	);
}
