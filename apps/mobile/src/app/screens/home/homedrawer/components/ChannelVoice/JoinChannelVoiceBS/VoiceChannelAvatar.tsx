import { useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import { memo, useMemo } from 'react';
import { View } from 'react-native';
import MezonClanAvatar from '../../../../../../componentUI/MezonClanAvatar';
import { style } from './JoinChannelVoiceBS.styles';

const VoiceChannelAvatar = ({ userId }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const member = useAppSelector((state) => selectMemberClanByUserId(state, userId));
	const avatarUrl = useMemo(() => {
		return member?.clanAvatar || member?.user?.avatarUrl || '';
	}, [member?.clanAvatar, member?.user?.avatarUrl]);

	return (
		<View style={styles.avatarCircle}>
			<MezonClanAvatar alt={member?.user?.username || ''} image={avatarUrl} />
		</View>
	);
};

export default memo(VoiceChannelAvatar);
