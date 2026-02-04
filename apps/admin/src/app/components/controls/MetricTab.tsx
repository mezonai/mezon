import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import React from 'react';

type Props = {
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	iconWrapperClass?: string;
	iconWrapperStyle?: React.CSSProperties;
	label: string;
	tooltip?: string;
	value: string | number;
	activeClassName?: string;
	inactiveClassName?: string;
	labelClassActive?: string;
	labelClassInactive?: string;
	valueClassActive?: string;
	valueClassInactive?: string;
};

export default function MetricTab({
	active,
	onClick,
	icon,
	iconWrapperClass = 'p-2 rounded-full bg-[#5865F2]',
	iconWrapperStyle,
	label,
	tooltip,
	value,
	activeClassName = 'border-2 border-[#5865F2] bg-[#5865F2] text-white',
	inactiveClassName = 'border dark:border-[#4d4f52] border-gray-200 bg-white dark:bg-[#2b2d31] hover:bg-gray-100 dark:hover:bg-[#383a40]',
	labelClassActive = 'text-sm font-medium text-white',
	labelClassInactive = 'text-sm font-medium text-gray-600 dark:text-textSecondary',
	valueClassActive = 'text-xl font-bold text-white',
	valueClassInactive = 'text-xl font-bold text-gray-900 dark:text-white'
}: Props) {
	const base = 'group flex-1 px-3 py-2 rounded-md transition-colors focus:outline-none';
	const classes = `${base} ${active ? activeClassName : inactiveClassName}`;

	return (
		<button onClick={onClick} className={classes}>
			<div className="flex items-center">
				<div className={iconWrapperClass} style={iconWrapperStyle}>
					{icon}
				</div>
				<div className="ml-3 text-left">
					{tooltip ? (
						<Tooltip overlay={tooltip} placement="top">
							<div className={active ? labelClassActive : labelClassInactive}>{label}</div>
						</Tooltip>
					) : (
						<div className={active ? labelClassActive : labelClassInactive}>{label}</div>
					)}
					<div className={active ? valueClassActive : valueClassInactive}>{value}</div>
				</div>
			</div>
		</button>
	);
}
