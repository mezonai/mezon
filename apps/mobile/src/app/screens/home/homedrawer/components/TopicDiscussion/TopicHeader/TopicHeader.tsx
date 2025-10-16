import { useGetPriorityNameFromUserClan } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import { selectCurrentTopicInitMessage, selectFirstMessageOfCurrentTopic } from '@mezon/store-mobile';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, convertTimeString } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, ScrollView, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { EmbedMessage } from '../../EmbedMessage';
import { MessageAttachment } from '../../MessageAttachment';
import { RenderTextMarkdownContent } from '../../RenderTextMarkdown';
import { style } from './styles';

type TopicHeaderProps = {
	handleBack: () => void;
};

const TopicHeader = memo(({ handleBack }: TopicHeaderProps) => {
	const currentTopic = useSelector(selectCurrentTopicInitMessage);
	const firstMessage = useSelector(selectFirstMessageOfCurrentTopic);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('message');

	const valueTopic = useMemo(() => {
		return currentTopic || firstMessage?.message;
	}, [currentTopic, firstMessage?.message]);

	const memoizedValue = useMemo(() => {
		if (!currentTopic && !firstMessage) return null;
		return {
			clanId: currentTopic?.clan_id || firstMessage?.clan_id || '',
			channelId: currentTopic?.channel_id || firstMessage?.channel_id || '',
			senderId: currentTopic?.sender_id || firstMessage?.message?.sender_id || '',
			displayName: currentTopic?.display_name || currentTopic?.username || firstMessage?.message?.username || '',
			createTime: currentTopic?.create_time || firstMessage?.message?.create_time || '',
			embed: (typeof valueTopic?.content === 'object' ? valueTopic.content : safeJSONParse(valueTopic?.content))?.embed?.[0],
			attachments: currentTopic?.attachments || firstMessage?.message?.attachments || [],
			mentions: currentTopic?.mentions || firstMessage?.message?.mentions || []
		};
	}, [currentTopic, firstMessage]);

	const { priorityAvatar, namePriority } = useGetPriorityNameFromUserClan(memoizedValue?.senderId || '');
	const userRolesClan = useColorsRoleById(memoizedValue?.senderId || '');

	const onMention = useCallback(async (mentionedUser: string) => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_MENTION_USER_MESSAGE_ITEM, mentionedUser);
	}, []);

	const onChannelMention = useCallback(async (channel: ChannelsEntity) => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_MENTION_MESSAGE_ITEM, channel);
	}, []);

	const colorSenderName = useMemo(() => {
		return (
			(userRolesClan?.highestPermissionRoleColor?.startsWith('#') ? userRolesClan.highestPermissionRoleColor : themeValue.text) ||
			DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR
		);
	}, [themeValue.text, userRolesClan.highestPermissionRoleColor]);

	return (
		<View style={styles.container}>
			<View style={styles.headerPannel}>
				<Pressable onPress={handleBack} style={styles.backButton}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
				</Pressable>
				<View style={styles.titlePanel}>
					<Pressable>
						<MezonIconCDN icon={IconCDN.discussionIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
					</Pressable>
					<Text style={styles.title}>Topic</Text>
				</View>
				<View style={{ width: size.s_50 }} />
			</View>
			{valueTopic && (
				<View style={styles.userInfo}>
					<MezonAvatar avatarUrl={priorityAvatar} username={namePriority || memoizedValue?.displayName || ''} />
					<View>
						<Text style={[styles.name, { color: colorSenderName }]}>{namePriority || memoizedValue?.displayName || ''}</Text>
						{memoizedValue?.createTime && <Text style={styles.dateText}>{convertTimeString(memoizedValue?.createTime as string)}</Text>}
					</View>
				</View>
			)}
			{!valueTopic ? null : (
				<ScrollView>
					<RenderTextMarkdownContent
						content={{
							...((typeof valueTopic?.content === 'object' ? valueTopic?.content : safeJSONParse(valueTopic?.content)) || {}),
							mentions:
								(typeof memoizedValue?.mentions === 'object' ? memoizedValue?.mentions : safeJSONParse(memoizedValue?.mentions)) || []
						}}
						translate={t}
						isMessageReply={false}
						onMention={onMention}
						onChannelMention={onChannelMention}
					/>
					{memoizedValue?.attachments?.length > 0 && (
						<MessageAttachment
							attachments={
								typeof memoizedValue?.attachments === 'object'
									? memoizedValue?.attachments
									: safeJSONParse(memoizedValue?.attachments) || []
							}
							clanId={memoizedValue?.clanId || ''}
							channelId={memoizedValue?.channelId || ''}
						/>
					)}
					{!!memoizedValue?.embed && (
						<EmbedMessage
							message_id={firstMessage?.message_id || ''}
							channel_id={memoizedValue?.channelId || ''}
							embed={memoizedValue?.embed}
							key={`message_embed_${memoizedValue?.channelId}_${firstMessage?.message_id || ''}`}
						/>
					)}
				</ScrollView>
			)}
		</View>
	);
});

export default TopicHeader;
