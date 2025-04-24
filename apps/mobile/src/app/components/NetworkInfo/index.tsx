import { Colors, size } from '@mezon/mobile-ui';
import { appActions, selectHasInternetMobile } from '@mezon/store-mobile';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

const NetInfoComp = () => {
	const hasInternet = useSelector(selectHasInternetMobile);

	const dispatch = useDispatch();
	useEffect(() => {
		const netInfoSubscription = NetInfo.addEventListener((state) => {
			dispatch(appActions.setHasInternetMobile(state.isConnected));
		});
		return () => {
			netInfoSubscription();
		};
	}, [dispatch]);

	return !hasInternet ? (
		<Animated.View style={styles.container}>
			<Text style={styles.text1}>No internet connection</Text>
			<Text numberOfLines={1} style={styles.text2}>
				Please check your connection and try again
			</Text>
		</Animated.View>
	) : null;
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
		paddingVertical: 15,
		position: 'absolute',
		zIndex: 999999999999,
		top: 60,
		marginHorizontal: 10,
		alignSelf: 'center',
		backgroundColor: 'white',
		borderRadius: 10,
		elevation: 5, // Android shadow
		shadowColor: Colors.black, // iOS shadow
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		borderStartWidth: 5,
		borderColor: Colors.textRed
	},
	text1: { textAlign: 'left', fontSize: size.medium, fontWeight: 'bold', marginBottom: 5, color: 'black' },
	text2: { textAlign: 'left', fontSize: size.small, fontWeight: '500', color: 'grey' }
});

export default NetInfoComp;
