import { size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import { style } from './styles';
interface ILoadingModalProps {
	isVisible: boolean;
	isTransparent?: boolean;
}

const LoadingModal = ({ isVisible, isTransparent = false }: ILoadingModalProps) => {
	const { themeValue } = useTheme();
	const styles = style(isTransparent);

	if (!isVisible) return <View />;

	return (
		<View style={styles.centeredView}>
			<Flow size={size.s_34 * 2} color={themeValue.bgViolet} />
		</View>
	);
};

export default LoadingModal;
