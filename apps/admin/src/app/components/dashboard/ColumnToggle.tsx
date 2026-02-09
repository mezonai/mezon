import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import React from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
	ariaLabel?: string;
	checked: boolean;
	onChange: React.ChangeEventHandler<HTMLInputElement> | (() => void);
	className?: string;
};

export default function ColumnToggle({ ariaLabel, checked, onChange, className }: Props) {
	const { t } = useTranslation('dashboard');

	return (
		<Tooltip overlay={checked ? t('table.includedInExport') : t('table.notIncludedInExport')} placement="top">
			<input
				aria-label={ariaLabel}
				type="checkbox"
				className={className ?? 'h-4 w-4 rounded border dark:border-[#4d4f52] accent-[#5865F2] cursor-pointer'}
				checked={checked}
				onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
			/>
		</Tooltip>
	);
}
