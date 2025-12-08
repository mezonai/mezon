import { useGetPriorityNameFromUserClan } from '@mezon/core';
import { size, useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { selectFirstMessageOfCurrentTopic, useAppSelector } from '@mezon/store-mobile';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, convertTimeString } from '@mezon/utils';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { EmbedMessage } from '../../EmbedMessage';
import { MessageAttachment } from '../../MessageAttachment';
import { RenderTextMarkdownContent } from '../../RenderTextMarkdown';
import { style } from './styles';

type TopicHeaderProps = {
	currentChannelId: string;
	handleBack: () => void;
};

const TopicHeader = memo(({ currentChannelId, handleBack }: TopicHeaderProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['message', 'common']);
	const firstMessage = useAppSelector((state) => selectFirstMessageOfCurrentTopic(state, currentChannelId || ''));

	const { priorityAvatar, namePriority } = useGetPriorityNameFromUserClan(firstMessage?.sender_id || '');
	const userRolesClan = useColorsRoleById(firstMessage?.sender_id || '');

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
					<Text style={styles.title}>{t('actions.topicDiscussion')}</Text>
				</View>
				<View style={styles.spacer} />
			</View>
			{firstMessage && (
				<View style={styles.userInfo}>
					<MezonAvatar avatarUrl={priorityAvatar} username={namePriority || firstMessage?.display_name || ''} />
					<View>
						<Text style={[styles.name, { color: colorSenderName }]}>{namePriority || firstMessage?.display_name || ''}</Text>
						{firstMessage?.create_time && <Text style={styles.dateText}>{convertTimeString(firstMessage.create_time as string, t)}</Text>}
					</View>
				</View>
			)}
			{!firstMessage ? null : (
				<ScrollView>
					<RenderTextMarkdownContent
						content={{
							...(firstMessage?.content || {}),
							mentions: firstMessage?.mentions || []
						}}
						translate={t}
						isMessageReply={false}
					/>
					{firstMessage?.attachments?.length > 0 && (
						<MessageAttachment
							attachments={firstMessage?.attachments || []}
							clanId={firstMessage?.clan_id || ''}
							channelId={firstMessage?.channel_id || ''}
						/>
					)}
					{!!firstMessage?.content?.embed?.[0] && (
						<EmbedMessage
							message_id={firstMessage?.id || ''}
							channel_id={firstMessage?.channel_id || ''}
							embed={firstMessage.content.embed[0]}
							key={`message_embed_${firstMessage?.channel_id}_${firstMessage?.id}`}
						/>
					)}
				</ScrollView>
			)}
		</View>
	);
});

export default TopicHeader;
