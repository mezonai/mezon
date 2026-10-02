import { Icons } from '@mezon/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface SfuAudioDeviceMenuProps {
	inputDevices: MediaDeviceInfo[];
	outputDevices?: MediaDeviceInfo[];
	selectedInputDeviceId?: string;
	selectedOutputDeviceId?: string;
	onSelectInputDevice: (deviceId: string) => void;
	onSelectOutputDevice?: (deviceId: string) => void;
}

function getAudioDeviceSubtitle(devices: MediaDeviceInfo[], selectedDeviceId: string | undefined, systemDefaultLabel: string): string {
	if (!devices || devices.length === 0) return systemDefaultLabel;
	const active =
		devices.find((d) => d.deviceId === selectedDeviceId) ||
		(selectedDeviceId === 'default' ? devices.find((d) => d.deviceId === 'default') : undefined) ||
		devices[0];
	if (!active) return systemDefaultLabel;
	const label = active.label?.trim();
	if (label) return label;
	if (active.deviceId === 'default') return systemDefaultLabel;
	return systemDefaultLabel;
}

function isDeviceSelected(device: MediaDeviceInfo, list: MediaDeviceInfo[], selectedId: string | undefined): boolean {
	const active =
		list.find((d) => d.deviceId === selectedId) || (selectedId === 'default' ? list.find((d) => d.deviceId === 'default') : undefined) || list[0];
	return active?.deviceId === device.deviceId;
}

