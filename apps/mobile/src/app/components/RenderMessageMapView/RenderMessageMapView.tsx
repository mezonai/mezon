import { useTheme } from '@mezon/mobile-ui';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { style } from './styles';

type RenderMessageMapViewProps = {
	content: string;
	avatarUrl?: string;
	isSelf?: boolean;
	senderName?: string;
};

function RenderMessageMapView({ content, avatarUrl, isSelf, senderName }: RenderMessageMapViewProps) {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = style(themeValue, isTabletLandscape);
	const { t } = useTranslation('message');

	const handlePress = async () => {
		const supported = await Linking.canOpenURL(content);
		if (supported) {
			Linking.openURL(content);
		}
	};

	const extractCoordinates = (url: string) => {
		const regex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
		const matches = url?.match(regex);
		if (matches) {
			const latitude = parseFloat(matches[1]);
			const longitude = parseFloat(matches[2]);
			return { latitude, longitude } as const;
		}
		return null;
	};

	const coordinate = useMemo(() => extractCoordinates(content), [content]);

	if (!coordinate) return null;

	return (
		<TouchableOpacity onPress={handlePress} style={styles.card} activeOpacity={0.8}>
			<MapView
				style={styles.map}
				initialRegion={{
					latitude: coordinate.latitude,
					longitude: coordinate.longitude,
					latitudeDelta: 0.005,
					longitudeDelta: 0.005
				}}
				pointerEvents="none"
				scrollEnabled={false}
				zoomEnabled={false}
				zoomControlEnabled={false}
				zoomTapEnabled={false}
			>
				<Marker coordinate={{ latitude: coordinate.latitude, longitude: coordinate.longitude }}>
					<View style={styles.avatarWrapper}>{!!avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.avatar} />}</View>
				</Marker>
			</MapView>

			<View style={styles.info}>
				<Text style={styles.title}>
					{isSelf ? t('mapView.yourLocation') : t('mapView.locationOf', { name: senderName || t('mapView.sender') })}
				</Text>
			</View>
		</TouchableOpacity>
	);
}

export default React.memo(RenderMessageMapView);
