import { Menu, MezonIcon, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import type { FocusEvent, KeyboardEvent } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FriendSortOrder } from './friendSorting';

type FriendSortProps = {
	value: FriendSortOrder;
	onChange: (value: FriendSortOrder) => void;
};

type SortOptionRowProps = {
	optionValue: FriendSortOrder;
	label: string;
	selected: boolean;
	onSelect: (value: FriendSortOrder) => void;
};

const SortOptionRow = ({ optionValue, label, selected, onSelect }: SortOptionRowProps) => {
	const handleClick = useCallback(() => {
		onSelect(optionValue);
	}, [onSelect, optionValue]);

	return (
		<button
			type="button"
			role="radio"
			aria-checked={selected}
			onClick={handleClick}
			className={`w-full flex items-center justify-between gap-4 px-3 py-2 rounded-md text-[14px] font-medium text-left cursor-pointer transition-colors ${selected ? 'bg-active-button text-theme-primary-active' : 'text-theme-primary text-theme-primary-hover bg-item-hover'}`}
		>
			<span className="whitespace-nowrap">{label}</span>
			<span
				aria-hidden="true"
				className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-current' : 'border-current opacity-60'}`}
			>
				{selected && <span className="w-2 h-2 rounded-full bg-current" />}
			</span>
		</button>
	);
};

const FriendSort = ({ value, onChange }: FriendSortProps) => {
	const { t } = useTranslation('friendsPage');
	const [open, setOpen] = useState(false);

	const handleSelect = useCallback(
		(nextValue: FriendSortOrder) => {
			onChange(nextValue);
			setOpen(false);
		},
		[onChange]
	);

	const handleVisibleChange = useCallback((visible: boolean) => {
		setOpen(visible);
	}, []);

	const handleRadioGroupFocus = useCallback((event: FocusEvent<HTMLDivElement>) => {
		if (event.target !== event.currentTarget) {
			return;
		}
		const target =
			event.currentTarget.querySelector<HTMLButtonElement>('[role="radio"][aria-checked="true"]') ||
			event.currentTarget.querySelector<HTMLButtonElement>('[role="radio"]');
		target?.focus();
	}, []);

	const handleRadioGroupKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
			return;
		}
		const radios = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
		if (radios.length === 0) {
			return;
		}
		event.preventDefault();
		const activeElement = event.currentTarget.ownerDocument.activeElement;
		const currentIndex = radios.findIndex((radio) => radio === activeElement);
		const delta = event.key === 'ArrowDown' ? 1 : -1;
		const fallbackIndex = event.key === 'ArrowDown' ? 0 : radios.length - 1;
		const nextIndex = currentIndex < 0 ? fallbackIndex : (currentIndex + delta + radios.length) % radios.length;
		radios[nextIndex]?.focus();
	}, []);

	const menu = useMemo(
		() => (
			<div
				role="radiogroup"
				tabIndex={-1}
				aria-label={t('sort.label')}
				onFocus={handleRadioGroupFocus}
				onKeyDown={handleRadioGroupKeyDown}
				className="flex flex-col gap-1"
			>
				<SortOptionRow optionValue="recent" label={t('sort.recent')} selected={value === 'recent'} onSelect={handleSelect} />
				<SortOptionRow optionValue="name" label={t('sort.name')} selected={value === 'name'} onSelect={handleSelect} />
			</div>
		),
		[handleRadioGroupFocus, handleRadioGroupKeyDown, handleSelect, t, value]
	);

	return (
		<Menu
			trigger="click"
			placement="bottomRight"
			visible={open}
			onVisibleChange={handleVisibleChange}
			align={{ offset: [0, 8] }}
			menu={menu}
			className="bg-theme-contexify border-theme-primary shadow-lg p-1.5 min-w-[220px]"
		>
			<button
				type="button"
				aria-expanded={open}
				aria-haspopup="true"
				data-e2e={generateE2eId('friend_page.button.sort')}
				className={`h-[44px] shrink-0 px-4 rounded-lg border-theme-primary text-theme-primary-hover bg-item-hover flex items-center gap-2 text-[15px] font-medium whitespace-nowrap cursor-pointer transition-colors ${open ? 'bg-active-button text-theme-primary-active' : 'bg-theme-input-primary text-theme-primary'}`}
			>
				<MezonIcon icon={MzIcons20.mzSwap} className="text-[var(--mz-icon)] rotate-90 shrink-0" />
				<span>{t('sort.label')}</span>
			</button>
		</Menu>
	);
};

export default memo(FriendSort);
