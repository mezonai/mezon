import { size, useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import React, { memo } from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Images from '../../../assets/Images';
import ImageNative from '../../components/ImageNative';
import { IconCDN } from '../../constants/icon_cdn';
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
	isMsgReply?: boolean;
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
	isMsgReply = false
}: IMezonClanAvatarProps) {
	const { themeValue } = useTheme();

	const styles = style(themeValue, isMsgReply);

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
				<FastImage
					source={alt === 'Anonymous' ? IconCDN.anonymousAvatar : Images.ANONYMOUS_AVATAR}
					style={{ width: '100%', height: '100%', borderRadius: size.s_100 }}
				/>
			) : null}
		</View>
	);
});
