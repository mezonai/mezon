import { Menu, MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FriendSortOrder } from './friendSorting';

const sortOrders: FriendSortOrder[] = ['recentActivity', 'recentlyAdded', 'nameAscending', 'nameDescending'];

type FriendSortProps = {
	value: FriendSortOrder;
	onChange: (value: FriendSortOrder) => void;
};

const FriendSort = ({ value, onChange }: FriendSortProps) => {
	const { t } = useTranslation('friendsPage');
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Menu
			visible={isOpen}
			onVisibleChange={setIsOpen}
			placement="bottomRight"
			menu={
				<div
					className="p-1 min-w-[200px]"
					role="group"
					aria-label={t('sort.label')}
					onKeyDown={(event) => {
						if (event.key === 'Escape') setIsOpen(false);
					}}
				>
					{sortOrders.map((order) => (
						<button
							key={order}
							type="button"
							aria-pressed={value === order}
							className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg text-sm text-theme-primary bg-item-hover"
							onClick={() => {
								onChange(order);
								setIsOpen(false);
							}}
						>
							{t(`sort.${order}`)}
							{value === order && <MezonIcon icon={MzIcons16.mzCheck} className="text-[var(--mz-icon)]" />}
						</button>
					))}
				</div>
			}
		>
			<button
				type="button"
				aria-expanded={isOpen}
				aria-label={t('sort.current', { order: t(`sort.${value}`) })}
				title={t(`sort.${value}`)}
				className="flex items-center justify-center gap-2 shrink-0 h-[44px] px-3 rounded-lg border-theme-primary text-theme-primary bg-button-hover"
				data-e2e={generateE2eId('friend_page.button.sort')}
			>
				<MezonIcon icon={MzIcons20.mzSwap} className="rotate-90 text-[var(--mz-icon)]" />
				{t('sort.label')}
			</button>
		</Menu>
	);
};

export default FriendSort;
