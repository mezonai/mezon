import { load, STORAGE_IS_LAST_ACTIVE_TAB_DM } from '@mezon/mobile-components';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { APP_SCREEN } from '../ScreenTypes';
import BottomNavigator from './BottomNavigator';
import { styles } from './styles';

const BottomNavigatorWrapper = memo(({ initRouteName = '' }: { initRouteName: string }) => {
	const [isReadyToRender, setIsReadyToRender] = useState<boolean>(false);
	const navigation = useNavigation();

	const activeRouteName = useNavigationState((state) => {
		const bottomBarRoute = state?.routes?.find((r) => r.name === APP_SCREEN.BOTTOM_BAR);
		if (bottomBarRoute?.state) {
			const bottomTabState = bottomBarRoute.state;
			const focusedIndex = bottomTabState.index ?? 0;
			return (bottomTabState.routes?.[focusedIndex] as { name?: string })?.name;
		}
		return undefined;
	});

	const isClansTabActive = !activeRouteName || activeRouteName === APP_SCREEN.HOME;

	const initLoader = useCallback(async () => {
		if (isReadyToRender) return;

		if (initRouteName === APP_SCREEN.BOTTOM_BAR) {
			requestAnimationFrame(() => {
				setIsReadyToRender(() => true);
			});
		} else {
			// Check if navigation is ready by accessing its state
			const checkNavigationReady = () => {
				try {
					const state = navigation.getState();
					return state && state.routes && state.routes.length > 1;
				} catch {
					return false;
				}
			};

			// Poll for navigation readiness
			const interval = setInterval(() => {
				if (checkNavigationReady()) {
					clearInterval(interval);
					setTimeout(() => {
						setIsReadyToRender(() => true);
					}, 500);
				}
			}, 500);

			// Fallback timeout
			const timeout = setTimeout(() => {
				clearInterval(interval);
				setIsReadyToRender(() => true);
			}, 5000);

			return () => {
				clearInterval(interval);
				clearTimeout(timeout);
			};
		}
	}, [initRouteName, isReadyToRender, navigation]);

	useEffect(() => {
		initLoader();
	}, [initLoader]);

	if (!isReadyToRender) return <View style={styles.flexContainer} />;
	return (
		<View style={styles.flexContainer}>
			<StatusBarHeight isPrimary={isClansTabActive} />
			<BottomNavigator isLastActiveTabDm={load(STORAGE_IS_LAST_ACTIVE_TAB_DM) === 'true'} />
		</View>
	);
});

export default BottomNavigatorWrapper;
