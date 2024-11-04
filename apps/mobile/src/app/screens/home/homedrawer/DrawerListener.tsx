import { ActionEmitEvent } from '@mezon/mobile-components';
import { useDrawerStatus } from '@react-navigation/drawer';
import React, { useEffect } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
function DrawerListener() {
	const isOpenDrawer = useDrawerStatus() === 'open';

	useEffect(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.OPEN_CLOSE_DRAWER, { isOpenDrawer: isOpenDrawer });
	}, [isOpenDrawer]);
	return <View />;
}

export default React.memo(DrawerListener);
