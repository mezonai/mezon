import { selectNoiseSuppressionEnabled, selectNoiseSuppressionLevel, useAppDispatch, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DeepFilterNoiseFilterProcessor } from 'deepfilternet3-noise-filter';
import { useCallback, type ChangeEvent } from 'react';
import { useSelector } from 'react-redux';

interface NoiseSuppressionControlProps {
	className?: string;
}

export const NoiseSuppressionControl = ({ className = '' }: NoiseSuppressionControlProps) => {
	const dispatch = useAppDispatch();
	const noiseSuppressionEnabled = useSelector(selectNoiseSuppressionEnabled);
	const noiseSuppressionLevel = useSelector(selectNoiseSuppressionLevel);
	const isSupported = DeepFilterNoiseFilterProcessor.isSupported();
	const isEnabled = isSupported && noiseSuppressionEnabled;

	const toggleNoiseSuppression = useCallback(() => {
		if (!isSupported) return;
		dispatch(voiceActions.setNoiseSuppressionEnabled(!noiseSuppressionEnabled));
	}, [dispatch, isSupported, noiseSuppressionEnabled]);

	const handleNoiseSuppressionLevelChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			if (!isSupported) return;
			dispatch(voiceActions.setNoiseSuppressionLevel(Number(e.target.value)));
		},
		[dispatch, isSupported]
	);

	return (
		<div className={`space-y-4 ${className}`.trim()}>
			<div className="text-lg font-bold pt-4 text-theme-primary-active tracking-wide">Noise Suppression</div>
			<div className="flex items-center gap-3">
				<button
					onClick={toggleNoiseSuppression}
					disabled={!isSupported}
					className={`w-10 h-10 rounded-md flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed ${
						isSupported
							? isEnabled
								? 'bg-item-theme-hover text-theme-primary-active'
								: 'bg-item-theme-hover text-red-500'
							: 'bg-item-theme-hover text-theme-primary-hover'
					}`}
					aria-label="Toggle noise suppression"
				>
					<Icons.NoiseSupressionIcon className="w-5 h-5">
						{!isEnabled && <path d="M3 21 L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
					</Icons.NoiseSupressionIcon>
				</button>
				<input
					type="range"
					min={0}
					max={100}
					value={noiseSuppressionLevel}
					onChange={handleNoiseSuppressionLevelChange}
					disabled={!isSupported || !noiseSuppressionEnabled}
					className="w-full h-1 disabled:opacity-50"
				/>
				<div className="w-10 text-right text-xs text-theme-primary-hover">{noiseSuppressionLevel}%</div>
			</div>
		</div>
	);
};
