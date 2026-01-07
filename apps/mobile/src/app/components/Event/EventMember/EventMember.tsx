import { useMemberStatus } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import type { EventManagementEntity } from '@mezon/store-mobile';
import { selectEventById, selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import { style } from './styles';

interface IEventMemberProps {
	event: EventManagementEntity;
}

const Avatar = ({ id, index }: { id: string; index: number }) => {
	const user = useAppSelector((state) => selectMemberClanByUserId(state, id || ''));
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userStatus = useMemberStatus(id || '');

	const customStatus = useMemo(() => {
		return userStatus?.status;
	}, [userStatus?.status]);

	return (
		<View style={styles.item}>
			<MezonAvatar
				key={index.toString()}
				height={40}
				width={40}
				avatarUrl={user?.clanAvatar || user?.user?.avatarUrl}
				username={user?.clanNick || user?.user?.displayName || user?.user?.username}
				userStatus={userStatus}
				customStatus={customStatus}
			/>
			<Text style={styles.text}>{user?.clanNick || user?.user?.displayName || user?.user?.username}</Text>
		</View>
	);
};

export function EventMember({ event }: IEventMemberProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentEvent = useAppSelector((state) => selectEventById(state, event?.clanId ?? '', event?.id ?? ''));

	return <View style={styles.container}>{currentEvent?.userIds?.map((uid, index) => <Avatar key={uid} id={uid} index={index} />)}</View>;
}
