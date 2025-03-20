import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { DeviceContextType } from './types';

export const DeviceContext = createContext<DeviceContextType | null>(null);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

	const value = useMemo(() => {
		return {
			isTabletLandscape
		};
	}, [isTabletLandscape]);

	return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};
