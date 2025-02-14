import { AttachmentEntity, selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import { isImage, isVideo } from '../../../utils/helpers';
import styles from './MediaItem.styles';

interface IMediaItemProps {
	data: AttachmentEntity;
	onPress: (item: AttachmentEntity) => void;
}
export const MediaItem = React.memo(({ data, onPress }: IMediaItemProps) => {
	const checkIsVideo = useMemo(() => isVideo(data?.url), [data?.url]);
	const checkIsImage = useMemo(() => isImage(data?.url), [data?.url]);
	const uploader = useAppSelector((state) => selectMemberClanByUserId2(state, data?.uploader || ''));
	const handlePress = useCallback(() => {
		onPress(data);
	}, [onPress, data]);
	return (
		<TouchableOpacity onPress={handlePress} style={styles.containerItem}>
			<View style={styles.boxAvatar}>
				<MezonAvatar height={25} width={25} username={uploader?.user?.username} avatarUrl={uploader?.user?.avatar_url}></MezonAvatar>
			</View>
			{checkIsImage ? (
				<FastImage
					style={styles.image}
					source={{ uri: createImgproxyUrl(data?.url ?? '', { width: 300, height: 300, resizeType: 'fit' }) }}
					resizeMode="cover"
				/>
			) : null}
			{checkIsVideo ? (
				<ExpoVideo
					onError={(err) => {
						console.error('load error', err);
					}}
					source={{
						uri: data?.url
					}}
					useNativeControls={false}
					resizeMode={ResizeMode.CONTAIN}
					rate={1.0}
					style={styles.video}
				/>
			) : null}
		</TouchableOpacity>
	);
});
