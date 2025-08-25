import { IUserStatus } from '@mezon/mobile-components';
import { baseColor, size, useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { getStore, selectMemberClanByUserId2, selectStatusInVoice, useAppSelector } from '@mezon/store-mobile';
import { ChannelMembersEntity, DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useContext, useMemo } from 'react';
import { Text, View } from 'react-native';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { getUserStatusByMetadata } from '../../../utils/helpers';
import { threadDetailContext } from '../../ThreadDetail/MenuThreadDetail';
import { AddedByUser } from '../MemberItem/AddedByUser';
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
	const userVoiceStatus = useAppSelector((state) => selectStatusInVoice(state, user?.id || user?.user?.id || ''));

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
			return (
				(!isDMThread && nickName) ||
				(!isDMThread && userInfo?.clan_nick) ||
				userInfo?.display_name ||
				userInfo?.user?.display_name ||
				userInfo?.username ||
				userInfo?.user?.username
			);
		}
	}, [isDMThread, nickName, userInfo]);
	const userColorRolesClan = useColorsRoleById(userInfo?.id || '')?.highestPermissionRoleColor;

	const colorUserName = useMemo(() => {
		return ![ChannelType?.CHANNEL_TYPE_DM, ChannelType?.CHANNEL_TYPE_GROUP]?.includes(currentChannel?.type)
			? userColorRolesClan?.startsWith('#')
				? userColorRolesClan
				: themeValue.text
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
				width={size.s_36}
				height={size.s_36}
			/>

			{/* Name */}
			<View style={{ ...styles.nameContainer, borderBottomWidth: 1 }}>
				{!isHideUserName && (
					<View style={styles.nameItem}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_4 }}>
							<Text style={{ color: colorUserName }}>
								{userInfo?.username?.length > numCharCollapse ? `${name.substring(0, numCharCollapse)}...` : name}
							</Text>
							{![ChannelType.CHANNEL_TYPE_DM].includes(currentChannel?.type) &&
								(isDMThread ? creatorDMId : creatorClanId) === userInfo?.id && (
									<MezonIconCDN icon={IconCDN.ownerIcon} color={themeValue.borderWarning} width={16} height={16} />
								)}
						</View>
						{!!userVoiceStatus && (
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
								<MezonIconCDN icon={IconCDN.channelVoice} color={baseColor.green} width={12} height={12} />
								<Text style={{ color: themeValue.textDisabled, fontSize: size.s_12, fontWeight: '500' }}>In voice</Text>
							</View>
						)}
						{isDMThread && currentChannel?.type === ChannelType.CHANNEL_TYPE_GROUP && (
							<AddedByUser groupId={currentChannel?.id} userId={user?.id} />
						)}
					</View>
				)}
			</View>
		</View>
	);
}
