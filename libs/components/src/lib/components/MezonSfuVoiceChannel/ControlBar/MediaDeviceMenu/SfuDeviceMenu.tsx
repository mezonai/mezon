import { Icons } from '@mezon/ui';
import { useEffect, useRef, useState } from 'react';

interface SfuDeviceMenuProps {
	label: string;
	devices: MediaDeviceInfo[];
	selectedDeviceId: string;
	onSelect: (deviceId: string) => void;
}

export const SfuDeviceMenu = ({ label, devices, selectedDeviceId, onSelect }: SfuDeviceMenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		const closeMenu = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
		};
		document.addEventListener('mousedown', closeMenu);
		return () => document.removeEventListener('mousedown', closeMenu);
	}, [isOpen]);

	return (
		<div ref={menuRef} className="absolute bottom-0 right-0 z-30">
			<button
				type="button"
				title={label}
				aria-label={label}
				className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-600 bg-zinc-900"
				onClick={(event) => {
					event.stopPropagation();
					setIsOpen((value) => !value);
				}}
			>
				{isOpen ? <Icons.VoiceArowUpIcon className="h-3 w-3" /> : <Icons.VoiceArowDownIcon className="h-3 w-3" />}
			</button>
			{isOpen && (
				<div className="absolute bottom-7 right-0 min-w-[280px] rounded-lg bg-zinc-800 p-2 text-white shadow-2xl max-md:fixed max-md:inset-x-4 max-md:bottom-16 max-md:max-h-[50vh] max-md:min-w-0 max-md:overflow-y-auto">
					<p className="px-2 pb-2 text-xs font-semibold uppercase text-zinc-400">{label}</p>
					{devices.length ? (
						devices.map((device) => (
							<button
								key={device.deviceId}
								type="button"
								className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-zinc-700"
								onClick={() => {
									onSelect(device.deviceId);
									setIsOpen(false);
								}}
							>
								<span className="max-w-[220px] truncate">{device.label || label}</span>
								{device.deviceId === selectedDeviceId && <span className="text-blue-400">●</span>}
							</button>
						))
					) : (
						<p className="px-3 py-2 text-sm text-zinc-400">No devices found</p>
					)}
				</div>
			)}
		</div>
	);
};
