import { size, useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import React, { memo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Images from '../../../assets/Images';
import ImageNative from '../../components/ImageNative';
import { Icons } from '../MobileIcons';
import { style } from './styles';

interface IMezonClanAvatarProps {
	image?: string;
	alt?: string;
	defaultColor?: string;
	textStyle?: StyleProp<TextStyle>;
	noDefaultText?: boolean;
	lightMode?: boolean;
	imageHeight?: number;
	imageWidth?: number;
	customFontSizeAvatarCharacter?: number;
}

export default memo(function MezonClanAvatar({
	image,
	alt = '',
	defaultColor,
	textStyle,
	noDefaultText = false,
	lightMode,
	imageHeight = 100,
	imageWidth = 100,
	customFontSizeAvatarCharacter
}: IMezonClanAvatarProps) {
	const { themeValue } = useTheme();

	const styles = style(themeValue, customFontSizeAvatarCharacter);

	if (image) {
		return (
			<ImageNative
				url={createImgproxyUrl(image ?? '', { width: imageWidth, height: imageHeight, resizeType: 'fit' })}
				style={styles.image}
				resizeMode={'cover'}
			/>
		);
	}

	if (alt && !image && alt !== 'Anonymous') {
		return (
			<View style={styles.avatarMessageBoxDefault}>
				<Text style={styles.textAvatarMessageBoxDefault}>{alt?.charAt?.(0)?.toUpperCase()}</Text>
			</View>
		);
	}
	return (
		<View style={[styles.fakeBox, { backgroundColor: defaultColor || themeValue.colorAvatarDefault }]}>
			{!noDefaultText ? (
				alt === 'Anonymous' ? (
					<Icons.AnonymousIcon color={themeValue.white} width={size.s_20} height={size.s_20} />
				) : (
					<FastImage source={Images.ANONYMOUS_AVATAR} style={styles.defaultImageStyle} />
				)
			) : null}
		</View>
	);
});
