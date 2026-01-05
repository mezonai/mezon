import {
	fetchListLoggedDevices,
	selectAllDevices,
	selectCurrentDevice,
	selectDevicesLoadingStatus,
	selectOtherDevices,
	useAppDispatch,
	useAppSelector,
	type IDevice
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { convertTimeString, getPlatformLabel, isMobilePlatform } from '@mezon/utils';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type SettingDevicesProps = {
	menuIsOpen: boolean;
};

const DeviceIcon = ({ platform }: { platform?: string }) => {
	if (isMobilePlatform(platform)) {
		return (
			<div className="w-12 h-12 rounded-full bg-theme-setting-nav flex items-center justify-center">
				<Icons.DeviceMobileIcon className="w-6 h-6 text-theme-primary-active" />
			</div>
		);
	}
	return (
		<div className="w-12 h-12 rounded-full bg-theme-setting-nav flex items-center justify-center">
			<Icons.DeviceDesktopIcon className="w-6 h-6 text-theme-primary-active" />
		</div>
	);
};

type DeviceItemProps = {
	device: IDevice;
	isCurrent?: boolean;
	t: (key: string) => string;
	onRemove?: (deviceId: string) => void;
};

const formatDeviceDate = (date: string | Date | undefined, t: (key: string) => string): string => {
	if (!date) return '';
	const dateStr = date instanceof Date ? date.toISOString() : String(date);
	return convertTimeString(dateStr, t);
};

const DeviceItem = ({ device, isCurrent, t, onRemove }: DeviceItemProps) => {
	const { platform, deviceName, location, lastActive } = device;

	const formattedLastActive = formatDeviceDate(lastActive, t);
	const platformLabel = getPlatformLabel(platform);

	return (
		<div className="flex items-center justify-between py-4 border-b-theme-primary last:border-b-0">
			<div className="flex items-center gap-4">
				<DeviceIcon platform={platform} />
				<div>
					<div className="flex items-center gap-2">
						<span className="text-theme-primary-active font-semibold text-sm">{platformLabel}</span>
						{deviceName && (
							<span className="btn-primary text-theme-primary-active  text-xs px-2 py-0.5 rounded font-medium">
								{deviceName.toUpperCase()}
							</span>
						)}
					</div>
					<div className="text-theme-primary text-sm mt-1">
						{location && <span>{location}</span>}
						{!isCurrent && location && formattedLastActive && <span> · </span>}
						{!isCurrent && formattedLastActive && <span>{formattedLastActive}</span>}
					</div>
				</div>
			</div>
			{!isCurrent && onRemove && (
				<button
					onClick={() => onRemove(device.deviceId)}
					className="w-8 h-8 flex items-center hover:text-red-500 justify-center rounded-full hover:bg-theme-setting-nav text-theme-primary hover:text-theme-primary-active transition-colors"
					title={t('deviceSettings.removeDevice')}
				>
					<Icons.CloseIcon className="w-5 h-5" />
				</button>
			)}
		</div>
	);
};

const SettingDevices = ({ menuIsOpen }: SettingDevicesProps) => {
	const { t } = useTranslation('setting');
	const dispatch = useAppDispatch();

	const loadingStatus = useAppSelector(selectDevicesLoadingStatus);
	const currentDevice = useAppSelector(selectCurrentDevice);
	const otherDevices = useAppSelector(selectOtherDevices);
	const allDevices = useAppSelector(selectAllDevices);

	useEffect(() => {
		if (loadingStatus === 'not loaded') {
			dispatch(fetchListLoggedDevices());
		}
	}, [dispatch, loadingStatus]);

	const isLoading = loadingStatus === 'loading';
	const hasNoDevices = loadingStatus === 'loaded' && allDevices.length === 0;

	const handleRemoveDevice = (deviceId: string) => {
		void deviceId;
	};

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-full sbm:w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen === true ? 'sbm:min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar z-20`}
		>
			<h1 className="text-xl font-semibold tracking-wider text-theme-primary-active mb-6">{t('accountSettings.device')}</h1>

			<div className="mb-8">
				<p className="text-theme-primary text-sm leading-relaxed">{t('deviceSettings.description1')}</p>
				<p className="text-theme-primary text-sm leading-relaxed mt-4">{t('deviceSettings.description2')}</p>
			</div>

			{isLoading && (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary-active"></div>
				</div>
			)}

			{hasNoDevices && (
				<div className="text-center py-8">
					<p className="text-theme-primary text-sm">{t('deviceSettings.noDevices')}</p>
				</div>
			)}

			{!isLoading && currentDevice && (
				<div className="mb-8">
					<h2 className="text-theme-primary-active font-semibold text-lg mb-4">{t('deviceSettings.currentDevice')}</h2>
					<DeviceItem device={currentDevice} isCurrent={true} t={t} />
				</div>
			)}

			{!isLoading && otherDevices.length > 0 && (
				<div className="mb-8">
					<h2 className="text-theme-primary-active font-semibold text-lg mb-4">{t('deviceSettings.otherDevices')}</h2>
					<div>
						{otherDevices.map((device) => (
							<DeviceItem key={device.deviceId} device={device} t={t} onRemove={handleRemoveDevice} />
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default SettingDevices;
