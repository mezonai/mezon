import { Metrics, ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { appActions } from '@mezon/store-mobile';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Keyboard, Platform, StatusBar, View } from 'react-native';
import { useDispatch } from 'react-redux';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import LeftDrawerContent from './homedrawer/DrawerContent';
import HomeDefault from './homedrawer/HomeDefault';
import { styles } from './styles';

const Drawer = createDrawerNavigator();

const HomeScreen = React.memo(() => {
	const dispatch = useDispatch();
	const isTabletLandscape = useTabletLandscape();
	const navigation = useNavigation();
	const { themeValue, themeBasic } = useTheme();

	useEffect(() => {
		const focusedListener = navigation.addListener('focus', () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.primary);
			}
			StatusBar.setBarStyle(themeBasic === ThemeModeBase.DARK ? 'light-content' : 'dark-content');
		});
		const blurListener = navigation.addListener('blur', () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.secondary);
			}
			StatusBar.setBarStyle(themeBasic === ThemeModeBase.DARK ? 'light-content' : 'dark-content');
		});
		return () => {
			focusedListener();
			blurListener();
		};
	}, [navigation, themeBasic, themeValue.primary, themeValue.secondary]);

	if (isTabletLandscape) {
		return (
			<View style={styles.container}>
				<View style={styles.containerDrawerContent}>
					<LeftDrawerContent />
				</View>
				<View style={styles.containerHomeDefault}>
					<HomeDefault navigation={navigation} />
				</View>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, position: 'relative' }}>
			<Drawer.Navigator
				screenOptions={{
					drawerPosition: 'left',
					drawerType: 'back',
					freezeOnBlur: true,
					swipeEdgeWidth: Metrics.screenWidth,
					swipeMinDistance: 5,
					drawerStyle: {
						width: '100%'
					}
				}}
				screenListeners={{
					state: (e) => {
						Keyboard.dismiss();
						if (e.data.state.history?.length > 1) {
							dispatch(appActions.setHiddenBottomTabMobile(false));
						} else {
							dispatch(appActions.setHiddenBottomTabMobile(true));
						}
					}
				}}
				drawerContent={() => <LeftDrawerContent />}
			>
				<Drawer.Screen
					name={APP_SCREEN.HOME_DEFAULT}
					component={HomeDefault}
					options={{
						drawerType: 'back',
						swipeEdgeWidth: Metrics.screenWidth,
						keyboardDismissMode: 'none',
						swipeMinDistance: 5,
						headerShown: false
					}}
				/>
			</Drawer.Navigator>
		</View>
	);
});

export default HomeScreen;
