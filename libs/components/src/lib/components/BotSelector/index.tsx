import { Icons } from '@mezon/ui';
import { BotInfo } from '@mezon/utils';
import Tooltip from 'rc-tooltip';
import { memo, useState } from 'react';

export interface BotSelectorProps {
	bots: BotInfo[];
	selectedBotId?: string;
	onBotSelect: (botId: string) => void;
	className?: string;
}

export function BotSelector({ bots, selectedBotId, onBotSelect, className = '' }: BotSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);

	const selectedBot = bots.find((bot) => bot.id === selectedBotId) || bots[0];

	const handleBotSelect = (botId: string) => {
		onBotSelect(botId);
		setIsOpen(false);
	};

	const renderBotList = () => (
		<div className="w-64 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-bgPrimary dark:border-gray-600">
			<div className="py-1">
				{bots.map((bot) => (
					<button
						key={bot.id}
						className={`flex items-center w-full px-2 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
							selectedBotId === bot.id
								? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
								: 'text-gray-700 dark:text-gray-200'
						}`}
						onClick={() => handleBotSelect(bot.id)}
						type="button"
					>
						{bot.avatar && <span className="mr-3 text-lg">{bot.avatar}</span>}
						<div className="flex-1 min-w-0">
							<div className="font-medium">{bot.name}</div>
							{bot.description && (
								<div className="flex items-center gap-1">
									<div className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
										{bot.description.length > 30 ? `${bot.description.substring(0, 30)}...` : bot.description}
									</div>
									{bot.description.length > 30 && (
										<Tooltip
											overlay={<div className="max-w-xs p-2 text-sm">{bot.description}</div>}
											placement="top"
											trigger={['hover']}
										>
											<Icons.InfoIcon className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0" />
										</Tooltip>
									)}
								</div>
							)}
						</div>
					</button>
				))}
			</div>
		</div>
	);

	return (
		<div className={`relative ${className}`}>
			<Tooltip
				overlay={renderBotList()}
				placement="bottom"
				trigger={['click']}
				visible={isOpen}
				onVisibleChange={setIsOpen}
				overlayClassName="bot-selector-tooltip"
			>
				<button
					className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-bgPrimary dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
					type="button"
				>
					<div className="flex items-center">
						{selectedBot?.avatar && <span className="mr-2 text-lg">{selectedBot.avatar}</span>}
						<span className="truncate">{selectedBot?.name || 'Select Bot'}</span>
					</div>
					<svg
						className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</button>
			</Tooltip>
		</div>
	);
}

export default memo(BotSelector);
