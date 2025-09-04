import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useDirect, useInvite, useSendInviteMessage } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	FriendsEntity,
	clansActions,
	fetchSystemMessageByClanId,
	getStore,
	selectAllFriends,
	selectAllUserClans,
	selectCurrentClanId,
	selectDirectsOpenlist,
	useAppDispatch
} from '@mezon/store-mobile';
import Clipboard from '@react-native-clipboard/clipboard';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiSystemMessage } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, Text, View } from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../componentUI/MezonInput';
import { SeparatorWithLine } from '../../../../../components/Common';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { normalizeString } from '../../../../../utils/helpers';
import { FriendListItem, Receiver } from '../../Reusables';
import { QRModal } from './QRModal';
import { style } from './styles';

interface IInviteToChannelProp {
	isUnknownChannel: boolean;
	isKeyboardVisible?: boolean;
	channelId?: string;
}

interface IInviteToChannelIconProp {
	icon: React.JSX.Element;
	title: string;
	onPress?: () => void;
}

export const FriendList = React.memo(({ isUnknownChannel, isKeyboardVisible, channelId }: IInviteToChannelProp) => {
	const [searchUserText, setSearchUserText] = useState('');
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentClanId = useSelector(selectCurrentClanId);
	const { createLinkInviteUser } = useInvite();
	const { t } = useTranslation(['inviteToChannel']);
	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();
	const [sentIdList, setSentIdList] = useState<string[]>([]);
	const dispatch = useAppDispatch();
	const currentInviteLinkRef = useRef('');
	const [currentInviteLink, setCurrentInviteLink] = useState<string>('');
	const store = getStore();

	const friendList: FriendsEntity[] = useMemo(() => {
		const friends = selectAllFriends(store.getState() as any);
		return friends?.filter((user) => user.state === 0) || [];
	}, [store]);

	const userListInvite = useMemo(() => {
		const dmGroupChatList = selectDirectsOpenlist(store.getState() as any);
		const usersClan = selectAllUserClans(store.getState() as any);
		const userMap = new Map<string, Receiver>();
		const userIdInClanArray = usersClan.map((user) => user.id);
		friendList.forEach((itemFriend: FriendsEntity) => {
			const userId = itemFriend?.user?.id ?? '';
			if (userId && !userMap.has(userId) && !userIdInClanArray.includes(userId)) {
				userMap.set(userId, {
					id: userId,
					user: itemFriend?.user,
					channel_label: itemFriend?.user?.display_name || itemFriend?.user?.username
				});
			}
		});

		dmGroupChatList.forEach((itemDM: DirectEntity) => {
			const userId = itemDM?.user_id?.[0] ?? '';
			if (
				(userId && !userIdInClanArray.includes(userId) && itemDM?.type === ChannelType.CHANNEL_TYPE_DM) ||
				itemDM?.type === ChannelType.CHANNEL_TYPE_GROUP
			) {
				userMap.set(itemDM?.type === ChannelType.CHANNEL_TYPE_DM ? userId : itemDM?.channel_id, {
					channel_id: itemDM?.channel_id,
					channel_label: itemDM?.channel_label ?? itemDM?.usernames?.[0] ?? `${itemDM?.creator_name}'s Group`,
					channel_avatar: itemDM?.channel_avatar,
					type: itemDM?.type,
					id: itemDM?.channel_id,
					topic: itemDM?.topic
				});
			}
		});

		return [...(userMap?.values() ?? [])];
	}, [friendList, store]);

	const userInviteList = useMemo(() => {
		return userListInvite?.filter((dm) => normalizeString(dm?.channel_label).includes(normalizeString(searchUserText)));
	}, [searchUserText, userListInvite]);

	const addInviteLinkToClipboard = useCallback(() => {
		Clipboard.setString(currentInviteLink || currentInviteLinkRef?.current);
		Toast.show({
			type: 'success',
			props: {
				text2: t('copyLink'),
				leadingIcon: <MezonIconCDN icon={IconCDN.linkIcon} color={baseColor.link} />
			}
		});
	}, [currentInviteLink, t]);

	const handleShowQRModal = useCallback(() => {
		const data = {
			children: <QRModal inviteLink={currentInviteLink} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [currentInviteLink]);

	const directMessageWithUser = async (user: Receiver) => {
		const response = await createDirectMessageWithUser(user?.user?.id, user?.user?.display_name, user?.user?.username, user?.user?.avatar_url);
		if (response?.channel_id) {
			let channelMode = 0;
			if (Number(response.type) === ChannelType.CHANNEL_TYPE_DM) {
				channelMode = ChannelStreamMode.STREAM_MODE_DM;
			}
			if (Number(response.type) === ChannelType.CHANNEL_TYPE_GROUP) {
				channelMode = ChannelStreamMode.STREAM_MODE_GROUP;
			}
			sendInviteMessage(currentInviteLinkRef?.current, response.channel_id, channelMode);
		}
	};

	const handleSendInVite = async (directParamId?: string, type?: number, dmGroup?: Receiver) => {
		if (dmGroup?.user) {
			directMessageWithUser(dmGroup);
			setSentIdList([...sentIdList, dmGroup?.user?.id]);
			return;
		}

		if (directParamId && dmGroup) {
			let channelMode = 0;
			if (type === ChannelType.CHANNEL_TYPE_DM) {
				channelMode = ChannelStreamMode.STREAM_MODE_DM;
			}
			if (type === ChannelType.CHANNEL_TYPE_GROUP) {
				channelMode = ChannelStreamMode.STREAM_MODE_GROUP;
			}
			sendInviteMessage(currentInviteLinkRef?.current, directParamId, channelMode);
			setSentIdList([...sentIdList, dmGroup?.id]);
			return;
		}
	};

	const fetchInviteLink = async (channelId) => {
		try {
			const resp = await dispatch(fetchSystemMessageByClanId({ clanId: currentClanId, noCache: true }));
			const welcomeChannel = resp?.payload as ApiSystemMessage;
			const response = await createLinkInviteUser(currentClanId ?? '', channelId ? channelId : welcomeChannel?.channel_id, 10);
			if (!response || !response?.invite_link) {
				return;
			}
			const linkInvite = process.env.NX_CHAT_APP_REDIRECT_URI + '/invite/' + response.invite_link;
			setCurrentInviteLink(linkInvite);
			currentInviteLinkRef.current = linkInvite;
			dispatch(clansActions.joinClan({ clanId: '0' }));
		} catch (e) {
			Toast.show({ type: 'error', text1: 'Fail to create invite link. Try again' });
		}
	};

	useEffect(() => {
		if (currentClanId && currentClanId !== '0') {
			fetchInviteLink(channelId);
		}
	}, [currentClanId, channelId]);

	const inviteToChannelIconList = useMemo(() => {
		const iconList: IInviteToChannelIconProp[] = [
			{
				title: t('iconTitle.shareInvite'),
				icon: !currentInviteLink ? (
					<Chase color={themeValue.text} size={size.s_24} />
				) : (
					<MezonIconCDN icon={IconCDN.shareIcon} color={themeValue.text} />
				),
				onPress: () => (!currentInviteLink ? null : addInviteLinkToClipboard())
			},
			{
				title: t('iconTitle.copyLink'),
				icon: !currentInviteLink ? (
					<Chase color={themeValue.text} size={size.s_24} />
				) : (
					<MezonIconCDN icon={IconCDN.linkIcon} color={themeValue.text} />
				),
				onPress: () => (!currentInviteLink ? null : addInviteLinkToClipboard())
			},
			{
				title: t('iconTitle.qrcode'),
				icon: !currentInviteLink ? (
					<Chase color={themeValue.text} size={size.s_24} />
				) : (
					<MezonIconCDN icon={IconCDN.myQRcodeIcon} color={themeValue.text} />
				),
				onPress: () => (!currentInviteLink ? null : handleShowQRModal())
			}
		];
		return iconList;
	}, [currentInviteLink, addInviteLinkToClipboard, handleShowQRModal, t, themeValue.text]);

	const getInviteToChannelIcon = ({ icon, title, onPress }: IInviteToChannelIconProp) => {
		return (
			<Pressable style={styles.inviteIconWrapper} onPress={() => onPress()}>
				<View style={styles.shareToInviteIconWrapper}>{icon}</View>
				<Text style={styles.inviteIconText}>{title}</Text>
			</Pressable>
		);
	};

	return (
		<View style={styles.bottomSheetWrapper}>
			{!isKeyboardVisible && (
				<View style={styles.inviteHeader}>
					<Text style={styles.inviteHeaderText}>{t('title')}</Text>
				</View>
			)}
			{isUnknownChannel ? (
				<Text style={styles.textUnknown}>{t('unknownChannel')}</Text>
			) : (
				<>
					{!isKeyboardVisible && (
						<View style={styles.iconAreaWrapper}>
							{inviteToChannelIconList.map((icon, index) => {
								return <View key={index}>{getInviteToChannelIcon(icon)}</View>;
							})}
						</View>
					)}

					<View style={styles.searchInviteFriendWrapper}>
						<MezonInput
							placeHolder={t('inviteFriendToChannel')}
							onTextChange={setSearchUserText}
							value={searchUserText}
							prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={20} width={20} />}
						/>
					</View>

					{!!currentInviteLink && (
						<BottomSheetFlatList
							nestedScrollEnabled
							keyboardShouldPersistTaps="handled"
							keyboardDismissMode="on-drag"
							showsVerticalScrollIndicator={false}
							data={userInviteList}
							extraData={sentIdList}
							initialNumToRender={5}
							keyExtractor={(item) => `${item?.id}_item_invite`}
							ItemSeparatorComponent={() => {
								return <SeparatorWithLine style={{ backgroundColor: themeValue.border }} />;
							}}
							style={styles.inviteList}
							renderItem={({ item, index }) => {
								return (
									<FriendListItem
										key={`friend_item_${item?.id}_${index}`}
										dmGroup={item}
										user={item}
										onPress={handleSendInVite}
										isSent={sentIdList.includes(item?.id)}
									/>
								);
							}}
						/>
					)}
				</>
			)}
		</View>
	);
});
