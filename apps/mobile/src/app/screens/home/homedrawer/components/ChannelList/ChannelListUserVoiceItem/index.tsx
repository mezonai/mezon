import { size, useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByGoogleId, selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { IChannelMember, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import React from 'react';
import { Text, View } from 'react-native';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import { style } from './styles';

interface IUserVoiceProps {
	userVoice: IChannelMember;
	isCategoryExpanded: boolean;
	index: number;
	totalMembers: number;
}
const UserVoiceItem = React.memo(({ userVoice, isCategoryExpanded, index, totalMembers }: IUserVoiceProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const member = useAppSelector((state) => selectMemberClanByGoogleId(state, userVoice?.user_id ?? ''));
	const userStream = useAppSelector((state) => selectMemberClanByUserId2(state, userVoice?.user_id ?? ''));
	const clanNick = member ? member?.clan_nick : userStream?.clan_nick;
	const displayName = member ? member?.user?.display_name : userStream?.user?.display_name;
	const username = member ? member?.user?.username : userStream?.user?.username;
	const name = getNameForPrioritize(clanNick, displayName, username);
	const clanAvatar = member ? member?.clan_avatar : userStream?.clan_avatar;
	const avatarUrl = member ? member?.user?.avatar_url : userStream?.user?.avatar_url;
	const avatar = getAvatarForPrioritize(clanAvatar, avatarUrl);

	if (!isCategoryExpanded) {
		if (index === 5) {
			return (
				<View
					style={{
						left: -size.s_4 * index,
						width: size.s_20,
						height: size.s_20,
						borderRadius: size.s_20,
						backgroundColor: themeValue.primary,
						borderWidth: 1,
						borderColor: themeValue.text,
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					<Text style={styles.titleNumberMem}>+{totalMembers - 5}</Text>
				</View>
			);
		}
		if (index < 5) {
			return (
				<View style={{ left: -size.s_4 * index }}>
					<MezonAvatar width={size.s_20} height={size.s_20} username={name || userVoice?.participant} avatarUrl={avatar} />
				</View>
			);
		} else {
			return null;
		}
	}
	return (
		<View style={styles.userVoiceWrapper}>
			<MezonAvatar width={size.s_18} height={size.s_18} username={name || userVoice?.participant} avatarUrl={avatar} />
			{!!isCategoryExpanded &&
				(member || userStream ? (
					<Text style={styles.userVoiceName}>{name}</Text>
				) : (
					<Text style={styles.userVoiceName}>{userVoice?.participant} (guest)</Text>
				))}
		</View>
	);
});

export default UserVoiceItem;
