import { useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { styles as createStyles } from './styles';

interface TimelineEvent {
	id: string;
	title: string;
	description: string;
	month: string;
	day: string;
	year: string;
	images?: string[];
	type?: 'album' | 'single';
	position: 'left' | 'right' | 'full';
	isSpecial?: boolean;
}

const MediaHighlightsTimeline: React.FC = () => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation();

	// Mock data - replace with real data from API/Redux
	const [events] = useState<TimelineEvent[]>([
		{
			id: '1',
			title: "Grandpa's 80th",
			description: 'A wonderful celebration at the lake house.',
			month: 'OCT',
			day: '05',
			year: '2018',
			images: ['https://picsum.photos/100/100', 'https://picsum.photos/100/101'],
			type: 'album',
			position: 'left'
		},
		{
			id: '2',
			title: "Sarah's Graduation",
			description: 'First graduate in the family! So proud.',
			month: 'JUN',
			day: '12',
			year: '2019',
			position: 'right'
		},
		{
			id: '3',
			title: 'New Baby Born',
			description: 'Welcome to the world, little Leo.',
			month: 'DEC',
			day: '24',
			year: '2020',
			images: ['https://picsum.photos/100/102'],
			type: 'album',
			position: 'left'
		},
		{
			id: '4',
			title: 'Summer Trip',
			description: 'Road trip across the coast.',
			month: 'AUG',
			day: '15',
			year: '2021',
			images: ['https://picsum.photos/400/250'],
			position: 'right'
		},
		{
			id: '5',
			title: '50th Wedding Anniversary',
			description: 'A golden celebration of love, commitment, and 50 beautiful years together.',
			month: 'SEP',
			day: '20',
			year: '2022',
			images: ['https://picsum.photos/400/300', 'https://picsum.photos/400/301'],
			type: 'album',
			position: 'full',
			isSpecial: true
		},
		{
			id: '6',
			title: 'New Home',
			description: 'Finally bought our dream house!',
			month: 'MAR',
			day: '01',
			year: '2023',
			position: 'left'
		}
	]);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleEventPress = (event: TimelineEvent) => {
		const eventImages = event.images?.map((uri, index) => ({
			id: `img-${index}`,
			uri,
			isFeatured: index === 0
		}));

		// @ts-expect-error - Navigation type issue
		navigation.navigate(APP_SCREEN.EVENT_DETAIL, {
			eventId: event.id,
			title: event.title,
			date: `${event.month} ${event.day}, ${event.year}`,
			images: eventImages
		});
	};

	const handleCreateNew = () => {
		// @ts-expect-error - Navigation type issue
		navigation.navigate(APP_SCREEN.CREATE_MILESTONE);
	};

	const handleOpenCalendar = () => {
		// @ts-expect-error - Navigation type issue
		navigation.navigate(APP_SCREEN.FAMILY_EVENTS);
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBack} style={styles.backButton}>
					<Icon name="arrow-left" size={24} color={themeValue.textStrong} />
				</TouchableOpacity>
				<View style={styles.headerTitleContainer}>
					<Text style={styles.headerSubtitle}>SINCE 1985</Text>
					<Text style={styles.headerTitle}>The Family Journey</Text>
					<Text style={styles.headerDescription}>Cherishing every moment together.</Text>
				</View>
				<View style={styles.headerRight}>
					<TouchableOpacity onPress={handleOpenCalendar}>
						<Icon name="calendar-month" size={24} color={themeValue.textStrong} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Timeline Content */}
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.timelineContainer}>
					{/* Timeline Line */}
					<View style={styles.timelineLine} />

					{/* Events */}
					{events.map((event, _index) => {
						const isFullWidth = event.position === 'full';

						return (
							<View key={event.id} style={[styles.timelineItemWrapper, isFullWidth && styles.timelineItemWrapperFull]}>
								{/* Timeline Dot */}
								<View style={styles.timelineDot} />

								{/* Date on Timeline */}
								{!isFullWidth && (
									<View
										style={[styles.timelineDate, event.position === 'left' ? styles.timelineDateRight : styles.timelineDateLeft]}
									>
										<Text style={styles.dateMonth}>{event.month}</Text>
										<Text style={styles.dateDay}>{event.day}</Text>
										<Text style={styles.dateYear}>{event.year}</Text>
									</View>
								)}

								{/* Event Card */}
								<View
									style={[
										styles.eventCardContainer,
										isFullWidth ? styles.eventCardFull : event.position === 'left' ? styles.eventCardLeft : styles.eventCardRight
									]}
								>
									<TouchableOpacity
										style={[
											styles.eventCard,
											isFullWidth && styles.eventCardFullWidth,
											event.isSpecial && styles.eventCardSpecial
										]}
										onPress={() => handleEventPress(event)}
										activeOpacity={0.8}
									>
										{/* Date badge for full-width events */}
										{isFullWidth && (
											<View style={styles.fullWidthDateBadge}>
												<Text style={styles.fullWidthDateMonth}>{event.month}</Text>
												<Text style={styles.fullWidthDateDay}>{event.day}</Text>
												<Text style={styles.fullWidthDateYear}>{event.year}</Text>
											</View>
										)}

										{event.isSpecial && (
											<View style={styles.specialBadge}>
												<Icon name="star" size={16} color="#FDD835" />
												<Text style={styles.specialBadgeText}>SPECIAL</Text>
											</View>
										)}

										<Text style={styles.eventTitle}>{event.title}</Text>
										<Text style={styles.eventDescription}>{event.description}</Text>

										{/* Images */}
										{event.images && event.images.length > 0 && (
											<View style={styles.eventImages}>
												{event.type === 'album' && event.images.length > 1 ? (
													<View style={[styles.albumGrid, isFullWidth && styles.albumGridFull]}>
														{event.images.slice(0, isFullWidth ? 4 : 2).map((img, idx) => (
															<Image key={idx} source={{ uri: img }} style={styles.albumImage} resizeMode="cover" />
														))}
													</View>
												) : event.images[0] ? (
													<Image
														source={{ uri: event.images[0] }}
														style={[styles.singleImage, isFullWidth && styles.singleImageFull]}
														resizeMode="cover"
													/>
												) : null}
											</View>
										)}

										{/* View Album Link */}
										{event.type === 'album' && event.images && event.images.length > 0 && (
											<TouchableOpacity style={styles.viewAlbumButton}>
												<Text style={styles.viewAlbumText}>View Album</Text>
											</TouchableOpacity>
										)}
									</TouchableOpacity>
								</View>
							</View>
						);
					})}
				</View>
			</ScrollView>

			{/* Floating Action Button */}
			<TouchableOpacity style={styles.fab} onPress={handleCreateNew} activeOpacity={0.8}>
				<Icon name="plus" size={28} color="white" />
			</TouchableOpacity>
		</View>
	);
};

export default MediaHighlightsTimeline;
