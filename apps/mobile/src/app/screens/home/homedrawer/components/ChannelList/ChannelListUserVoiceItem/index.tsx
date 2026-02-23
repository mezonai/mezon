import { size, useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import MezonClanAvatar from '../../../../../../componentUI/MezonClanAvatar';
import { isValidIdString } from '../../../../../../utils/helpers';
import { style } from './styles';

interface IUserVoiceItemProps {
	userId: string;
	isCategoryExpanded: boolean;
	index: number;
	totalMembers: number;
}
const UserVoiceItem = memo(({ userId, isCategoryExpanded, index, totalMembers }: IUserVoiceItemProps) => {
	const { themeValue } = useTheme();
	const styles = useMemo(() => style(themeValue, index), [themeValue, index]);
	const userStream = useAppSelector((state) => selectMemberClanByUserId(state, userId ?? ''));
	const priorityName = useMemo(() => {
		return userStream?.clan_nick || userStream?.user?.display_name || userStream?.user?.username || '';
	}, [userStream?.clan_nick, userStream?.user?.display_name, userStream?.user?.username]);
	const priorityAvatar = useMemo(() => {
		return userStream?.clan_avatar || userStream?.user?.avatar_url || '';
	}, [userStream?.clan_avatar, userStream?.user?.avatar_url]);

	if (!isCategoryExpanded) {
		if (index === 5) {
			return (
				<View style={[styles.collapsedCountBadge, styles.collapsedAvatar]}>
					<Text style={styles.titleNumberMem}>+{totalMembers - 5}</Text>
				</View>
			);
		}
		if (index < 5) {
			return (
				<View style={[styles.collapsedAvatar, styles.collapsedAvatarImage]}>
					<MezonClanAvatar image={priorityAvatar} alt={userStream?.user?.username || ''} customFontSizeAvatarCharacter={size.h8} />
				</View>
			);
		} else {
			return null;
		}
	}

	if (!isValidIdString(userId) || !priorityName) return null;

	return (
		<View style={styles.userVoiceWrapper}>
			<View style={styles.collapsedAvatarImage}>
				<MezonClanAvatar image={priorityAvatar} alt={priorityName} customFontSizeAvatarCharacter={size.h8} />
			</View>
			<Text style={styles.userVoiceName}>{priorityName}</Text>
		</View>
	);
});

export default UserVoiceItem;
