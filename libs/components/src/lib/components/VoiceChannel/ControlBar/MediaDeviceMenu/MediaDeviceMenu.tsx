import { computeMenuPosition } from '@livekit/components-core';
import { Icons } from '@mezon/ui';
import type { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import { ButtonHTMLAttributes, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MediaDeviceSelect } from './MediaDeviceSelect';

export interface MediaDeviceMenuProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	kind?: MediaDeviceKind;
	initialSelection?: string;
	onActiveDeviceChange?: (kind: MediaDeviceKind, deviceId: string) => void;
	tracks?: Partial<Record<MediaDeviceKind, LocalAudioTrack | LocalVideoTrack | undefined>>;
	requestPermissions?: boolean;
}

export function MediaDeviceMenu({
	kind,
	initialSelection,
	onActiveDeviceChange,
	tracks,
	requestPermissions = false,
	...props
}: MediaDeviceMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [updateRequired, setUpdateRequired] = useState<boolean>(true);
	const [needPermissions, setNeedPermissions] = useState(requestPermissions);

	const handleActiveDeviceChange = (kind: MediaDeviceKind, deviceId: string) => {
		setIsOpen(false);
		onActiveDeviceChange?.(kind, deviceId);
	};

	const button = useRef<HTMLButtonElement>(null);
	const tooltip = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (isOpen) {
			setNeedPermissions(true);
		}
	}, [isOpen]);

	useLayoutEffect(() => {
		if (button.current && tooltip.current && (devices || updateRequired)) {
			computeMenuPosition(button.current, tooltip.current)();
		}
		setUpdateRequired(false);
	}, [button, tooltip, devices, updateRequired]);

	const handleClickOutside = (event: MouseEvent) => {
		if (!tooltip.current || !button.current) return;
		if (!button.current.contains(event.target as Node) && !tooltip.current.contains(event.target as Node)) {
			setIsOpen(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<>
			<button
				className="lk-button !w-5 !h-5 !p-2 !absolute !bottom-0 !left-[36px] !rounded-full !border-2 !border-solid !border-[#111]"
				aria-pressed={isOpen}
				{...props}
				ref={button}
				onClick={(e) => {
					e.stopPropagation();
					setIsOpen(!isOpen);
				}}
			>
				{isOpen ? (
					<Icons.VoiceArowUpIcon className="w-4 h-4 bg-white text-black rounded-full" />
				) : (
					<Icons.VoiceArowDownIcon className="w-4 h-4" />
				)}
				{props.children}
			</button>
			{!props.disabled && (
				<div className="lk-device-menu" ref={tooltip} style={{ visibility: isOpen ? 'visible' : 'hidden', bottom: '0px', top: 'auto' }}>
					{kind && (
						<MediaDeviceSelect
							initialSelection={initialSelection}
							onActiveDeviceChange={(deviceId) => handleActiveDeviceChange(kind, deviceId)}
							onDeviceListChange={setDevices}
							kind={kind}
							track={tracks?.[kind]}
							requestPermissions={needPermissions}
						/>
					)}
				</div>
			)}
		</>
	);
}
