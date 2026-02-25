import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useDirect, useSendInviteMessage } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { DirectEntity, FriendsEntity } from '@mezon/store-mobile';
import {
	appActions,
	clansActions,
	getStore,
	getStoreAsync,
	giveCoffeeActions,
	selectAllAccount,
	selectAllFriends,
	selectAllUserClans,
	selectDirectsOpenlist,
	selectEphemeralKeyPair,
	selectZkProofs,
	useAppDispatch,
	useWallet
} from '@mezon/store-mobile';
import { CURRENCY, TypeMessage, formatBalanceToString, formatMoney } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import type { ApiTokenSentEvent } from 'mezon-js/api.gen';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Keyboard, Platform, Pressable, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import Backdrop from '../../../components/BottomSheetRootListener/backdrop';
import { IconCDN } from '../../../constants/icon_cdn';
import { removeDiacritics } from '../../../utils/helpers';
import { ConfirmReLoginModal } from './ConfirmReLoginModal';
import { ConfirmSuccessModal } from './ConfirmSuccessModal';
import { style } from './styles';

type Receiver = {
	id?: string;
	username?: Array<string>;
	avatar_url?: string;
};
export const formatTokenAmount = (amount: any) => {
	let sanitizedText = String(amount).replace(/[^0-9]/g, '');
	if (sanitizedText === '') return '0';
	sanitizedText = sanitizedText.replace(/^0+/, '');
	const numericValue = parseInt(sanitizedText, 10) || 0;
	return numericValue.toLocaleString();
};

