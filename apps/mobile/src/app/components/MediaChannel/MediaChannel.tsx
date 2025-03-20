import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { AttachmentEntity, RootState, selectAllListAttachmentByChannel } from '@mezon/store-mobile';
import React, { memo, useCallback, useMemo } from 'react';
import { DeviceEventEmitter, Dimensions, FlatList, View } from 'react-native';
import { useSelector } from 'react-redux';
import { EmptySearchPage } from '../EmptySearchPage';
import { ImageListModal } from '../ImageListModal';
import { style } from './MediaChannel.styles';
import { MediaItem } from './MediaItem';
import MediaSkeleton from './MediaSkeleton/MediaSkeleton';

const MediaChannel = memo(({ channelId }: { channelId: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const attachments = useSelector((state) => selectAllListAttachmentByChannel(state, channelId));
	const loadStatus = useSelector((state: RootState) => state?.attachments?.loadingStatus);
	const widthScreen = Dimensions.get('screen').width;
	const widthImage = useMemo(() => {
		return (widthScreen - size.s_40) / 3;
	}, [widthScreen]);

	const openImage = useCallback((image: AttachmentEntity) => {
		const data = {
			children: <ImageListModal channelId={channelId} imageSelected={image as AttachmentEntity} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);

	const renderItem = ({ item, index }) => (
		<View style={{ height: widthImage, width: widthImage, margin: size.s_4 }} key={`${index}_item_media_channel`}>
			<MediaItem data={item} onPress={openImage} />
		</View>
	);

	return (
		<View style={styles.wrapper}>
			{loadStatus === 'loading' && attachments?.length ? (
				<MediaSkeleton numberSkeleton={20} />
			) : (
				<FlatList
					data={attachments}
					style={{ width: widthScreen }}
					numColumns={3}
					keyExtractor={(item, index) => `${index}_item_media_channel`}
					renderItem={renderItem}
					contentContainerStyle={styles.contentContainer}
					removeClippedSubviews={true}
					showsVerticalScrollIndicator={true}
					initialNumToRender={10}
					maxToRenderPerBatch={10}
					windowSize={5}
					ListEmptyComponent={<EmptySearchPage />}
				/>
			)}
		</View>
	);
});

export default MediaChannel;
