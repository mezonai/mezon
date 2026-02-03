import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles as createStyles } from './styles';

interface MediaItem {
	id: string;
	type: 'image' | 'video';
	uri: string;
	title?: string;
	isLatest?: boolean;
}

interface AvatarItem {
	id: string;
	name: string;
	uri: string;
}

interface MediaHighlightsProps {
	mediaItems?: MediaItem[];
	avatars?: AvatarItem[];
	onMediaPress?: (item: MediaItem) => void;
	onAvatarPress?: (item: AvatarItem) => void;
	onSeeAllPress?: () => void;
}

const MediaHighlights: React.FC<MediaHighlightsProps> = ({ mediaItems = [], avatars = [], onMediaPress, onAvatarPress, onSeeAllPress }) => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);

	// Mock data for demonstration
	const defaultMediaItems: MediaItem[] =
		mediaItems.length > 0
			? mediaItems
			: [
					{
						id: '1',
						type: 'image',
						uri: 'https://picsum.photos/400/300',
						title: 'Lễ Cưới Minh & Lan',
						isLatest: true
					},
					{
						id: '2',
						type: 'image',
						uri: 'https://picsum.photos/200/150'
					},
					{
						id: '3',
						type: 'video',
						uri: 'https://picsum.photos/200/151'
					}
				];

	const defaultAvatars: AvatarItem[] =
		avatars.length > 0
			? avatars
			: [
					{
						id: '1',
						name: 'Tô Tiên',
						uri: 'https://picsum.photos/100/100'
					},
					{
						id: '2',
						name: 'Quế Hương',
						uri: 'https://picsum.photos/100/101'
					},
					{
						id: '3',
						name: 'Hồi Ức',
						uri: 'https://picsum.photos/100/102'
					}
				];

	const mainMedia = defaultMediaItems[0];
	const sideMedia = defaultMediaItems.slice(1, 3);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Icon name="play-box-multiple" size={20} color={themeValue.textStrong} />
					<Text style={styles.headerTitle}>MEDIA & HIGHLIGHTS</Text>
				</View>
				<TouchableOpacity onPress={onSeeAllPress}>
					<Icon name="chevron-right" size={24} color={themeValue.textStrong} />
				</TouchableOpacity>
			</View>

			{/* Media Grid */}
			<View style={styles.mediaGrid}>
				{/* Main Media */}
				<TouchableOpacity style={styles.mainMedia} onPress={() => onMediaPress?.(mainMedia)} activeOpacity={0.8}>
					<Image source={{ uri: mainMedia.uri }} style={styles.mainMediaImage} resizeMode="cover" />
					{mainMedia.isLatest && (
						<View style={styles.latestBadge}>
							<Text style={styles.latestBadgeText}>MỚI NHẤT</Text>
						</View>
					)}
					{mainMedia.title && (
						<View style={styles.mainMediaTitleContainer}>
							<Text style={styles.mainMediaTitle}>{mainMedia.title}</Text>
						</View>
					)}
				</TouchableOpacity>

				{/* Side Media */}
				<View style={styles.sideMedia}>
					{sideMedia.map((item, index) => (
						<TouchableOpacity
							key={item.id}
							style={[styles.sideMediaItem, index > 0 && styles.sideMediaItemSpacing]}
							onPress={() => onMediaPress?.(item)}
							activeOpacity={0.8}
						>
							<Image source={{ uri: item.uri }} style={styles.sideMediaImage} resizeMode="cover" />
							{item.type === 'video' && (
								<View style={styles.playIconContainer}>
									<Icon name="play-circle" size={32} color="white" />
								</View>
							)}
						</TouchableOpacity>
					))}
				</View>
			</View>
		</View>
	);
};

export default MediaHighlights;
