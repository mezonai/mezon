import { useTheme } from '@mezon/mobile-ui';
import type { IDevice } from '@mezon/store-mobile';
import { fetchListLoggedDevices, selectAllDevices, selectDevicesLoadingStatus, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import DeviceItem from './DeviceItem';
import { style } from './styles';

const DeviceManage = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['setting']);
	const loadingStatus = useAppSelector(selectDevicesLoadingStatus);
	const allDevices = useAppSelector(selectAllDevices);
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(fetchListLoggedDevices());
	}, []);

	const renderItem = ({ item }: { item: IDevice }) => <DeviceItem item={item} />;

	return (
		<View style={styles.container}>
			<StatusBarHeight />
			<View style={styles.padding}>
				<Text style={styles.description}>{t('deviceSettings.description1')}</Text>
				<Text style={styles.description}>{t('deviceSettings.description2')}</Text>
				{loadingStatus === 'loading' && !allDevices?.length && (
					<View style={styles.containerLoading}>
						<Flow color={themeValue.textDisabled} />
					</View>
				)}
				{loadingStatus === 'loaded' && !allDevices?.length && <Text style={styles.noDevices}>{t('deviceSettings.noDevices')}</Text>}
				{loadingStatus === 'loaded' && allDevices?.length > 0 && (
					<FlatList data={allDevices} keyExtractor={(item) => item?.device_id} renderItem={renderItem} />
				)}
			</View>
		</View>
	);
};

export default DeviceManage;
