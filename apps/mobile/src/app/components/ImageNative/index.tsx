import React, { memo } from 'react';
import { Platform, StyleSheet, ViewProps, requireNativeComponent } from 'react-native';

interface CustomImageProps extends ViewProps {
	url: string;
	resizeMode?: 'cover' | 'contain' | 'center';
	style?: any;
}

interface CustomImageIOSProps extends ViewProps {
	source: { uri: string };
	resizeMode?: 'cover' | 'contain' | 'center';
	style?: any;
}

const CustomImageView = requireNativeComponent<CustomImageProps>('CustomImageView');
const CustomImageViewIOS = requireNativeComponent<CustomImageIOSProps>('CustomImageViewIOS');
const ImageNative = ({ url, style, resizeMode }: CustomImageProps) => {
	return Platform.OS === 'android' ? (
		<CustomImageView url={url?.toString()} resizeMode={resizeMode} style={style} />
	) : (
		<CustomImageViewIOS source={{ uri: url?.toString() }} resizeMode={resizeMode} style={style} />
	);
};

const styles = StyleSheet.create({});

export default memo(ImageNative);
