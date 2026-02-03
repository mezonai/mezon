import { useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { styles as createStyles } from './styles';

interface EventItem {
	id: string;
	title: string;
	description: string;
	date: Date;
	time?: string;
	isAllDay?: boolean;
	image?: string;
	category: string;
	daysUntil?: number;
}

const FamilyEvents: React.FC = () => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation();

	const [selectedDate, setSelectedDate] = useState(new Date());
	const [currentMonth] = useState(new Date(2023, 9, 1)); // October 2023

	// Mock events data
	const [events] = useState<EventItem[]>([
		{
			id: '1',
			title: "Grandpa's 80th",
			description: 'Celebrating a legacy of 80 years with the whole Miller clan. Join us for a vintage-themed gala night.',
			date: new Date(2023, 9, 25),
			time: '6:00 PM',
			image: 'https://picsum.photos/400/250',
			category: '80TH BIRTHDAY',
			daysUntil: 4
		},
		{
			id: '2',
			title: 'Family Reunion',
			description: 'Annual gathering at the old estate. Bring your favorite side dish and plenty of stories!',
			date: new Date(2023, 10, 12),
			isAllDay: true,
			image: 'https://picsum.photos/400/251',
			category: 'REUNION',
			daysUntil: 22
		}
	]);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleCreateNew = () => {
		// @ts-expect-error - Navigation type issue
		navigation.navigate(APP_SCREEN.CREATE_MILESTONE);
	};

	const handleEventPress = (event: EventItem) => {
		// @ts-expect-error - Navigation type issue
		navigation.navigate(APP_SCREEN.EVENT_DETAIL_SCREEN, {
			eventId: event.id,
			title: event.title,
			description: event.description,
			date: event.date,
			time: event.time,
			isAllDay: event.isAllDay,
			image: event.image,
			category: event.category,
			location: 'The Miller Estate, 124 Heritage Lane, Oakwood Springs'
		});
	};

	const handleAddToGallery = (_event: EventItem) => {
		// TODO: Add to gallery functionality
	};

	const handleRSVP = (_event: EventItem) => {
		// TODO: RSVP functionality
	};

	// Generate calendar days
	const generateCalendarDays = () => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = firstDay.getDay();

		const days = [];

		// Add empty slots for days before month starts
		for (let i = 0; i < startingDayOfWeek; i++) {
			const prevMonthDay = new Date(year, month, -(startingDayOfWeek - i - 1));
			days.push({ date: prevMonthDay, isCurrentMonth: false });
		}

		// Add days of current month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push({ date: new Date(year, month, day), isCurrentMonth: true });
		}

		return days;
	};

	const calendarDays = generateCalendarDays();
	const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

	const formatMonth = () => {
		return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	};

	const isDateSelected = (date: Date) => {
		return date.toDateString() === selectedDate.toDateString();
	};

	const hasEvent = (date: Date) => {
		return events.some((event) => event.date.toDateString() === date.toDateString());
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBack}>
					<Icon name="menu" size={28} color="white" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Family Events</Text>
				<TouchableOpacity>
					<Icon name="magnify" size={28} color="white" />
				</TouchableOpacity>
			</View>

			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Calendar */}
				<View style={styles.calendarContainer}>
					{/* Month Navigation */}
					<View style={styles.monthHeader}>
						<TouchableOpacity>
							<Icon name="chevron-left" size={28} color="white" />
						</TouchableOpacity>
						<Text style={styles.monthText}>{formatMonth()}</Text>
						<TouchableOpacity>
							<Icon name="chevron-right" size={28} color="white" />
						</TouchableOpacity>
					</View>

					{/* Week Days */}
					<View style={styles.weekDaysRow}>
						{weekDays.map((day, index) => (
							<View key={index} style={styles.weekDayCell}>
								<Text style={styles.weekDayText}>{day}</Text>
							</View>
						))}
					</View>

					{/* Calendar Grid */}
					<View style={styles.calendarGrid}>
						{calendarDays.map((item, index) => (
							<TouchableOpacity
								key={index}
								style={[
									styles.dayCell,
									isDateSelected(item.date) && styles.dayCellSelected,
									hasEvent(item.date) && styles.dayCellHasEvent
								]}
								onPress={() => setSelectedDate(item.date)}
							>
								<Text
									style={[
										styles.dayText,
										!item.isCurrentMonth && styles.dayTextInactive,
										isDateSelected(item.date) && styles.dayTextSelected
									]}
								>
									{item.date.getDate()}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Upcoming Events Section */}
				<View style={styles.eventsSection}>
					<View style={styles.eventsSectionHeader}>
						<Text style={styles.eventsSectionTitle}>Upcoming Events</Text>
						<TouchableOpacity style={styles.heritageFeedButton}>
							<Text style={styles.heritageFeedText}>HERITAGE FEED</Text>
						</TouchableOpacity>
					</View>

					{/* Events List */}
					{events.map((event) => (
						<TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => handleEventPress(event)}>
							{/* Event Image */}
							{event.image && (
								<View style={styles.eventImageContainer}>
									<Image source={{ uri: event.image }} style={styles.eventImage} resizeMode="cover" />
									<View style={styles.eventCategoryBadge}>
										<Text style={styles.eventCategoryText}>{event.category}</Text>
									</View>
								</View>
							)}

							{/* Event Content */}
							<View style={styles.eventContent}>
								<Text style={styles.eventTitle}>{event.title}</Text>

								{/* Event Date/Time */}
								<View style={styles.eventDateTime}>
									<Icon name="calendar" size={18} color="#8B5CF6" />
									<Text style={styles.eventDateTimeText}>
										{event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										{event.time && ` • ${event.time}`}
										{event.isAllDay && ' • All Day'}
									</Text>
									{event.daysUntil && (
										<View style={styles.daysUntilBadge}>
											<Text style={styles.daysUntilText}>In {event.daysUntil} days</Text>
										</View>
									)}
								</View>

								{/* Event Description */}
								<Text style={styles.eventDescription}>{event.description}</Text>

								{/* Action Buttons */}
								<View style={styles.eventActions}>
									<TouchableOpacity style={styles.addToGalleryButton} onPress={() => handleAddToGallery(event)}>
										<Icon name="camera-plus" size={20} color="white" />
										<Text style={styles.addToGalleryText}>Add to Gallery</Text>
									</TouchableOpacity>
									<TouchableOpacity style={styles.shareButton} onPress={() => handleRSVP(event)}>
										<Icon name="share-variant" size={20} color="white" />
									</TouchableOpacity>
								</View>
							</View>
						</TouchableOpacity>
					))}
				</View>

				<View style={styles.bottomSpacer} />
			</ScrollView>

			{/* FAB */}
			<TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
				<Icon name="plus" size={28} color="white" />
			</TouchableOpacity>
		</View>
	);
};

export default FamilyEvents;
