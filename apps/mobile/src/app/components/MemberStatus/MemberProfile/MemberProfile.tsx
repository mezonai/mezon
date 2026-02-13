import { useMemberStatus } from '@mezon/core';
import { size, useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import type { DirectEntity } from '@mezon/store-mobile';
import { selectAllAccount, selectMemberClanByUserId, selectMemberDMByUserId, useAppSelector } from '@mezon/store-mobile';
import type { ChannelMembersEntity, IChannel } from '@mezon/utils';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, EUserStatus } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { MemberInvoiceStatus } from '../MemberInvoiceStatus';
import { AddedByUser } from '../MemberItem/AddedByUser';
import { style } from './style';

interface IMemberProfileProps {
	user: ChannelMembersEntity;
	creatorClanId: string;
	isDM: boolean;
	currentChannel?: IChannel | DirectEntity;
	isShowUsername?: boolean;
}

export const MemberProfile = memo(({ user, creatorClanId, isDM, currentChannel, isShowUsername = false }: IMemberProfileProps) => {
	const { themeValue } = useTheme();
	const userId = user?.id || user?.user?.id || '';
	const { highestPermissionRoleColor } = useColorsRoleById(userId);
	const getStatus = useMemberStatus(userId);
	const currentUserProfile = useSelector(selectAllAccount);
	const dmProfile = useAppSelector((state) => selectMemberDMByUserId(state, userId));
	const clanProfile = useAppSelector((state) => selectMemberClanByUserId(state, userId));

	const infoMemberStatus = useMemo(() => {
		if (userId !== currentUserProfile?.user?.id) {
			return getStatus;
		}

		return {
			status: currentUserProfile?.user?.status || EUserStatus.ONLINE,
			user_status: currentUserProfile?.user?.user_status
		};
	}, [currentUserProfile?.user?.id, currentUserProfile?.user?.status, currentUserProfile?.user?.user_status, getStatus, userId]);

	const priorityMemberAvatar = useMemo(() => {
		const avatar = dmProfile?.avatar_url || user?.user?.avatar_url || user?.avatar_url || user?.avatars?.[0] || '';
		if (isDM) {
			return avatar;
		}

		return clanProfile?.clan_avatar || user?.clan_avatar || avatar;
	}, [dmProfile?.avatar_url, user?.user?.avatar_url, user?.avatar_url, user?.avatars, user?.clan_avatar, isDM, clanProfile?.clan_avatar]);

	const memberUsername = useMemo(() => {
		return dmProfile?.username || user?.username || user?.user?.username || '';
	}, [dmProfile?.username, user?.username, user?.user?.username]);

	const priorityMemberName = useMemo(() => {
		const name = dmProfile?.display_name || user?.display_name || user?.user?.display_name || memberUsername;
		if (isDM) {
			return name;
		}

		return clanProfile?.clan_nick || user?.clan_nick || name;
	}, [dmProfile?.display_name, user?.display_name, user?.user?.display_name, user?.clan_nick, memberUsername, isDM, clanProfile?.clan_nick]);

	const colorUsername = useMemo(() => {
		return !isDM
			? highestPermissionRoleColor?.startsWith('#')
				? highestPermissionRoleColor
				: themeValue.text
			: DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR;
	}, [isDM, highestPermissionRoleColor, themeValue.text]);

	const styles = useMemo(() => style(themeValue, colorUsername), [themeValue, colorUsername]);

	const isShowOwnerIcon = useMemo(() => {
		return (
			currentChannel?.type !== ChannelType.CHANNEL_TYPE_DM &&
			(currentChannel?.type === ChannelType.CHANNEL_TYPE_GROUP ? currentChannel?.creator_id : creatorClanId) === userId
		);
	}, [currentChannel?.type, currentChannel?.creator_id, creatorClanId, userId]);

	return (
		<View style={styles.container}>
			<MezonAvatar
				avatarUrl={priorityMemberAvatar}
				username={priorityMemberName}
				userStatus={infoMemberStatus}
				customStatus={infoMemberStatus?.status}
				width={size.s_36}
				height={size.s_36}
			/>

			<View style={styles.nameContainer}>
				<View style={styles.nameItem}>
					<View style={styles.nameRowContainer}>
						<Text style={styles.displayNameText} numberOfLines={1}>
							{priorityMemberName}
						</Text>
						{isShowOwnerIcon && (
							<MezonIconCDN icon={IconCDN.ownerIcon} color={themeValue.borderWarning} width={size.s_16} height={size.s_16} />
						)}
					</View>
					{isShowUsername && memberUsername && (
						<Text style={styles.usernameText} numberOfLines={1}>
							{memberUsername}
						</Text>
					)}
					{currentChannel?.type !== ChannelType.CHANNEL_TYPE_GROUP && <MemberInvoiceStatus userId={userId} />}
					{currentChannel?.type === ChannelType.CHANNEL_TYPE_GROUP && <AddedByUser groupId={currentChannel?.id} userId={userId} />}
				</View>
			</View>
		</View>
	);
});
