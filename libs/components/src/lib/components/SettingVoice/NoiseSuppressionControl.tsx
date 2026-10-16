import { Icons } from '@mezon/ui';
import { getNoiseSuppressionAudioCaptureOptions } from '@mezon/utils';
import { useTranslation } from 'react-i18next';

interface NoiseSuppressionControlProps {
	className?: string;
	noiseSuppressionEnabled?: boolean;
	onNoiseSuppressionEnabledChange?: (enabled: boolean) => void;
	isTesting: boolean;
	getInputTrack?: () => MediaStreamTrack | undefined;
}

export const NoiseSuppressionControl = ({
	className = '',
	noiseSuppressionEnabled = false,
	onNoiseSuppressionEnabledChange,
	isTesting,
	getInputTrack
}: NoiseSuppressionControlProps) => {
	const { t } = useTranslation(['setting']);

	const isSupported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getSupportedConstraints().noiseSuppression);

	const toggleNoiseSuppression = () => {
		if (!isSupported) return;
		const enabled = !noiseSuppressionEnabled;
		onNoiseSuppressionEnabledChange?.(enabled);
		// Apply to the running mic test, if any
		const audioTrack = isTesting ? getInputTrack?.() : undefined;
		audioTrack?.applyConstraints(getNoiseSuppressionAudioCaptureOptions(enabled)).catch((error) => {
			console.warn('Failed to apply noise suppression to the mic test:', error);
		});
	};

	return (
		<div className={`space-y-4 ${className}`.trim()}>
			<div className="text-lg font-bold pt-4 text-theme-primary-active tracking-wide">{t('setting:voice.noiseSuppression.title')}</div>
			<button
				onClick={toggleNoiseSuppression}
				disabled={!isSupported}
				className={`w-10 h-10 rounded-md flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed ${
					isSupported
						? noiseSuppressionEnabled
							? 'bg-item-theme-hover text-theme-primary-active'
							: 'bg-item-theme-hover text-red-500'
						: 'bg-item-theme-hover text-theme-primary-hover'
				}`}
				aria-label={t('setting:voice.noiseSuppression.toggleAriaLabel')}
			>
				<Icons.NoiseSupressionIcon className="w-5 h-5" disabled={!noiseSuppressionEnabled} />
			</button>
		</div>
	);
};
