import { useTheme } from '@mezon/mobile-ui';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { openPicker } from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles as createStyles } from './styles';

interface EventImage {
	id: string;
	uri: string;
	isFeatured?: boolean;
	uploadedBy?: {
		name: string;
		avatar: string;
	};
}

interface RouteParams {
	eventId: string;
	title: string;
	date: string;
	images?: EventImage[];
}

const EventDetail: React.FC = () => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation();
	const route = useRoute();
	const params = route.params as RouteParams;

	// Mock uploader avatars
	const uploaders = [
		{ name: 'Sarah', avatar: 'https://picsum.photos/100/100' },
		{ name: 'Michael', avatar: 'https://picsum.photos/100/101' },
		{ name: 'Emma', avatar: 'https://picsum.photos/100/102' },
		{ name: 'David', avatar: 'https://picsum.photos/100/103' },
		{ name: 'Sophia', avatar: 'https://picsum.photos/100/104' }
	];

	// State for images
	const [images, setImages] = useState<EventImage[]>(
		params.images || [
			{
				id: '1',
				uri: 'https://picsum.photos/400/400',
				isFeatured: true,
				uploadedBy: uploaders[0]
			},
			{
				id: '2',
				uri: 'https://picsum.photos/400/401',
				uploadedBy: uploaders[1]
			},
			{
				id: '3',
				uri: 'https://picsum.photos/400/402',
				uploadedBy: uploaders[2]
			},
			{
				id: '4',
				uri: 'https://picsum.photos/400/403',
				uploadedBy: uploaders[3]
			},
			{
				id: '5',
				uri: 'https://picsum.photos/400/404',
				uploadedBy: uploaders[4]
			}
		]
	);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleCamera = () => {
		Alert.alert('Camera', 'Open camera to take a photo', [{ text: 'OK' }]);
	};

	const handleImagePicker = async () => {
		try {
			const selectedImages = await openPicker({
				mediaType: 'photo',
				multiple: true,
				maxFiles: 10,
				compressImageQuality: 0.8
			});

			const imageArray = Array.isArray(selectedImages) ? selectedImages : [selectedImages];

			const newImages: EventImage[] = imageArray.map((img, index) => ({
				id: `new-${Date.now()}-${index}`,
				uri: Platform.OS === 'ios' ? img.sourceURL || img.path : img.path,
				uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)]
			}));

			setImages([...images, ...newImages]);
			Alert.alert('Success', `${newImages.length} photo(s) added to album`);
		} catch (error: unknown) {
			const err = error as { code?: string };
			if (err?.code !== 'E_PICKER_CANCELLED') {
				Alert.alert('Error', 'Failed to pick images');
			}
		}
	};

	const handleUploadPress = () => {
		Alert.alert('Add Photos', 'Choose an option', [
			{
				text: 'Take Photo',
				onPress: handleCamera
			},
			{
				text: 'Choose from Gallery',
				onPress: handleImagePicker
			},
			{
				text: 'Cancel',
				style: 'cancel'
			}
		]);
	};

	const handleImagePress = (_image: EventImage) => {
		// TODO: Open image viewer/lightbox
	};

	const featuredImage = images.find((img) => img.isFeatured) || images[0];
	const gridImages = images.filter((img) => !img.isFeatured || img.id !== featuredImage.id);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBack} style={styles.headerButton}>
					<Icon name="arrow-left" size={28} color="white" />
				</TouchableOpacity>
				<View style={styles.headerContent}>
					<Text style={styles.headerTitle}>{params.title || 'Event Details'}</Text>
					<View style={styles.dateContainer}>
						<Icon name="calendar" size={14} color="white" />
						<Text style={styles.headerDate}>{params.date || 'Date'}</Text>
					</View>
				</View>
				<TouchableOpacity onPress={handleCamera} style={styles.headerButton}>
					<Icon name="camera" size={28} color="white" />
				</TouchableOpacity>
			</View>

			{/* Content */}
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Featured Image */}
				{featuredImage && (
					<TouchableOpacity style={styles.featuredImageContainer} onPress={() => handleImagePress(featuredImage)} activeOpacity={0.9}>
						<Image source={{ uri: featuredImage.uri }} style={styles.featuredImage} resizeMode="cover" />
						<View style={styles.featuredBadge}>
							<Text style={styles.featuredBadgeText}>FEATURED</Text>
						</View>
						{featuredImage.uploadedBy && (
							<View style={styles.featuredUploaderContainer}>
								<Image source={{ uri: featuredImage.uploadedBy.avatar }} style={styles.featuredUploaderAvatar} resizeMode="cover" />
							</View>
						)}
					</TouchableOpacity>
				)}

				{/* Photos Grid */}
				<View style={styles.gridContainer}>
					{gridImages.map((image) => (
						<TouchableOpacity key={image.id} style={styles.gridItem} onPress={() => handleImagePress(image)} activeOpacity={0.8}>
							<Image source={{ uri: image.uri }} style={styles.gridImage} resizeMode="cover" />
							{image.uploadedBy && (
								<View style={styles.uploaderAvatarContainer}>
									<Image source={{ uri: image.uploadedBy.avatar }} style={styles.uploaderAvatar} resizeMode="cover" />
								</View>
							)}
						</TouchableOpacity>
					))}

					{/* Upload Placeholder */}
					<TouchableOpacity style={styles.uploadPlaceholder} onPress={handleUploadPress} activeOpacity={0.7}>
						<View style={styles.uploadIconContainer}>
							<Icon name="image-plus" size={32} color="#8B5CF6" />
						</View>
					</TouchableOpacity>
				</View>

				{/* Bottom Spacing */}
				<View style={styles.bottomSpacer} />
			</ScrollView>

			{/* Floating Action Button */}
			<TouchableOpacity style={styles.fab} onPress={handleUploadPress} activeOpacity={0.8}>
				<Icon name="upload" size={24} color="white" />
			</TouchableOpacity>
		</View>
	);
};

export default EventDetail;
