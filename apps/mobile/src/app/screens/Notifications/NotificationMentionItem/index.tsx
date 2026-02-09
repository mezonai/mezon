import { convertTimestampToTimeAgo } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectClanById, selectUserById, useAppSelector } from '@mezon/store-mobile';
import type { IMentionOnMessage } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonClanAvatar from '../../../componentUI/MezonClanAvatar';
import type { attacmentNotifyItem } from '../MessageNotification';
import MessageNotification from '../MessageNotification';
import type { NotifyProps } from '../types';
import { ENotifyBsToShow } from '../types';
import { style } from './NotificationMentionItem.styles';

export function parseObject(obj: any) {
	let attachments;
	let mentions;
	let reactions;
	let references;
	let content;

	try {
		attachments = typeof obj?.attachments === 'string' ? safeJSONParse(obj?.attachments || '{}') : obj?.attachments || {};
	} catch (err) {
		attachments = {};
	}

	try {
		mentions = typeof obj?.mentions === 'string' ? safeJSONParse(obj?.mentions || '{}') : obj?.mentions || {};
	} catch (err) {
		mentions = {};
	}

	try {
		references = typeof obj?.references === 'string' ? safeJSONParse(obj?.references || '{}') : obj?.references || {};
	} catch (err) {
		references = {};
	}

	try {
		reactions = typeof obj?.reactions === 'string' ? safeJSONParse(obj?.reactions || '{}') : obj?.reactions || {};
	} catch (err) {
		reactions = {};
	}

	try {
		content = typeof obj?.content === 'string' ? safeJSONParse(obj?.content || '{}') : obj?.content || {};
	} catch (err) {
		content = {};
	}

	const parsedObj = {
		...obj,
		attachments,
		mentions,
		reactions,
		references,
		content
	};
	return parsedObj;
}

const NotificationMentionItem = memo(({ notify, onLongPressNotify, onPressNotify }: NotifyProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const channelInfo = useAppSelector((state) => selectChannelById(state, notify?.content?.channel_id || '0'));
	const data = parseObject(notify?.content);
	const clan = useAppSelector(selectClanById(notify?.content?.clan_id as string));
	const user = useAppSelector((state) => selectUserById(state as any, notify?.sender_id ?? ''));
	const messageTimeDifference = convertTimestampToTimeAgo(data?.create_time_seconds);

	const subjectText = useMemo(() => {
		return clan?.clan_name && channelInfo?.channel_label
			? `(${clan.clan_name}) - ${channelInfo.channel_label}`
			: notify?.content?.display_name || notify?.content?.username || ''
	}, [clan?.clan_name, channelInfo?.channel_label, notify?.content?.display_name, notify?.content?.username]);

	const priorityAvatar = useMemo(() => {
		return notify?.content?.avatar || user?.avatar_url || '';
	}, [notify?.content?.avatar, user?.avatar_url]);

	const attachmentItem: attacmentNotifyItem = useMemo(() => {
		return notify?.content?.attachment_link
			? {
				url: notify?.content?.attachment_link,
				hasMore: notify?.content?.has_more_attachment
			}
			: null;
	}, [notify?.content?.attachment_link, notify?.content?.has_more_attachment]);

	const mentions = useMemo<IMentionOnMessage[]>(() => {
		const message = notify?.content;
		const mention = message.mention_ids?.map((item, index) => {
			return {
				e: message.position_e?.[index],
				s: message.position_s?.[index],
				roleId: message.is_mention_role?.[index] ? item : '',
				userId: message.is_mention_role?.[index] ? '' : item
			};
		});
		return mention || [];
	}, [notify?.content]);

	if (!data?.content && !subjectText && !data?.attachments?.length && !attachmentItem) {
		return null;
	}

	return (
		<TouchableOpacity
			onPress={() => {
				onPressNotify(notify);
			}}
			onLongPress={() => {
				onLongPressNotify(ENotifyBsToShow.removeNotification, notify);
			}}
		>
			<View style={styles.notifyContainer}>
				<View style={styles.notifyHeader}>
					<View style={styles.boxImage}>
						<MezonClanAvatar image={priorityAvatar} alt={clan?.clan_name || notify?.content?.display_name || notify?.content?.username || ''} />
					</View>
					<View style={styles.notifyContent}>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text style={styles.username}>{subjectText}</Text>
						</Text>
						<View style={styles.contentMessage}>
							<MessageNotification message={data} mentions={mentions} attachmentItem={attachmentItem} />
						</View>
					</View>
					<Text style={styles.notifyDuration}>{messageTimeDifference}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
});

export default NotificationMentionItem;
