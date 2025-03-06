import { AttachmentEntity, selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import { isImage } from '../../../utils/helpers';
import ImageNative from '../../ImageNative';
import styles from './MediaItem.styles';

interface IMediaItemProps {
	data: AttachmentEntity;
	onPress: (item: AttachmentEntity) => void;
}
export const MediaItem = React.memo(({ data, onPress }: IMediaItemProps) => {
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
				<ImageNative
					style={styles.image}
					url={createImgproxyUrl(data?.url ?? '', { width: 300, height: 300, resizeType: 'fit' })}
					resizeMode="cover"
				/>
			) : null}
		</TouchableOpacity>
	);
});
