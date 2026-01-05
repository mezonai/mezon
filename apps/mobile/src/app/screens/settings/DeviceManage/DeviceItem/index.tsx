import { useTheme } from '@mezon/mobile-ui';
import type { IDevice } from '@mezon/store-mobile';
import { convertTimeString, getPlatformLabel, isMobilePlatform } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

type DeviceItemProps = {
	item: IDevice;
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
	const formattedLastActive = formatDeviceDate(item?.last_active, t);
	const platformLabel = getPlatformLabel(item?.platform);
	return (
		<View style={styles.container}>
			<MezonIconCDN icon={isMobilePlatform(item?.platform) ? IconCDN.mobileDeviceIcon : IconCDN.deviceDestopIcon} color={themeValue.text} />
			<View style={styles.itemInfo}>
				<View style={styles.platformInfo}>
					<Text style={styles.platformName}>{platformLabel}</Text>
					<View style={styles.deviceName}>
						<Text style={styles.deviceText}>{item?.device_name}</Text>
					</View>
				</View>
				<View style={styles.platformInfo}>
					<Text style={styles.text}>{`${item?.location} - ${formattedLastActive.toString()}`}</Text>
				</View>
			</View>
		</View>
	);
};
export default DeviceItem;
