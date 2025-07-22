import { useGetPriorityNameFromUserClan } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, selectCurrentTopicInitMessage, selectFirstMessageOfCurrentTopic } from '@mezon/store-mobile';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, convertTimeString } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, ScrollView, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { MessageAttachment } from '../../MessageAttachment';
import { RenderTextMarkdownContent } from '../../RenderTextMarkdown';
import { style } from './styles';

type TopicHeaderProps = {
	mode: ChannelStreamMode;
	handleBack: () => void;
};

const TopicHeader = React.memo(({ mode, handleBack }: TopicHeaderProps) => {
	const currentTopic = useSelector(selectCurrentTopicInitMessage);
	const firstMessage = useSelector(selectFirstMessageOfCurrentTopic);
	const valueTopic = currentTopic || firstMessage?.message;
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('message');
	const { priorityAvatar, namePriority } = useGetPriorityNameFromUserClan(valueTopic?.sender_id || '');

	const userRolesClan = useColorsRoleById(valueTopic?.sender_id || '');

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
						<MezonIconCDN icon={IconCDN.discussionIcon} color={themeValue.text} height={size.s_20} width={size.s_16} />
					</Pressable>
					<Text style={styles.title}>Topic</Text>
				</View>
				<View style={{ width: size.s_50 }} />
			</View>
			{valueTopic && (
				<View style={styles.userInfo}>
					<MezonAvatar avatarUrl={priorityAvatar} username={namePriority} />
					<View>
						<Text style={[styles.name, { color: colorSenderName }]}>{namePriority}</Text>
						{valueTopic?.create_time && <Text style={styles.dateText}>{convertTimeString(valueTopic?.create_time)}</Text>}
					</View>
				</View>
			)}
			{!valueTopic ? null : (
				<ScrollView>
					<RenderTextMarkdownContent
						content={{
							...((typeof valueTopic?.content === 'object' ? valueTopic?.content : safeJSONParse(valueTopic?.content)) || {}),
							mentions: valueTopic?.mentions
						}}
						translate={t}
						isMessageReply={false}
						onMention={onMention}
						onChannelMention={onChannelMention}
					/>
					{valueTopic?.attachments?.length > 0 && (
						<MessageAttachment
							attachments={
								typeof valueTopic?.attachments === 'object' ? valueTopic?.attachments : safeJSONParse(valueTopic?.attachments) || []
							}
							clanId={valueTopic?.clan_id}
							channelId={valueTopic?.channel_id}
						/>
					)}
				</ScrollView>
			)}
		</View>
	);
});

export default TopicHeader;
