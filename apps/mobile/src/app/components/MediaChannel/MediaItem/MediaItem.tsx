import type { AttachmentEntity } from '@mezon/store-mobile';
import { selectMemberClanByUserId, selectMemberDMByUserId, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import MezonClanAvatar from '../../../componentUI/MezonClanAvatar';
import { isImage } from '../../../utils/helpers';
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
			return userProfile?.avatar_url || '';
		}

		return clanProfile?.clan_avatar || clanProfile?.user?.avatar_url || '';
	}, [clanProfile?.clan_avatar, clanProfile?.user?.avatar_url, isDM, userProfile?.avatar_url]);

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
			) : null}
		</TouchableOpacity>
	);
});
