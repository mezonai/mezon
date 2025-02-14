import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { Text, size, useTheme } from '@mezon/mobile-ui';
import { MessagesEntity, messagesActions, selectAllChannelMemberIds, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { ETokenMessage, TypeMessage, convertTimeString } from '@mezon/utils';
import React, { memo, useCallback, useMemo } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { style } from './styles';

export const MessageLineSystem = memo(({ message }: { message: MessagesEntity }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { mentions = [] } = message;
	const { t } = message?.content ?? {};

	const getMemberIds = useAppSelector((state) => selectAllChannelMemberIds(state, message?.channel_id as string));

	const messageTime = convertTimeString(message?.create_time as string);
	const findThreadInText = (text: string) => {
		const threadStart = 'started a thread: ';
		const startIdx = text?.indexOf(threadStart);

		if (startIdx !== -1) {
			const threadContentStart = startIdx + threadStart?.length;
			const threadContentEnd = text.indexOf('.', threadContentStart);
			const threadContent =
				threadContentEnd !== -1 ? text?.substring(threadContentStart, threadContentEnd) : text?.substring(threadContentStart);

			return {
				s: threadContentStart,
				e: threadContentStart + threadContent?.length,
				kindOf: ETokenMessage.HASHTAGS
			};
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
	const content = useMemo(() => {
		const formattedContent = [];
		let lastIndex = 0;

		const renderElement = (element, contentInElement, index) => {
			switch (element.kindOf) {
				case ETokenMessage.MENTIONS:
					if (element?.user_id) {
						formattedContent.push(
							allUserIdsInChannel?.includes(element?.user_id) || contentInElement === '@here' ? (
								<Text style={styles.textMention} key={`mention-${index}`} onPress={() => onMention(`@${element?.username}`)}>
									{contentInElement}
								</Text>
							) : (
								<Text key={`plain-${index}`}>{contentInElement}</Text>
							)
						);
					}
					break;

				case ETokenMessage.HASHTAGS:
					formattedContent.push(
						<Text style={styles.textMention} key={`hashtag-${index}`}>
							{contentInElement}
						</Text>
					);
					break;

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
		<View style={[styles.wrapperMessageBox, { marginVertical: size.s_10 }]}>
			<View style={{ marginLeft: size.s_10 }}>
				{message?.code === TypeMessage.Welcome && <Icons.WelcomeIcon />}
				{message?.code === TypeMessage.CreateThread && <Icons.ThreadIcon color={themeValue.text} width={size.s_20} height={size.s_20} />}
				{message?.code === TypeMessage.CreatePin && <Icons.PinIcon color={themeValue.text} width={size.s_20} height={size.s_20} />}
				{message?.code === TypeMessage.AuditLog && <Icons.AuditLogIcon width={size.s_24} height={size.s_24} />}
			</View>
			<View style={styles.messageSystemBox}>
				<Text style={styles.messageText}>
					{content}
					<Text style={styles.messageTime}>{`   ${messageTime}`}</Text>
				</Text>
			</View>
		</View>
	);
});