const ITEM_HEIGHT = size.s_60;
const MAX_NOTE_LENGTH = 512;
export const SendTokenScreen = ({ route }: any) => {
	const { t } = useTranslation(['token', 'common']);
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const store = getStore();
	const formValue = route?.params?.formValue;
	const jsonObject: ApiTokenSentEvent | any = safeJSONParse(formValue || '{}');
	const formattedAmount = formatTokenAmount(jsonObject?.amount || '0');
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
	const dispatch = useAppDispatch();
	const listDM = useMemo(() => {
		const dmGroupChatList = selectDirectsOpenlist(store.getState() as any);
		return dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_DM);
	}, [store]);
	const [disableButton, setDisableButton] = useState<boolean>(false);
	const friendList: FriendsEntity[] = useMemo(() => {
		const friends = selectAllFriends(store.getState());
		return friends?.filter((user) => user.state === 0) || [];
	}, [store]);
	const canEdit = jsonObject?.canEdit;
	const { walletDetail } = useWallet();

	const tokenInWallet = useMemo(() => {
		return walletDetail?.balance || 0;
	}, [walletDetail?.balance]);

	const mergeUser = useMemo(() => {
		const userMap = new Map<string, Receiver>();
		const usersClan = selectAllUserClans(store.getState());

		usersClan?.forEach((itemUserClan) => {
			const userId = itemUserClan?.id ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: [
						typeof itemUserClan?.user?.username === 'string' ? itemUserClan?.user?.username : (itemUserClan?.user?.username?.[0] ?? '')
					] as Array<string>,
					avatar_url: itemUserClan?.user?.avatar_url ?? ''
				});
			}
		});

		listDM.forEach((itemDM: DirectEntity) => {
			const userId = itemDM?.user_ids?.[0] ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: [typeof itemDM?.usernames === 'string' ? itemDM?.usernames : (itemDM?.usernames?.[0] ?? '')] as Array<string>,
					avatar_url: itemDM?.avatars?.[0] ?? ''
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

		const arrUser = Array.from(userMap.values())?.filter((user) => user?.id !== userProfile?.user?.id) || [];
		return arrUser;
	}, [friendList, listDM, store, userProfile?.user?.id]);

	const directMessageId = useMemo(() => {
		const directMessage = listDM?.find?.((dm) => {
			const userIds = dm?.user_ids;
			if (!Array.isArray(userIds) || userIds.length !== 1) {
				return false;
			}
			const firstUserId = userIds[0];
			const targetId = jsonObject?.receiver_id || selectedUser?.id;
			return firstUserId === targetId;
		});
		return directMessage?.id;
	}, [jsonObject?.receiver_id, listDM, selectedUser?.id]);

	const handleShowModalReLogin = (content?: string) => {
		const data = {
			children: <ConfirmReLoginModal content={content} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, {
			isShow: true,
			data
		});
	};

	const handleSendLogMessage = useCallback(
		async (walletAddress) => {
			if (!walletAddress) {
				try {
					dispatch(clansActions.joinClan({ clanId: '0' }));
					if (directMessageId) {
						await sendInviteMessage(
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
				} catch (error) {
					console.error('Error sending log message:', error);
				}
			}
		},
		[createDirectMessageWithUser, directMessageId, dispatch, jsonObject, mergeUser, note, plainTokenCount, selectedUser, sendInviteMessage, t]
	);

	const sendToken = async () => {
		const store = await getStoreAsync();
		try {
			const walletAddress = jsonObject?.wallet_address;
			if (!selectedUser && !jsonObject?.receiver_id && !walletAddress) {
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
			if (
				Number(formatBalanceToString((plainTokenCount || 0)?.toString(), 0)) > Number(formatBalanceToString((tokenInWallet || 0)?.toString()))
			) {
				Toast.show({
					type: 'error',
					text1: t('toast.error.exceedWallet')
				});
				return;
			}
			store.dispatch(appActions.setLoadingMainMobile(true));
			setDisableButton(true);

			const zkProofs = selectZkProofs(store.getState() as any);
			const ephemeralKeyPair = selectEphemeralKeyPair(store.getState() as any);

			if (!zkProofs || !ephemeralKeyPair) {
				store.dispatch(appActions.setLoadingMainMobile(false));
				setDisableButton(false);
				handleShowModalReLogin();
				return;
			}

			const tokenEvent: ApiTokenSentEvent = {
				sender_id: walletAddress ? walletDetail?.address : userProfile?.user?.id || '',
				sender_name: walletAddress ? walletDetail?.address : userProfile?.user?.username?.[0] || userProfile?.user?.username || '',
				receiver_id: walletAddress ? walletAddress : jsonObject?.receiver_id || selectedUser?.id || '',
				extra_attribute: jsonObject?.extra_attribute || '',
				amount: Number(plainTokenCount || 1),
				note: note?.replace?.(/\s+/g, ' ')?.trim() || ''
			};
			const res: any = await store.dispatch(giveCoffeeActions.sendToken({ tokenEvent, isSendByAddress: !!walletAddress, isMobile: true }));
			store.dispatch(appActions.setLoadingMainMobile(false));
			setDisableButton(false);
			if (res?.meta?.requestStatus === 'rejected' || !res) {
				handleShowModalReLogin(res?.payload);
			} else {
				handleSendLogMessage(walletAddress);
				const now = new Date();
				const formattedTime = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
					.toString()
					.padStart(2, '0')}/${now.getFullYear()} ${now
					.getHours()
					.toString()
					.padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
				setSuccessTime(formattedTime);
				setDisableButton(false);
				handleShowSuccessModal();
			}
		} catch (err) {
			Toast.show({
				type: 'error',
				text1: err?.message || t('toast.error.anErrorOccurred')
			});
			setDisableButton(false);
		} finally {
			store.dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const handleConfirmSuccessful = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		navigation.goBack();
	};

	const handleOpenBottomSheet = () => {
		Keyboard.dismiss();
		setSearchText('');
		BottomSheetRef?.current?.present();
	};

	const handleSelectUser = (item: Receiver) => {
		setSelectedUser(item);
		BottomSheetRef?.current?.dismiss();
	};

	const filteredUsers = useMemo(() => {
		if (!searchText.trim()) return mergeUser;

		const search = searchText.toLowerCase();
		const searchNorm = removeDiacritics(search);

		return mergeUser
			.map((user) => {
				const username = (typeof user?.username === 'string' ? user.username : user?.username?.[0] || '').toLowerCase();
				const usernameNorm = removeDiacritics(username);

				const score =
					username === search
						? 1000
						: username.startsWith(search)
							? 900
							: usernameNorm === searchNorm
								? 800
								: usernameNorm.startsWith(searchNorm)
									? 700
									: username.includes(search)
										? 500
										: usernameNorm.includes(searchNorm)
											? 400
											: 0;

				return score ? { user, score, len: username.length } : null;
			})
			.filter(Boolean)
			.sort((a, b) => b.score - a.score || a.len - b.len)
			.map((item) => item.user);
	}, [mergeUser, searchText]);

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

	const handleSendNewToken = () => {
		setPlainTokenCount(0);
		setSelectedUser(null);
		setSearchText('');
		setTokenCount('0');
		setNote(t('sendToken'));
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	const renderItem = useCallback(
		({ item }) => (
			<Pressable key={`token_receiver_${item.id}`} style={[styles.userItem, { height: ITEM_HEIGHT }]} onPress={() => handleSelectUser(item)}>
				<MezonAvatar avatarUrl={item?.avatar_url} username={item?.username?.[0]} height={size.s_34} width={size.s_34} />
				<Text style={styles.title}>{item.username}</Text>
			</Pressable>
		),
		[styles]
	);

	const getItemLayout = useCallback(
		(data, index) => ({
			length: ITEM_HEIGHT,
			offset: ITEM_HEIGHT * index,
			index
		}),
		[]
	);

	const keyExtractor = useCallback((item) => item.id, []);

	const handleCopyAddress = async () => {
		if (jsonObject?.wallet_address) {
			Clipboard.setString(jsonObject?.wallet_address);
			Toast.show({
				type: 'success',
				props: {
					text2: t('copyAddressSuccess'),
					leadingIcon: <MezonIconCDN icon={IconCDN.linkIcon} color={baseColor.link} />
				}
			});
		}
	};

	const handleShowSuccessModal = () => {
		const data = {
			children: (
				<ConfirmSuccessModal
					tokenCount={tokenCount}
					note={note}
					successTime={successTime}
					selectedUser={selectedUser}
					jsonObject={jsonObject}
					directMessageId={directMessageId}
					onConfirm={handleConfirmSuccessful}
					onSendNewToken={handleSendNewToken}
				/>
			)
		};

		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior="padding"
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
		>
			<View style={styles.wrapperContainer}>
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
								<Text style={styles.cardAmount}>
									{formatBalanceToString((tokenInWallet || 0)?.toString())} {CURRENCY.SYMBOL}
								</Text>
							</View>
						</View>
					</LinearGradient>
					<View>
						<Text style={styles.title}>{jsonObject?.wallet_address ? t('sendTokenToAddress') : t('sendTokenTo')}</Text>
						<TouchableOpacity
							disabled={!!jsonObject?.receiver_id || jsonObject?.type === 'payment' || !!jsonObject?.wallet_address}
							style={[styles.textField, styles.selectSendTokenTo]}
							onPress={handleOpenBottomSheet}
						>
							<Text style={styles.username} numberOfLines={1}>
								{jsonObject?.wallet_address
									? jsonObject?.wallet_address
									: jsonObject?.receiver_id
										? jsonObject?.receiver_name || ''
										: selectedUser?.username || t('selectAccount')}
							</Text>
							{jsonObject?.wallet_address ? (
								<TouchableOpacity style={styles.btnCopyAddress} onPress={handleCopyAddress}>
									<MezonIconCDN icon={IconCDN.copyIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
								</TouchableOpacity>
							) : !jsonObject?.receiver_id ? (
								<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
							) : (
								<View />
							)}
						</TouchableOpacity>
					</View>
					<View>
						<Text style={styles.title}>{t('token')}</Text>
						<View style={styles.textField}>
							<TextInput
								autoFocus={!!jsonObject?.receiver_id || !!jsonObject?.wallet_address}
								editable={(!jsonObject?.amount || canEdit) && jsonObject?.type !== 'payment'}
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
								editable={(!jsonObject?.note || canEdit) && jsonObject?.type !== 'payment'}
								style={styles.textInputNote}
								placeholderTextColor="#535353"
								autoCapitalize="none"
								value={note}
								numberOfLines={5}
								multiline={true}
								textAlignVertical="top"
								onChangeText={(text) => setNote(text)}
								maxLength={MAX_NOTE_LENGTH}
							/>
							<Text style={styles.characterCount}>
								{note?.length || 0}/{MAX_NOTE_LENGTH}
							</Text>
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
					enableDynamicSizing={false}
					snapPoints={['80%']}
					backdropComponent={Backdrop}
					android_keyboardInputMode="adjustResize"
					style={styles.bottomSheetStyle}
					backgroundStyle={{ backgroundColor: themeValue.primary }}
				>
					<MezonInput
						autoFocus={true}
						inputWrapperStyle={styles.searchText}
						placeHolder={t('selectUser')}
						onTextChange={handleSearchText}
						prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={20} width={20} />}
					/>

					<BottomSheetFlatList
						keyExtractor={keyExtractor}
						keyboardShouldPersistTaps="handled"
						data={filteredUsers}
						renderItem={renderItem}
						getItemLayout={getItemLayout}
						style={[styles.flatListStyle, { backgroundColor: themeValue.secondary }]}
						contentContainerStyle={styles.flatListContentStyle}
						removeClippedSubviews
						maxToRenderPerBatch={10}
						initialNumToRender={15}
						windowSize={5}
						updateCellsBatchingPeriod={50}
					/>
				</BottomSheetModal>
			</View>
		</KeyboardAvoidingView>
	);
};
