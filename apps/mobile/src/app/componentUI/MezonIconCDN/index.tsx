import { size, useTheme } from '@mezon/mobile-ui';
import { ImageStyle } from 'react-native-fast-image';
import ImageNative from '../../components/ImageNative';
import { IconSet } from '../../constants/icon_cdn';

type IconComponentProps = {
	icon: IconSet;
	height?: number;
	width?: number;
	customStyle?: ImageStyle;
};

const MezonIconCDN = ({ icon, height = size.s_24, width = size.s_24, customStyle }: IconComponentProps) => {
	const { themeBasic } = useTheme();
	const iconUrl = icon?.[themeBasic];
	return <ImageNative url={iconUrl} style={[{ height: height, width: width }, customStyle]} resizeMode="contain" />;
};

export default MezonIconCDN;
