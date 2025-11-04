import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { MessagesEntity, channelsActions, messagesActions, selectAllChannelMemberIds, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { ETokenMessage, TypeMessage, convertTimeString, parseThreadInfo } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import WaveButton from '../../../components/WaveWelcome';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

export const MessageLineSystem = memo(({ message }: { message: MessagesEntity }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { mentions = [] } = message;
	const { t } = message?.content ?? {};
	const navigation = useNavigation<any>();
	const { t: translateMessage } = useTranslation('message');

	const getMemberIds = useAppSelector((state) => selectAllChannelMemberIds(state, message?.channel_id as string));

	const messageTime = convertTimeString(message?.create_time as string);
	const findThreadInText = (text: string) => {
		let threadContent: { threadLabel?: string; threadId?: string; threadContent?: string } = {};
		if (message?.code === TypeMessage.CreateThread && text) {
			threadContent = parseThreadInfo(message?.content?.t);
		}

		if (threadContent) {
			const threadStart = threadContent?.threadLabel;
			const startIdx = text?.indexOf(threadStart);

			if (startIdx !== -1) {
				return {
					s: startIdx - 1,
					e: text?.length,
					kindOf: ETokenMessage.HASHTAGS
				};
			}
		}
		return null;
	};

	const findMessageInText = (text: string) => {
		const messageText = 'a message';
		const startIdx = text?.indexOf(messageText);

		if (startIdx !== -1) {
			return {
				s: startIdx,
				e: startIdx + messageText?.length,
				kindOf: ETokenMessage.LINKS
			};
		}
		return null;
	};

	const elements = useMemo(() => {
		const elements = [...mentions.map((item) => ({ ...item, kindOf: ETokenMessage.MENTIONS }))]?.sort((a, b) => (a.s ?? 0) - (b.s ?? 0));

		const threadInfo = findThreadInText(t);
		if (threadInfo) {
			elements.push(threadInfo);
		}

		const messageInfo = findMessageInText(t);
		if (messageInfo) {
			elements.push(messageInfo);
		}

		return elements;
	}, [mentions, t]);

	const onMention = useCallback((mentionedUser: string) => {
		if (mentionedUser?.length) DeviceEventEmitter.emit(ActionEmitEvent.ON_MENTION_USER_MESSAGE_ITEM, mentionedUser);
	}, []);

	const dispatch = useAppDispatch();
	const allUserIdsInChannel = getMemberIds;
	const handleJumpToPinMessage = useCallback(
		(e) => {
			if (message?.references && message?.references[0]?.message_ref_id) {
				dispatch(
					messagesActions.jumpToMessage({
						clanId: message?.clan_id || '',
						messageId: message?.references[0]?.message_ref_id,
						channelId: message?.channel_id
					})
				);
			}
		},
		[dispatch, message?.channel_id, message?.clan_id, message?.references]
	);

	const handleJumpToThread = async (threadInfo) => {
		if (threadInfo) {
			const payloadThread = {
				type: ChannelType.CHANNEL_TYPE_THREAD,
				id: threadInfo?.threadId,
				channel_id: threadInfo?.threadId,
				clan_id: message?.clan_id
			};
			await dispatch(channelsActions.addThreadToChannels({ channelId: threadInfo?.threadId, clanId: message?.clan_id }));
			DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_MENTION_MESSAGE_ITEM, payloadThread);
		}
	};

	const navigateAllThread = () => {
		navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD });
	};

	const content = useMemo(() => {
		const formattedContent = [];
		if (message?.code === TypeMessage.CreatePin) {
			if (mentions?.[0]) {
				formattedContent.push(
					<Text style={styles.textMention} key="mention-user" onPress={() => onMention(`@${mentions[0]?.username || ''}`)}>
						{`@${mentions[0]?.username || ''}`}
					</Text>
				);
			}

			formattedContent.push(
				<Text key="pin-message">
					{' ' + translateMessage('systemMessages.pinned') + ' '}
					<Text onPress={handleJumpToPinMessage} style={styles.textPinMessage}>
						{translateMessage('systemMessages.aMessage')}
					</Text>
					{' ' + translateMessage('systemMessages.toThisChannel') + ' ' + translateMessage('systemMessages.allPinned') + ' '}
					{translateMessage('systemMessages.messages')}
				</Text>
			);

			return formattedContent;
		}

		let lastIndex = 0;

		const renderElement = (element, contentInElement, index) => {
			switch (element.kindOf) {
				case ETokenMessage.MENTIONS:
					if (element?.user_id) {
						formattedContent.push(
							allUserIdsInChannel?.includes(element?.user_id) || contentInElement === '@here' ? (
								<Text key={`plain-${index}`}>
									<Text style={styles.textMention} key={`mention-${index}`} onPress={() => onMention(`@${element?.username}`)}>
										{contentInElement?.trim()}
									</Text>{' '}
								</Text>
							) : (
								<Text key={`plain-${index}`}>{contentInElement}</Text>
							)
						);
					}
					break;

				case ETokenMessage.HASHTAGS: {
					const hashtag = parseThreadInfo(contentInElement);
					formattedContent.push(
						<Text key={`hashtag-${index}_${hashtag?.threadId}`}>
							{'started a thread: '}
							<Text style={styles.textMention} onPress={() => handleJumpToThread(hashtag)}>
								{hashtag?.threadLabel}
							</Text>
							{`${hashtag?.threadContent || ''}. see `}
							<Text style={styles.textMention} key={`hashtag-${index}`} onPress={navigateAllThread}>
								{'all threads'}
							</Text>
						</Text>
					);
					break;
				}

				case ETokenMessage.LINKS:
					formattedContent.push(
						<Text onPress={handleJumpToPinMessage} style={styles.textPinMessage} key={`link-${index}`}>
							{contentInElement}
						</Text>
					);
					break;
				default:
					formattedContent.push(
						<Text onPress={handleJumpToPinMessage} style={styles.textPinMessage} key={`link-${index}`}>
							{''}
						</Text>
					);
					break;
			}
		};

		elements?.forEach((element, index) => {
			const s = element?.s ?? 0;
			const e = element?.e ?? 0;
			const contentInElement = t?.substring(s, e);

			if (lastIndex < s) {
				formattedContent.push(<Text key={`text-${index}`}>{t?.slice(lastIndex, s) ?? ''}</Text>);
			}

			renderElement(element, contentInElement, index);
			lastIndex = e;
		});

		if (lastIndex < (t?.length ?? 0)) {
			formattedContent.push(<Text key="remaining">{t?.slice(lastIndex) ?? ''}</Text>);
		}

		return formattedContent;
	}, [elements, t, allUserIdsInChannel, styles, handleJumpToPinMessage, onMention]);

	return (
		<View style={[styles.wrapperMessageBox, styles.systemMessageContainer]}>
			<View>
				{message?.code === TypeMessage.Welcome && (
					<MezonIconCDN icon={IconCDN.auditLog} width={size.s_24} height={size.s_24} color={baseColor.bgSuccess} />
				)}
				{message?.code === TypeMessage.CreateThread && (
					<MezonIconCDN icon={IconCDN.threadIcon} color={themeValue.text} width={size.s_20} height={size.s_20} />
				)}
				{message?.code === TypeMessage.CreatePin && (
					<MezonIconCDN icon={IconCDN.pinIcon} color={themeValue.text} width={size.s_20} height={size.s_20} />
				)}
				{message?.code === TypeMessage.AuditLog && (
					<MezonIconCDN icon={IconCDN.auditLog} width={size.s_24} height={size.s_24} color={baseColor.blurple} />
				)}
				{message?.code === TypeMessage.UpcomingEvent && (
					<MezonIconCDN icon={IconCDN.auditLog} width={size.s_24} height={size.s_24} color={baseColor.redStrong} />
				)}
			</View>
			<View style={styles.columnFlexDirection}>
				<View style={styles.messageSystemBox}>
					<Text style={styles.messageText}>
						{content}
						<Text style={styles.messageTime}>{`   ${messageTime}`}</Text>
					</Text>
				</View>

				{message?.code === TypeMessage.Welcome && <WaveButton message={message} />}
			</View>
		</View>
	);
});
