import { size, verticalScale } from '@mezon/mobile-ui';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';

type IProps = {
	isVisible: boolean;
};

const LoadingModal = ({ isVisible }: IProps) => {
	if (!isVisible) return <View />;
	return (
		<View style={styles.centeredView}>
			<Flow size={size.s_34 * 2} color={'#5a62f4'} />
		</View>
	);
};

const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.7)',
		position: 'absolute',
		zIndex: 2,
		top: 0,
		left: 0,
		width: '100%',
		height: '100%'
	},
	modalView: {
		backgroundColor: 'black',
		borderRadius: verticalScale(20),
		padding: verticalScale(20),
		alignItems: 'center',
		elevation: 5
	}
});

export default LoadingModal;
