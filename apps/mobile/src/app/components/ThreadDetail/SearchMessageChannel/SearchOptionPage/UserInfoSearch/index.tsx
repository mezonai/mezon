import { useMemberStatus } from '@mezon/core';
import { IUserMention } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { safeJSONParse } from 'mezon-js';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { MezonAvatar } from '../../../../../componentUI';
import { style } from '../SearchOptionPage.styles';

interface UserInfoSearchProps {
	onSelectUserInfo: (user: IUserMention) => void;
	userData: IUserMention;
}

export default function UserInfoSearch({ onSelectUserInfo, userData }: UserInfoSearchProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userStatus = useMemberStatus((userData?.id as string) || '');
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, (userData?.id as string) || ''));
	const status = useMemo(() => {
		return typeof user?.user?.metadata === 'string'
			? safeJSONParse(user?.user?.metadata || '')?.user_status
			: (user?.user?.metadata as any)?.user_status;
	}, [user?.user?.metadata]);
	return (
		<TouchableOpacity onPress={() => onSelectUserInfo(userData)} style={styles.userInfoBox}>
			<MezonAvatar
				userStatus={userStatus}
				customStatus={status}
				height={size.s_40}
				width={size.s_40}
				username={userData?.display}
				avatarUrl={userData?.avatarUrl}
			/>
			<Block>
				<Text style={styles.userName}>{userData?.display}</Text>
				<Text style={styles.subUserName}>{userData?.subDisplay}</Text>
			</Block>
		</TouchableOpacity>
	);
}
