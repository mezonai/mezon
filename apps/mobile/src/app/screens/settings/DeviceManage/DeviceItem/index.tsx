import { useTheme } from '@mezon/mobile-ui';
import { convertTimeString, getPlatformLabel } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

export interface IDevice {
	device_id: string;
	device_name?: string;
	ip?: string;
	last_active_seconds?: string;
	login_at_seconds?: string;
	platform?: string;
	status?: number;
	is_current_device?: boolean;
	location?: string;
}

type DeviceItemProps = {
	item: IDevice;
};

export const DeviceType = {
	MOBILE: 'mobile',
	DESKTOP: 'desktop'
};

const formatDeviceDate = (date: string | Date | undefined, t: (key: string) => string): string => {
	if (!date) return '';
	const dateStr = date instanceof Date ? date.toISOString() : String(date);
	return convertTimeString(dateStr, t);
};

const DeviceItem = ({ item }: DeviceItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['setting']);
	const formattedLastActive = formatDeviceDate(new Date(Number(item?.last_active_seconds) * 1000), t);
	const platformLabel = getPlatformLabel(item?.platform);

	return (
		<View style={styles.container}>
			<MezonIconCDN
				icon={item?.platform?.toLowerCase() === DeviceType.MOBILE ? IconCDN.mobileDeviceIcon : IconCDN.deviceDestopIcon}
				color={themeValue.text}
			/>
			<View style={styles.itemInfo}>
				<View style={styles.platformInfo}>
					<Text style={styles.platformName}>{platformLabel}</Text>
					<View style={styles.deviceName}>
						<Text style={styles.deviceText}>{item?.device_name}</Text>
					</View>
				</View>
				<View style={styles.platformInfo}>
					<Text style={styles.text}>{`${item?.location} - ${formattedLastActive.toLocaleLowerCase()}`}</Text>
				</View>
			</View>
		</View>
	);
};
export default DeviceItem;
