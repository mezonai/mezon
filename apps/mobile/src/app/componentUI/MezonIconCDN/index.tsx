import { size, useTheme } from '@mezon/mobile-ui';
import FastImage, { ImageStyle } from 'react-native-fast-image';
import { IconSet } from '../../constants/icon_cdn';

type IconComponentProps = {
	icon: IconSet;
	height?: number;
	width?: number;
	customStyle?: ImageStyle;
};

export const MezonIconCDN = ({ icon, height = size.s_24, width = size.s_24, customStyle }: IconComponentProps) => {
	const { themeBasic } = useTheme();
	const iconUrl = icon?.[themeBasic];
	return <FastImage source={{ uri: iconUrl }} style={[{ height: height, width: width }, customStyle]} resizeMode="contain" />;
};
