import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useDirect, useSendInviteMessage } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	FriendsEntity,
	appActions,
	getStoreAsync,
	giveCoffeeActions,
	selectAllAccount,
	selectAllDirectMessages,
	selectAllFriends,
	selectAllUserClans,
	selectUpdateToken
} from '@mezon/store-mobile';
import { TypeMessage, formatMoney } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { captureRef } from 'react-native-view-shot';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonInput from '../../../componentUI/MezonInput';
import Backdrop from '../../../components/BottomSheetRootListener/backdrop';
import { APP_SCREEN, SettingScreenProps } from '../../../navigation/ScreenTypes';
import { Sharing } from '../../settings/Sharing';
import { style } from './styles';

type Receiver = {
	id?: string;
	username?: Array<string>;
	avatar_url?: string;
};

type ScreenSendToken = typeof APP_SCREEN.SETTINGS.SEND_TOKEN;
export const SendTokenScreen = ({ navigation, route }: SettingScreenProps<ScreenSendToken>) => {
	const { t } = useTranslation(['token']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [tokenCount, setTokenCount] = useState('0');
	const [note, setNote] = useState(t('sendToken'));
	const userProfile = useSelector(selectAllAccount);
	const usersClan = useSelector(selectAllUserClans);
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const friends = useSelector(selectAllFriends);
	const BottomSheetRef = useRef<BottomSheetModal>(null);
	const listDM = dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_DM);
	const [selectedUser, setSelectedUser] = useState<Receiver>(null);
	const [searchText, setSearchText] = useState<string>('');
	const [plainTokenCount, setPlainTokenCount] = useState(0);
	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();
	const [successTime, setSuccessTime] = useState('');
	const [fileShared, setFileShared] = useState<any>();
	const viewToSnapshotRef = useRef();
	const friendList: FriendsEntity[] = useMemo(() => {
		return friends?.filter((user) => user.state === 0) || [];
	}, [friends]);

	const tokenInWallet = useMemo(() => {
		return userProfile?.wallet ? safeJSONParse(userProfile?.wallet || '{}')?.value : 0;
	}, [userProfile?.wallet]);
	const getTokenSocket = useSelector(selectUpdateToken(userProfile?.user?.id ?? ''));

	const mergeUser = useMemo(() => {
		const userMap = new Map<string, Receiver>();

		usersClan
			?.filter((item) => item?.user?.id !== userProfile?.user?.id)
			?.forEach((itemUserClan) => {
				const userId = itemUserClan?.id ?? '';
				if (userId && !userMap.has(userId)) {
					userMap.set(userId, {
						id: userId,
						username: [
							typeof itemUserClan?.user?.username === 'string'
								? itemUserClan?.user?.username
								: (itemUserClan?.user?.username?.[0] ?? '')
						] as Array<string>,
						avatar_url: itemUserClan?.user?.avatar_url ?? ''
					});
				}
			});

		listDM.forEach((itemDM: DirectEntity) => {
			const userId = itemDM?.user_id?.[0] ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: [typeof itemDM?.usernames === 'string' ? itemDM?.usernames : (itemDM?.usernames?.[0] ?? '')] as Array<string>,
					avatar_url: itemDM?.channel_avatar?.[0] ?? ''
				});
			}
		});

		friendList.forEach((itemFriend: FriendsEntity) => {
			const userId = itemFriend?.user?.id ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: [
						typeof itemFriend?.user?.display_name === 'string'
							? itemFriend?.user?.display_name
							: (itemFriend?.user?.display_name?.[0] ?? '')
					] as Array<string>,
					avatar_url: itemFriend?.user?.avatar_url ?? ''
				});
			}
		});

		return Array.from(userMap.values());
	}, [friendList, listDM, userProfile?.user?.id, usersClan]);

	const directMessageId = useMemo(() => {
		const directMessage = listDM?.find?.((dm) => dm?.user_id?.length === 1 && dm?.user_id[0] === selectedUser?.id);
		return directMessage?.id;
	}, [listDM, selectedUser?.id]);

	const sendToken = async () => {
		const store = await getStoreAsync();
		try {
			if (!selectedUser) {
				Toast.show({
					type: 'error',
					text1: t('toast.error.mustSelectUser')
				});
				return;
			}
			if (Number(plainTokenCount || 0) <= 0) {
				Toast.show({
					type: 'error',
					text1: t('toast.error.amountMustThanZero')
				});
				return;
			}

			if (Number(plainTokenCount || 0) > Number(tokenInWallet)) {
				Toast.show({
					type: 'error',
					text1: t('toast.error.exceedWallet')
				});
				return;
			}
			store.dispatch(appActions.setLoadingMainMobile(true));

			const tokenEvent: ApiTokenSentEvent = {
				sender_id: userProfile?.user?.id || '',
				sender_name: userProfile?.user?.username?.[0] || userProfile?.user?.username || '',
				receiver_id: selectedUser?.id || '',
				amount: Number(plainTokenCount || 1),
				note: note || '',
				extra_attribute: ''
			};

			const res = store.dispatch(giveCoffeeActions.sendToken(tokenEvent));
			store.dispatch(appActions.setLoadingMainMobile(false));
			if (directMessageId) {
				sendInviteMessage(
					`${t('tokensSent')} ${formatMoney(Number(plainTokenCount || 1))}₫ | ${note || ''}`,
					directMessageId,
					ChannelStreamMode.STREAM_MODE_DM,
					TypeMessage.SendToken
				);
			} else {
				const response = await createDirectMessageWithUser(selectedUser?.id);
				if (response?.channel_id) {
					sendInviteMessage(
						`${t('tokensSent')} ${formatMoney(Number(plainTokenCount || 1))}₫ | ${note || ''}`,
						response?.channel_id,
						ChannelStreamMode.STREAM_MODE_DM,
						TypeMessage.SendToken
					);
				}
			}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			if (res?.action?.action?.requestStatus === 'rejected' || !res) {
				Toast.show({
					type: 'error',
					text1: t('toast.error.anErrorOccurred')
				});
			} else {
				const now = new Date();
				const formattedTime = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
					.toString()
					.padStart(2, '0')}/${now.getFullYear()} ${now
					.getHours()
					.toString()
					.padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
				setSuccessTime(formattedTime);
				setShowConfirmModal(true);
			}
		} catch (err) {
			store.dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const handleConfirmSuccessful = () => {
		setShowConfirmModal(false);
		navigation.pop(2);
	};

	const handleOpenBottomSheet = () => {
		BottomSheetRef?.current?.present();
	};

	const snapPoints = useMemo(() => {
		return ['90%'];
	}, []);

	const handleSelectUser = (item: Receiver) => {
		setSelectedUser(item);
		BottomSheetRef?.current?.dismiss();
	};

	const filteredUsers = useMemo(() => {
		return mergeUser.filter((user) =>
			(typeof user?.username === 'string' ? user?.username : user?.username?.[0] || '')?.toLowerCase().includes(searchText.toLowerCase())
		);
	}, [mergeUser, searchText]);

	const renderItem = ({ item }) => {
		return (
			<Pressable key={`token_receiver_${item.id}`} style={styles.userItem} onPress={() => handleSelectUser(item)}>
				<MezonAvatar avatarUrl={item?.avatar_url} username={item?.username} height={size.s_34} width={size.s_34} />
				<Text style={styles.title}>{item.username}</Text>
			</Pressable>
		);
	};

	const handleSearchText = debounce((text) => {
		setSearchText(text);
	}, 500);

	const handleInputChange = (text: string) => {
		let sanitizedText = text.replace(/[^0-9]/g, '');

		if (sanitizedText === '') {
			setTokenCount('0');
			setPlainTokenCount(0);
			return;
		}

		sanitizedText = sanitizedText.replace(/^0+/, '');
		const numericValue = parseInt(sanitizedText, 10) || 0;

		setPlainTokenCount(numericValue);
		setTokenCount(numericValue.toLocaleString());
	};

	const handleShare = async () => {
		const dataUri = await captureRef(viewToSnapshotRef, { result: 'tmpfile' });
		if (!dataUri) {
			console.error('Failed to capture screenshot');
			return;
		}
		const shareData = {
			subject: null,
			mimeType: 'image/jpeg',
			fileName: `share` + Date.now(),
			text: null,
			weblink: null,
			contentUri: dataUri,
			filePath: dataUri
		};
		setFileShared([shareData]);
	};

	const handleSendNewToken = () => {
		setPlainTokenCount(0);
		setSelectedUser(null);
		setSearchText('');
		setTokenCount('0');
		setShowConfirmModal(false);
	};

	const onCloseFileShare = useCallback(() => {
		setFileShared(undefined);
		navigation.goBack();
	}, [navigation]);

	return (
		<View style={styles.container}>
			<ScrollView style={styles.form}>
				<Text style={styles.heading}>{t('sendToken')}</Text>
				<View>
					<Text style={styles.title}>{t('sendTokenTo')}</Text>
					<TouchableOpacity style={[styles.textField, { height: size.s_50 }]} onPress={handleOpenBottomSheet}>
						<Text style={styles.username}>{selectedUser?.username}</Text>
					</TouchableOpacity>
				</View>
				<View>
					<Text style={styles.title}>{t('token')}</Text>
					<View style={styles.textField}>
						<TextInput
							style={styles.textInput}
							value={tokenCount}
							keyboardType="numeric"
							placeholderTextColor="#535353"
							onChangeText={handleInputChange}
						/>
					</View>
				</View>
				<View>
					<Text style={styles.title}>{t('note')}</Text>
					<View style={styles.textField}>
						<TextInput
							style={[styles.textInput, { height: size.s_100, paddingVertical: size.s_10, paddingTop: size.s_10 }]}
							placeholderTextColor="#535353"
							autoCapitalize="none"
							value={note}
							numberOfLines={5}
							multiline={true}
							textAlignVertical="top"
							onChangeText={(text) => setNote(text)}
						/>
					</View>
				</View>
			</ScrollView>
			<Pressable style={styles.button} onPress={sendToken}>
				<Text style={styles.buttonTitle}>{t('sendToken')}</Text>
			</Pressable>
			<Modal
				isVisible={showConfirmModal}
				animationIn="fadeIn"
				animationOut="fadeOut"
				hasBackdrop={true}
				coverScreen={true}
				backdropColor="rgba(0,0,0, 0.9)"
				deviceHeight={Dimensions.get('screen').height}
				style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
			>
				{fileShared ? (
					<Sharing data={fileShared} onClose={onCloseFileShare} />
				) : (
					<View ref={viewToSnapshotRef} style={styles.fullscreenModal}>
						<View style={styles.modalHeader}>
							<View>
								<Icons.TickIcon width={100} height={100} />
							</View>
							<Text style={styles.successText}>{t('toast.success.sendSuccess')}</Text>
							<Text style={styles.amountText}>
								{tokenCount} {plainTokenCount === 1 ? `token` : `tokens`}
							</Text>
						</View>

						<View style={styles.modalBody}>
							<View style={styles.infoRow}>
								<Text style={styles.label}>{t('receiver')}</Text>
								<Text style={[styles.value, { fontSize: size.s_20 }]}>{selectedUser?.username || 'Unknown'}</Text>
							</View>

							<View style={styles.infoRow}>
								<Text style={styles.label}>{t('note')}</Text>
								<Text style={styles.value}>{note || ''}</Text>
							</View>

							<View style={styles.infoRow}>
								<Text style={styles.label}>{t('date')}</Text>
								<Text style={styles.value}>{successTime}</Text>
							</View>
						</View>
						<View style={styles.action}>
							<View style={styles.actionMore}>
								<TouchableOpacity activeOpacity={1} style={styles.buttonActionMore} onPress={handleShare}>
									<Icons.ShareIcon width={24} height={24} />
									<Text style={styles.textActionMore}>{t('share')}</Text>
								</TouchableOpacity>
								<TouchableOpacity style={styles.buttonActionMore} onPress={handleSendNewToken}>
									<Icons.ArrowLeftRightIcon />
									<Text style={styles.textActionMore}>{t('sendNewToken')}</Text>
								</TouchableOpacity>
							</View>

							<TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSuccessful}>
								<Text style={styles.confirmText}>{t('complete')}</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}
			</Modal>
			<BottomSheetModal
				ref={BottomSheetRef}
				snapPoints={snapPoints}
				backdropComponent={Backdrop}
				backgroundStyle={{ backgroundColor: themeValue.primary }}
			>
				<View style={{ paddingHorizontal: size.s_20, paddingVertical: size.s_10, flex: 1, gap: size.s_10 }}>
					<MezonInput
						inputWrapperStyle={styles.searchText}
						placeHolder={t('selectUser')}
						onTextChange={handleSearchText}
						prefixIcon={<Icons.MagnifyingIcon color={themeValue.text} height={20} width={20} />}
					/>
					<View style={{ flex: 1, backgroundColor: themeValue.secondary, borderRadius: size.s_8 }}>
						<BottomSheetFlatList data={filteredUsers} renderItem={renderItem} />
					</View>
				</View>
			</BottomSheetModal>
		</View>
	);
};
