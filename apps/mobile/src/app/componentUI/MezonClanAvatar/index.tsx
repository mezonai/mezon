import { size, useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import React from 'react';
import { Image, StyleProp, TextStyle, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Images from '../../../assets/Images';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { style } from './styles';

interface IMezonClanAvatarProps {
	image?: string;
	alt?: string;
	defaultColor?: string;
	textStyle?: StyleProp<TextStyle>;
	noDefaultText?: boolean;
	lightMode?: boolean;
}

export default function MezonClanAvatar({
	image,
	alt = 'anonymous',
	defaultColor,
	textStyle,
	noDefaultText = false,
	lightMode
}: IMezonClanAvatarProps) {
	const { themeValue } = useTheme();
	const [isLoadFailProxy, setIsLoadFailProxy] = React.useState<boolean>(false);
	const isTabletLandscape = useTabletLandscape();

	const styles = style(themeValue);

	if (image) {
		if (isTabletLandscape) {
			return (
				<Image
					source={{
						uri: isLoadFailProxy ? image : createImgproxyUrl(image ?? '', { width: 100, height: 100, resizeType: 'fit' })
					}}
					style={styles.image}
					onError={() => {
						setIsLoadFailProxy(true);
					}}
				/>
			);
		}
		return (
			<FastImage
				source={{
					uri: isLoadFailProxy ? image : createImgproxyUrl(image ?? '', { width: 100, height: 100, resizeType: 'fit' })
				}}
				style={styles.image}
				onError={() => {
					setIsLoadFailProxy(true);
				}}
			/>
		);
	}
	return (
		<View style={[styles.fakeBox, { backgroundColor: defaultColor || themeValue.colorAvatarDefault }]}>
			{!noDefaultText ? (
				<FastImage source={Images.ANONYMOUS_AVATAR} style={{ width: '100%', height: '100%', borderRadius: size.s_100 }} />
			) : null}
		</View>
	);
}
