import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useDirect, useSendInviteMessage } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	FriendsEntity,
	appActions,
	getStore,
	getStoreAsync,
	giveCoffeeActions,
	selectAllAccount,
	selectAllFriends,
	selectAllUserClans,
	selectDirectsOpenlist,
	useAppDispatch
} from '@mezon/store-mobile';
import { TypeMessage, formatMoney, formatNumber } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Keyboard, Modal, Platform, Pressable, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import Backdrop from '../../../components/BottomSheetRootListener/backdrop';
import { IconCDN } from '../../../constants/icon_cdn';
import { useImage } from '../../../hooks/useImage';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { Sharing } from '../../settings/Sharing';
import { style } from './styles';

type Receiver = {
	id?: string;
	username?: Array<string>;
	avatar_url?: string;
};
const formatTokenAmount = (amount: any) => {
	let sanitizedText = String(amount).replace(/[^0-9]/g, '');
	if (sanitizedText === '') return '0';
	sanitizedText = sanitizedText.replace(/^0+/, '');
	const numericValue = parseInt(sanitizedText, 10) || 0;
	return numericValue.toLocaleString();
};
export const SendTokenScreen = ({ navigation, route }: any) => {
	const { t } = useTranslation(['token']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const store = getStore();
	const formValue = route?.params?.formValue;
	const jsonObject: ApiTokenSentEvent = safeJSONParse(formValue || '{}');
	const formattedAmount = formatTokenAmount(jsonObject?.amount || '0');
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [tokenCount, setTokenCount] = useState(formattedAmount || '0');
	const [note, setNote] = useState(jsonObject?.note || t('sendToken'));
	const [plainTokenCount, setPlainTokenCount] = useState(jsonObject?.amount || 0);
	const userProfile = useSelector(selectAllAccount);
	const BottomSheetRef = useRef<BottomSheetModal>(null);
	const [selectedUser, setSelectedUser] = useState<Receiver | null>(null);
	const [searchText, setSearchText] = useState<string>('');
	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();
	const [successTime, setSuccessTime] = useState('');
	const [fileShared, setFileShared] = useState<any>();
	const [isShowModalShare, setIsShowModalShare] = useState<boolean>(false);
	const { saveImageToCameraRoll } = useImage();
	const dispatch = useAppDispatch();
	const listDM = useMemo(() => {
		const dmGroupChatList = selectDirectsOpenlist(store.getState() as any);
		return dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_DM);
	}, []);

	const viewToSnapshotRef = useRef<ViewShot>(null);
	const [disableButton, setDisableButton] = useState<boolean>(false);
	const friendList: FriendsEntity[] = useMemo(() => {
		const friends = selectAllFriends(store.getState());
		return friends?.filter((user) => user.state === 0) || [];
	}, []);
	const canEdit = jsonObject?.canEdit;

	const tokenInWallet = useMemo(() => {
		return userProfile?.wallet || 0;
	}, [userProfile?.wallet]);

	const mergeUser = useMemo(() => {
		const userMap = new Map<string, Receiver>();
		const usersClan = selectAllUserClans(store.getState());

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
	}, [friendList, listDM, userProfile?.user?.id]);

	const directMessageId = useMemo(() => {
		const directMessage = listDM?.find?.((dm) => {
			const userIds = dm?.user_id;
			if (!Array.isArray(userIds) || userIds.length !== 1) {
				return false;
			}
			const firstUserId = userIds[0];
			const targetId = jsonObject?.receiver_id || selectedUser?.id;
			return firstUserId === targetId;
		});
		return directMessage?.id;
	}, [jsonObject?.receiver_id, listDM, selectedUser?.id]);

	const sendToken = async () => {
		const store = await getStoreAsync();
		try {
			if (!selectedUser && !jsonObject?.receiver_id) {
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
			setDisableButton(true);

			const tokenEvent: ApiTokenSentEvent = {
				sender_id: userProfile?.user?.id || '',
				sender_name: userProfile?.user?.username?.[0] || userProfile?.user?.username || '',
				receiver_id: jsonObject?.receiver_id || selectedUser?.id || '',
				extra_attribute: jsonObject?.extra_attribute || '',
				amount: Number(plainTokenCount || 1),
				note: note?.replace?.(/\s+/g, ' ')?.trim() || ''
			};

			const res = await store.dispatch(giveCoffeeActions.sendToken(tokenEvent));
			store.dispatch(appActions.setLoadingMainMobile(false));
			if (res?.meta?.requestStatus === 'rejected' || !res) {
				Toast.show({
					type: 'error',
					text1: t('toast.error.anErrorOccurred')
				});
				setDisableButton(false);
			} else {
				if (directMessageId) {
					sendInviteMessage(
						`${t('tokensSent')} ${formatMoney(Number(plainTokenCount || 1))}₫ | ${note?.replace?.(/\s+/g, ' ')?.trim() || ''}`,
						directMessageId,
						ChannelStreamMode.STREAM_MODE_DM,
						TypeMessage.SendToken
					);
				} else {
					const receiver = (mergeUser?.find((user) => user?.id === jsonObject?.receiver_id) || selectedUser || jsonObject) as any;
					const response = await createDirectMessageWithUser(
						receiver?.id || receiver?.receiver_id,
						receiver?.username?.[0] || receiver?.receiver_name,
						receiver?.username?.[0] || receiver?.receiver_name,
						receiver?.avatar_url
					);
					if (response?.channel_id) {
						sendInviteMessage(
							`${t('tokensSent')} ${formatMoney(Number(plainTokenCount || 1))}₫ | ${note?.replace?.(/\s+/g, ' ')?.trim() || ''}`,
							response?.channel_id,
							ChannelStreamMode.STREAM_MODE_DM,
							TypeMessage.SendToken
						);
					}
				}
				const now = new Date();
				const formattedTime = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
					.toString()
					.padStart(2, '0')}/${now.getFullYear()} ${now
					.getHours()
					.toString()
					.padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
				setSuccessTime(formattedTime);
				setDisableButton(false);
				setShowConfirmModal(true);
			}
		} catch (err) {
			Toast.show({
				type: 'error',
				text1: t('toast.error.anErrorOccurred')
			});
			setDisableButton(false);
		} finally {
			store.dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const handleConfirmSuccessful = () => {
		setShowConfirmModal(false);
		navigation.replace(APP_SCREEN.BOTTOM_BAR);
	};

	const handleOpenBottomSheet = () => {
		Keyboard.dismiss();
		setSearchText('');
		BottomSheetRef?.current?.present();
	};

	const snapPoints = useMemo(() => {
		return ['70%', '90%'];
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

	const renderItem = ({ item }: { item: Receiver }) => {
		return (
			<Pressable key={`token_receiver_${item.id}`} style={styles.userItem} onPress={() => handleSelectUser(item)}>
				<MezonAvatar avatarUrl={item?.avatar_url} username={item?.username?.[0]} height={size.s_34} width={size.s_34} />
				<Text style={styles.title}>{item.username}</Text>
			</Pressable>
		);
	};

	const handleSearchText = debounce((text) => {
		setSearchText(text);
	}, 300);

	const handleInputChange = (text: string) => {
		const sanitizedText = text.replace(/[^0-9]/g, '');

		if (sanitizedText === '') {
			setTokenCount('0');
			setPlainTokenCount(0);
			return;
		}
		const formatSanitizedText = sanitizedText.replace(/^0+/, '');
		const numericValue = parseInt(formatSanitizedText, 10) || 0;

		setPlainTokenCount(numericValue);
		if (numericValue !== 0) {
			setTokenCount(numericValue.toLocaleString());
		} else {
			setTokenCount(sanitizedText);
		}
	};

	const handleShare = async () => {
		try {
			if (fileShared) {
				setIsShowModalShare(true);
				return;
			}
			if (viewToSnapshotRef?.current) {
				const dataUri = await viewToSnapshotRef?.current?.capture?.();
				if (!dataUri) {
					Toast.show({
						type: 'error',
						text1: 'Failed to share transfer funds'
					});
					return;
				}
				const shareData = {
					subject: null,
					mimeType: 'image/png',
					fileName: `share` + Date.now() + '.png',
					text: null,
					weblink: null,
					contentUri: dataUri,
					filePath: dataUri
				};
				setFileShared([shareData]);
				setIsShowModalShare(true);
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: 'Failed to share transfer funds'
			});
		}
	};

	const handleSaveImage = async () => {
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const dataUri = await viewToSnapshotRef?.current?.capture?.();
			if (!dataUri) {
				Alert.alert('Failed to save image');
				return;
			}
			await saveImageToCameraRoll('file://' + dataUri, 'png');
			Alert.alert('Save image successfully');
		} catch (error) {
			Alert.alert('Failed to save image');
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const handleSendNewToken = () => {
		setPlainTokenCount(0);
		setSelectedUser(null);
		setSearchText('');
		setTokenCount('0');
		setShowConfirmModal(false);
	};

	const onCloseFileShare = useCallback(
		(isSent = false) => {
			if (isSent) {
				navigation.goBack();
			} else {
				setIsShowModalShare(false);
			}
		},
		[navigation]
	);

	if (showConfirmModal) {
		return (
			<Modal visible={true} supportedOrientations={['portrait', 'landscape']}>
				{fileShared && isShowModalShare ? (
					<Sharing data={fileShared} onClose={onCloseFileShare} />
				) : (
					<ViewShot
						ref={viewToSnapshotRef}
						options={{ fileName: 'send_money_success_mobile', format: 'png', quality: 1 }}
						style={{ flex: 1 }}
					>
						<View style={styles.fullscreenModal}>
							<View style={styles.modalHeader}>
								<View>
									<Icons.TickIcon width={100} height={100} />
								</View>
								<Text style={styles.successText}>{t('toast.success.sendSuccess')}</Text>
								<Text style={styles.amountText}>{tokenCount} ₫</Text>
							</View>

							<View style={styles.modalBody}>
								<View style={styles.infoRow}>
									<Text style={styles.label}>{t('receiver')}</Text>
									<Text style={[styles.value, { fontSize: size.s_20 }]}>
										{/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
										{/*@ts-expect-error*/}
										{selectedUser?.username || jsonObject?.receiver_name || 'KOMU'}
									</Text>
								</View>

								<View style={styles.infoRow}>
									<Text style={styles.label}>{t('note')}</Text>
									<Text style={styles.value}>{note?.replace?.(/\s+/g, ' ')?.trim() || ''}</Text>
								</View>

								<View style={styles.infoRow}>
									<Text style={styles.label}>{t('date')}</Text>
									<Text style={styles.value}>{successTime}</Text>
								</View>
							</View>
							<View style={styles.action}>
								<View style={styles.actionMore}>
									<TouchableOpacity activeOpacity={1} style={styles.buttonActionMore} onPress={handleShare}>
										<MezonIconCDN icon={IconCDN.shareIcon} width={size.s_24} height={size.s_24} color={themeValue.textStrong} />
										<Text style={styles.textActionMore}>{t('share')}</Text>
									</TouchableOpacity>
									<TouchableOpacity activeOpacity={1} style={styles.buttonActionMore} onPress={handleSaveImage}>
										<MezonIconCDN
											icon={IconCDN.downloadIcon}
											width={size.s_24}
											height={size.s_24}
											color={themeValue.textStrong}
										/>
										<Text style={styles.textActionMore}>{t('saveImage')}</Text>
									</TouchableOpacity>
									<TouchableOpacity style={styles.buttonActionMore} onPress={handleSendNewToken}>
										<Icons.ArrowLeftRightIcon color={themeValue.textStrong} />
										<Text style={styles.textActionMore}>{t('sendNewToken')}</Text>
									</TouchableOpacity>
								</View>

								<TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSuccessful}>
									<Text style={styles.confirmText}>{t('complete')}</Text>
								</TouchableOpacity>
							</View>
						</View>
					</ViewShot>
				)}
			</Modal>
		);
	}
	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior="padding"
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
		>
			<View style={{ flex: 1 }}>
				<KeyboardAwareScrollView bottomOffset={100} style={styles.form} keyboardShouldPersistTaps={'handled'}>
					<Text style={styles.heading}>{t('sendToken')}</Text>
					<LinearGradient
						start={{ x: 1, y: 1 }}
						end={{ x: 0, y: 1 }}
						colors={[themeValue.secondaryLight, themeValue.colorAvatarDefault]}
						style={styles.cardWallet}
					>
						<View style={styles.cardWalletWrapper}>
							<View style={styles.cardWalletLine}>
								<Text style={styles.cardTitle}>{t('debitAccount')}</Text>
								<Text style={styles.cardTitle}>{userProfile?.user?.username || userProfile?.user?.display_name}</Text>
							</View>
							<View style={styles.cardWalletLine}>
								<Text style={styles.cardTitle}>{t('balance')}</Text>
								<Text style={styles.cardAmount}>{tokenInWallet ? formatNumber(Number(tokenInWallet), 'vi-VN', 'VND') : '0'}</Text>
							</View>
						</View>
					</LinearGradient>
					<View>
						<Text style={styles.title}>{t('sendTokenTo')}</Text>
						<TouchableOpacity
							disabled={!!jsonObject?.receiver_id}
							style={[
								styles.textField,
								{
									height: size.s_40,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									paddingRight: size.s_10
								}
							]}
							onPress={handleOpenBottomSheet}
						>
							<Text style={styles.username}>
								{/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
								{/*@ts-expect-error*/}
								{jsonObject?.receiver_id ? jsonObject?.receiver_name || 'KOMU' : selectedUser?.username || t('selectAccount')}
							</Text>
							{!jsonObject?.receiver_id && (
								<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
							)}
						</TouchableOpacity>
					</View>
					<View>
						<Text style={styles.title}>{t('token')}</Text>
						<View style={styles.textField}>
							<TextInput
								autoFocus={!!jsonObject?.receiver_id}
								editable={!jsonObject?.amount || canEdit}
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
								editable={!jsonObject?.note || canEdit}
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
				</KeyboardAwareScrollView>
				<View style={styles.wrapperButton}>
					<Pressable style={styles.button} onPress={sendToken} disabled={disableButton}>
						<Text style={styles.buttonTitle}>{t('sendToken')}</Text>
					</Pressable>
				</View>
				<BottomSheetModal
					ref={BottomSheetRef}
					snapPoints={snapPoints}
					backdropComponent={Backdrop}
					style={{ paddingHorizontal: size.s_20, paddingVertical: size.s_10, flex: 1, gap: size.s_10 }}
					backgroundStyle={{ backgroundColor: themeValue.primary }}
				>
					<MezonInput
						inputWrapperStyle={styles.searchText}
						placeHolder={t('selectUser')}
						onTextChange={handleSearchText}
						prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={20} width={20} />}
					/>

					<BottomSheetFlatList
						keyExtractor={(item) => `user_receiver_${item?.id}`}
						keyboardShouldPersistTaps={'handled'}
						data={filteredUsers}
						style={{
							backgroundColor: themeValue.secondary,
							borderRadius: size.s_8,
							marginTop: size.s_10
						}}
						contentContainerStyle={{ paddingBottom: size.s_20, minHeight: '100%' }}
						renderItem={renderItem}
					/>
				</BottomSheetModal>
			</View>
		</KeyboardAvoidingView>
	);
};
