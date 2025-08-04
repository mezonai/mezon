import { size } from '@mezon/mobile-ui';
import { Image, ImageStyle } from 'react-native';
import { IconCDN } from '../../constants/icon_cdn';

type IconComponentProps = {
	icon: IconCDN;
	height?: number;
	width?: number;
	color?: string;
	useOriginalColor?: boolean;
	customStyle?: ImageStyle | ImageStyle[];
};

const MezonIconCDN = ({ icon, height = size.s_24, width = size.s_24, color = 'white', useOriginalColor = false, customStyle }: IconComponentProps) => {
	const imageStyle = [
		{ height: height, width: width },
		!useOriginalColor && { tintColor: color },
		customStyle
	].filter(Boolean);

	return <Image source={icon} style={imageStyle} resizeMode="contain" />;
};

export default MezonIconCDN;
