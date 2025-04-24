import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, NativeModules, Platform } from 'react-native';
import { DeviceContextType } from './types';

export const DeviceContext = createContext<DeviceContextType | null>(null);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isTabletLandscape, setIsTabletLandscape] = useState<boolean>(false);

	const checkTablet = async (): Promise<boolean> => {
		try {
			return Platform.OS === 'ios' ? await NativeModules.DeviceUtilsIOS.isTablet() : await NativeModules.DeviceUtils.isTablet();
		} catch (error) {
			console.error('Error checking if device is a tablet:', error);
			return false;
		}
	};

	const checkOrientation = useCallback(async () => {
		const { width, height } = Dimensions.get('window');
		const isLandscape = width > height;
		const isTablet = await checkTablet();
		if (isTablet && isLandscape) {
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
