import { Icons } from '@mezon/ui';
import Tooltip from 'rc-tooltip';
import { memo, useCallback, useState } from 'react';
import { useNoiseSuppressionControl } from './hooks/useNoiseSuppressionControl';

interface NoiseSuppressionControlProps {
	isShowMember?: boolean;
}

export const NoiseSuppressionControl = memo(({ isShowMember }: NoiseSuppressionControlProps) => {
	const [showTooltip, setShowTooltip] = useState(false);

	const { enabled, level, toggleNoiseSuppression, handleLevelChange: handleLevel } = useNoiseSuppressionControl();

	const handleLevelChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleLevel(Number(e.target.value));
		},
		[handleLevel]
	);

	const handleStopPropagation = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
	}, []);

	return enabled ? (
		<Tooltip
			placement="top"
			overlayClassName="w-64"
			visible={showTooltip && enabled}
			overlay={
				<div className="p-2" onClick={handleStopPropagation}>
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs font-semibold text-theme-primary-active">Noise Suppression</span>
						<span className="text-xs text-theme-primary-active">{level}%</span>
					</div>
					<input
						type="range"
						min="0"
						max="100"
						value={level}
						onChange={handleLevelChange}
						className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
						disabled={!enabled}
					/>
				</div>
			}
			onVisibleChange={setShowTooltip}
			destroyTooltipOnHide
		>
			<button
				onClick={toggleNoiseSuppression}
				className={`w-14 h-14 max-md:w-10 max-md:h-10 max-md:p-2 !rounded-full flex justify-center items-center border-none dark:border-none transition-colors ${
					isShowMember ? 'bg-zinc-500 dark:bg-zinc-900' : 'bg-zinc-700'
				} hover:bg-green-600 dark:hover:bg-green-700`}
			>
				<Icons.NoiseSupressionIcon className={`w-5 h-5 text-green-400`} />
			</button>
		</Tooltip>
	) : (
		<button
			onClick={toggleNoiseSuppression}
			className={`w-14 h-14 max-md:w-10 max-md:h-10 max-md:p-2 !rounded-full flex justify-center items-center border-none dark:border-none transition-colors ${
				isShowMember ? 'bg-zinc-500 dark:bg-zinc-900' : 'bg-zinc-700'
			} hover:bg-zinc-600 dark:hover:bg-zinc-800`}
		>
			<Icons.NoiseSupressionIcon className={`w-5 h-5 text-gray-400`} disabled />
		</button>
	);
});
