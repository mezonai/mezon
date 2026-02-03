import { useTheme } from '@mezon/mobile-ui';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles as createStyles } from './styles';

interface Guest {
	id: string;
	name: string;
	avatar: string;
}

interface Discussion {
	id: string;
	author: string;
	authorAvatar: string;
	message: string;
	timestamp: Date;
}

interface RouteParams {
	eventId: string;
	title: string;
	description: string;
	date: Date;
	time?: string;
	isAllDay?: boolean;
	image?: string;
	category: string;
	location?: string;
}

const EventDetailScreen: React.FC = () => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation();
	const route = useRoute();
	const params = route.params as RouteParams;

	const [isGoing, setIsGoing] = useState(false);

	// Mock data
	const [guests] = useState<Guest[]>([
		{ id: '1', name: 'Sarah', avatar: 'https://picsum.photos/100/100' },
		{ id: '2', name: 'Michael', avatar: 'https://picsum.photos/100/101' },
		{ id: '3', name: 'Emma', avatar: 'https://picsum.photos/100/102' },
		{ id: '4', name: 'David', avatar: 'https://picsum.photos/100/103' },
		{ id: '5', name: 'Sophia', avatar: 'https://picsum.photos/100/104' }
	]);

	const [discussions] = useState<Discussion[]>([
		{
			id: '1',
			author: 'Aunt Sarah',
			authorAvatar: 'https://picsum.photos/100/105',
			message: 'Has anyone arranged the catering for the cake yet? I can help!',
			timestamp: new Date()
		}
	]);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleShare = () => {
		console.log('Share event');
	};

	const handleMenu = () => {
		console.log('Open menu');
	};

	const handleToggleGoing = () => {
		setIsGoing(!isGoing);
	};

	const handleAddPhotos = () => {
		console.log('Add photos');
	};

	const handleAddToCalendar = () => {
		console.log('Add to calendar');
	};

	const handleSeeAllGuests = () => {
		console.log('See all guests');
	};

	const handleJoinLiveChat = () => {
		console.log('Join live chat');
	};

	const formatDate = () => {
		if (!params.date) return '';
		const date = new Date(params.date);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	};

	const formatTime = () => {
		if (params.isAllDay) return 'All Day';
		return params.time || '';
	};

	return (
		<View style={styles.container}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Hero Image */}
				<View style={styles.heroContainer}>
					<Image source={{ uri: params.image || 'https://picsum.photos/400/300' }} style={styles.heroImage} resizeMode="cover" />

					{/* Header Overlay */}
					<View style={styles.headerOverlay}>
						<TouchableOpacity onPress={handleBack} style={styles.headerButton}>
							<Icon name="chevron-left" size={32} color="white" />
						</TouchableOpacity>
						<View style={styles.headerRight}>
							<TouchableOpacity onPress={handleShare} style={styles.headerButton}>
								<Icon name="share-variant" size={24} color="white" />
							</TouchableOpacity>
							<TouchableOpacity onPress={handleMenu} style={styles.headerButton}>
								<Icon name="dots-vertical" size={24} color="white" />
							</TouchableOpacity>
						</View>
					</View>

					{/* Category Badge */}
					<View style={styles.categoryBadge}>
						<Text style={styles.categoryText}>{params.category}</Text>
					</View>

					{/* Title Overlay */}
					<View style={styles.titleOverlay}>
						<Text style={styles.eventTitle}>{params.title}</Text>
						<View style={styles.dateTimeRow}>
							<Icon name="calendar" size={16} color="white" />
							<Text style={styles.dateTimeText}>
								{formatDate()} • {formatTime()}
							</Text>
						</View>
					</View>
				</View>

				{/* Content */}
				<View style={styles.content}>
					{/* Action Buttons */}
					<View style={styles.actionButtons}>
						<TouchableOpacity style={[styles.goingButton, isGoing && styles.goingButtonActive]} onPress={handleToggleGoing}>
							<Icon name={isGoing ? 'check-circle' : 'check-circle-outline'} size={20} color="white" />
							<Text style={styles.goingButtonText}>{isGoing ? 'Going' : 'Going?'}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.addPhotosButton} onPress={handleAddPhotos}>
							<Icon name="camera-plus" size={20} color="white" />
							<Text style={styles.addPhotosButtonText}>Add Photos</Text>
						</TouchableOpacity>
					</View>

					{/* Time Section */}
					<View style={styles.infoSection}>
						<View style={styles.infoIconContainer}>
							<Icon name="clock-outline" size={24} color="#8B5CF6" />
						</View>
						<View style={styles.infoContent}>
							<Text style={styles.infoTitle}>Time</Text>
							<Text style={styles.infoText}>
								{formatDate().split(',')[1]} • {formatTime()}
							</Text>
							<TouchableOpacity onPress={handleAddToCalendar}>
								<Text style={styles.addToCalendarText}>ADD TO CALENDAR</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Location Section */}
					{params.location && (
						<View style={styles.infoSection}>
							<View style={styles.infoIconContainer}>
								<Icon name="map-marker" size={24} color="#8B5CF6" />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoTitle}>Location</Text>
								<Text style={styles.infoText}>{params.location}</Text>
								{/* Map Preview */}
								<View style={styles.mapPreview}>
									<Icon name="map" size={48} color="#666680" />
									<Text style={styles.mapPreviewText}>Map Preview</Text>
								</View>
							</View>
						</View>
					)}

					{/* Description */}
					<View style={styles.descriptionSection}>
						<Text style={styles.sectionTitle}>Description</Text>
						<Text style={styles.descriptionText}>{params.description}</Text>
					</View>

					{/* Guest List */}
					<View style={styles.guestSection}>
						<View style={styles.guestHeader}>
							<Text style={styles.sectionTitle}>Guest List</Text>
							<Text style={styles.guestCount}>{guests.length + 19} Attending</Text>
							<TouchableOpacity onPress={handleSeeAllGuests}>
								<Text style={styles.seeAllText}>SEE ALL</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.guestAvatars}>
							{guests.slice(0, 5).map((guest) => (
								<Image key={guest.id} source={{ uri: guest.avatar }} style={styles.guestAvatar} />
							))}
							<View style={styles.moreGuestsAvatar}>
								<Text style={styles.moreGuestsText}>+19</Text>
							</View>
						</View>
					</View>

					{/* Event Discussion */}
					<View style={styles.discussionSection}>
						<View style={styles.discussionHeader}>
							<Icon name="message-text" size={24} color="#8B5CF6" />
							<Text style={styles.discussionTitle}>Event Discussion</Text>
							<View style={styles.discussionBadge}>
								<Text style={styles.discussionBadgeText}>3</Text>
							</View>
						</View>

						{discussions.map((discussion) => (
							<View key={discussion.id} style={styles.discussionItem}>
								<Image source={{ uri: discussion.authorAvatar }} style={styles.discussionAvatar} />
								<View style={styles.discussionContent}>
									<Text style={styles.discussionAuthor}>{discussion.author}</Text>
									<Text style={styles.discussionMessage}>{discussion.message}</Text>
								</View>
							</View>
						))}

						<TouchableOpacity style={styles.joinChatButton} onPress={handleJoinLiveChat}>
							<Text style={styles.joinChatButtonText}>Join Live Chat</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.bottomSpacer} />
				</View>
			</ScrollView>
		</View>
	);
};

export default EventDetailScreen;
