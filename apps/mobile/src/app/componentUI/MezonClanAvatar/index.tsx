import { size, useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import React from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Images from '../../../assets/Images';
import ImageNative from '../../components/ImageNative';
import { style } from './styles';

interface IMezonClanAvatarProps {
	image?: string;
	alt?: string;
	defaultColor?: string;
	textStyle?: StyleProp<TextStyle>;
	noDefaultText?: boolean;
	lightMode?: boolean;
}

export default function MezonClanAvatar({ image, alt = '', defaultColor, textStyle, noDefaultText = false, lightMode }: IMezonClanAvatarProps) {
	const { themeValue } = useTheme();

	const styles = style(themeValue);

	if (image) {
		return (
			<ImageNative
				url={createImgproxyUrl(image ?? '', { width: 100, height: 100, resizeType: 'fit' })}
				style={styles.image}
				resizeMode={'cover'}
			/>
		);
	}
	return (
		<View style={[styles.fakeBox, { backgroundColor: defaultColor || themeValue.colorAvatarDefault }]}>
			{!noDefaultText ? (
				<FastImage
					source={alt === 'Anonymous' ? Images.ANONYMOUS_MESSAGE_AVATAR : Images.ANONYMOUS_AVATAR}
					style={{ width: '100%', height: '100%', borderRadius: size.s_100 }}
				/>
			) : null}
		</View>
	);
}
