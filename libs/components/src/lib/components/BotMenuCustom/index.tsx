import { BotMenuAction, BotMenuItem, SimpleBotMenu } from '@mezon/utils';
import { memo, useCallback } from 'react';

export interface BotMenuCustomProps {
	menu: SimpleBotMenu;
	onMenuItemClick?: (action: BotMenuAction, item: BotMenuItem) => void;
	className?: string;
}

export function BotMenuCustom({ menu, onMenuItemClick, className = '' }: BotMenuCustomProps) {
	const handleItemClick = useCallback(
		(item: BotMenuItem) => {
			onMenuItemClick?.(item.action, item);

			switch (item.action.type) {
				case 'uri':
					if (item.action.uri) {
						window.open(item.action.uri, '_blank');
					}
					break;
				case 'message':
					if (item.action.text) {
						// For now, we just trigger the callback
					}
					break;
				default:
					break;
			}
		},
		[onMenuItemClick]
	);

	const gridTemplateColumns = `repeat(${menu.grid.columns}, 1fr)`;
	const gridTemplateRows = `repeat(${menu.grid.rows}, 1fr)`;

	return (
		<div className={`bot-menu-custom ${className}`}>
			{menu.selected && <div className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">{menu.chatBarText}</div>}
			<div
				className="grid gap-1.5 rounded-lg font-mono text-xs font-bold"
				style={{
					gridTemplateColumns,
					gridTemplateRows
				}}
			>
				{menu.grid.items.map((item) => (
					<button
						key={item.id}
						className="flex items-center justify-center rounded-md p-1.5 transition-all duration-200 hover:opacity-80 active:scale-95 min-h-[32px]"
						style={{
							backgroundColor: item.backgroundColor || '#4F46E5',
							color: item.textColor || '#FFFFFF'
						}}
						onClick={() => handleItemClick(item)}
						title={item.action.label || item.label}
					>
						{item.icon && <span className="mr-1 text-sm">{item.icon}</span>}
						<span className="truncate text-xs">{item.label}</span>
					</button>
				))}
			</div>
		</div>
	);
}

export default memo(BotMenuCustom);
