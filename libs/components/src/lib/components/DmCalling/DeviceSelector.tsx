import { Icons } from '@mezon/ui';
import { Dropdown } from 'flowbite-react';
import React, { ReactNode } from 'react';

type DeviceSelectorProps = {
	deviceList: MediaDeviceInfo[];
	currentDevice: MediaDeviceInfo | null;
	icon: ReactNode;
	onSelectDevice: (deviceId: string) => Promise<void>;
};

const DeviceSelector: React.FC<DeviceSelectorProps> = ({ deviceList, currentDevice, icon, onSelectDevice }) => {
	return (
		<Dropdown
			label={''}
			renderTrigger={() => (
				<div className="flex items-center border border-white h-full rounded-3xl cursor-pointer hover:bg-colorTextLightMode w-[250px]">
					{icon}
					{deviceList.length && (
						<div className="w-full h-fit px-2 overflow-hidden whitespace-nowrap text-ellipsis truncate">{currentDevice?.label || ''}</div>
					)}
				</div>
			)}
			className={'rounded-3xl'}
			dismissOnClick={true}
		>
			<div className="text-white p-1 w-auto min-w-max rounded">
				{deviceList.map((device) => (
					<div
						key={device.deviceId}
						className={`p-1 rounded-3xl hover:bg-colorTextLightMode w-full cursor-pointer flex gap-2 justify-between items-center ${device.deviceId === currentDevice?.deviceId && 'text-contentBrand'} `}
						onClick={() => onSelectDevice(device.deviceId)}
					>
						<div className={'h-5 w-5 flex justify-center items-center'}>
							{device.deviceId === currentDevice?.deviceId && <Icons.CheckIcon />}
						</div>
						<div className={'flex flex-1 justify-start'}>{device.label}</div>
					</div>
				))}
			</div>
		</Dropdown>
	);
};

export default DeviceSelector;
