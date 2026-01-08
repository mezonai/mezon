import { size, useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import type { IChannelMember } from '@mezon/utils';
import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import MezonClanAvatar from '../../../../../../componentUI/MezonClanAvatar';
import { style } from './styles';

interface IUserVoiceItemProps {
	userVoice: IChannelMember;
	isCategoryExpanded: boolean;
	index: number;
	totalMembers: number;
}
const UserVoiceItem = memo(({ userVoice, isCategoryExpanded, index, totalMembers }: IUserVoiceItemProps) => {
	const { themeValue } = useTheme();
	const styles = useMemo(() => style(themeValue, index), [themeValue, index]);
	const userStream = useAppSelector((state) => selectMemberClanByUserId(state, userVoice?.userId ?? ''));
	const priorityName = useMemo(() => {
		return userStream?.clanNick || userStream?.user?.displayName || userStream?.user?.username || '';
	}, [userStream?.clanNick, userStream?.user?.displayName, userStream?.user?.username]);
	const priorityAvatar = useMemo(() => {
		return userStream?.clanAvatar || userStream?.user?.avatarUrl || '';
	}, [userStream?.clanAvatar, userStream?.user?.avatarUrl]);

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

	return (
		<View style={styles.userVoiceWrapper}>
			<View style={styles.collapsedAvatarImage}>
				<MezonClanAvatar image={priorityAvatar} alt={userStream?.user?.username || ''} customFontSizeAvatarCharacter={size.h8} />
			</View>
			<Text style={styles.userVoiceName}>{userStream ? priorityName : `${userVoice?.participant} (guest)`}</Text>
		</View>
	);
});

export default UserVoiceItem;
