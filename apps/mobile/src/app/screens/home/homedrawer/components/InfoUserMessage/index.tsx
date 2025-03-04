import { Text } from '@mezon/mobile-ui';
import { RolesClanEntity, selectRolesClanEntities } from '@mezon/store-mobile';
import { DEFAULT_ROLE_COLOR, convertTimeString } from '@mezon/utils';
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { styles } from './styles';

interface IProps {
	onPress: () => void;
	senderDisplayName: string;
	createTime: string;
	isShow: boolean;
	messageSenderId: string;
	mode: number;
}
export const InfoUserMessage = ({ createTime, isShow, onPress, senderDisplayName, messageSenderId, mode }: IProps) => {
	const rolesClanEntity = useSelector(selectRolesClanEntities);
	const userRolesClan = useMemo(() => {
		const activeRole: Array<RolesClanEntity> = [];
		let userRoleLength = 0;
		let highestPermissionRole = null;
		let maxLevelPermission = 0;

		for (const key in rolesClanEntity) {
			const role = rolesClanEntity[key];
			const checkHasRole = role.role_user_list?.role_users?.some((listUser) => listUser.id === messageSenderId);

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
	}, [messageSenderId, rolesClanEntity]);
	if (isShow) {
		return (
			<TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.messageBoxTop}>
				<Text
					style={{ ...styles.usernameMessageBox, color: userRolesClan.highestPermissionRoleColor }}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{senderDisplayName}
				</Text>
				<Text style={styles.dateMessageBox}>{createTime ? convertTimeString(createTime) : ''}</Text>
			</TouchableOpacity>
		);
	}

	return <View style={styles.wrapperAvatarCombine} />;
};
