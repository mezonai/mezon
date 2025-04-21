import { useTheme } from '@mezon/mobile-ui';
import React, { useMemo } from 'react';
import { Linking, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { style } from './styles';
function RenderMessageMapView({ content }: { content: string }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const handlePress = async () => {
		const supported = await Linking.canOpenURL(content);
		if (supported) {
			Linking.openURL(content);
		}
	};
	const extractCoordinates = (url) => {
		const regex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
		const matches = url?.match(regex);
		if (matches) {
			const latitude = parseFloat(matches[1]);
			const longitude = parseFloat(matches[2]);
			return { latitude, longitude };
		}
		return null;
	};

	const coordinate = useMemo(() => extractCoordinates(content), [content]);

	return (
		<TouchableOpacity onPress={handlePress}>
			<MapView
				initialRegion={{
					latitude: coordinate?.latitude,
					longitude: coordinate?.longitude,
					latitudeDelta: 0.0922,
					longitudeDelta: 0.0421
				}}
				style={styles.mapView}
			>
				<Marker
					coordinate={{ latitude: coordinate?.latitude, longitude: coordinate?.longitude }}
					title={'Marker Title'}
					description={'Marker Description'}
				/>
			</MapView>
		</TouchableOpacity>
	);
}
export default React.memo(RenderMessageMapView);
