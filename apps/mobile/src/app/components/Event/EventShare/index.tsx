import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	EventManagementEntity,
	appActions,
	getStore,
	selectAllChannelsByUser,
	selectChannelById,
	selectDirectsOpenlist,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { ChannelThreads, EBacktickType, IMessageSendPayload, normalizeString } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { FlashList } from '@shopify/flash-list';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import { IconCDN } from '../../../constants/icon_cdn';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { IForwardIObject } from '../../../screens/home/homedrawer/components/ForwardMessage';
import ForwardMessageItem from '../../../screens/home/homedrawer/components/ForwardMessage/ForwardMessageItem/ForwardMessageItem';
import { style } from './styles';

interface IShareEventModalProps {
	event: EventManagementEntity;
	onConfirm?: () => void;
}
export const ShareEventModal = memo(({ event, onConfirm }: IShareEventModalProps) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const { t } = useTranslation(['eventMenu']);
	const styles = style(themeValue, isTabletLandscape);
	const store = getStore();
	const channelVoice = useAppSelector((state) => selectChannelById(state, event?.channel_voice_id || ''));
	const [searchText, setSearchText] = useState('');
	const selectedShareObjectsRef = useRef<IForwardIObject[]>([]);
	const [memberCount, setMemberCount] = useState('');
	const { clientRef, sessionRef, socketRef } = useMezon();
	const dispatch = useAppDispatch();

	const mapDirectMessageToForwardObject = (dm: DirectEntity): IForwardIObject => {
		return {
			channelId: dm?.id,
			type: dm?.type,
			avatar: dm?.type === ChannelType.CHANNEL_TYPE_DM ? dm?.channel_avatar?.[0] : 'assets/images/avatar-group.png',
			name: dm?.channel_label,
			clanId: '',
			clanName: ''
		};
	};

	const mapChannelToForwardObject = (channel: ChannelThreads): IForwardIObject => {
		return {
			channelId: channel?.id,
			type: channel?.type,
			avatar: '#',
			name: channel?.channel_label,
			clanId: channel?.clan_id,
			clanName: channel?.clan_name
		};
	};

	const allForwardObject = useMemo(() => {
		const listChannels = selectAllChannelsByUser(store.getState());
		const dmGroupChatList = selectDirectsOpenlist(store.getState() as any);
		const listDMForward = dmGroupChatList
			?.filter((dm) => dm?.type === ChannelType.CHANNEL_TYPE_DM && dm?.channel_label)
			.map(mapDirectMessageToForwardObject);

		const listGroupForward = dmGroupChatList
			?.filter((groupChat) => groupChat?.type === ChannelType.CHANNEL_TYPE_GROUP && groupChat?.channel_label)
			.map(mapDirectMessageToForwardObject);

		const listTextChannel = listChannels
			?.filter((channel) => channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && channel?.channel_label)
			.map(mapChannelToForwardObject);

		return [...listTextChannel, ...listGroupForward, ...listDMForward];
	}, [store]);

	const filteredForwardObjects = useMemo(() => {
		if (searchText?.trim()?.charAt(0) === '#') {
			return allForwardObject.filter((ob) => ob.type === ChannelType.CHANNEL_TYPE_CHANNEL);
		}
		return allForwardObject.filter((ob) => normalizeString(ob?.name).includes(normalizeString(searchText)));
	}, [searchText, allForwardObject]);

	const shareLink = useMemo(() => {
		if (!channelVoice?.channel_id && !event?.meet_room?.external_link) return '';
		return channelVoice?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE
			? `https://meet.google.com/${channelVoice.meeting_code}`
			: channelVoice.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
				? `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/clans/${channelVoice.clan_id}/channels/${channelVoice.channel_id}`
				: `${process.env.NX_CHAT_APP_REDIRECT_URI}${event?.meet_room?.external_link}`;
	}, [channelVoice, event?.meet_room?.external_link]);

	function handleClose() {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}

	const isChecked = (forwardObject: IForwardIObject) => {
		const { channelId, type } = forwardObject;
		const existingIndex = selectedShareObjectsRef.current?.findIndex((item) => item.channelId === channelId && item.type === type);
		return existingIndex !== -1;
	};

	const handleSendMessageShare = async () => {
		if (!selectedShareObjectsRef.current?.length) return;
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;

			if (!client || !session || !socket) {
				throw new Error('Client is not initialized');
			}

			const linkType = channelVoice.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ? EBacktickType.VOICE_LINK : EBacktickType.LINK;

			const content: IMessageSendPayload = {
				t: shareLink,
				mk: [
					{
						s: 0,
						e: shareLink.length,
						type: linkType
					}
				]
			};

			for (const selectedObjectSend of selectedShareObjectsRef.current) {
				const { type, channelId, clanId = '' } = selectedObjectSend;
				let mode = ChannelStreamMode.STREAM_MODE_CHANNEL;

				if (type === ChannelType.CHANNEL_TYPE_DM) {
					mode = ChannelStreamMode.STREAM_MODE_DM;
				} else if (type === ChannelType.CHANNEL_TYPE_GROUP) {
					mode = ChannelStreamMode.STREAM_MODE_GROUP;
				}
				await socket.joinChat(clanId, channelId, type, true);
				await socket.writeChatMessage(clanId, channelId, mode, true, content);
			}
		} catch (err) {
			console.error(err);
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		}
	};

	const onSelectChange = useCallback((value: boolean, item: IForwardIObject) => {
		if (!item || !item?.channelId) return;
		if (value) {
			selectedShareObjectsRef.current = [...selectedShareObjectsRef.current, item];
		} else {
			selectedShareObjectsRef.current = selectedShareObjectsRef.current.filter((ob) => ob.channelId !== item.channelId);
		}
		setMemberCount(selectedShareObjectsRef.current?.length ? ` (${selectedShareObjectsRef.current?.length})` : '');
	}, []);

	const renderForwardObject = ({ item }) => {
		return (
			<ForwardMessageItem key={`item_share_${item?.channelId}`} item={item} isItemChecked={isChecked(item)} onSelectChange={onSelectChange} />
		);
	};

	const handleCoppyLink = async () => {
		if (shareLink) {
			Clipboard.setString(shareLink);
			Toast.show({
				type: 'success',
				props: {
					text2: t('share.copied'),
					leadingIcon: <MezonIconCDN icon={IconCDN.linkIcon} color={baseColor.link} />
				}
			});
		}
	};

	return (
		<View style={styles.main}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>{t('share.title')}</Text>
				</View>
				<View style={styles.row}>
					<TextInput style={styles.textInput} value={shareLink} />
					<TouchableOpacity style={styles.copyButton} onPress={handleCoppyLink}>
						<MezonIconCDN icon={IconCDN.copyIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
					</TouchableOpacity>
				</View>

				<MezonInput
					placeHolder={t('share.search')}
					onTextChange={setSearchText}
					value={searchText}
					prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={20} width={20} />}
					inputWrapperStyle={{ backgroundColor: themeValue.primary, paddingHorizontal: size.s_6 }}
					inputStyle={styles.searchText}
				/>
				<FlashList
					keyboardShouldPersistTaps="handled"
					data={filteredForwardObjects}
					// ItemSeparatorComponent={() => <SeparatorWithLine style={{ backgroundColor: themeValue.border }} />}
					keyExtractor={(item) => item?.channelId?.toString()}
					renderItem={renderForwardObject}
					estimatedItemSize={size.s_60}
				/>
				<TouchableOpacity style={styles.sendButton} onPress={handleSendMessageShare}>
					<Text style={styles.buttonText}>{t('share.share') + memberCount}</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={handleClose} />
		</View>
	);
});
