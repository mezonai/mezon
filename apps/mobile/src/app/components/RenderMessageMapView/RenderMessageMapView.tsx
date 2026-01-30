import { size, useTheme } from '@mezon/mobile-ui';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MezonClanAvatar from '../../componentUI/MezonClanAvatar';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { style } from './styles';

interface IRenderMessageMapViewProps {
	content: string;
	avatarUrl?: string;
	isSelf?: boolean;
	senderName?: string;
	senderUsername?: string;
}

function RenderMessageMapView({ content, avatarUrl, isSelf, senderName, senderUsername }: IRenderMessageMapViewProps) {
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

	const coordinate = useMemo(() => {
		const regex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
		const matches = content?.match(regex);
		if (matches) {
			const latitude = parseFloat(matches[1]);
			const longitude = parseFloat(matches[2]);
			return { latitude, longitude } as const;
		}
		return null;
	}, [content]);

	if (!coordinate) return null;

	return (
		<Pressable onPress={handlePress} style={styles.card}>
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
					<View style={styles.avatarWrapper}>
						<MezonClanAvatar image={avatarUrl} alt={senderUsername} customFontSizeAvatarCharacter={size.h5} />
					</View>
				</Marker>
			</MapView>

			<View style={styles.info}>
				<Text style={styles.title}>
					{isSelf ? t('mapView.yourLocation') : t('mapView.locationOf', { name: senderName || t('mapView.sender') })}
				</Text>
			</View>
		</Pressable>
	);
}

export default memo(RenderMessageMapView);
