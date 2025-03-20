import { size } from '@mezon/mobile-ui';
import { Image, ImageStyle } from 'react-native';

type IconComponentProps = {
	icon: string;
	height?: number;
	width?: number;
	color?: string;
	customStyle?: ImageStyle | ImageStyle[];
};

const MezonIconCDN = ({ icon, height = size.s_24, width = size.s_24, color = 'white', customStyle }: IconComponentProps) => {
	const iconUrl = icon;
	return <Image source={{ uri: iconUrl }} style={[{ height: height, width: width, tintColor: color }, customStyle]} resizeMode="contain" />;
};

export default MezonIconCDN;
