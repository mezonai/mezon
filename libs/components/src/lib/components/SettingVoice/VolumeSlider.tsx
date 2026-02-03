import React from 'react';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

interface VolumeSliderProps {
	value: number;
	onChange: (value: number) => void;
	label: string;
	disabled?: boolean;
}

const VolumeSliderComponent = ({ value, onChange, label, disabled = false }: VolumeSliderProps) => {
	return (
		<div className="space-y-4">
			<div className="text-lg font-bold  text-theme-primary-active tracking-wide">{label}</div>
			<div className="flex items-center gap-3">
				<input
					type="range"
					min={0}
					max={100}
					value={Math.round(value * 100)}
					disabled={disabled}
					onChange={(e) => onChange(clamp01(Number(e.target.value) / 100))}
					className="w-full h-1 disabled:opacity-50 disabled:cursor-not-allowed"
				/>
				<div className="w-10 text-right text-xs text-theme-primary-hover">{Math.round(value * 100)}%</div>
			</div>
		</div>
	);
};

export const VolumeSlider = React.memo(VolumeSliderComponent);
