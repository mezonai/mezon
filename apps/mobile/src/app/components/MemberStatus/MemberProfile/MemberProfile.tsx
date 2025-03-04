import { IUserStatus, OwnerIcon } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { RolesClanEntity, selectRolesClanEntities } from '@mezon/store-mobile';
import { ChannelMembersEntity, DEFAULT_ROLE_COLOR } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useContext, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MezonAvatar } from '../../../componentUI';
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
	const currentChannel = useContext(threadDetailContext);
	const rolesClanEntity = useSelector(selectRolesClanEntities);

	const userInfo: any = useMemo(() => {
		return user?.user || user;
	}, [user]);

	const name = useMemo(() => {
		if (userInfo) {
			return nickName || userInfo?.display_name || userInfo?.username;
		}
	}, [nickName, userInfo]);

	const userRolesClan = useMemo(() => {
		const activeRole: Array<RolesClanEntity> = [];
		let userRoleLength = 0;
		let highestPermissionRole = null;
		let maxLevelPermission = 0;

		for (const key in rolesClanEntity) {
			const role = rolesClanEntity[key];
			const checkHasRole = role.role_user_list?.role_users?.some((listUser) => listUser.id === userInfo?.id);

			if (checkHasRole) {
				activeRole.push(role);
				userRoleLength++;

				if (role.max_level_permission !== undefined && role.max_level_permission > maxLevelPermission) {
					maxLevelPermission = role.max_level_permission;
					highestPermissionRole = role;
				}
			}
		}

		return {
			usersRole: activeRole,
			length: userRoleLength,
			highestPermissionRoleColor: highestPermissionRole?.color || activeRole[0]?.color || DEFAULT_ROLE_COLOR
		};
	}, [userInfo?.id, rolesClanEntity]);

	const status = getUserStatusByMetadata(user?.user?.metadata);

	return (
		<View style={{ ...styles.container, opacity: isOffline ? 0.5 : 1 }}>
			{/* Avatar */}
			<MezonAvatar avatarUrl={userInfo?.avatar_url} username={userInfo?.username} userStatus={userStatus} customStatus={status} />

			{/* Name */}
			<View style={{ ...styles.nameContainer, borderBottomWidth: 1 }}>
				{!isHideUserName && (
					<Text style={{ color: userRolesClan.highestPermissionRoleColor }}>
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
