import { useMemberStatus } from '@mezon/core';
import { IUserStatus } from '@mezon/mobile-components';
import { baseColor, size, useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { getStore, selectAllAccount, selectMemberClanByUserId, selectStatusInVoice, useAppSelector } from '@mezon/store-mobile';
import { ChannelMembersEntity, DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, EUserStatus } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { threadDetailContext } from '../../ThreadDetail/MenuThreadDetail';
import { AddedByUser } from '../MemberItem/AddedByUser';
import { style } from './style';
interface IProps {
	user: ChannelMembersEntity;
	userStatus?: IUserStatus;
	numCharCollapse?: number;
	isHideUserName?: boolean;
	nickName?: string;
	creatorClanId?: string;
	creatorDMId?: string;
	isDMThread?: boolean;
}

export const MemberProfile = memo(({ user, isHideUserName, numCharCollapse = 6, nickName, creatorClanId, creatorDMId, isDMThread }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['userProfile']);
	const userId = user?.id || user?.user?.id || '';
	const userVoiceStatus = useAppSelector((state) => selectStatusInVoice(state, userId));
	const getStatus = useMemberStatus(userId);
	const userProfile = useSelector(selectAllAccount);

	const infoMemberStatus = useMemo(() => {
		if (userId !== userProfile?.user?.id) {
			return getStatus;
		}
		return {
			status: userProfile?.user?.status || EUserStatus.ONLINE,
			user_status: userProfile?.user?.user_status
		};
	}, [getStatus, userId, userProfile]);

	const userInfo: any = useMemo(() => {
		if (!isDMThread) {
			const store = getStore();
			const currentClanUser = selectMemberClanByUserId(store.getState(), userId as string);
			if (currentClanUser) {
				return currentClanUser;
			}
		}
		return user?.user || user;
	}, [isDMThread, user, userId]);

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
	}, [currentChannel?.type, userColorRolesClan, themeValue.text]);

	return (
		<View style={styles.container}>
			{/* Avatar */}
			<MezonAvatar
				avatarUrl={userInfo?.clan_avatar || userInfo?.user?.avatar_url || userInfo?.avatar_url || userInfo?.avatars?.[0]}
				username={name}
				userStatus={infoMemberStatus}
				customStatus={infoMemberStatus?.status}
				width={size.s_36}
				height={size.s_36}
			/>

			{/* Name */}
			<View style={styles.nameContainer}>
				{!isHideUserName && (
					<View style={styles.nameItem}>
						<View style={styles.nameRowContainer}>
							<Text style={{ color: colorUserName }}>
								{userInfo?.username?.length > numCharCollapse ? `${name.substring(0, numCharCollapse)}...` : name}
							</Text>
							{![ChannelType.CHANNEL_TYPE_DM].includes(currentChannel?.type) &&
								(isDMThread ? creatorDMId : creatorClanId) === userInfo?.id && (
									<MezonIconCDN icon={IconCDN.ownerIcon} color={themeValue.borderWarning} width={16} height={16} />
								)}
						</View>
						{!!userVoiceStatus && !isDMThread && (
							<View style={styles.voiceContainer}>
								<MezonIconCDN icon={IconCDN.channelVoice} color={baseColor.green} width={12} height={12} />
								<Text style={styles.voiceText}>{t('voiceInfo.inVoice')}</Text>
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
});
