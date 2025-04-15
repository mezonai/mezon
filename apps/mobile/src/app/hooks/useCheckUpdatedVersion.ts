import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import checkVersion from 'react-native-store-version';
import VersionInfo from 'react-native-version-info';

export const useCheckUpdatedVersion = () => {
	const navigation = useNavigation<any>();
	const [needUpdate, setNeedUpdate] = useState(false);

	const checkUpdatedVersion = async () => {
		try {
			const check = await checkVersion({
				version: VersionInfo.appVersion,
				iosStoreURL: process.env.NX_APP_STORE_URL,
				androidStoreURL: process.env.NX_GOOGLE_PLAY_URL,
				country: 'vn'
			});

			if (check.detail === 'remote > local') {
				// setNeedUpdate(true);
				// navigation.navigate(APP_SCREEN.SERVERS.STACK, {
				// 	screen: APP_SCREEN.SERVERS.UPDATE_GATE,
				// 	params: { storeUrl: Platform.OS === 'ios' ? process.env.NX_APP_STORE_URL : process.env.NX_GOOGLE_PLAY_URL }
				// });
			}
		} catch (error) {
			console.warn(error);
		}
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			checkUpdatedVersion();
		}, 2000);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { needUpdate };
};
