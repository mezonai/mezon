import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelEvent } from '@mezon/store-mobile';
import {
	channelMediaActions,
	selectChannelMediaByChannelId,
	selectChannelMediaLoadingStatus,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import ImageNative from '../../components/ImageNative';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { styles as createStyles } from './styles';

const getDaysUntil = (timestampSeconds: number): number | null => {
	const now = Date.now();
	const eventTime = timestampSeconds * 1000;
	if (eventTime <= now) return null;
	return Math.ceil((eventTime - now) / (1000 * 60 * 60 * 24));
};

const generateYearList = (): number[] => {
	const currentYear = new Date().getFullYear();
	const years: number[] = [];
	for (let y = currentYear; y >= currentYear - 5; y--) {
		years.push(y);
	}
	return years;
};

const FamilyEvents: React.FC = () => {
	const { t } = useTranslation('channelCreator');
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation<any>();
	const route = useRoute<any>();
	const dispatch = useAppDispatch();

	const channelId = route.params?.channelId || '';
	const clanId = route.params?.clanId || '';

	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
	const years = useMemo(() => generateYearList(), []);

	const events = useAppSelector((state) => selectChannelMediaByChannelId(state, channelId));
	const loadingStatus = useAppSelector(selectChannelMediaLoadingStatus);
	const isLoading = loadingStatus === 'loading';

	const months = (t('monthsShort', { returnObjects: true }) as string[]) || [];

	const formatDate = useCallback(
		(timestampSeconds: number) => {
			const date = new Date(timestampSeconds * 1000);
			const month = months[date.getMonth()];
			return {
				month,
				day: date.getDate(),
				year: date.getFullYear(),
				formatted: `${month} ${date.getDate()}, ${date.getFullYear()}`
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
					limit: 50
				})
			);
		}
	}, [dispatch, clanId, channelId, selectedYear]);

	const getEventThumbnail = useCallback((event: ChannelEvent): string | undefined => {
		const attachment = event.attachments?.[0];
		return attachment?.thumbnail || attachment?.file_url;
	}, []);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleCreateNew = () => {
		navigation.navigate(APP_SCREEN.CREATE_MILESTONE, { channelId, clanId });
	};

	const handleEventPress = useCallback(
		(event: ChannelEvent) => {
			const thumbnail = getEventThumbnail(event);

			navigation.navigate(APP_SCREEN.EVENT_DETAIL_SCREEN, {
				eventId: event.id || '',
				title: event.title || '',
				description: event.description || '',
				date: event.start_time_seconds ? new Date(event.start_time_seconds * 1000) : new Date(),
				image: thumbnail,
				category: event.title?.toUpperCase() || '',
				location: event.location || ''
			});
		},
		[getEventThumbnail, navigation]
	);

	const handleYearSelect = useCallback((year: number) => {
		setSelectedYear(year);
	}, []);

	const renderEventItem = useCallback(
		({ item: event }: { item: ChannelEvent }) => {
			const date = event.start_time_seconds ? formatDate(event.start_time_seconds) : null;
			const daysUntil = event.start_time_seconds ? getDaysUntil(event.start_time_seconds) : null;
			const thumbnail = getEventThumbnail(event);

			return (
				<TouchableOpacity style={styles.eventCard} onPress={() => handleEventPress(event)}>
					{/* Event Image */}
					{thumbnail && (
						<View style={styles.eventImageContainer}>
							<ImageNative url={thumbnail} style={styles.eventImage} resizeMode="cover" />
							{event.title && (
								<View style={styles.eventCategoryBadge}>
									<Text style={styles.eventCategoryText}>{event.title.toUpperCase()}</Text>
								</View>
							)}
						</View>
					)}

					{/* Event Content */}
					<View style={styles.eventContent}>
						{event.title ? <Text style={styles.eventTitle}>{event.title}</Text> : null}

						{/* Event Date/Time */}
						{date && (
							<View style={styles.eventDateTime}>
								<MezonIconCDN icon={IconCDN.calendarIcon} width={size.s_18} height={size.s_18} color="#8B5CF6" />
								<Text style={styles.eventDateTimeText}>{date.formatted}</Text>
								{daysUntil && daysUntil > 0 && (
									<View style={styles.daysUntilBadge}>
										<Text style={styles.daysUntilText}>{t('familyEvents.inDays', { count: daysUntil })}</Text>
									</View>
								)}
							</View>
						)}

						{/* Event Description */}
						{event.description ? <Text style={styles.eventDescription}>{event.description}</Text> : null}
					</View>
				</TouchableOpacity>
			);
		},
		[getEventThumbnail, handleEventPress, styles, formatDate, t]
	);

	const keyExtractor = useCallback((item: ChannelEvent) => item.id || '', []);

	const listHeaderComponent = useMemo(
		() => (
			<>
				{/* Events Section Header */}
				<View style={styles.eventsSectionHeader}>
					<Text style={styles.eventsSectionTitle}>
						{t('familyEvents.eventsIn')} {selectedYear}
					</Text>
				</View>

				{isLoading && events.length === 0 && (
					<View style={{ paddingVertical: size.s_40, alignItems: 'center' }}>
						<ActivityIndicator />
					</View>
				)}
			</>
		),
		[styles, selectedYear, isLoading, events.length, t]
	);

	const listEmptyComponent = useMemo(
		() =>
			!isLoading ? (
				<View style={{ paddingVertical: size.s_40, alignItems: 'center' }}>
					<Text style={{ color: '#9999bb', fontSize: size.s_16 }}>
						{t('familyEvents.noEvents')} {selectedYear}
					</Text>
				</View>
			) : null,
		[isLoading, selectedYear, t]
	);

	const listFooterComponent = useMemo(() => <View style={styles.bottomSpacer} />, [styles.bottomSpacer]);

	return (
		<View style={styles.container}>
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBack}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} width={size.s_24} height={size.s_24} color={themeValue.text} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{t('familyEvents.title')}</Text>
				<View style={{ width: size.s_28 }} />
			</View>
			{/* Year Filter */}
			<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.yearFilterContainer}>
				{years.map((year) => (
					<TouchableOpacity
						key={year}
						style={[styles.yearChip, selectedYear === year && styles.yearChipSelected]}
						onPress={() => handleYearSelect(year)}
					>
						<Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextSelected]}>{year}</Text>
					</TouchableOpacity>
				))}
			</ScrollView>
			<FlatList
				style={styles.scrollView}
				data={events}
				keyExtractor={keyExtractor}
				renderItem={renderEventItem}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={listHeaderComponent}
				ListEmptyComponent={listEmptyComponent}
				ListFooterComponent={listFooterComponent}
			/>

			{/* FAB */}
			<TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
				<MezonIconCDN icon={IconCDN.plusLargeIcon} width={size.s_28} height={size.s_28} color="white" />
			</TouchableOpacity>
		</View>
	);
};

export default FamilyEvents;
