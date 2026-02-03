import { useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { openPicker } from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MezonDateTimePicker from '../../componentUI/MezonDateTimePicker';
import { styles as createStyles } from './styles';

interface FamilyMember {
	id: string;
	name: string;
	avatar: string;
	selected?: boolean;
}

interface MediaItem {
	id: string;
	uri: string;
	type: 'photo' | 'video';
}

const CreateMilestone: React.FC = () => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation();

	const [eventTitle, setEventTitle] = useState('');
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [story, setStory] = useState('');
	const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
	const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
		{
			id: '1',
			name: 'Sarah',
			avatar: 'https://picsum.photos/100/100',
			selected: true
		},
		{
			id: '2',
			name: 'Michael',
			avatar: 'https://picsum.photos/100/101',
			selected: false
		},
		{
			id: '3',
			name: 'Elena',
			avatar: 'https://picsum.photos/100/102',
			selected: false
		},
		{
			id: '4',
			name: 'David',
			avatar: 'https://picsum.photos/100/103',
			selected: false
		},
		{
			id: '5',
			name: 'Chloe',
			avatar: 'https://picsum.photos/100/104',
			selected: false
		}
	]);

	const handleClose = () => {
		navigation.goBack();
	};

	const handleCancel = () => {
		Alert.alert('Cancel', 'Are you sure you want to discard this milestone?', [
			{ text: 'Continue Editing', style: 'cancel' },
			{ text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
		]);
	};

	const handleAddMedia = async () => {
		try {
			const selectedImages = await openPicker({
				mediaType: 'photo',
				multiple: true,
				maxFiles: 10,
				compressImageQuality: 0.8
			});

			const imageArray = Array.isArray(selectedImages) ? selectedImages : [selectedImages];

			const newMedia: MediaItem[] = imageArray.map((img, index) => ({
				id: `media-${Date.now()}-${index}`,
				uri: img.path,
				type: 'photo'
			}));

			setMediaItems([...mediaItems, ...newMedia]);
		} catch (error: any) {
			if (error?.code !== 'E_PICKER_CANCELLED') {
				Alert.alert('Error', 'Failed to pick images');
			}
		}
	};

	const handleToggleMember = (memberId: string) => {
		setFamilyMembers(familyMembers.map((member) => (member.id === memberId ? { ...member, selected: !member.selected } : member)));
	};

	const handleSave = () => {
		if (!eventTitle.trim()) {
			Alert.alert('Required', 'Please enter an event title');
			return;
		}

		// TODO: Save milestone to backend/Redux
		const milestone = {
			title: eventTitle,
			date: selectedDate,
			story,
			media: mediaItems,
			taggedMembers: familyMembers.filter((m) => m.selected)
		};

		Alert.alert('Success', 'Milestone created successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={handleClose} style={styles.closeButton}>
					<Icon name="close" size={28} color="white" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>New Family Milestone</Text>
				<TouchableOpacity onPress={handleCancel}>
					<Text style={styles.cancelText}>Cancel</Text>
				</TouchableOpacity>
			</View>

			{/* Form Content */}
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				<View style={styles.formContainer}>
					{/* Event Title */}
					<View style={styles.fieldContainer}>
						<Text style={styles.fieldLabel}>Event Title</Text>
						<TextInput
							style={styles.input}
							value={eventTitle}
							onChangeText={setEventTitle}
							placeholder="e.g., Anniversary, Wedding, Reunion"
							placeholderTextColor={themeValue.textDisabled}
						/>
					</View>

					{/* Date */}
					<View style={styles.fieldContainer}>
						<Text style={styles.fieldLabel}>Date</Text>
						<MezonDateTimePicker
							mode="date"
							value={selectedDate}
							onChange={(date) => setSelectedDate(date)}
							placeholder="Select date"
							postfixIcon="calendar"
						/>
					</View>

					{/* The Story */}
					<View style={styles.fieldContainer}>
						<Text style={styles.fieldLabel}>The Story</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							value={story}
							onChangeText={setStory}
							placeholder="Share the beautiful story behind this moment..."
							placeholderTextColor={themeValue.textDisabled}
							multiline
							numberOfLines={6}
							textAlignVertical="top"
						/>
					</View>

					{/* Memories */}
					<View style={styles.fieldContainer}>
						<Text style={styles.fieldLabel}>Memories</Text>

						{mediaItems.length > 0 ? (
							<View style={styles.mediaGrid}>
								{mediaItems.map((media) => (
									<View key={media.id} style={styles.mediaItem}>
										<Image source={{ uri: media.uri }} style={styles.mediaImage} resizeMode="cover" />
										<TouchableOpacity
											style={styles.removeMediaButton}
											onPress={() => setMediaItems(mediaItems.filter((m) => m.id !== media.id))}
										>
											<Icon name="close-circle" size={24} color="white" />
										</TouchableOpacity>
									</View>
								))}
							</View>
						) : null}

						<TouchableOpacity style={styles.uploadContainer} onPress={handleAddMedia}>
							<View style={styles.uploadIconContainer}>
								<Icon name="image-plus" size={40} color="#8B5CF6" />
							</View>
							<Text style={styles.uploadTitle}>Upload Photos or Videos</Text>
							<Text style={styles.uploadSubtitle}>Add high-quality media to your album</Text>
							<View style={styles.addMediaButton}>
								<Text style={styles.addMediaButtonText}>Add Media</Text>
							</View>
						</TouchableOpacity>
					</View>

					{/* Tag Family Members */}
					<View style={styles.fieldContainer}>
						<Text style={styles.fieldLabel}>Tag Family Members</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll}>
							{familyMembers.map((member) => (
								<TouchableOpacity key={member.id} style={styles.memberItem} onPress={() => handleToggleMember(member.id)}>
									<View style={[styles.memberAvatarContainer, member.selected && styles.memberAvatarSelected]}>
										<Image source={{ uri: member.avatar }} style={styles.memberAvatar} resizeMode="cover" />
										{member.selected && (
											<View style={styles.selectedBadge}>
												<Icon name="check" size={16} color="white" />
											</View>
										)}
									</View>
									<Text style={[styles.memberName, member.selected && styles.memberNameSelected]}>{member.name}</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>

					{/* Bottom Spacing */}
					<View style={styles.bottomSpacer} />
				</View>
			</ScrollView>

			{/* Save Button */}
			<View style={styles.footer}>
				<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
					<Icon name="content-save" size={24} color="white" />
					<Text style={styles.saveButtonText}>Save Milestone</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default CreateMilestone;
