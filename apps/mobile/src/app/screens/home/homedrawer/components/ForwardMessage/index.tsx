/* eslint-disable no-console */
import { useSendForwardMessage } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { DirectEntity, MessagesEntity } from '@mezon/store-mobile';
import {
	getIsFowardAll,
	getSelectedMessage,
	getStore,
	selectAllChannelsByUser,
	selectBanMemberCurrentClanById,
	selectBlockedUsersForMessage,
	selectCurrentChannelId,
	selectCurrentTopicId,
	selectCurrentUserId,
	selectDirectsOpenlist,
	selectDmGroupCurrentId,
	selectMessageEntitiesByChannelId,
	selectMessageIdsByChannelId,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import type { ChannelThreads, IMessageWithUser } from '@mezon/utils';
import { FORWARD_MESSAGE_TIME, MIN_THRESHOLD_CHARS, isValidEmojiData, normalizeString } from '@mezon/utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../componentUI/MezonInput';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { DmListItemLastMessage } from '../../../../messages/DMListItemLastMessage';
import { RenderForwardMedia } from '../RenderForwardMedia';
import ForwardMessageItem from './ForwardMessageItem/ForwardMessageItem';
import { style } from './styles';

export interface IForwardIObject {
	channelId: string;
	type: number;
	clanId?: string;
	name?: string;
	avatar?: string;
	clanName?: string;
	isChannelPublic?: boolean;
}

const ForwardMessageScreen = () => {
	const [searchText, setSearchText] = useState('');
	const [personalRawMessages, setPersonalRawMessages] = useState<string>('');
	const [count, setCount] = useState('');

	const navigation = useNavigation();
	const route = useRoute();
	const params = route.params as { message: IMessageWithUser; isPublic?: boolean };
	const { message } = params || {};
	const { sendForwardMessage } = useSendForwardMessage();
	const { t } = useTranslation('message');
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const store = getStore();
	const mezon = useMezon();

	const isForwardAll = useSelector(getIsFowardAll);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const selectedMessage = useSelector(getSelectedMessage);

	const selectedForwardObjectsRef = useRef<IForwardIObject[]>([]);

	const currentId = useMemo(() => currentDmId || currentTopicId || currentChannelId || '', [currentDmId, currentTopicId, currentChannelId]);
	const allMessagesEntities = useAppSelector((state) => selectMessageEntitiesByChannelId(state, currentId));
	const allMessageIds = useAppSelector((state) => selectMessageIdsByChannelId(state, currentId));

	const mapDirectMessageToForwardObject = (dm: DirectEntity): IForwardIObject => {
		return {
			channelId: dm?.id,
			type: dm?.type,
			avatar: dm?.type === ChannelType.CHANNEL_TYPE_DM ? dm?.avatars?.[0] : dm?.channel_avatar,
			name: dm?.channel_label,
			clanId: '',
			clanName: '',
			isChannelPublic: false
		};
	};

	const mapChannelToForwardObject = (channel: ChannelThreads): IForwardIObject => {
		return {
			channelId: channel?.id,
			type: channel?.type,
			avatar: '#',
			name: channel?.channel_label,
			clanId: channel?.clan_id,
			clanName: channel?.clan_name,
			isChannelPublic: !channel?.channel_private || false
		};
	};

	const messageAttachments = useMemo(() => {
		try {
			const attachments = selectedMessage?.attachments || [];
			return {
				images: attachments?.filter((a) => a?.filetype?.includes('image')),
				videos: attachments?.filter((a) => a?.filetype?.includes('video')),
				files: attachments?.filter((a) => !a?.filetype?.includes('image') && !a?.filetype?.includes('video'))
			};
		} catch (error) {
			console.error('Error processing message attachments:', error);
			return {
				images: [],
				videos: [],
				files: []
			};
		}
	}, [selectedMessage?.attachments]);

	const allForwardObject = useMemo(() => {
		const listChannels = selectAllChannelsByUser(store.getState() as any);
		const dmGroupChatList = selectDirectsOpenlist(store.getState() as any);
		const listBlockUsers = selectBlockedUsersForMessage(store.getState() as any);
		const listDMForward = dmGroupChatList
			?.filter(
				(dm) =>
					dm?.type === ChannelType.CHANNEL_TYPE_DM && dm?.channel_label && !listBlockUsers?.some((user) => user?.id === dm?.user_ids?.[0])
			)
			.map(mapDirectMessageToForwardObject);

		const listGroupForward = dmGroupChatList
			?.filter((groupChat) => groupChat?.type === ChannelType.CHANNEL_TYPE_GROUP && groupChat?.channel_label)
			.map(mapDirectMessageToForwardObject);

		const listTextChannel = listChannels
			?.filter(
				(channel) =>
					(channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL || channel?.type === ChannelType.CHANNEL_TYPE_THREAD) &&
					channel?.channel_label
			)
			.map(mapChannelToForwardObject);

		return [...(listTextChannel || []), ...(listDMForward || []), ...(listGroupForward || [])];
	}, [store]);

	const filteredForwardObjects = useMemo(() => {
		if (searchText?.trim()?.charAt(0) === '#') {
			return allForwardObject.filter((ob) => ob?.type === ChannelType.CHANNEL_TYPE_CHANNEL || ob?.type === ChannelType.CHANNEL_TYPE_THREAD);
		}

		const filtered = allForwardObject.filter((ob) => normalizeString(ob?.name).includes(normalizeString(searchText)));
		if (!searchText?.trim()) {
			return filtered;
		}

		const normalizedSearch = normalizeString(searchText);

		return filtered.sort((a, b) => {
			const normalizedA = normalizeString(a?.name);
			const normalizedB = normalizeString(b?.name);

			const isExactA = normalizedA === normalizedSearch;
			const isExactB = normalizedB === normalizedSearch;
			if (isExactA && !isExactB) return -1;
			if (!isExactA && isExactB) return 1;

			const startsWithA = normalizedA.startsWith(normalizedSearch);
			const startsWithB = normalizedB.startsWith(normalizedSearch);
			if (startsWithA && !startsWithB) return -1;
			if (!startsWithA && startsWithB) return 1;

			return normalizedA.localeCompare(normalizedB);
		});
	}, [searchText, allForwardObject]);

	const isChecked = (forwardObject: IForwardIObject) => {
		const { channelId, type } = forwardObject;
		const existingIndex = selectedForwardObjectsRef.current?.findIndex((item) => item.channelId === channelId && item.type === type);
		return existingIndex !== -1;
	};

	const onClose = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const handleSendMessage = useCallback(
		async (clanId: string, channelIdOrDirectId: string, mode: ChannelStreamMode, isPublic: boolean) => {
			if (!personalRawMessages?.trim()) return;

			await mezon.socketRef.current.writeChatMessage(
				clanId,
				channelIdOrDirectId,
				mode,
				isPublic,
				{ t: personalRawMessages },
				[],
				[],
				[],
				false,
				false
			);
		},
		[mezon.socketRef, personalRawMessages]
	);

	const sendMessagesToTargets = useCallback(
		async (targets: IForwardIObject[], messages: MessagesEntity[]) => {
			const currentUserId = selectCurrentUserId(store.getState());

			for (const target of targets) {
				const { type, channelId, clanId = '', isChannelPublic, name } = target || {};
				const isBanFromChannel = selectBanMemberCurrentClanById(store.getState(), channelId, currentUserId);

				if (isBanFromChannel) {
					Toast.show({
						type: 'error',
						text1: t('bannedChannel', { channelName: name })
					});
					return;
				}

				const modeMap: Record<number, ChannelStreamMode> = {
					[ChannelType.CHANNEL_TYPE_DM]: ChannelStreamMode.STREAM_MODE_DM,
					[ChannelType.CHANNEL_TYPE_GROUP]: ChannelStreamMode.STREAM_MODE_GROUP,
					[ChannelType.CHANNEL_TYPE_CHANNEL]: ChannelStreamMode.STREAM_MODE_CHANNEL,
					[ChannelType.CHANNEL_TYPE_THREAD]: ChannelStreamMode.STREAM_MODE_THREAD
				};

				const mode = modeMap[type];
				const isPublicMessage =
					type === ChannelType.CHANNEL_TYPE_CHANNEL || type === ChannelType.CHANNEL_TYPE_THREAD ? isChannelPublic : false;

				for (const msg of messages) {
					await sendForwardMessage(
						type === ChannelType.CHANNEL_TYPE_CHANNEL || type === ChannelType.CHANNEL_TYPE_THREAD ? clanId : '',
						channelId,
						mode,
						isPublicMessage,
						msg
					);
				}

				await handleSendMessage(clanId, channelId, mode, isPublicMessage);
			}
		},
		[store, t, sendForwardMessage, handleSendMessage]
	);

	const getMessagesToForward = useCallback(async () => {
		const messages: MessagesEntity[] = [selectedMessage];

		if (!isForwardAll) return messages;

		const revertIds = [...(allMessageIds || [])].reverse();
		const startIndex = revertIds.findIndex((id) => id === selectedMessage?.id);

		let index = startIndex - 1;
		while (index >= 0) {
			const previousMessageEntity = allMessagesEntities?.[revertIds?.[index + 1]];
			const messageEntity = allMessagesEntities?.[revertIds?.[index]];

			if (!messageEntity) break;

			const differentTime = Date.parse(messageEntity?.create_time) - Date.parse(previousMessageEntity?.create_time);

			if (differentTime <= FORWARD_MESSAGE_TIME && messageEntity?.sender_id === selectedMessage?.user?.id) {
				messages.push(messageEntity);
				index--;
			} else {
				break;
			}
		}

		return messages;
	}, [selectedMessage, isForwardAll, allMessageIds, allMessagesEntities]);

	const handleForward = useCallback(async () => {
		if (!selectedForwardObjectsRef.current?.length) return;

		try {
			const messages = await getMessagesToForward();
			await sendMessagesToTargets(selectedForwardObjectsRef.current, messages);

			Toast.show({
				type: 'success',
				props: {
					text2: t('forwardMessagesSuccessfully'),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={30} height={17} />
				}
			});

			onClose();
		} catch (error) {
			console.error('Forward error:', error);
		}
	}, [getMessagesToForward, sendMessagesToTargets, onClose, t]);

	const isOnlyContainEmoji = useMemo(() => isValidEmojiData(message.content), [message.content]);

	const onSelectChange = useCallback((value: boolean, item: IForwardIObject) => {
		if (!item || !item?.channelId) return;
		if (value) {
			selectedForwardObjectsRef.current = [...selectedForwardObjectsRef.current, item];
		} else {
			selectedForwardObjectsRef.current = selectedForwardObjectsRef.current.filter((ob) => ob.channelId !== item.channelId);
		}
		setCount(selectedForwardObjectsRef.current?.length ? ` (${selectedForwardObjectsRef.current?.length})` : '');
	}, []);

	const renderForwardObject = ({ item }: { item: IForwardIObject }) => {
		return (
			<ForwardMessageItem key={`item_forward_${item?.channelId}`} isItemChecked={isChecked(item)} onSelectChange={onSelectChange} item={item} />
		);
	};

	return (
		<KeyboardAvoidingView
			behavior="padding"
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
			style={styles.container}
		>
			<StatusBarHeight />
			<View style={styles.wrapper}>
				<LinearGradient
					start={{ x: 1, y: 0 }}
					end={{ x: 0, y: 0 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={[StyleSheet.absoluteFillObject]}
				/>
				<View style={styles.header}>
					<View style={styles.headerSide}>
						<TouchableOpacity onPress={onClose}>
							<MezonIconCDN icon={IconCDN.closeLargeIcon} color={themeValue.textStrong} />
						</TouchableOpacity>
					</View>
					<Text style={styles.headerTitle}>{t('forwardTo')}</Text>
					<View style={styles.headerSide} />
				</View>

				<MezonInput
					placeHolder={t('search')}
					onTextChange={setSearchText}
					value={searchText}
					prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={20} width={20} />}
					inputWrapperStyle={styles.inputWrapper}
				/>

				<View style={styles.contentWrapper}>
					<FlashList
						keyExtractor={(item) => `${item.channelId}_${item.type}`}
						estimatedItemSize={size.s_50}
						data={filteredForwardObjects}
						renderItem={renderForwardObject}
						keyboardShouldPersistTaps="handled"
					/>
				</View>

				<View style={styles.containerMessage}>
					<View style={styles.containerMessageForward}>
						<View style={styles.messageContentContainer}>
							{!!message?.content?.t && (
								<View style={{ flexDirection: 'row' }}>
									<DmListItemLastMessage content={message.content} emojiOnForward={isOnlyContainEmoji} />
								</View>
							)}
							{message?.content?.embed && <Text style={styles.titleText}>{message?.content?.embed?.[0]?.title}</Text>}
							{messageAttachments?.images?.length > 0 && (
								<View style={styles.row}>
									<MezonIconCDN icon={IconCDN.imageIcon} color={themeValue.textDisabled} height={size.s_16} width={size.s_16} />
									<Text style={styles.titleText}>
										{messageAttachments.images.length}{' '}
										{messageAttachments.images.length > 1 ? t('attachments.images') : t('attachments.image')}
									</Text>
								</View>
							)}
							{messageAttachments?.videos?.length > 0 && (
								<View style={styles.row}>
									<MezonIconCDN
										icon={IconCDN.playCircleIcon}
										color={themeValue.textDisabled}
										height={size.s_16}
										width={size.s_16}
									/>
									<Text style={styles.titleText}>
										{messageAttachments.videos.length}{' '}
										{messageAttachments.videos.length > 1 ? t('attachments.videos') : t('attachments.video')}
									</Text>
								</View>
							)}
							{messageAttachments?.files?.length > 0 && (
								<View style={styles.row}>
									<MezonIconCDN
										icon={IconCDN.attachmentIcon}
										color={themeValue.textDisabled}
										height={size.s_16}
										width={size.s_16}
									/>
									<Text style={styles.titleText}>
										{messageAttachments.files.length}{' '}
										{messageAttachments.files.length > 1 ? t('attachments.files') : t('attachments.file')}
									</Text>
								</View>
							)}
						</View>
						{message?.attachments?.length > 0 && (
							<RenderForwardMedia attachment={message?.attachments?.[0]} count={message?.attachments?.length - 1} />
						)}
					</View>
				</View>

				<View style={styles.containerSendMessage}>
					<View style={styles.chatInput}>
						<TextInput
							style={styles.textInput}
							value={personalRawMessages}
							onChangeText={setPersonalRawMessages}
							placeholder={t('addAMessage')}
							placeholderTextColor={themeValue.textDisabled}
							maxLength={MIN_THRESHOLD_CHARS}
						/>
						{!!personalRawMessages?.length && (
							<TouchableOpacity activeOpacity={0.8} onPress={() => setPersonalRawMessages('')} style={styles.iconRightInput}>
								<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_18} color={themeValue.text} height={size.s_18} />
							</TouchableOpacity>
						)}
					</View>
					<TouchableOpacity
						style={[styles.btn, !selectedForwardObjectsRef.current?.length && { backgroundColor: themeValue.textDisabled }]}
						onPress={handleForward}
					>
						<Text style={styles.btnText} numberOfLines={1}>
							{t('buzz.confirmText')}
							{count}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
};

export default ForwardMessageScreen;
