import { IUserStatus, OwnerIcon } from '@mezon/mobile-components';
import { useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { getStore, selectMemberClanByUserId2 } from '@mezon/store-mobile';
import { ChannelMembersEntity, DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useContext, useMemo } from 'react';
import { Text, View } from 'react-native';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import { getUserStatusByMetadata } from '../../../utils/helpers';
import { threadDetailContext } from '../../ThreadDetail/MenuThreadDetail';
import { style } from './style';
interface IProps {
	user: ChannelMembersEntity;
	userStatus?: IUserStatus;
	numCharCollapse?: number;
	isHideIconStatus?: boolean;
	isHideUserName?: boolean;
	isOffline?: boolean;
	nickName?: string;
	creatorClanId?: string;
	creatorDMId?: string;
	isDMThread?: boolean;
}

export function MemberProfile({
	user,
	userStatus,
	isHideIconStatus,
	isHideUserName,
	numCharCollapse = 6,
	isOffline,
	nickName,
	creatorClanId,
	creatorDMId,
	isDMThread
}: IProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const userInfo: any = useMemo(() => {
		if (!isDMThread) {
			const store = getStore();
			const currentClanUser = selectMemberClanByUserId2(store.getState(), (user?.id || user?.user?.id) as string);
			if (currentClanUser) {
				return currentClanUser;
			}
		}
		return user?.user || user;
	}, [isDMThread, user]);

	const currentChannel = useContext(threadDetailContext);
	const name = useMemo(() => {
		if (userInfo) {
			return nickName || userInfo?.display_name || userInfo?.username || userInfo.clan_nick || userInfo?.user?.username;
		}
	}, [nickName, userInfo]);
	const userColorRolesClan = useColorsRoleById(userInfo?.id || '')?.highestPermissionRoleColor;

	const colorUserName = useMemo(() => {
		return ![ChannelType?.CHANNEL_TYPE_DM, ChannelType?.CHANNEL_TYPE_GROUP]?.includes(currentChannel?.type)
			? userColorRolesClan
			: DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR;
	}, [userColorRolesClan, currentChannel?.type]);

	const status = getUserStatusByMetadata(user?.user?.metadata || user?.metadata);

	return (
		<View style={{ ...styles.container }}>
			{/* Avatar */}
			<MezonAvatar
				avatarUrl={userInfo?.clan_avatar || userInfo?.user?.avatar_url || userInfo?.avatar_url}
				username={userInfo?.username}
				userStatus={userStatus}
				customStatus={status}
			/>

			{/* Name */}
			<View style={{ ...styles.nameContainer, borderBottomWidth: 1 }}>
				{!isHideUserName && (
					<Text style={{ color: colorUserName }}>
						{userInfo?.username?.length > numCharCollapse ? `${name.substring(0, numCharCollapse)}...` : name}
					</Text>
				)}
				{![ChannelType.CHANNEL_TYPE_DM].includes(currentChannel?.type) && (isDMThread ? creatorDMId : creatorClanId) === userInfo?.id && (
					<OwnerIcon width={16} height={16} />
				)}
			</View>
		</View>
	);
}
