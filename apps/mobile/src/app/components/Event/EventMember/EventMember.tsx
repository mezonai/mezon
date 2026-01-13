import { useMemberStatus } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import type { EventManagementEntity } from '@mezon/store-mobile';
import { selectEventById, selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
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
				avatarUrl={user?.clan_avatar || user?.user?.avatar_url}
				username={user?.clan_nick || user?.user?.display_name || user?.user?.username}
				userStatus={userStatus}
				customStatus={customStatus}
			/>
			<Text style={styles.text}>{user?.clan_nick || user?.user?.display_name || user?.user?.username}</Text>
		</View>
	);
};

export function EventMember({ event }: IEventMemberProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentEvent = useAppSelector((state) => selectEventById(state, event?.clan_id ?? '', event?.id ?? ''));
	const { t } = useTranslation('eventMenu');

	if (!currentEvent?.user_ids?.length)
		return (
			<View style={styles.emptyScreen}>
				<MezonIconCDN icon={IconCDN.peopleIcon} height={size.s_24} width={size.s_24} color={themeValue.textDisabled} />
				<Text style={styles.emptyText}>{t('detail.noOneInterested')}</Text>
			</View>
		);

	return <View style={styles.container}>{currentEvent?.user_ids?.map((uid, index) => <Avatar key={uid} id={uid} index={index} />)}</View>;
}
