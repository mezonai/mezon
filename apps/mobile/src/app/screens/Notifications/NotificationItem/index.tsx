import { useTheme } from '@mezon/mobile-ui';
import { NotificationCategory } from '@mezon/utils';
import { memo } from 'react';
import { View } from 'react-native';
import NotificationIndividualItem from '../NotificationIndividualItem';
import NotificationMentionItem from '../NotificationMentionItem';
import NotificationTopicItem from '../NotificationTopicItem';
import NotificationWebhookClan from '../NotificationWebhookClan/NotificationWebhookClan';
import type { NotifyProps } from '../types';

const NotificationItem = memo(({ notify, onLongPressNotify, onPressNotify }: NotifyProps) => {
	const { themeValue } = useTheme();

	return (
		<View>
			{notify?.category === NotificationCategory.FOR_YOU && (
				<NotificationIndividualItem notify={notify} onLongPressNotify={onLongPressNotify} />
			)}
			{notify?.category === NotificationCategory.MENTIONS && (
				<NotificationMentionItem onPressNotify={onPressNotify} notify={notify} onLongPressNotify={onLongPressNotify} />
			)}
			{notify?.category === NotificationCategory.MESSAGES && <NotificationWebhookClan notify={notify} onLongPressNotify={onLongPressNotify} />}
			{notify?.code === undefined && <NotificationTopicItem onPressNotify={onPressNotify} notify={notify} />}
		</View>
	);
});

export default NotificationItem;
