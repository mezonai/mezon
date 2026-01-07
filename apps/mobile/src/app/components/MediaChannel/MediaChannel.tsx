import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { AttachmentEntity } from '@mezon/store-mobile';
import {
	galleryActions,
	selectCurrentClanId,
	selectCurrentLanguage,
	selectGalleryAttachmentsByChannel,
	selectGalleryPaginationByChannel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import moment from 'moment';
import 'moment/locale/en-au';
import 'moment/locale/vi';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ViewToken } from 'react-native';
import { ActivityIndicator, DeviceEventEmitter, Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { EmptySearchPage } from '../EmptySearchPage';
import { ImageListModal } from '../ImageListModal';
import { style } from './MediaChannel.styles';
import { MediaItem } from './MediaItem';
import MediaSkeleton from './MediaSkeleton/MediaSkeleton';

interface FlatDataItem {
	id: string;
	type: 'header' | 'row';
	date?: string;
	items?: AttachmentEntity[];
	rowIndex?: number;
}

interface IMediaChannelProps {
	channelId: string;
	isDM: boolean;
}

const MAX_COLUMNS = 3;
const ITEMS_PER_ROW = 3;

const MediaChannel = memo(({ channelId, isDM }: IMediaChannelProps) => {
	const widthScreen = Dimensions.get('screen').width;
	const widthImage = useMemo(() => {
		return (widthScreen - size.s_42) / MAX_COLUMNS;
	}, [widthScreen]);
	const { themeValue } = useTheme();
	const styles = style(themeValue, widthImage);
	const dispatch = useAppDispatch();
	const currentChannelId = channelId;
	const galleryAttachmentsByChannel = useAppSelector((state) => selectGalleryAttachmentsByChannel(state, currentChannelId));
	const paginationState = useAppSelector((state) => selectGalleryPaginationByChannel(state, currentChannelId));
	const currentClanId = useAppSelector((state) => selectCurrentClanId(state as any)) ?? '';
	const currentLanguage = useAppSelector(selectCurrentLanguage);
	const attachments = useMemo(() => {
		return galleryAttachmentsByChannel?.filter((attachment) => !attachment?.url?.includes(`${process.env.NX_BASE_IMG_URL}/stickers`)) ?? [];
	}, [galleryAttachmentsByChannel]);

	useEffect(() => {
		moment.locale(currentLanguage);
	}, [currentLanguage]);

	const visibleDatesRef = useRef<Set<string>>(new Set());

	// Memoize date grouping separately for better performance
	const dateGroups = useMemo(() => {
		if (!attachments || attachments.length === 0) {
			return new Map<string, AttachmentEntity[]>();
		}

		const groups = new Map<string, AttachmentEntity[]>();

		for (const attachment of attachments) {
			if (!attachment.createTime) continue;

			const date = new Date(attachment.createTime);
			const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

			if (!groups.has(dateKey)) {
				groups.set(dateKey, []);
			}
			groups.get(dateKey)!.push(attachment);
		}

		return groups;
	}, [attachments]);

	const flatData: FlatDataItem[] = useMemo(() => {
		if (dateGroups.size === 0) {
			return [];
		}

		const result: FlatDataItem[] = [];

		dateGroups.forEach((items, dateKey) => {
			// Add header
			result.push({
				id: `header-${dateKey}`,
				type: 'header',
				date: dateKey
			});

			// Split items into rows of 3
			for (let i = 0; i < items.length; i += ITEMS_PER_ROW) {
				const rowItems = items.slice(i, i + ITEMS_PER_ROW);
				result.push({
					id: `row-${dateKey}-${i}`,
					type: 'row',
					items: rowItems,
					rowIndex: i / ITEMS_PER_ROW
				});
			}
		});

		return result;
	}, [dateGroups]);

	const openImage = useCallback(
		(image: AttachmentEntity) => {
			const data = {
				children: <ImageListModal channelId={channelId} imageSelected={image as AttachmentEntity} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		},
		[channelId]
	);

	const handleEndReached = useCallback(() => {
		if (!attachments || attachments.length === 0) return;
		if (paginationState?.isLoading) return;
		if (!paginationState?.hasMoreBefore) return;

		const lastAttachment = attachments[attachments.length - 1];
		const timestamp = lastAttachment?.createTime;
		const beforeTs = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : undefined;
		if (!beforeTs) return;

		dispatch(galleryActions.setGalleryLoading({ channelId: currentChannelId, isLoading: true }));
		dispatch(
			galleryActions.fetchGalleryAttachments({
				clanId: currentClanId,
				channelId: currentChannelId,
				limit: paginationState?.limit ?? 50,
				before: beforeTs,
				direction: 'before'
			})
		);
	}, [attachments, paginationState, currentClanId, currentChannelId, dispatch]);

	const formatDateHeader = useCallback((dateString: string) => {
		try {
			return moment(dateString).format('LL');
		} catch (error) {
			return dateString;
		}
	}, []);

	// Memoized header component
	const renderHeader = useCallback(
		(item: FlatDataItem) => (
			<View style={styles.sectionHeader}>
				<LinearGradient
					start={{ x: 1, y: 0 }}
					end={{ x: 0, y: 0 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={[StyleSheet.absoluteFillObject]}
				/>
				<Text style={styles.sectionDayHeaderTitle}>{formatDateHeader(item.date!)}</Text>
			</View>
		),
		[styles.sectionHeader, styles.sectionDayHeaderTitle, themeValue.primary, themeValue?.primaryGradiant, formatDateHeader]
	);

	// Memoized row component
	const renderRow = useCallback(
		(item: FlatDataItem) => (
			<View style={styles.rowContainer}>
				{item.items?.map((media, idx) => (
					<View key={media?.id || `${idx}_${media?.filename}`} style={styles.rowItem}>
						<MediaItem data={media} onPress={openImage} isDM={isDM} />
					</View>
				))}
			</View>
		),
		[styles.rowContainer, styles.rowItem, openImage, isDM]
	);

	const renderItem = useCallback(
		({ item }: { item: FlatDataItem }) => {
			if (item.type === 'header') {
				return renderHeader(item);
			}
			return renderRow(item);
		},
		[renderHeader, renderRow]
	);

	const renderListFooter = useCallback(() => {
		if (!paginationState?.isLoading) return null;
		return (
			<View style={styles.listFooter}>
				<ActivityIndicator size="small" />
			</View>
		);
	}, [paginationState?.isLoading, styles]);

	const getItemLayout = useCallback(
		(data: any, index: number) => {
			const item = flatData[index];
			if (!item) {
				return { length: 0, offset: 0, index };
			}

			const headerHeight = size.s_50;
			const rowHeight = widthImage + size.s_8;
			let offset = 0;
			let length = 0;

			if (item.type === 'header') {
				length = headerHeight;
				for (let i = 0; i < index; i++) {
					const prevItem = flatData[i];
					offset += prevItem.type === 'header' ? headerHeight : rowHeight;
				}
			} else {
				length = rowHeight;
				for (let i = 0; i < index; i++) {
					const prevItem = flatData[i];
					offset += prevItem.type === 'header' ? headerHeight : rowHeight;
				}
			}

			return { length, offset, index };
		},
		[flatData, widthImage]
	);

	const viewabilityConfigRef = useRef({
		itemVisiblePercentThreshold: 50,
		minimumViewTime: 100
	});

	const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
		const newVisibleDates = new Set<string>();
		viewableItems.forEach((item) => {
			if (item.item.type === 'header' && item.item.date) {
				newVisibleDates.add(item.item.date);
			}
		});
		visibleDatesRef.current = newVisibleDates;
	}).current;

	useEffect(() => {
		if (!currentClanId || !currentChannelId) return;
		if (paginationState?.isLoading) return;

		dispatch(
			galleryActions.fetchGalleryAttachments({
				clanId: currentClanId,
				channelId: currentChannelId,
				limit: paginationState?.limit ?? 50,
				direction: 'initial'
			})
		);
	}, [currentClanId, currentChannelId]);

	const keyExtractor = useCallback((item: FlatDataItem) => item.id, []);

	return (
		<View style={styles.wrapper}>
			{paginationState?.isLoading && attachments?.length === 0 ? (
				<MediaSkeleton numberSkeleton={12} />
			) : flatData.length > 0 ? (
				<FlatList
					data={flatData}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
					ListFooterComponent={renderListFooter}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
					bounces={false}
					initialNumToRender={10}
					maxToRenderPerBatch={5}
					updateCellsBatchingPeriod={50}
					windowSize={5}
					removeClippedSubviews={true}
					onEndReached={handleEndReached}
					onEndReachedThreshold={0.5}
					disableIntervalMomentum={true}
					scrollEventThrottle={16}
					getItemLayout={getItemLayout}
					onViewableItemsChanged={onViewableItemsChanged}
					viewabilityConfig={viewabilityConfigRef.current}
					maintainVisibleContentPosition={{
						minIndexForVisible: 0
					}}
				/>
			) : (
				<EmptySearchPage />
			)}
		</View>
	);
});

export default MediaChannel;
