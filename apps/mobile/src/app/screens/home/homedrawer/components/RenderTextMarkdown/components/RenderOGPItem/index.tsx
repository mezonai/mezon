import { useTheme } from '@mezon/mobile-ui';
import { Linking, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import ImageNative from '../../../../../../../components/ImageNative';
import useTabletLandscape from '../../../../../../../hooks/useTabletLandscape';
import { style } from './styles';

type RenderOgpPreviewProps = {
	ogpItem: OgpElemnent;
	url: string;
};

export type OgpElemnent = {
	title: string;
	description?: string;
	image?: string;
};

const RenderOgpPreview = ({ ogpItem, url }: RenderOgpPreviewProps) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);
	const { width } = useWindowDimensions();
	const ogpViewWidth = isTabletLandscape ? width * 0.4 : width * 0.8;

	const openLink = () => {
		if (url === 'undefined') return;
		Linking.openURL(url);
	};

	return (
		<View style={[styles.wrapper, { width: ogpViewWidth }]}>
			<View style={styles.container}>
				<TouchableOpacity onPress={openLink}>
					<Text numberOfLines={2} style={styles.title}>
						{ogpItem?.title || url}
					</Text>
				</TouchableOpacity>
				{!!ogpItem?.description && (
					<Text numberOfLines={2} style={styles?.description}>
						{ogpItem.description}
					</Text>
				)}
				{!!ogpItem?.image && (
					<View style={[styles.image]}>
						<ImageNative url={ogpItem.image} style={styles.nativeImage} resizeMode="cover" />
					</View>
				)}
			</View>
		</View>
	);
};

export default RenderOgpPreview;
