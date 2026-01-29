import React, { useEffect, useMemo, useRef, useState } from 'react';

interface DeviceSelectorProps {
	devices: MediaDeviceInfo[];
	value: string;
	onChange: (deviceId: string) => void;
	label: string;
	disabled: boolean;
	t: (key: string) => string;
}

const DeviceSelectorComponent = ({ devices, value, onChange, label, disabled, t }: DeviceSelectorProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const options = useMemo(
		() =>
			devices.map((d) => ({
				id: d.deviceId,
				label: d.label || t('setting:voice.unnamedDevice')
			})),
		[devices, t]
	);

	const selectedOption = useMemo(
		() => options.find((o) => o.id === value) || (options.length === 0 ? { id: '', label: t('setting:voice.noDevices') } : options[0]),
		[options, value, t]
	);

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

	const handleSelect = (deviceId: string) => {
		onChange(deviceId);
		setIsOpen(false);
	};

	return (
		<div className="space-y-4">
			<div className="text-lg font-bold text-theme-primary-active tracking-wide">{label}</div>
			<div className="relative" ref={dropdownRef}>
				<button
					type="button"
					onClick={() => !disabled && setIsOpen(!isOpen)}
					disabled={disabled}
					className="w-full rounded-md bg-theme-setting-primary border border-theme-primary px-3 py-2 text-sm text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed hover:border-theme-primary-active transition-colors"
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
						{options.length === 0 ? (
							<div className="px-3 py-2 text-sm text-theme-primary-hover">{t('setting:voice.noDevices')}</div>
						) : (
							options.map((option) => (
								<button
									key={option.id}
									type="button"
									onClick={() => handleSelect(option.id)}
									className={`w-full px-3 py-2 text-sm text-left transition-colors ${
										option.id === value ? 'bg-theme-primary text-theme-primary-active' : 'text-theme-primary hover:bg-gray-700/50'
									}`}
								>
									<span className="truncate block">{option.label}</span>
								</button>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export const DeviceSelector = React.memo(DeviceSelectorComponent);
