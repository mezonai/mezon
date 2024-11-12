import { Block, size, useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByGoogleId, useAppSelector } from '@mezon/store-mobile';
import { IChannelMember, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import React, { useMemo } from 'react';
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
	const member = useAppSelector((state) => selectMemberClanByGoogleId(state, userVoice.user_id ?? ''));
	const name = useMemo(() => {
		return getNameForPrioritize(member?.clan_nick, member?.user?.display_name, member?.user?.username);
	}, [member?.clan_nick, member?.user?.display_name, member?.user?.username]);
	const avatar = useMemo(() => {
		return getAvatarForPrioritize(member?.clan_avatar, member?.user?.avatar_url);
	}, [member?.clan_avatar, member?.user?.avatar_url]);

	if (!isCategoryExpanded) {
		if (index === 5) {
			return (
				<Block
					left={-size.s_4 * index}
					width={size.s_20}
					height={size.s_20}
					borderRadius={size.s_20}
					backgroundColor={themeValue.primary}
					borderWidth={1}
					borderColor={themeValue.text}
					alignItems={'center'}
					justifyContent={'center'}
				>
					<Text style={styles.titleNumberMem}>+{totalMembers - 5}</Text>
				</Block>
			);
		}
		if (index < 5) {
			return (
				<Block left={-size.s_4 * index}>
					<MezonAvatar width={size.s_20} height={size.s_20} username={name || userVoice?.participant} avatarUrl={avatar} />
				</Block>
			);
		} else {
			return null;
		}
	}
	return (
		<View style={styles.userVoiceWrapper}>
			<MezonAvatar width={size.s_18} height={size.s_18} username={name || userVoice?.participant} avatarUrl={avatar} />
			{!!isCategoryExpanded &&
				(member ? (
					<Text style={styles.userVoiceName}>{name}</Text>
				) : (
					<Text style={styles.userVoiceName}>{userVoice?.participant} (guest)</Text>
				))}
		</View>
	);
});

export default UserVoiceItem;
