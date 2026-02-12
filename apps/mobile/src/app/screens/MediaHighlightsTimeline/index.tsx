import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { ChannelEvent, ChannelEventAttachment } from '@mezon/store-mobile';
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
import {
	ActivityIndicator,
	FlatList,
	Image,
	Modal,
	NativeModules,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Entypo from 'react-native-vector-icons/Entypo';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import ImageNative from '../../components/ImageNative';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { TimelineSkeleton } from './TimelineSkeleton';
import { styles as createStyles } from './styles';

const isVideoFile = (att: ChannelEventAttachment) => att.file_type?.startsWith('video/');

const VideoThumbnailView: React.FC<{
	videoUrl: string;
	style: any;
	resizeMode?: 'cover' | 'contain';
}> = React.memo(({ videoUrl, style: imgStyle, resizeMode = 'cover' }) => {
	const [thumbUri, setThumbUri] = useState('');

	useEffect(() => {
		if (!videoUrl) return;
		if (Platform.OS === 'ios') {
			NativeModules.VideoThumbnailModule?.getThumbnail(videoUrl)
				.then((result: { uri?: string }) => setThumbUri(result?.uri || ''))
				.catch(() => setThumbUri(''));
		} else {
			NativeModules.VideoThumbnail?.getThumbnail(videoUrl)
				.then((path: string) => setThumbUri(typeof path === 'string' ? path : ''))
				.catch(() => setThumbUri(''));
		}
	}, [videoUrl]);

	if (!thumbUri) {
		return (
			<View style={[imgStyle, { alignItems: 'center', justifyContent: 'center' }]}>
				<ActivityIndicator size="small" color="#8B5CF6" />
			</View>
		);
	}

	return <Image source={{ uri: thumbUri }} style={imgStyle} resizeMode={resizeMode} />;
});

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

	const rawEvents = useAppSelector((state) => selectChannelMediaByChannelId(state, channelId));
	const events = useMemo(
		() =>
			[...rawEvents]
				.filter((e) => {
					if (!e.create_time_seconds) return true;
					return new Date(e.create_time_seconds * 1000)?.getFullYear() === Number(selectedYear);
				})
				.sort((a, b) => (b.create_time_seconds || 0) - (a.create_time_seconds || 0)),
		[rawEvents, selectedYear]
	);
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
					noCache: true,
					clan_id: clanId,
					channel_id: channelId,
					year: selectedYear,
					limit: 200
				})
			);
		}
	}, [dispatch, clanId, channelId, selectedYear]);

	const getEventMedia = useCallback((event: ChannelEvent) => {
		return (event.attachments || [])
			.map((att) => {
				const isVideo = isVideoFile(att);
				const originalUrl = att.thumbnail || att.file_url || '';
				if (!originalUrl) return null;
				const proxyUrl = isVideo ? '' : (createImgproxyUrl(originalUrl, { width: 200, height: 200, resizeType: 'fit' }) as string);
				return { proxyUrl, originalUrl, isVideo, fileUrl: att.file_url || '' };
			})
			.filter(Boolean) as { proxyUrl: string; originalUrl: string; isVideo: boolean; fileUrl: string }[];
	}, []);

	const getPosition = useCallback((index: number): 'left' | 'right' => {
		return index % 2 === 0 ? 'left' : 'right';
	}, []);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleEventPress = useCallback(
		(event: ChannelEvent) => {
			const date = event.start_time_seconds ? formatEventDate(event.start_time_seconds) : null;

			navigation.navigate(APP_SCREEN.ALBUM_DETAIL, {
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

	const renderMediaItem = useCallback((media: { proxyUrl: string; originalUrl: string; isVideo: boolean; fileUrl: string }, style: any) => {
		if (media.isVideo) {
			return (
				<View style={{ position: 'relative' }}>
					<VideoThumbnailView videoUrl={media.fileUrl} style={style} />
					<View style={videoStyles.playOverlay}>
						<Entypo name="controller-play" size={size.s_20} color="white" />
					</View>
				</View>
			);
		}
		return <ImageNative url={media.proxyUrl} urlOriginal={media.originalUrl} style={style} resizeMode="cover" />;
	}, []);

	const renderTimelineItem = useCallback(
		({ item: event, index }: { item: ChannelEvent; index: number }) => {
			const position = getPosition(index);
			const date = event.start_time_seconds ? formatEventDate(event.start_time_seconds) : null;
			const mediaItems = getEventMedia(event);
			const isAlbum = mediaItems.length > 1;

			return (
				<View style={styles.timelineItemWrapper}>
					<View style={styles.timelineLineSegment} />
					<View style={styles.timelineDot} />
					{date && (
						<View style={[styles.timelineDate, position === 'left' ? styles.timelineDateRight : styles.timelineDateLeft]}>
							<Text style={styles.dateMonth}>{date.month}</Text>
							<Text style={styles.dateDay}>{date.day}</Text>
							<Text style={styles.dateYear}>{date.year}</Text>
						</View>
					)}
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

							{mediaItems.length > 0 && (
								<View style={styles.eventImages}>
									{isAlbum ? (
										<View style={styles.albumGrid}>
											{mediaItems.slice(0, 2).map((media, idx) => (
												<View key={idx}>{renderMediaItem(media, styles.albumImage)}</View>
											))}
										</View>
									) : (
										renderMediaItem(mediaItems[0], styles.singleImage)
									)}
								</View>
							)}

							{/* View Album Link */}
							{isAlbum && (
								<View style={styles.viewAlbumButton}>
									<Text style={styles.viewAlbumText}>
										{t('mediaHighlights.viewAlbum')} ({mediaItems.length})
									</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>
				</View>
			);
		},
		[styles, getPosition, formatEventDate, getEventMedia, handleEventPress, renderMediaItem, t]
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
					<Text style={styles.headerSubtitle}>{selectedYear ? `${t('mediaHighlights.since')} ${selectedYear}` : ''}</Text>
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
				<View style={styles.loadingWrapper}>
					<TimelineSkeleton />
				</View>
			) : events.length > 0 ? (
				<>
					<FlatList
						data={events}
						extraData={events}
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

const videoStyles = StyleSheet.create({
	playOverlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.25)',
		borderRadius: size.s_10
	}
});

export default MediaHighlightsTimeline;
