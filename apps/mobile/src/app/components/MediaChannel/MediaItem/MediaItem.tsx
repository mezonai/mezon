import { size } from '@mezon/mobile-ui';
import type { AttachmentEntity } from '@mezon/store-mobile';
import { selectMemberClanByUserId, selectMemberDMByUserId, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import React, { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Entypo from 'react-native-vector-icons/Entypo';
import MezonClanAvatar from '../../../componentUI/MezonClanAvatar';
import { useVideoThumbnail } from '../../../hooks/useVideoThumbnail';
import { isImage, isVideo } from '../../../utils/helpers';
import ImageNative from '../../ImageNative';
import styles from './MediaItem.styles';

interface IMediaItemProps {
	data: AttachmentEntity;
	onPress: (item: AttachmentEntity) => void;
	isDM: boolean;
}
export const MediaItem = memo(({ data, onPress, isDM }: IMediaItemProps) => {
	const checkIsImage = useMemo(() => isImage(data?.url), [data?.url]);
	const userProfile = useAppSelector((state) => selectMemberDMByUserId(state, data?.uploader || ''));
	const clanProfile = useAppSelector((state) => selectMemberClanByUserId(state, data?.uploader || ''));
	const isVideoType = isVideo(data?.url);
	const thumbnail = useVideoThumbnail(data?.url || '', (data as any)?.thumbnail, isVideoType);
	const senderName = useMemo(() => {
		if (data?.uploader === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}

		if (isDM) {
			return userProfile?.username || '';
		}

		return clanProfile?.user?.username || '';
	}, [clanProfile?.user?.username, data?.uploader, isDM, userProfile?.username]);

	const prioritySenderAvatar = useMemo(() => {
		if (isDM) {
			return userProfile?.avatarUrl || '';
		}

		return clanProfile?.clanAvatar || clanProfile?.user?.avatarUrl || '';
	}, [clanProfile?.clanAvatar, clanProfile?.user?.avatarUrl, isDM, userProfile?.avatarUrl]);

	const handlePress = useCallback(() => {
		onPress(data);
	}, [onPress, data]);
	return (
		<TouchableOpacity onPress={handlePress} style={styles.containerItem}>
			<View style={styles.boxAvatar}>
				<MezonClanAvatar alt={senderName} image={prioritySenderAvatar} />
			</View>
			{checkIsImage ? (
				<ImageNative
					style={styles.image}
					url={createImgproxyUrl(data?.url ?? '', { width: 300, height: 300, resizeType: 'fit' })}
					resizeMode="cover"
				/>
			) : isVideoType ? (
				<>
					<FastImage source={{ uri: thumbnail || data?.url }} style={[styles.image]} resizeMode={'cover'} />
					<View style={styles.itemVideoFooter}>
						<Entypo name="controller-play" size={size.s_30} color="#FFF" />
					</View>
				</>
			) : null}
		</TouchableOpacity>
	);
});
