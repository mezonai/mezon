import { useTheme } from '@mezon/mobile-ui';
import { RootState, selectCountClanJoined } from '@mezon/store-mobile';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { DiscoverMobileProvider } from '../Discover/DiscoverMobileContext';
import DiscoverScreen from '../Discover/DiscoverScreen';
import HeaderUserEmptyClan from './HeaderUserEmptyClan';
import { style } from './styles';

const UserEmptyClan = () => {
	const countClanJoined = useSelector(selectCountClanJoined);
	const clansLoadingStatus = useSelector((state: RootState) => state?.clans?.loadingStatus);
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	if (clansLoadingStatus === 'loaded' && countClanJoined === 0) {
		return (
			<View style={styles.wrapper}>
				<LinearGradient
					start={{ x: 1, y: 0 }}
					end={{ x: 0, y: 0 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={[StyleSheet.absoluteFill]}
				/>
				<DiscoverMobileProvider>
					<HeaderUserEmptyClan />
					<DiscoverScreen />
				</DiscoverMobileProvider>
			</View>
		);
	}

	return null;
};

export default memo(UserEmptyClan);
