import { ActionEmitEvent, Icons, PaperclipIcon, convertTimestampToTimeAgo } from '@mezon/mobile-components';
import { Colors, useTheme } from '@mezon/mobile-ui';
import { useAppDispatch, useAppSelector } from '@mezon/store';
import { directActions, selectDirectById, selectDmGroupCurrentId, selectIsUnreadDMById } from '@mezon/store-mobile';
import { IExtendedMessage, normalizeString } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { DmListItemLastMessage } from './DMListItemLastMessage';
import { TypingDmItem } from './TypingDMItem';
import { style } from './styles';

export const DmListItem = React.memo((props: { id: string; navigation: any; onLongPress; onPress? }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { id, navigation, onLongPress, onPress } = props;
	const directMessage = useAppSelector((state) => selectDirectById(state, id));
	const isUnReadChannel = useSelector(selectIsUnreadDMById(directMessage?.id));
	const { t } = useTranslation('message');
	const isTabletLandscape = useTabletLandscape();
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	const dispatch = useAppDispatch();
	const [hiddenFlag, setHiddenFlag] = useState(false);

	const redirectToMessageDetail = async () => {
		await dispatch(directActions.setDmGroupCurrentId(directMessage?.id));
		if (isTabletLandscape) {
			onPress && onPress(directMessage?.id);
		} else {
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.MESSAGE_DETAIL,
				params: { directMessageId: directMessage?.id }
			});
		}
	};

	const isTypeDMGroup = useMemo(() => {
		return Number(directMessage?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [directMessage?.type]);

	const otherMemberList = useMemo(() => {
		const userIdList = directMessage.user_id;
		const usernameList = directMessage?.channel_label?.split?.(',') || [];
		return usernameList?.map((username, index) => ({
			userId: userIdList?.[index],
			username: username
		}));
	}, [directMessage]);

	const getLastMessageContent = (content: string | IExtendedMessage) => {
		if (!content) return null;
		const text = typeof content === 'string' ? JSON.parse(content)?.t : JSON.parse(JSON.stringify(content) || '{}')?.t;
		const lastMessageSender = otherMemberList?.find?.((it) => it.userId === directMessage?.last_sent_message?.sender_id);

		if (!text) {
			return (
				<View style={styles.contentMessage}>
					<Text
						style={[styles.defaultText, styles.lastMessage, { color: isUnReadChannel ? themeValue.white : themeValue.textNormal }]}
						numberOfLines={1}
					>
						{lastMessageSender ? lastMessageSender?.username : t('directMessage.you')}
						{': '}
						{'attachment '}
						<PaperclipIcon width={13} height={13} color={Colors.textGray} />
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.contentMessage}>
				<Text style={[styles.defaultText, styles.lastMessage, { color: isUnReadChannel ? themeValue.white : themeValue.textNormal }]}>
					{lastMessageSender ? lastMessageSender?.username : t('directMessage.you')}
					{': '}
				</Text>
				{!!content && (
					<DmListItemLastMessage
						content={typeof content === 'object' ? content : JSON.parse(content || '{}')}
						styleText={{ color: isUnReadChannel ? themeValue.white : themeValue.textNormal }}
					/>
				)}
			</View>
		);
	};

	const lastMessageTime = useMemo(() => {
		if (directMessage?.last_sent_message?.timestamp_seconds) {
			const timestamp = Number(directMessage?.last_sent_message?.timestamp_seconds);
			return convertTimestampToTimeAgo(timestamp);
		}
		return null;
	}, [directMessage]);

	useEffect(() => {
		const searchDMListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SEARCH_DM, ({ searchText }) => {
			if (searchText && !normalizeString(directMessage?.channel_label || directMessage?.usernames)?.includes(normalizeString(searchText))) {
				setHiddenFlag(true);
			} else {
				setHiddenFlag(false);
			}
		});

		return () => {
			searchDMListener.remove();
		};
	}, [directMessage?.channel_label, directMessage?.usernames]);

	if (hiddenFlag) return null;

	return (
		<TouchableOpacity
			style={[
				styles.messageItem,
				currentDmGroupId === directMessage?.id && {
					backgroundColor: isTabletLandscape ? themeValue.secondary : themeValue.primary,
					borderColor: themeValue.borderHighlight,
					borderWidth: 1
				}
			]}
			onPress={redirectToMessageDetail}
			onLongPress={() => onLongPress(directMessage)}
		>
			{isTypeDMGroup ? (
				<View style={styles.groupAvatar}>
					<Icons.GroupIcon />
				</View>
			) : (
				<View style={styles.avatarWrapper}>
					{directMessage?.channel_avatar?.[0] ? (
						<FastImage source={{ uri: directMessage?.channel_avatar?.[0] }} style={styles.friendAvatar} />
					) : (
						<View style={styles.wrapperTextAvatar}>
							<Text style={styles.textAvatar}>{(directMessage?.channel_label || directMessage?.usernames)?.charAt?.(0)}</Text>
						</View>
					)}
					<TypingDmItem directMessage={directMessage} />
				</View>
			)}

			<View style={{ flex: 1 }}>
				<View style={styles.messageContent}>
					<Text
						numberOfLines={1}
						style={[styles.defaultText, styles.channelLabel, { color: isUnReadChannel ? themeValue.white : themeValue.textNormal }]}
					>
						{(directMessage?.channel_label || directMessage?.usernames) ?? `${directMessage.creator_name}'s Group` ?? ''}
					</Text>
					{lastMessageTime ? (
						<Text style={[styles.defaultText, styles.dateTime, { color: isUnReadChannel ? themeValue.white : themeValue.textNormal }]}>
							{lastMessageTime}
						</Text>
					) : null}
				</View>

				{getLastMessageContent(directMessage?.last_sent_message?.content)}
			</View>
		</TouchableOpacity>
	);
});
