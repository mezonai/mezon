import { useTheme } from '@mezon/mobile-ui';
import { selectAllChannelMembers, selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ImageNative from '../../../../../../components/ImageNative';
import { style } from '../styles';

interface IReactionMemberProps {
	userId: string;
	onSelectUserId: (userId: string) => void;
	channelId?: string;
	count?: number;
}

export const ReactionMember = React.memo((props: IReactionMemberProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { userId, onSelectUserId, channelId, count } = props;
	const channelMemberList = useAppSelector((state) => selectAllChannelMembers(state, channelId || ''));
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, userId || ''));
	const reactionMember = useMemo(() => {
		if (user) {
			return user;
		}
		return channelMemberList?.find((member) => member?.id === userId);
	}, [user, channelMemberList, userId]);

	const showUserInformation = () => {
		onSelectUserId(userId);
	};

	return (
		<TouchableOpacity style={styles.memberWrapper} onPress={showUserInformation}>
			<View style={styles.imageWrapper}>
				{reactionMember?.user?.avatar_url ? (
					<ImageNative
						url={createImgproxyUrl(reactionMember?.clan_avatar ?? reactionMember?.user?.avatar_url ?? '', {
							width: 50,
							height: 50,
							resizeType: 'fit'
						})}
						style={[styles.image]}
						resizeMode={'cover'}
					/>
				) : (
					<View style={styles.avatarBoxDefault}>
						<Text style={styles.textAvatarBoxDefault}>{reactionMember?.user?.username?.charAt(0)?.toUpperCase()}</Text>
					</View>
				)}
			</View>
			<View style={styles.memberReactContainer}>
				<Text style={styles.memberName}>
					{reactionMember?.clan_nick || reactionMember?.user?.display_name || reactionMember?.user?.username}
				</Text>
				{count && <Text style={styles.memberReactCount}>x{count}</Text>}
			</View>
		</TouchableOpacity>
	);
});
