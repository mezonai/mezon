import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	AttachmentEntity,
	RootState,
	galleryActions,
	selectCurrentClanId,
	selectCurrentLanguage,
	selectGalleryAttachmentsByChannel,
	selectGalleryPaginationByChannel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Dimensions, SectionList, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { chunkIntoRows, formatDateHeader, groupByYearDay, parseAttachmentLikeDate } from '../../utils/groupDataHelper';
import { EmptySearchPage } from '../EmptySearchPage';
import { ImageListModal } from '../ImageListModal';
import { style } from './MediaChannel.styles';
import { MediaItem } from './MediaItem';
import MediaSkeleton from './MediaSkeleton/MediaSkeleton';

type MediaRowItem = { key: string; items: AttachmentEntity[] };

type SectionByDay = {
	titleDay: string;
	year: string;
	data: MediaRowItem[];
	key: string;
	isFirstOfYear?: boolean;
};

const MAX_COLUMNS = 3;

const MediaChannel = memo(({ channelId }: { channelId: string }) => {
	const widthScreen = Dimensions.get('screen').width;
	const widthImage = useMemo(() => {
		return (widthScreen - size.s_40) / MAX_COLUMNS;
	}, [widthScreen]);
	const { themeValue } = useTheme();
	const styles = style(themeValue, widthImage);
	const dispatch = useAppDispatch();
	const currentChannelId = channelId;
	const attachments = useAppSelector((state) => selectGalleryAttachmentsByChannel(state, currentChannelId));
	const paginationState = useAppSelector((state) => selectGalleryPaginationByChannel(state, currentChannelId));
	const currentClanId = useAppSelector((state) => selectCurrentClanId(state as any)) ?? '';
	const currentLanguage = useSelector((state: RootState) => selectCurrentLanguage(state as any));

	const parseAttachmentDate = useCallback((att: AttachmentEntity): Date => parseAttachmentLikeDate(att), []);

	const chunkIntoRowsMemo = useCallback((list: AttachmentEntity[], chunkSize: number, seed: string): MediaRowItem[] => {
		return chunkIntoRows<AttachmentEntity>(list, chunkSize, seed);
	}, []);

	const sections = useMemo<SectionByDay[]>(() => {
		if (!attachments || attachments.length === 0) return [];

		const groups = groupByYearDay<AttachmentEntity>(attachments, parseAttachmentDate);
		const result: SectionByDay[] = groups.map((g) => {
			const rows = chunkIntoRowsMemo(g.items, MAX_COLUMNS, `${g.year}-${g.dayTs}`);
			const lang = currentLanguage === 'en' ? 'en' : 'vi';
			const title = formatDateHeader(new Date(g.dayTs), lang);
			return {
				key: `${g.year}-${g.dayTs}`,
				year: g.year,
				titleDay: title,
				data: rows,
				isFirstOfYear: g.isFirstOfYear
			};
		});
		return result;
	}, [attachments, chunkIntoRowsMemo, parseAttachmentDate, currentLanguage]);

	const openImage = useCallback((image: AttachmentEntity) => {
		const data = {
			children: <ImageListModal channelId={channelId} imageSelected={image as AttachmentEntity} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);

	const handleEndReached = useCallback(() => {
		if (!attachments || attachments.length === 0) return;
		if (paginationState?.isLoading) return;
		if (!paginationState?.hasMoreBefore) return;

		const lastAttachment = attachments[attachments.length - 1];
		const timestamp = lastAttachment?.create_time;
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
	}, [attachments, paginationState?.isLoading, paginationState?.hasMoreBefore, paginationState?.limit, currentClanId, currentChannelId, dispatch]);

	const renderRow = ({ item }: { item: MediaRowItem }) => (
		<View style={styles.rowContainer}>
			{item.items.map((media, idx) => (
				<View key={`${item.key}_${media?.id ?? idx}`} style={styles.rowItem}>
					<MediaItem key={`${item.key}_${media?.id ?? idx}`} data={media} onPress={openImage} />
				</View>
			))}
			{item.items.length < MAX_COLUMNS &&
				Array.from({ length: MAX_COLUMNS - item.items.length }).map((_, fillerIdx) => (
					<View key={`filler_${item.key}_${fillerIdx}`} style={styles.rowItem} />
				))}
		</View>
	);

	const renderSectionHeader = ({ section }: { section: SectionByDay }) => (
		<View style={styles.sectionHeader}>
			{section.isFirstOfYear && <Text style={styles.sectionYearHeaderTitle}>{section.year}</Text>}
			<Text style={styles.sectionDayHeaderTitle}>{section.titleDay}</Text>
		</View>
	);

	const renderListFooter = useCallback(() => {
		if (!paginationState?.isLoading) return null;
		return (
			<View style={{ paddingVertical: size.s_16, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator size="small" />
			</View>
		);
	}, [paginationState?.isLoading]);

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

	return (
		<View style={styles.wrapper}>
			{paginationState?.isLoading && attachments?.length === 0 ? (
				<MediaSkeleton numberSkeleton={20} />
			) : sections.length > 0 ? (
				<SectionList
					sections={sections}
					keyExtractor={(row) => row.key}
					renderItem={renderRow}
					renderSectionHeader={renderSectionHeader}
					ListFooterComponent={renderListFooter}
					contentContainerStyle={styles.contentContainer}
					removeClippedSubviews={true}
					showsVerticalScrollIndicator={false}
					initialNumToRender={24}
					maxToRenderPerBatch={12}
					updateCellsBatchingPeriod={12}
					windowSize={30}
					stickySectionHeadersEnabled
					onEndReached={handleEndReached}
					onEndReachedThreshold={0.5}
				/>
			) : (
				<EmptySearchPage />
			)}
		</View>
	);
});

export default MediaChannel;
