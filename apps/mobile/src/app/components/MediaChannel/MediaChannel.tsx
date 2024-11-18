import { Block, size, useTheme } from '@mezon/mobile-ui';
import { AttachmentEntity, selectAttachmentPhoto } from '@mezon/store-mobile';
import { memo, useCallback, useMemo, useState } from 'react';
import { Dimensions, FlatList, Platform, View } from 'react-native';
import { useSelector } from 'react-redux';
import { EmptySearchPage } from '../EmptySearchPage';
import { ImageListModal } from '../ImageListModal';
import { style } from './MediaChannel.styles';
import { MediaItem } from './MediaItem';

const MediaChannel = memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const attachments = useSelector(selectAttachmentPhoto());
	const [imageSelected, setImageSelected] = useState<AttachmentEntity>();
	const [visibleImageModal, setVisibleImageModal] = useState<boolean>(false);
	const widthScreen = Dimensions.get('screen').width;
	const widthImage = useMemo(() => {
		return widthScreen / 3 - size.s_4 * (Platform.OS === 'ios' ? 4 : 1);
	}, [widthScreen]);

	const openImage = useCallback(
		(image: AttachmentEntity) => {
			setImageSelected(image);
			setVisibleImageModal(true);
		},
		[setVisibleImageModal]
	);

	const renderItem = ({ item, index }) => (
		<Block height={widthImage} width={widthImage} margin={size.s_4} key={`${index}_item_media_channel`}>
			<MediaItem data={item} onPress={openImage} />
		</Block>
	);
	const onCloseModalImage = useCallback(() => {
		setVisibleImageModal(false);
	}, []);
	return (
		<View style={styles.wrapper}>
			<FlatList
				data={attachments}
				style={{ width: widthScreen }}
				numColumns={3}
				keyExtractor={(item, index) => `${index}_item_media_channel`}
				renderItem={renderItem}
				contentContainerStyle={{ paddingBottom: size.s_50, justifyContent: 'space-between' }}
				removeClippedSubviews={true}
				showsVerticalScrollIndicator={true}
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={5}
				ListEmptyComponent={<EmptySearchPage />}
			/>
			{visibleImageModal && <ImageListModal visible={visibleImageModal} onClose={onCloseModalImage} imageSelected={imageSelected} />}
		</View>
	);
});

export default MediaChannel;
