import { useDMInvite, useDirect, useInvite, useSendInviteMessage } from '@mezon/core';
import { Icons, LinkIcon } from '@mezon/mobile-components';
import { Colors, useTheme } from '@mezon/mobile-ui';
import { DirectEntity, selectCurrentChannelId, selectCurrentClanId } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import Clipboard from '@react-native-clipboard/clipboard';
import { FlashList } from '@shopify/flash-list';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonInput from '../../../../../componentUI/MezonInput';
import { SeparatorWithLine } from '../../../../../components/Common';
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
		const currentChannelId = useSelector(selectCurrentChannelId);
		const [currentInviteLink, setCurrentInviteLink] = useState('');
		const [searchUserText, setSearchUserText] = useState('');
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const currentClanId = useSelector(selectCurrentClanId);
		const { createLinkInviteUser } = useInvite();
		const { t } = useTranslation(['inviteToChannel']);
		const { listDMInvite, listUserInvite } = useDMInvite(currentChannelId);
		const { createDirectMessageWithUser } = useDirect();
		const { sendInviteMessage } = useSendInviteMessage();
		const [sentIdList, setSentIdList] = useState<string[]>([]);
		const mezon = useMezon();

		const userInviteList = useMemo(() => {
			if (listDMInvite?.length) {
				return listDMInvite?.filter((dm) => normalizeString(dm?.channel_label).includes(normalizeString(searchUserText)));
			}
			return listUserInvite?.filter((UserInvite) => normalizeString(UserInvite?.user?.display_name).includes(normalizeString(searchUserText)));
		}, [searchUserText, listDMInvite, listUserInvite]);

		const addInviteLinkToClipboard = useCallback(() => {
			Clipboard.setString(currentInviteLink);
			Toast.show({
				type: 'success',
				props: {
					text2: t('copyLink'),
					leadingIcon: <LinkIcon color={Colors.textLink} />
				}
			});
		}, [currentInviteLink, t]);

		const sendToDM = async (dataSend: { text: string }, channelSelected: DirectEntity) => {
			await mezon.socketRef.current.writeChatMessage(
				'0',
				channelSelected.id,
				Number(channelSelected?.user_id?.length) === 1 ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP,
				false,
				{
					t: dataSend.text,
					lk: [
						{
							e: dataSend.text.length,
							lk: dataSend.text,
							s: 0
						}
					]
				},
				[],
				[],
				[]
			);
		};

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
				sendInviteMessage(currentInviteLink, response.channel_id, channelMode);
			}
		};

		const handleSendInVite = async (directParamId?: string, type?: number, userId?: string, dmGroup?: DirectEntity) => {
			if (userId) {
				directMessageWithUser(userId);
				setSentIdList([...sentIdList, userId]);
				return;
			}

			if (directParamId && dmGroup) {
				sendToDM({ text: currentInviteLink }, dmGroup);
				setSentIdList([...sentIdList, dmGroup?.id]);
				return;
			}
		};

		const fetchInviteLink = async () => {
			const response = await createLinkInviteUser(currentClanId ?? '', currentChannelId ?? '', 10);
			if (!response) {
				return;
			}
			setCurrentInviteLink(process.env.NX_CHAT_APP_REDIRECT_URI + '/invite/' + response.invite_link);
		};

		useEffect(() => {
			if (currentClanId && currentChannelId && currentClanId !== '0') {
				fetchInviteLink();
			}
		}, [currentClanId, currentChannelId]);

		const showUpdating = () => {
			Toast.show({
				type: 'info',
				text1: 'Coming soon'
			});
		};

		const inviteToChannelIconList = useMemo(() => {
			const iconList: IInviteToChannelIconProp[] = [
				{
					title: t('iconTitle.shareInvite'),
					icon: <Icons.ShareIcon color={themeValue.text} />,
					onPress: () => showUpdating()
				},
				{
					title: t('iconTitle.copyLink'),
					icon: <Icons.LinkIcon color={themeValue.text} />,
					onPress: () => addInviteLinkToClipboard()
				},
				{
					title: t('iconTitle.youtube'),
					icon: <Icons.BrandYoutubeIcon color={themeValue.text} />,
					onPress: () => showUpdating()
				},
				{
					title: t('iconTitle.facebook'),
					icon: <Icons.BrandFacebookIcon color={themeValue.text} />,
					onPress: () => showUpdating()
				},
				{
					title: t('iconTitle.twitter'),
					icon: <Icons.BrandTwitterIcon color={themeValue.text} />,
					onPress: () => showUpdating()
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
								prefixIcon={<Icons.MagnifyingIcon color={themeValue.text} height={20} width={20} />}
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
							style={styles.inviteList}
							renderItem={({ item }) => {
								return (
									<FriendListItem
										key={item?.id}
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
