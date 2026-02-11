import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { ChannelEvent } from '@mezon/store-mobile';
import {
	channelMediaActions,
	selectChannelMediaByChannelId,
	selectChannelMediaLoadingStatus,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import ImageNative from '../../components/ImageNative';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { TimelineSkeleton } from './TimelineSkeleton';
import { styles as createStyles } from './styles';

const MediaHighlightsTimeline: React.FC = () => {
	const { t } = useTranslation(['channelCreator']);
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation<any>();
	const route = useRoute<any>();
	const dispatch = useAppDispatch();

	const channelId = route.params?.channelId || '';
	const channelName = route.params?.channelName || '';
	const clanId = route.params?.clanId || '';

	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const [showYearPicker, setShowYearPicker] = useState(false);

	const events = useAppSelector((state) => selectChannelMediaByChannelId(state, channelId));
	const loadingStatus = useAppSelector(selectChannelMediaLoadingStatus);

	const yearList = useMemo(() => {
		const years: number[] = [];
		for (let y = currentYear; y >= currentYear - 10; y--) {
			years.push(y);
		}
		return years;
	}, [currentYear]);

	const months = useMemo(() => (t('monthsShort', { returnObjects: true }) as string[]) || [], [t]);

	const formatEventDate = useCallback(
		(timestampSeconds: number) => {
			const date = new Date(timestampSeconds * 1000);
			return {
				month: months[date.getMonth()],
				day: String(date.getDate()).padStart(2, '0'),
				year: String(date.getFullYear())
			};
		},
		[months]
	);

	useEffect(() => {
		if (clanId && channelId) {
			dispatch(
				channelMediaActions.fetchChannelMedia({
					clan_id: clanId,
					channel_id: channelId,
					year: selectedYear,
					limit: 200
				})
			);
		}
	}, [dispatch, clanId, channelId, selectedYear]);

	const getEventImages = useCallback((event: ChannelEvent) => {
		return (event.attachments || [])
			.map((att) => {
				const originalUrl = att.thumbnail || att.file_url || '';
				if (!originalUrl) return null;
				const proxyUrl = createImgproxyUrl(originalUrl, {
					width: 200,
					height: 200,
					resizeType: 'fit'
				}) as string;
				return { proxyUrl, originalUrl };
			})
			.filter(Boolean) as { proxyUrl: string; originalUrl: string }[];
	}, []);

	const getPosition = useCallback((index: number): 'left' | 'right' => {
		return index % 2 === 0 ? 'left' : 'right';
	}, []);

	const firstYear = useMemo(() => {
		if (!events.length) return '';
		const sorted = [...events].sort((a, b) => (a.start_time_seconds || 0) - (b.start_time_seconds || 0));
		const oldest = sorted[0];
		if (!oldest?.start_time_seconds) return '';
		return String(new Date(oldest.start_time_seconds * 1000).getFullYear());
	}, [events]);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleEventPress = useCallback(
		(event: ChannelEvent) => {
			const date = event.start_time_seconds ? formatEventDate(event.start_time_seconds) : null;

			navigation.navigate(APP_SCREEN.EVENT_DETAIL, {
				eventId: event.id,
				title: event.title,
				description: event.description || '',
				startTimeSeconds: event.start_time_seconds,
				date: date ? `${date.month} ${date.day}, ${date.year}` : '',
				attachments: event.attachments || [],
				channelId,
				clanId
			});
		},
		[formatEventDate, navigation, channelId, clanId]
	);

	const handleCreateNew = () => {
		navigation.navigate(APP_SCREEN.CREATE_MILESTONE, { channelId, clanId });
	};

	const handleOpenCalendar = useCallback(() => {
		setShowYearPicker(true);
	}, []);

	const handleSelectYear = useCallback((year: number) => {
		setSelectedYear(year);
		setShowYearPicker(false);
	}, []);

	const renderTimelineItem = useCallback(
		({ item: event, index }: { item: ChannelEvent; index: number }) => {
			const position = getPosition(index);
			const date = event.start_time_seconds ? formatEventDate(event.start_time_seconds) : null;
			const images = getEventImages(event);
			const isAlbum = images.length > 1;

			return (
				<View style={styles.timelineItemWrapper}>
					{/* Timeline Line Segment */}
					<View style={styles.timelineLineSegment} />

					{/* Timeline Dot */}
					<View style={styles.timelineDot} />

					{/* Date on Timeline */}
					{date && (
						<View style={[styles.timelineDate, position === 'left' ? styles.timelineDateRight : styles.timelineDateLeft]}>
							<Text style={styles.dateMonth}>{date.month}</Text>
							<Text style={styles.dateDay}>{date.day}</Text>
							<Text style={styles.dateYear}>{date.year}</Text>
						</View>
					)}

					{/* Event Card */}
					<View style={[styles.eventCardContainer, position === 'left' ? styles.eventCardLeft : styles.eventCardRight]}>
						<TouchableOpacity style={styles.eventCard} onPress={() => handleEventPress(event)} activeOpacity={0.8}>
							{event.title ? (
								<Text style={styles.eventTitle} numberOfLines={2}>
									{event.title}
								</Text>
							) : null}
							{event.description ? (
								<Text style={styles.eventDescription} numberOfLines={3}>
									{event.description}
								</Text>
							) : null}

							{/* Images */}
							{images.length > 0 && (
								<View style={styles.eventImages}>
									{isAlbum ? (
										<View style={styles.albumGrid}>
											{images.slice(0, 2).map((img, idx) => (
												<ImageNative
													key={idx}
													url={img.proxyUrl}
													urlOriginal={img.originalUrl}
													style={styles.albumImage}
													resizeMode="cover"
												/>
											))}
										</View>
									) : (
										<ImageNative
											url={images[0].proxyUrl}
											urlOriginal={images[0].originalUrl}
											style={styles.singleImage}
											resizeMode="cover"
										/>
									)}
								</View>
							)}

							{/* View Album Link */}
							{isAlbum && (
								<View style={styles.viewAlbumButton}>
									<Text style={styles.viewAlbumText}>
										{t('mediaHighlights.viewAlbum')} ({images.length})
									</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>
				</View>
			);
		},
		[styles, getPosition, formatEventDate, getEventImages, handleEventPress, t]
	);

	const keyExtractor = useCallback((item: ChannelEvent) => item.id, []);

	return (
		<View style={styles.container}>
			{/* Header */}
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBack} style={styles.backButton}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} width={size.s_24} height={size.s_24} color={themeValue.textStrong} />
				</TouchableOpacity>
				<View style={styles.headerTitleContainer}>
					{firstYear ? (
						<Text style={styles.headerSubtitle}>
							{t('mediaHighlights.since')} {firstYear}
						</Text>
					) : null}
					<Text style={styles.headerTitle} numberOfLines={3}>
						{events.length > 0 ? t('mediaHighlights.title') : t('mediaHighlights.familyJourney')}
					</Text>
					<Text style={styles.headerDescription} numberOfLines={3}>
						{events.length > 0 ? channelName : t('mediaHighlights.cherishMoment')}
					</Text>
				</View>
				<View style={styles.headerRight}>
					<TouchableOpacity onPress={handleOpenCalendar}>
						<MezonIconCDN icon={IconCDN.calendarIcon} width={size.s_24} height={size.s_24} color={themeValue.textStrong} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Content */}
			{loadingStatus === 'loading' && events.length === 0 ? (
				<TimelineSkeleton />
			) : events.length > 0 ? (
				<>
					<FlatList
						data={events}
						renderItem={renderTimelineItem}
						keyExtractor={keyExtractor}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
						initialNumToRender={5}
						maxToRenderPerBatch={5}
						windowSize={7}
						removeClippedSubviews={true}
					/>

					{/* Floating Action Button */}
					<TouchableOpacity style={styles.fab} onPress={handleCreateNew} activeOpacity={0.8}>
						<MezonIconCDN icon={IconCDN.plusLargeIcon} width={size.s_28} height={size.s_28} color="white" />
					</TouchableOpacity>
				</>
			) : (
				<View style={styles.emptyContainer}>
					<Image source={IconCDN.bgEmptyIcon} style={styles.emptyImage} resizeMode="contain" />
					<Text style={styles.emptyTitle}>{t('mediaHighlights.emptyTitle')}</Text>
					<Text style={styles.emptyDescription}>{t('mediaHighlights.emptyDescription')}</Text>
					<TouchableOpacity style={styles.createButton} onPress={handleCreateNew} activeOpacity={0.8}>
						<MezonIconCDN icon={IconCDN.plusLargeIcon} width={size.s_20} height={size.s_20} color="white" />
						<Text style={styles.createButtonText}>{t('mediaHighlights.createFirstMilestone')}</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* Year Picker Modal */}
			<Modal visible={showYearPicker} transparent animationType="fade" onRequestClose={() => setShowYearPicker(false)}>
				<Pressable style={internalStyles.overlay} onPress={() => setShowYearPicker(false)}>
					<View style={[internalStyles.yearPickerContainer, { backgroundColor: themeValue.secondary }]}>
						<Text style={[internalStyles.yearPickerTitle, { color: themeValue.textStrong }]}>
							{t('mediaHighlights.selectYear', { defaultValue: 'Select Year' })}
						</Text>
						<FlatList
							data={yearList}
							keyExtractor={(item) => String(item)}
							showsVerticalScrollIndicator={false}
							style={internalStyles.yearList}
							renderItem={({ item: year }) => (
								<TouchableOpacity
									style={[internalStyles.yearItem, year === selectedYear && internalStyles.yearItemSelected]}
									onPress={() => handleSelectYear(year)}
									activeOpacity={0.7}
								>
									<Text
										style={[
											internalStyles.yearText,
											{ color: themeValue.text },
											year === selectedYear && internalStyles.yearTextSelected
										]}
									>
										{year}
									</Text>
								</TouchableOpacity>
							)}
						/>
					</View>
				</Pressable>
			</Modal>
		</View>
	);
};

const internalStyles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	yearPickerContainer: {
		width: 280,
		maxHeight: 400,
		borderRadius: size.s_16,
		paddingVertical: size.s_16,
		paddingHorizontal: size.s_8
	},
	yearPickerTitle: {
		fontSize: size.s_18,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: size.s_12
	},
	yearList: {
		flexGrow: 0
	},
	yearItem: {
		paddingVertical: size.s_12,
		paddingHorizontal: size.s_16,
		borderRadius: size.s_10,
		marginVertical: 2
	},
	yearItemSelected: {
		backgroundColor: baseColor.blurple
	},
	yearText: {
		fontSize: size.s_16,
		fontWeight: '500',
		textAlign: 'center'
	},
	yearTextSelected: {
		color: 'white',
		fontWeight: '700'
	}
});

export default MediaHighlightsTimeline;
