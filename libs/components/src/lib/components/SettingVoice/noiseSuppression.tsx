import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VolumeSlider } from './VolumeSlider';

export type NoiseSuppressionModel = 'off' | 'browser' | 'ai';

export const NOISE_MODELS: NoiseSuppressionModel[] = ['off', 'browser', 'ai'];

export interface NoiseSuppressionState {
	enabled: boolean;
	model: NoiseSuppressionModel;
	level: number;
}

export const isValidNoiseSuppressionModel = (value: string | null): value is NoiseSuppressionModel => {
	return !!value && NOISE_MODELS.includes(value as NoiseSuppressionModel);
};

export const getNoiseSuppressionMediaConstraints = (
	inputDeviceId: string,
	state: Pick<NoiseSuppressionState, 'enabled' | 'model'>
): MediaTrackConstraints => {
	const useNoiseSuppression = state.enabled && state.model !== 'off';
	return {
		...(inputDeviceId ? { deviceId: { exact: inputDeviceId } } : {}),
		noiseSuppression: useNoiseSuppression,
		echoCancellation: useNoiseSuppression,
		autoGainControl: useNoiseSuppression
	};
};

export const applyNoiseSuppressionModel = (audioContext: AudioContext, inputNode: AudioNode, state: NoiseSuppressionState): AudioNode => {
	if (!state.enabled || state.model === 'off') {
		return inputNode;
	}

	const normalizedLevel = Math.max(0, Math.min(1, state.level / 100));
	let processingNode: AudioNode = inputNode;

	const highPass = audioContext.createBiquadFilter();
	highPass.type = 'highpass';
	highPass.frequency.value = 90;
	processingNode.connect(highPass);
	processingNode = highPass;

	const compressor = audioContext.createDynamicsCompressor();
	compressor.threshold.value = -35 - normalizedLevel * 20;
	compressor.knee.value = 15;
	compressor.ratio.value = 2 + normalizedLevel * 6;
	compressor.attack.value = 0.003;
	compressor.release.value = 0.2;
	processingNode.connect(compressor);
	processingNode = compressor;

	if (state.model === 'ai') {
		const lowPass = audioContext.createBiquadFilter();
		lowPass.type = 'lowpass';
		lowPass.frequency.value = 9000 - normalizedLevel * 3500;
		processingNode.connect(lowPass);
		processingNode = lowPass;
	}

	return processingNode;
};

interface NoiseSuppressionControlProps {
	model: NoiseSuppressionModel;
	enabled: boolean;
	level: number;
	onEnabledChange: (enabled: boolean) => void;
	onModelChange: (model: NoiseSuppressionModel) => void;
	onLevelChange: (level: number) => void;
	t: (key: string) => string;
}

const NoiseSuppressionControlComponent = ({
	model,
	enabled,
	level,
	onEnabledChange,
	onModelChange,
	onLevelChange,
	t
}: NoiseSuppressionControlProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const options = useMemo(
		() => [
			{ id: 'off' as const, label: t('setting:voice.noiseSuppressionModels.off') },
			{ id: 'browser' as const, label: t('setting:voice.noiseSuppressionModels.browser') },
			{ id: 'ai' as const, label: t('setting:voice.noiseSuppressionModels.ai') }
		],
		[t]
	);

	const selectedOption = useMemo(() => options.find((o) => o.id === model) || options[0], [options, model]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [isOpen]);

	return (
		<div className="space-y-4 pt-4">
			<div className="space-y-3">
				<div className="text-lg font-bold text-theme-primary-active tracking-wide">{t('setting:voice.noiseSuppressionModel')}</div>
				<label className="flex items-center gap-2 text-sm text-theme-primary">
					<input
						type="checkbox"
						checked={enabled}
						onChange={(e) => {
							const nextEnabled = e.target.checked;
							onEnabledChange(nextEnabled);
							if (!nextEnabled) {
								onModelChange('off');
							} else if (model === 'off') {
								onModelChange('ai');
							}
						}}
					/>
					<span>{t('setting:voice.noiseSuppressionEnabled')}</span>
				</label>
				<div className="relative" ref={dropdownRef}>
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className="w-full rounded-md bg-theme-setting-primary border border-theme-primary px-3 py-2 text-sm text-left flex items-center justify-between hover:border-theme-primary-active transition-colors"
					>
						<span className="truncate flex-1">{selectedOption?.label}</span>
						<svg
							className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{isOpen && (
						<div className="absolute w-full mt-1 bg-theme-setting-primary border border-theme-primary rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
							{options.map((option) => (
								<button
									key={option.id}
									type="button"
									onClick={() => {
										onModelChange(option.id);
										onEnabledChange(option.id !== 'off');
										setIsOpen(false);
									}}
									className={`w-full px-3 py-2 text-sm text-left transition-colors ${
										option.id === model ? 'bg-theme-primary text-theme-primary-active' : 'text-theme-primary hover:bg-gray-700/50'
									}`}
								>
									<span className="truncate block">{option.label}</span>
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			<VolumeSlider
				value={enabled ? level / 100 : 0}
				onChange={(value) => onLevelChange(Math.round(value * 100))}
				label={t('setting:voice.noiseSuppressionStrength')}
				disabled={!enabled}
			/>
		</div>
	);
};

export const NoiseSuppressionControl = React.memo(NoiseSuppressionControlComponent);
