/* eslint-disable no-console */
import { useSendForwardMessage } from '@mezon/core';
import { baseColor, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import type { DirectEntity, MessagesEntity } from '@mezon/store-mobile';
import {
	getIsFowardAll,
	getSelectedMessage,
	getStore,
	selectAllChannelsByUser,
	selectBlockedUsersForMessage,
	selectCurrentChannelId,
	selectDirectsOpenlist,
	selectDmGroupCurrentId,
	selectMessageEntitiesByChannelId,
	useAppSelector
} from '@mezon/store-mobile';
import type { ChannelThreads, IMessageWithUser } from '@mezon/utils';
import { normalizeString } from '@mezon/utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../componentUI/MezonInput';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../constants/icon_cdn';
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
	const navigation = useNavigation();
	const route = useRoute();
	const params = route.params as { message: IMessageWithUser; isPublic?: boolean };
	const { message, isPublic } = params;

	const { sendForwardMessage } = useSendForwardMessage();
	const { t } = useTranslation('message');
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const store = getStore();
	const isForwardAll = useSelector(getIsFowardAll);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const selectedMessage = useSelector(getSelectedMessage);
	const [count, setCount] = useState('');
	const selectedForwardObjectsRef = useRef<IForwardIObject[]>([]);

	const allMessagesEntities = useAppSelector((state) =>
		selectMessageEntitiesByChannelId(state, (currentDmId ? currentDmId : currentChannelId) || '')
	);
	const convertedAllMessagesEntities: MessagesEntity[] = allMessagesEntities ? Object.values(allMessagesEntities) : [];
	const allMessagesBySenderId = useMemo(() => {
		return convertedAllMessagesEntities?.filter((message) => message.sender_id === selectedMessage?.user?.id);
	}, [allMessagesEntities, selectedMessage?.user?.id]);

	const startIndex = useMemo(() => {
		return allMessagesBySenderId.findIndex((message) => message.id === selectedMessage?.id);
	}, [allMessagesEntities, selectedMessage?.id]);

	const mapDirectMessageToForwardObject = (dm: DirectEntity): IForwardIObject => {
		return {
			channelId: dm?.id,
			type: dm?.type,
			avatar: dm?.type === ChannelType.CHANNEL_TYPE_DM ? dm?.channel_avatar?.[0] : dm?.topic,
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

		return [...listTextChannel, ...listGroupForward, ...listDMForward];
	}, [store]);

	const filteredForwardObjects = useMemo(() => {
		if (searchText?.trim()?.charAt(0) === '#') {
			return allForwardObject.filter((ob) => ob?.type === ChannelType.CHANNEL_TYPE_CHANNEL || ob?.type === ChannelType.CHANNEL_TYPE_THREAD);
		}
		return allForwardObject.filter((ob) => normalizeString(ob?.name).includes(normalizeString(searchText)));
	}, [searchText, allForwardObject]);

	const isChecked = (forwardObject: IForwardIObject) => {
		const { channelId, type } = forwardObject;
		const existingIndex = selectedForwardObjectsRef.current?.findIndex((item) => item.channelId === channelId && item.type === type);
		return existingIndex !== -1;
	};

	const onClose = () => {
		navigation.goBack();
	};

	const handleForward = () => {
		return isForwardAll ? handleForwardAllMessage() : sentToMessage();
	};

	const handleForwardAllMessage = async () => {
		if (!selectedForwardObjectsRef.current?.length) return;
		try {
			const combineMessages: MessagesEntity[] = [];
			combineMessages.push(selectedMessage);

			let index = startIndex + 1;
			while (
				index < allMessagesBySenderId.length &&
				!allMessagesBySenderId[index].isStartedMessageGroup &&
				allMessagesBySenderId[index].sender_id === selectedMessage?.user?.id
			) {
				combineMessages.push(allMessagesBySenderId[index]);
				index++;
			}
			for (const selectedObjectSend of selectedForwardObjectsRef.current) {
				const { type, channelId, clanId = '' } = selectedObjectSend;
				switch (type) {
					case ChannelType.CHANNEL_TYPE_DM:
						for (const message of combineMessages) {
							sendForwardMessage('', channelId, ChannelStreamMode.STREAM_MODE_DM, false, message);
						}
						break;
					case ChannelType.CHANNEL_TYPE_GROUP:
						for (const message of combineMessages) {
							sendForwardMessage('', channelId, ChannelStreamMode.STREAM_MODE_GROUP, false, message);
						}
						break;
					case ChannelType.CHANNEL_TYPE_CHANNEL:
						for (const message of combineMessages) {
							sendForwardMessage(clanId, channelId, ChannelStreamMode.STREAM_MODE_CHANNEL, isPublic, message);
						}
						break;
					case ChannelType.CHANNEL_TYPE_THREAD:
						for (const message of combineMessages) {
							sendForwardMessage(clanId, channelId, ChannelStreamMode.STREAM_MODE_THREAD, isPublic, message);
						}
						break;
					default:
						break;
				}
			}

			Toast.show({
				type: 'success',
				props: {
					text2: t('forwardMessagesSuccessfully'),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={30} height={17} />
				}
			});
		} catch (error) {
			console.error('Forward all messages log => error', error);
		}
		onClose();
	};

	const sentToMessage = async () => {
		if (!selectedForwardObjectsRef.current?.length) return;
		try {
			for (const selectedObjectSend of selectedForwardObjectsRef.current) {
				const { type, channelId, clanId = '', isChannelPublic } = selectedObjectSend;
				switch (type) {
					case ChannelType.CHANNEL_TYPE_DM:
						sendForwardMessage('', channelId, ChannelStreamMode.STREAM_MODE_DM, false, message);
						break;
					case ChannelType.CHANNEL_TYPE_GROUP:
						sendForwardMessage('', channelId, ChannelStreamMode.STREAM_MODE_GROUP, false, message);
						break;
					case ChannelType.CHANNEL_TYPE_CHANNEL:
						sendForwardMessage(clanId, channelId, ChannelStreamMode.STREAM_MODE_CHANNEL, isChannelPublic, message);
						break;
					case ChannelType.CHANNEL_TYPE_THREAD:
						sendForwardMessage(clanId, channelId, ChannelStreamMode.STREAM_MODE_THREAD, isChannelPublic, message);
						break;
					default:
						break;
				}
			}
			Toast.show({
				type: 'success',
				props: {
					text2: t('forwardMessagesSuccessfully'),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={30} height={17} />
				}
			});
		} catch (error) {
			console.error('error', error);
		}
		onClose();
	};

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
			style={{ flex: 1, paddingHorizontal: size.s_16, paddingTop: size.s_16 }}
		>
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: size.s_18 }}>
				<View style={{ flex: 1 }}>
					<TouchableOpacity onPress={onClose}>
						<MezonIconCDN icon={IconCDN.closeLargeIcon} color={themeValue.textStrong} />
					</TouchableOpacity>
				</View>
				<Text
					style={{
						fontSize: verticalScale(20),
						color: themeValue.white
					}}
				>
					{t('forwardTo')}
				</Text>
				<View style={{ flex: 1 }} />
			</View>

			<MezonInput
				placeHolder={t('search')}
				onTextChange={setSearchText}
				value={searchText}
				prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={20} width={20} />}
				inputWrapperStyle={{ backgroundColor: themeValue.primary, paddingHorizontal: size.s_6 }}
			/>

			<View style={{ marginTop: size.s_12, marginBottom: size.s_12, flex: 1 }}>
				<FlashList
					keyExtractor={(item) => `${item.channelId}_${item.type}`}
					estimatedItemSize={70}
					data={filteredForwardObjects}
					renderItem={renderForwardObject}
					keyboardShouldPersistTaps="handled"
				/>
			</View>

			<TouchableOpacity
				style={[styles.btn, !selectedForwardObjectsRef.current?.length && { backgroundColor: themeValue.textDisabled }]}
				onPress={handleForward}
			>
				<Text style={styles.btnText}>
					{t('buzz.confirmText')}
					{count}
				</Text>
			</TouchableOpacity>
		</KeyboardAvoidingView>
	);
};

export default ForwardMessageScreen;
