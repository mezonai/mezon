import { useTheme } from '@mezon/mobile-ui';
import { useMezon } from '@mezon/transport';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import type { IDevice } from './DeviceItem';
import DeviceItem from './DeviceItem';
import { style } from './styles';

const DeviceManage = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['setting']);
	const [loading, setLoading] = useState(true);
	const { socketRef } = useMezon();
	const [allDevices, setAllDevices] = useState<IDevice[]>([]);

	const fetchDevicesFromSocket = useCallback(async () => {
		try {
			const socket = socketRef?.current;
			if (socket?.isOpen()) {
				const data = await socket.listDataSocket({
					api_name: 'ListLogedDevice'
				});
				const deviceList = data?.['list_loged_device'];
				if (deviceList) {
					setAllDevices(deviceList?.devices);
				}
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, [socketRef]);

	useEffect(() => {
		fetchDevicesFromSocket();
	}, []);

	const currentDeviceItem: IDevice = useMemo(() => {
		const seconds = Math.floor(Date.now() / 1000);
		return {
			device_id: '0',
			device_name: 'current',
			ip: 'current',
			last_active_seconds: seconds.toString(),
			login_at_seconds: seconds.toString(),
			platform: 'Mobile',
			status: 0,
			is_current_device: true,
			location: 'en'
		};
	}, []);

	const renderItem = ({ item }: { item: IDevice }) => <DeviceItem item={item} />;

	return (
		<View style={styles.container}>
			<View style={styles.padding}>
				<Text style={styles.description}>{t('deviceSettings.description1')}</Text>
				<Text style={styles.description}>{t('deviceSettings.description2')}</Text>
				{loading && !allDevices?.length && (
					<View style={styles.containerLoading}>
						<Flow color={themeValue.textDisabled} />
					</View>
				)}
				{!loading && allDevices?.length > 0 && <DeviceItem item={currentDeviceItem} />}
				{!loading && !allDevices?.length && <FlatList data={allDevices} keyExtractor={(item) => item?.device_id} renderItem={renderItem} />}
			</View>
		</View>
	);
};

export default DeviceManage;
