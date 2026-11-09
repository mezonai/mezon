import { Menu, MezonIcon, MzIcons20 } from '@mezon/ui';
import type { ReactElement, ReactNode } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type DeviceSelectorProps = {
	deviceList: MediaDeviceInfo[];
	currentDevice: MediaDeviceInfo | null;
	icon: ReactNode;
	onSelectDevice: (deviceId: string) => Promise<void>;
};

const DeviceSelector: React.FC<DeviceSelectorProps> = ({ deviceList, currentDevice, icon, onSelectDevice }) => {
	const { t } = useTranslation('channelVoice');
	const systemDefaultLabel = t('device.systemDefault');

	const menu = useMemo(() => {
		const menuItems: ReactElement[] = [];
		deviceList.forEach((device) =>
			menuItems.push(
				<div
					key={device.deviceId}
					className={`px-4 py-3 hover:bg-neutral-700 w-full cursor-pointer flex gap-3 justify-between items-center transition-colors duration-200`}
					onClick={() => onSelectDevice(device.deviceId)}
				>
					<div className={'flex flex-col flex-1 justify-start min-w-0'}>
						<div className={'text-white font-medium text-sm truncate'}>{device.label || '\u200b'}</div>
						{device.deviceId === 'default' && !device.label?.trim() && (
							<div className={'text-neutral-400 text-xs'}>{systemDefaultLabel}</div>
						)}
					</div>
					<MezonIcon icon={MzIcons20.mzChevronRight} className="text-white" />
				</div>
			)
		);
		return <div className="contents">{menuItems}</div>;
	}, [deviceList, onSelectDevice, systemDefaultLabel]);

	return (
		<Menu menu={menu} className={'rounded-lg bg-neutral-800 border border-neutral-700 shadow-lg min-w-[280px]'}>
			<div className="flex items-center h-full rounded-lg cursor-pointer hover:bg-neutral-600 transition-colors duration-200 px-3 min-w-0">
				{icon}
				{!!deviceList.length && (
					<div className="w-full h-fit px-2 overflow-hidden whitespace-nowrap text-ellipsis truncate text-white min-w-0">
						{currentDevice?.label || ''}
					</div>
				)}
			</div>
		</Menu>
	);
};

export default DeviceSelector;
