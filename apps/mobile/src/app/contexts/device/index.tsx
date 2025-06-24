import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import { DeviceContextType } from './types';

export const DeviceContext = createContext<DeviceContextType | null>(null);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isTabletLandscape, setIsTabletLandscape] = useState<boolean>(false);
	const isTabletRef = useRef<boolean | null>(null);

	const checkTablet = async (): Promise<boolean> => {
		// Cache tablet check result since device type doesn't change
		if (isTabletRef.current !== null) {
			return isTabletRef.current;
		}

		try {
			const isTablet = Platform.OS === 'ios' ? await NativeModules.DeviceUtilsIOS.isTablet() : await NativeModules.DeviceUtils.isTablet();
			isTabletRef.current = isTablet;
			setIsTabletLandscape(isTablet);
			return isTablet;
		} catch (error) {
			console.error('Error checking if device is a tablet:', error);
			isTabletRef.current = false;
			return false;
		}
	};

	useEffect(() => {
		checkTablet();
	}, []);

	const value = useMemo(() => {
		return {
			isTabletLandscape
		};
	}, [isTabletLandscape]);

	return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};
