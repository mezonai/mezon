import { useDirect, useInvite, useSendInviteMessage } from '@mezon/core';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	FriendsEntity,
	fetchSystemMessageByClanId,
	getStore,
	selectAllFriends,
	selectAllUserClans,
	selectClanSystemMessage,
	selectCurrentClanId,
	selectDirectsOpenlist,
	useAppDispatch
} from '@mezon/store-mobile';
import Clipboard from '@react-native-clipboard/clipboard';
import { FlashList } from '@shopify/flash-list';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../componentUI/MezonInput';
import { SeparatorWithLine } from '../../../../../components/Common';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { normalizeString } from '../../../../../utils/helpers';
import { FriendListItem, Receiver } from '../../Reusables';
import { style } from './styles';

interface IInviteToChannelProp {
	isUnknownChannel: boolean;
	isDMThread?: boolean;
	isKeyboardVisible?: boolean;
	expiredTimeSelected?: string;
	openEditLinkModal?: () => void;
	channelId?: string;
}

interface IInviteToChannelIconProp {
	icon: React.JSX.Element;
	title: string;
	onPress?: () => void;
}

export const FriendList = React.memo(
	({ isUnknownChannel, expiredTimeSelected, isDMThread = false, isKeyboardVisible, openEditLinkModal, channelId }: IInviteToChannelProp) => {
		const [searchUserText, setSearchUserText] = useState('');
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const currentClanId = useSelector(selectCurrentClanId);
		const { createLinkInviteUser } = useInvite();
		const { t } = useTranslation(['inviteToChannel']);
		const { createDirectMessageWithUser } = useDirect();
		const { sendInviteMessage } = useSendInviteMessage();
		const [sentIdList, setSentIdList] = useState<string[]>([]);
		const welcomeChannel = useSelector(selectClanSystemMessage);
		const dispatch = useAppDispatch();
		const currentInviteLinkRef = useRef('');
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
						id: itemDM?.channel_id
					});
				}
			});

			return [...(userMap?.values() ?? [])];
		}, [friendList, store]);

		const userInviteList = useMemo(() => {
			return userListInvite?.filter((dm) => normalizeString(dm?.channel_label).includes(normalizeString(searchUserText)));
		}, [searchUserText, userListInvite]);

		const addInviteLinkToClipboard = useCallback(() => {
			Clipboard.setString(currentInviteLinkRef?.current);
			Toast.show({
				type: 'success',
				props: {
					text2: t('copyLink'),
					leadingIcon: <MezonIconCDN icon={IconCDN.linkIcon} color={Colors.textLink} />
				}
			});
		}, [currentInviteLinkRef?.current, t]);

		const directMessageWithUser = async (user: Receiver) => {
			const response = await createDirectMessageWithUser(
				user?.user?.id,
				user?.user?.display_name || user?.user?.username,
				user?.user?.avatar_url
			);
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

		const fetchInviteLink = async () => {
			const response = await createLinkInviteUser(currentClanId ?? '', channelId ? channelId : welcomeChannel?.channel_id, 10);
			if (!response || !response?.invite_link) {
				return;
			}
			currentInviteLinkRef.current = process.env.NX_CHAT_APP_REDIRECT_URI + '/invite/' + response.invite_link;
		};

		const fetchSystemMessage = async () => {
			if (!currentClanId) return;
			await dispatch(fetchSystemMessageByClanId(currentClanId));
		};

		useEffect(() => {
			fetchSystemMessage();
		}, [currentClanId]);

		useEffect(() => {
			if (currentClanId && currentClanId !== '0') {
				fetchInviteLink();
			}
		}, [currentClanId, channelId, welcomeChannel?.channel_id]);

		const inviteToChannelIconList = useMemo(() => {
			const iconList: IInviteToChannelIconProp[] = [
				{
					title: t('iconTitle.shareInvite'),
					icon: <MezonIconCDN icon={IconCDN.shareIcon} color={themeValue.text} />,
					onPress: () => addInviteLinkToClipboard()
				},
				{
					title: t('iconTitle.copyLink'),
					icon: <MezonIconCDN icon={IconCDN.linkIcon} color={themeValue.text} />,
					onPress: () => addInviteLinkToClipboard()
				},
				{
					title: t('iconTitle.youtube'),
					icon: <MezonIconCDN icon={IconCDN.brandYoutubeIcon} color={themeValue.text} />,
					onPress: () => addInviteLinkToClipboard()
				},
				{
					title: t('iconTitle.facebook'),
					icon: <MezonIconCDN icon={IconCDN.brandFacebookIcon} color={themeValue.text} />,
					onPress: () => addInviteLinkToClipboard()
				},
				{
					title: t('iconTitle.twitter'),
					icon: <MezonIconCDN icon={IconCDN.brandTwitterIcon} color={themeValue.text} />,
					onPress: () => addInviteLinkToClipboard()
				}
			];
			return iconList;
		}, [t, addInviteLinkToClipboard, themeValue]);

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

							<View style={styles.editInviteLinkWrapper}>
								<Text style={styles.defaultText}>
									{t('yourLinkInvite')} {expiredTimeSelected}{' '}
								</Text>
								<Pressable onPress={openEditLinkModal}>
									<Text style={styles.linkText}>{t('editInviteLink')}</Text>
								</Pressable>
							</View>
						</View>

						<FlashList
							data={userInviteList}
							keyExtractor={(item) => `${item?.id}_item_invite`}
							ItemSeparatorComponent={() => {
								return <SeparatorWithLine style={{ backgroundColor: themeValue.border }} />;
							}}
							estimatedItemSize={size.s_60}
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
					</>
				)}
			</View>
		);
	}
);
