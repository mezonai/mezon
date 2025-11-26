import { useTheme } from '@mezon/mobile-ui';
import { selectAllChannelMembers, selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonClanAvatar from '../../../../../../componentUI/MezonClanAvatar';
import { style } from '../styles';

interface IReactionMemberProps {
	userId: string;
	onSelectUserId: (userId: string) => void;
	channelId?: string;
	count?: number;
	currentClanId: string;
}

export const ReactionMember = memo((props: IReactionMemberProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { userId, onSelectUserId, channelId, count, currentClanId } = props;
	const channelMemberList = useAppSelector((state) => selectAllChannelMembers(state, channelId || ''));
	const clanProfile = useAppSelector((state) => selectMemberClanByUserId(state, userId || ''));
	const reactionMember = useMemo(() => {
		if (clanProfile) {
			return clanProfile;
		}
		return channelMemberList?.find((member) => member?.id === userId);
	}, [channelMemberList, clanProfile, userId]);

	const reactionMemberAvatar = useMemo(() => {
		if (currentClanId === '0') {
			return reactionMember?.user?.avatar_url || '';
		}
		return reactionMember?.clan_avatar || reactionMember?.user?.avatar_url || '';
	}, [currentClanId, reactionMember?.clan_avatar, reactionMember?.user?.avatar_url]);

	const reactionMemberName = useMemo(() => {
		const displayName = reactionMember?.user?.display_name || reactionMember?.user?.username || '';
		if (currentClanId === '0') {
			return displayName;
		}
		return reactionMember?.clan_nick || displayName;
	}, [currentClanId, reactionMember?.clan_nick, reactionMember?.user?.display_name, reactionMember?.user?.username]);

	const showUserInformation = () => {
		onSelectUserId(userId);
	};

	return (
		<TouchableOpacity style={styles.memberWrapper} onPress={showUserInformation}>
			<View style={styles.imageWrapper}>
				<MezonClanAvatar image={reactionMemberAvatar} alt={reactionMember?.user?.username || ''} />
			</View>
			<View style={styles.memberReactContainer}>
				<Text style={styles.memberName}>{reactionMemberName}</Text>
				{count && <Text style={styles.memberReactCount}>x{count}</Text>}
			</View>
		</TouchableOpacity>
	);
});
