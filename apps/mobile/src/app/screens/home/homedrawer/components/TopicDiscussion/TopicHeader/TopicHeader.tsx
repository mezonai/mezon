import { useGetPriorityNameFromUserClan } from '@mezon/core';
import { size, useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { selectFirstMessageEntityTopic, selectFirstMessageOfCurrentTopic, useAppSelector } from '@mezon/store-mobile';
import { convertTimeString, DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import MezonClanAvatar from '../../../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import ImageNative from '../../../../../../components/ImageNative';
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
	const firstMessageEntity = useAppSelector((state) => selectFirstMessageEntityTopic(state));
	const firstMessageByChannel = useAppSelector((state) => selectFirstMessageOfCurrentTopic(state, currentChannelId || ''));

	const firstMessage = useMemo(() => {
		if (firstMessageByChannel) {
			return firstMessageByChannel;
		}
		return firstMessageEntity;
	}, [firstMessageByChannel, firstMessageEntity]);

	const { priorityAvatar, namePriority } = useGetPriorityNameFromUserClan(firstMessage?.sender_id || '');
	const userRolesClan = useColorsRoleById(firstMessage?.sender_id || '');

	const senderUsername = useMemo(() => {
		return firstMessage?.user?.username || firstMessage?.username || '';
	}, [firstMessage?.user?.username, firstMessage?.username]);

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
					<View style={styles.avatarWrapper}>
						<MezonClanAvatar alt={senderUsername} image={priorityAvatar} />
					</View>

					<View>
						<View style={styles.nameWrapper}>
							<Text style={[styles.name, { color: colorSenderName }]}>{namePriority || firstMessage?.display_name || ''}</Text>

							{userRolesClan?.highestPermissionRoleIcon && (
								<ImageNative url={userRolesClan.highestPermissionRoleIcon} style={styles.roleIcon} resizeMode={'contain'} />
							)}
						</View>
						{firstMessage?.create_time_seconds && (
							<Text style={styles.dateText}>
								{convertTimeString(new Date(firstMessage.create_time_seconds * 1000).toISOString(), t)}
							</Text>
						)}
					</View>
				</View>
			)}
			{!firstMessage ? null : (
				<ScrollView>
					<RenderTextMarkdownContent
						content={{
							...(typeof firstMessage?.content === 'string'
								? safeJSONParse(firstMessage?.content || '{}')
								: firstMessage?.content || {}),
							mentions: firstMessage?.mentions || []
						}}
						translate={t}
						isMessageReply={false}
					/>
					{firstMessage?.attachments?.length > 0 && (
						<MessageAttachment
							attachments={
								typeof firstMessage?.attachments === 'string'
									? safeJSONParse(firstMessage?.attachments || '[]')
									: firstMessage?.attachments || []
							}
							clanId={firstMessage?.clan_id || ''}
							channelId={firstMessage?.channel_id || ''}
							messageCreatTime={firstMessage?.create_time_seconds}
							senderId={firstMessage?.sender_id}
						/>
					)}
					{!!firstMessage?.content?.embed?.[0] && (
						<EmbedMessage
							message_id={firstMessage?.id || ''}
							channel_id={firstMessage?.channel_id || ''}
							embed={
								typeof firstMessage?.content?.embed === 'string'
									? safeJSONParse(firstMessage?.content || '{}')?.embed?.[0]
									: firstMessage?.content?.embed?.[0]
							}
							key={`message_embed_${firstMessage?.channel_id}_${firstMessage?.id}`}
						/>
					)}
				</ScrollView>
			)}
		</View>
	);
});

export default TopicHeader;
