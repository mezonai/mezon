import { size, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import { ActionLog, convertTimeString, getAvatarForPrioritize } from '@mezon/utils';
import { ApiAuditLog } from 'mezon-js/types';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import { style } from './styles';

type AuditLogItemProps = {
	data: ApiAuditLog;
};
//
export const AuditLogItem = memo(({ data }: AuditLogItemProps) => {
	const auditLogTime = convertTimeString(data?.timeLog as string);
	const userAuditLogItem = useAppSelector((state) => selectMemberClanByUserId(state, data?.userId ?? ''));
	const username = userAuditLogItem?.user?.username;
	const avatar = getAvatarForPrioritize(userAuditLogItem?.clanAvatar, userAuditLogItem?.user?.avatarUrl);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userMention = useAppSelector((state) => selectMemberClanByUserId(state, data?.entityId ?? ''));
	const usernameMention = userMention?.user?.username;
	const channel = useAppSelector((state) => selectChannelById(state, data?.channelId || ''));
	const { t } = useTranslation('auditLog');
	const isAddAction =
		data?.actionLog === ActionLog.ADD_MEMBER_CHANNEL_ACTION_AUDIT || data?.actionLog === ActionLog.ADD_ROLE_CHANNEL_ACTION_AUDIT;

	const isRemoveAction =
		data?.actionLog === ActionLog.REMOVE_MEMBER_CHANNEL_ACTION_AUDIT || data?.actionLog === ActionLog.REMOVE_ROLE_CHANNEL_ACTION_AUDIT;

	const isChannelAction = isAddAction || isRemoveAction;

	const actionText = isAddAction ? t('auditLogItem.add') : t('auditLogItem.remove');
	const targetEntity =
		data?.actionLog === ActionLog.ADD_MEMBER_CHANNEL_ACTION_AUDIT || data?.actionLog === ActionLog.REMOVE_MEMBER_CHANNEL_ACTION_AUDIT
			? usernameMention
			: '';

	return (
		<View style={styles.itemContainer}>
			<MezonAvatar avatarUrl={avatar} username={username} height={size.s_36} width={size.s_36} />
			<View style={styles.itemContent}>
				<View>
					{isChannelAction && data?.channelId !== '0' ? (
						<Text style={styles.actionText}>
							<Text style={styles.username}>{username}</Text>{' '}
							<Text>
								{actionText} {targetEntity} ({data?.entityId}) {t('auditLogItem.toChannel')}
							</Text>
							<Text>
								{' '}
								#{channel?.channelLabel} ({channel?.channelId})
							</Text>
						</Text>
					) : (
						<Text style={styles.actionText}>
							<Text style={styles.username}>{username}</Text> <Text style={styles.lowercase}>{data?.actionLog}</Text>
							<Text>
								{' '}
								#{data?.entityName || data?.entityId} {data?.entityName && `(${data?.entityId})`}
							</Text>
						</Text>
					)}
				</View>
				<Text style={styles.textTime}>{auditLogTime}</Text>
			</View>
		</View>
	);
});
