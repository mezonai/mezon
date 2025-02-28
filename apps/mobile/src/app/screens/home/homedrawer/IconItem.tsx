import FastImage from 'react-native-fast-image';

interface IconItemProps {
	iconUrl: string;
	height: number;
	width: number;
}
export const IconCDNItem = ({ iconUrl, height, width }: IconItemProps) => {
	return <FastImage source={{ uri: iconUrl }} style={{ height: height, width: width }} />;
};
