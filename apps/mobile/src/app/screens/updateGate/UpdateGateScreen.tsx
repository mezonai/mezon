import { Colors, size } from '@mezon/mobile-ui';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { BackHandler, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';

const UpdateGateScreen = ({ route }) => {
	const storeUrl = route?.params?.storeUrl;

	useFocusEffect(() => {
		const backAction = () => true;
		const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

		return () => backHandler.remove();
	});

	const onPress = () => Linking.openURL(storeUrl);

	const handleGestureEvent = (event) => {
		if (event.nativeEvent.translationX < 0) {
			// Prevent swipe left action
			event.preventDefault();
		}
	};

	return (
		<Modal isVisible={true} animationIn={'fadeIn'} coverScreen={true} backdropColor={Colors.secondary} backdropOpacity={1}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<PanGestureHandler onGestureEvent={handleGestureEvent}>
					<View style={styles.container}>
						<View />
						<View
							style={{
								alignSelf: 'center',
								marginBottom: size.s_50
							}}
						>
							<FastImage
								source={require('../../../assets/images/bgRocket.png')}
								style={{ width: 350, height: 350 }}
								resizeMode={'cover'}
							/>
							<View>
								<Text style={styles.title}>Out of Date Version</Text>
								<Text style={styles.subTitle}>Let's update to have the best experience!</Text>
							</View>
						</View>
						<TouchableOpacity onPress={onPress}>
							<View
								style={{
									backgroundColor: Colors.white,
									flexDirection: 'row',
									justifyContent: 'space-between',
									paddingHorizontal: size.s_10,
									height: size.s_50,
									borderRadius: size.s_50,
									alignItems: 'center'
								}}
							>
								<Text style={styles.titleBtn}>Update Now</Text>
							</View>
						</TouchableOpacity>
					</View>
				</PanGestureHandler>
			</GestureHandlerRootView>
		</Modal>
	);
};

export default UpdateGateScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: size.s_40,
		backgroundColor: Colors.secondary,
		justifyContent: 'space-between'
	},
	title: {
		fontSize: size.s_20,
		fontWeight: 'bold',
		color: Colors.white,
		textAlign: 'center'
	},
	subTitle: {
		textAlign: 'center',
		marginTop: size.s_10,
		fontSize: size.s_16,
		lineHeight: size.s_24,
		color: Colors.tertiary
	},
	titleBtn: {
		flex: 1,
		textAlign: 'center',
		fontSize: size.s_16,
		fontWeight: 'bold',
		color: Colors.black
	}
});
