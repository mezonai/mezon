import { selectDmGroupCurrentId, selectHiddenBottomTabMobile } from '@mezon/store';
import { useDrawerStatus } from '@react-navigation/drawer';
import { DrawerActions, useNavigation, useNavigationState } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { Alert, BackHandler, View } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';

function BackNativeListener() {
	const navigation = useNavigation<any>();
	const drawerStatus = useDrawerStatus();
	const isHiddenTab = useSelector(selectHiddenBottomTabMobile);
	const currentDirectId = useSelector(selectDmGroupCurrentId);

	const routesNavigation = useNavigationState((state) => state?.routes?.[state?.index]);

	const isHomeActive = useMemo(() => {
		if (routesNavigation?.state?.index === 0) {
			return true;
		}
		return routesNavigation?.name === APP_SCREEN.BOTTOM_BAR && !routesNavigation?.state?.index;
	}, [routesNavigation]);

	useEffect(() => {
		const backAction = () => {
			if (drawerStatus === 'closed') {
				navigation.dispatch(DrawerActions.openDrawer());
				return true;
			} else if (isHomeActive && !isHiddenTab && !currentDirectId) {
				Alert.alert(
					'Exit App',
					'Are you sure you want to close the app?',
					[
						{
							text: 'Cancel',
							onPress: () => null,
							style: 'cancel'
						},
						{
							text: 'Yes',
							onPress: () => BackHandler.exitApp()
						}
					],
					{ cancelable: false }
				);
				return true;
			} else {
				// empty
			}
			return false;
		};
		const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
		return () => {
			backHandler.remove();
		};
	}, [isHomeActive, drawerStatus, navigation, isHiddenTab, currentDirectId]);

	return <View />;
}

export default React.memo(BackNativeListener);
