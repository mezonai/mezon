import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const useTabletLandscape = () => {
	return false;
	const [isTabletLandscape, setIsTabletLandscape] = useState<boolean>(false);
	const checkOrientation = useCallback(() => {
		const { width, height } = Dimensions.get('window');
		const isLandscape = width > height;

		if (DeviceInfo.isTablet() && isLandscape) {
			setIsTabletLandscape(true);
		} else {
			setIsTabletLandscape(false);
		}
	}, []);

	useEffect(() => {
		checkOrientation();

		const subscription = Dimensions.addEventListener('change', checkOrientation);

		return () => subscription?.remove();
	}, [checkOrientation]);

	return useMemo(() => isTabletLandscape, [isTabletLandscape]);
};

export default useTabletLandscape;