export const SfuAudioDeviceMenu = ({
	inputDevices,
	outputDevices = [],
	selectedInputDeviceId,
	selectedOutputDeviceId,
	onSelectInputDevice,
	onSelectOutputDevice
}: SfuAudioDeviceMenuProps) => {
	const { t } = useTranslation('channelVoice');
	const [isOpen, setIsOpen] = useState(false);
	const [expandedDevice, setExpandedDevice] = useState<'input' | 'output' | null>(null);
	const [flyoutSide, setFlyoutSide] = useState<'right' | 'left'>('right');
	const menuRef = useRef<HTMLDivElement>(null);

	const systemDefaultLabel = t('device.systemDefault', { defaultValue: 'System default' });
	const inputSubtitle = useMemo(
		() => getAudioDeviceSubtitle(inputDevices, selectedInputDeviceId, systemDefaultLabel),
		[inputDevices, selectedInputDeviceId, systemDefaultLabel]
	);
	const outputSubtitle = useMemo(
		() => getAudioDeviceSubtitle(outputDevices, selectedOutputDeviceId, systemDefaultLabel),
		[outputDevices, selectedOutputDeviceId, systemDefaultLabel]
	);

	useEffect(() => {
		if (!isOpen) return;
		const closeMenu = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
				setExpandedDevice(null);
			}
		};
		document.addEventListener('mousedown', closeMenu);
		return () => document.removeEventListener('mousedown', closeMenu);
	}, [isOpen]);

	useEffect(() => {
		if (!expandedDevice || !menuRef.current) return;
		const rect = menuRef.current.getBoundingClientRect();
		if (window.innerWidth - rect.right < 280) {
			setFlyoutSide('left');
		} else {
			setFlyoutSide('right');
		}
	}, [expandedDevice]);

	const flyoutPlacementClass = flyoutSide === 'right' ? 'left-full ml-1.5' : 'right-full mr-1.5';

	return (
		<div ref={menuRef} className="absolute bottom-0 right-0 z-30">
			<button
				type="button"
				title={t('device.audioSettings', { defaultValue: 'Audio settings' })}
				aria-label={t('device.audioSettings', { defaultValue: 'Audio settings' })}
				className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-600 bg-zinc-900 hover:border-zinc-400 transition-colors"
				onClick={(event) => {
					event.stopPropagation();
					setIsOpen((value) => {
						if (value) setExpandedDevice(null);
						return !value;
					});
				}}
			>
				{isOpen ? <Icons.VoiceArowUpIcon className="h-3 w-3" /> : <Icons.VoiceArowDownIcon className="h-3 w-3" />}
			</button>

			{isOpen && (
				<div className="absolute bottom-7 right-0 w-[240px] rounded-xl bg-[#1e1a38] border border-[#312c58] text-white shadow-2xl z-40 overflow-visible max-md:fixed max-md:inset-x-4 max-md:bottom-16 max-md:w-auto">
					{/* Input device item */}
					<div className="relative border-b border-[#312c58]">
						<div
							className={`px-4 py-3 hover:bg-[#2c274f] cursor-pointer flex gap-3 justify-between items-center transition-colors duration-200 rounded-t-xl ${
								expandedDevice === 'input' ? 'bg-[#2c274f]' : ''
							}`}
							onClick={(e) => {
								e.stopPropagation();
								setExpandedDevice(expandedDevice === 'input' ? null : 'input');
							}}
						>
							<div className="flex flex-col flex-1 min-w-0 justify-start">
								<div className="text-white font-medium text-sm">{t('device.inputDevice', { defaultValue: 'Input device' })}</div>
								<div className="text-[#8c88a8] text-xs truncate overflow-hidden whitespace-nowrap">{inputSubtitle}</div>
							</div>
							<Icons.ArrowRight defaultSize="w-4 h-4" defaultFill1="rgba(249,249,249,0.7)" className="shrink-0 text-white/70" />
						</div>

						{expandedDevice === 'input' && (
							<div
								className={`z-50 rounded-xl bg-[#1e1a38] border border-[#312c58] overflow-hidden min-w-[260px] max-w-[320px] max-h-[320px] overflow-y-auto shadow-2xl p-1.5 absolute bottom-0 ${flyoutPlacementClass} max-md:static max-md:left-auto max-md:bottom-auto max-md:ml-0 max-md:mr-0 max-md:w-full max-md:max-h-[220px] max-md:rounded-none max-md:border-x-0 max-md:border-b-0 max-md:border-t max-md:border-[#312c58] max-md:shadow-none max-md:bg-[#16142a]`}
							>
								{inputDevices.length ? (
									inputDevices.map((device) => {
										const active = isDeviceSelected(device, inputDevices, selectedInputDeviceId);
										return (
											<button
												key={device.deviceId}
												type="button"
												className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-[#2c274f] ${
													active ? 'text-blue-400 bg-[#2c274f]/60' : 'text-white'
												}`}
												onClick={(e) => {
													e.stopPropagation();
													onSelectInputDevice(device.deviceId);
													setExpandedDevice(null);
													setIsOpen(false);
												}}
											>
												{active ? (
													<Icons.Check defaultSize="w-4 h-4" className="shrink-0 text-blue-400" />
												) : (
													<span className="w-4 h-4 shrink-0" />
												)}
												<div className="flex flex-col flex-1 min-w-0">
													<span className="truncate overflow-hidden whitespace-nowrap">
														{device.label || systemDefaultLabel}
													</span>
													{device.deviceId === 'default' && !device.label?.trim() && (
														<span className="text-[#8c88a8] text-xs">{systemDefaultLabel}</span>
													)}
												</div>
											</button>
										);
									})
								) : (
									<p className="px-3 py-2 text-xs text-neutral-400">
										{t('device.noInputDevices', { defaultValue: 'No input devices found' })}
									</p>
								)}
							</div>
						)}
					</div>

					{/* Output device item */}
					<div className="relative">
						<div
							className={`px-4 py-3 hover:bg-[#2c274f] cursor-pointer flex gap-3 justify-between items-center transition-colors duration-200 rounded-b-xl ${
								expandedDevice === 'output' ? 'bg-[#2c274f]' : ''
							}`}
							onClick={(e) => {
								e.stopPropagation();
								setExpandedDevice(expandedDevice === 'output' ? null : 'output');
							}}
						>
							<div className="flex flex-col flex-1 min-w-0 justify-start">
								<div className="text-white font-medium text-sm">{t('device.outputDevice', { defaultValue: 'Output device' })}</div>
								<div className="text-[#8c88a8] text-xs truncate overflow-hidden whitespace-nowrap">{outputSubtitle}</div>
							</div>
							<Icons.ArrowRight defaultSize="w-4 h-4" defaultFill1="rgba(249,249,249,0.7)" className="shrink-0 text-white/70" />
						</div>

						{expandedDevice === 'output' && (
							<div
								className={`z-50 rounded-xl bg-[#1e1a38] border border-[#312c58] overflow-hidden min-w-[260px] max-w-[320px] max-h-[320px] overflow-y-auto shadow-2xl p-1.5 absolute bottom-0 ${flyoutPlacementClass} max-md:static max-md:left-auto max-md:bottom-auto max-md:ml-0 max-md:mr-0 max-md:w-full max-md:max-h-[220px] max-md:rounded-none max-md:border-x-0 max-md:border-b-0 max-md:border-t max-md:border-[#312c58] max-md:shadow-none max-md:bg-[#16142a]`}
							>
								{outputDevices.length ? (
									outputDevices.map((device) => {
										const active = isDeviceSelected(device, outputDevices, selectedOutputDeviceId);
										return (
											<button
												key={device.deviceId}
												type="button"
												className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-[#2c274f] ${
													active ? 'text-blue-400 bg-[#2c274f]/60' : 'text-white'
												}`}
												onClick={(e) => {
													e.stopPropagation();
													onSelectOutputDevice?.(device.deviceId);
													setExpandedDevice(null);
													setIsOpen(false);
												}}
											>
												{active ? (
													<Icons.Check defaultSize="w-4 h-4" className="shrink-0 text-blue-400" />
												) : (
													<span className="w-4 h-4 shrink-0" />
												)}
												<div className="flex flex-col flex-1 min-w-0">
													<span className="truncate overflow-hidden whitespace-nowrap">
														{device.label || systemDefaultLabel}
													</span>
													{device.deviceId === 'default' && !device.label?.trim() && (
														<span className="text-[#8c88a8] text-xs">{systemDefaultLabel}</span>
													)}
												</div>
											</button>
										);
									})
								) : (
									<p className="px-3 py-2 text-xs text-neutral-400">
										{t('device.noOutputDevices', { defaultValue: 'No output devices found' })}
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
