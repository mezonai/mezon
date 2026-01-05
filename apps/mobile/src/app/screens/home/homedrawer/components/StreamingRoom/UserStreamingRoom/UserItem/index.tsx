import { selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import { memo, useMemo } from 'react';
import { View } from 'react-native';
import MezonClanAvatar from '../../../../../../../componentUI/MezonClanAvatar';
import { style } from './styles';

const UserItem = (user) => {
	const styles = style();
	const userStream = useAppSelector((state) => selectMemberClanByUserId(state, user?.user?.userId || ''));

	const avatarUrl = useMemo(() => {
		return userStream?.clanAvatar || userStream?.user?.avatarUrl || '';
	}, [userStream?.clanAvatar, userStream?.user?.avatarUrl]);

	return (
		<View style={styles.imgWrapper}>
			<MezonClanAvatar alt={userStream?.user?.username || ''} image={avatarUrl} />
		</View>
	);
};

export default memo(UserItem);
