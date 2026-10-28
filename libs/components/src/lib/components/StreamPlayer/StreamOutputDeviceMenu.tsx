import { Icons } from '@mezon/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePreferredOutputDevice } from '../MezonSfuVoiceChannel/usePreferredOutputDevice';
import { StreamMenu } from './StreamMenu';

function deviceLabel(device: MediaDeviceInfo, systemDefaultLabel: string, unnamedLabel: string) {
	const label = device.label?.trim();
	if (label) return label;
	if (device.deviceId === 'default') return systemDefaultLabel;
	return unnamedLabel;
}

export function StreamOutputDeviceMenu({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
	const { t } = useTranslation('channelVoice');
	const { hasSetSinkId, outputDeviceId, outputDevices, changeOutputDevice } = usePreferredOutputDevice();
	const systemDefaultLabel = t('device.systemDefault');
	const unnamedLabel = t('setting:voice.unnamedDevice', { defaultValue: 'Unnamed device' });
	const options = useMemo(
		() => outputDevices.map((device) => ({ id: device.deviceId, label: deviceLabel(device, systemDefaultLabel, unnamedLabel) })),
		[outputDevices, systemDefaultLabel, unnamedLabel]
	);

	if (!hasSetSinkId || options.length === 0) return null;

	return (
		<StreamMenu
			label={t('device.outputDevice')}
			trigger={<Icons.Speaker className="h-5 w-5" />}
			options={options}
			selectedId={outputDeviceId}
			onSelect={changeOutputDevice}
			onOpenChange={onOpenChange}
		/>
	);
}
