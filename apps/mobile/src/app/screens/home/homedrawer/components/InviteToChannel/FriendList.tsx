import { useDMInvite, useDirect, useInvite, useSendInviteMessage } from '@mezon/core';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import { DirectEntity, fetchSystemMessageByClanId, selectClanSystemMessage, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
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
import { FriendListItem } from '../../Reusables';
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
		const { listDMInvite, listUserInvite } = useDMInvite(channelId ?? '');
		const { createDirectMessageWithUser } = useDirect();
		const { sendInviteMessage } = useSendInviteMessage();
		const [sentIdList, setSentIdList] = useState<string[]>([]);
		const welcomeChannel = useSelector(selectClanSystemMessage);
		const dispatch = useAppDispatch();
		const currentInviteLinkRef = useRef('');

		const userInviteList = useMemo(() => {
			if (listDMInvite?.length) {
				return listDMInvite?.filter((dm) => normalizeString(dm?.channel_label).includes(normalizeString(searchUserText)));
			}
			return listUserInvite?.filter((UserInvite) => normalizeString(UserInvite?.user?.display_name).includes(normalizeString(searchUserText)));
		}, [searchUserText, listDMInvite, listUserInvite]);

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

		const directMessageWithUser = async (userId: string) => {
			const response = await createDirectMessageWithUser(userId);
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

		const handleSendInVite = async (directParamId?: string, type?: number, userId?: string, dmGroup?: DirectEntity) => {
			if (userId) {
				directMessageWithUser(userId);
				setSentIdList([...sentIdList, userId]);
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
								placeHolder={'Invite friend to channel'}
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
