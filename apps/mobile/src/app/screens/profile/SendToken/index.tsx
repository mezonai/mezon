import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useFriends } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	FriendsEntity,
	appActions,
	getStoreAsync,
	giveCoffeeActions,
	selectAllAccount,
	selectAllDirectMessages,
	selectAllUserClans,
	selectUpdateToken
} from '@mezon/store-mobile';
import debounce from 'lodash.debounce';
import { ChannelType, safeJSONParse } from 'mezon-js';
import { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MezonAvatar, MezonInput } from '../../../componentUI';
import Backdrop from '../../../componentUI/MezonBottomSheet/backdrop';
import { APP_SCREEN, SettingScreenProps } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type Receiver = {
	id?: string;
	username?: string;
	avatar_url?: string;
};

type ScreenSendToken = typeof APP_SCREEN.SETTINGS.SEND_TOKEN;
export const SendTokenScreen = ({ navigation, route }: SettingScreenProps<ScreenSendToken>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [tokenCount, setTokenCount] = useState('0');
	const [note, setNote] = useState('send token');
	const { friends: allUser } = useFriends();
	const userProfile = useSelector(selectAllAccount);
	const usersClan = useSelector(selectAllUserClans);
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const BottomSheetRef = useRef<BottomSheetModal>(null);
	const listDM = dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_DM);
	const [selectedUser, setSelectedUser] = useState<Receiver>(null);
	const [searchText, setSearchText] = useState<string>('');
	const [plainTokenCount, setPlainTokenCount] = useState(0);
	const friendList: FriendsEntity[] = useMemo(() => {
		return allUser.filter((user) => user.state === 0);
	}, [allUser]);

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
						username: itemUserClan?.user?.username ?? '',
						avatar_url: itemUserClan?.user?.avatar_url ?? ''
					});
				}
			});

		listDM.forEach((itemDM: DirectEntity) => {
			const userId = itemDM?.user_id?.[0] ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: itemDM?.usernames ?? '',
					avatar_url: itemDM?.channel_avatar?.[0] ?? ''
				});
			}
		});

		friendList.forEach((itemFriend: FriendsEntity) => {
			const userId = itemFriend?.user?.id ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: itemFriend?.user?.display_name ?? itemFriend?.user?.username ?? '',
					avatar_url: itemFriend?.user?.avatar_url ?? ''
				});
			}
		});

		return Array.from(userMap.values());
	}, [friendList, listDM, userProfile?.user?.id, usersClan]);

	const sendToken = async () => {
		const store = await getStoreAsync();
		try {
			if (!selectedUser) {
				Toast.show({
					type: 'error',
					text1: 'You must select a user to receive'
				});
				return;
			}
			if (Number(plainTokenCount || 0) <= 0) {
				Toast.show({
					type: 'error',
					text1: 'Token amount must be greater than zero'
				});
				return;
			}

			if (Number(plainTokenCount || 0) > Number(tokenInWallet) + Number(getTokenSocket)) {
				Toast.show({
					type: 'error',
					text1: 'Token amount exceeds wallet balance'
				});
				return;
			}
			store.dispatch(appActions.setLoadingMainMobile(true));

			const tokenEvent: ApiTokenSentEvent = {
				sender_id: userProfile?.user?.id || '',
				sender_name: userProfile?.user?.username || '',
				receiver_id: selectedUser?.id || '',
				amount: Number(plainTokenCount || 1),
				note: note || '',
				extra_attribute: ''
			};

			const res = store.dispatch(giveCoffeeActions.sendToken(tokenEvent));
			store.dispatch(appActions.setLoadingMainMobile(false));
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			if (res?.action?.action?.requestStatus === 'rejected' || !res) {
				Toast.show({
					type: 'error',
					text1: 'An error occurred, please try again'
				});
			} else {
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
		return mergeUser.filter((user) => user.username.toLowerCase().includes(searchText.toLowerCase()));
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

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView style={styles.form}>
				<Text style={styles.heading}>Send Token</Text>
				<View>
					<Text style={styles.title}>Send Token To ?</Text>
					<TouchableOpacity style={[styles.textField, { height: size.s_50 }]} onPress={handleOpenBottomSheet}>
						<Text style={styles.userName}>{selectedUser?.username}</Text>
					</TouchableOpacity>
				</View>
				<View>
					<Text style={styles.title}>Token</Text>
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
					<Text style={styles.title}>Note</Text>
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
				<Text style={styles.buttonTitle}>Send Token</Text>
			</Pressable>
			<Modal
				isVisible={showConfirmModal}
				animationIn={'bounceIn'}
				animationOut={'bounceOut'}
				hasBackdrop={true}
				coverScreen={true}
				avoidKeyboard={false}
				backdropColor={'rgba(0,0,0, 0.7)'}
				deviceHeight={Dimensions.get('screen').height}
			>
				<View style={styles.modalContainer}>
					<View style={styles.heading}>
						<Text style={styles.heading}>Token sent successful</Text>
					</View>
					<TouchableOpacity style={styles.buttonConfirm} onPress={handleConfirmSuccessful}>
						<Text style={styles.buttonTitle}>Ok</Text>
					</TouchableOpacity>
				</View>
			</Modal>
			<BottomSheetModal
				ref={BottomSheetRef}
				snapPoints={snapPoints}
				backdropComponent={Backdrop}
				backgroundStyle={{ backgroundColor: themeValue.primary }}
			>
				<Block paddingHorizontal={size.s_20} paddingVertical={size.s_10} flex={1} gap={size.s_10}>
					<MezonInput
						inputWrapperStyle={styles.searchText}
						placeHolder={'Select user to send token'}
						onTextChange={handleSearchText}
						prefixIcon={<Icons.MagnifyingIcon color={themeValue.text} height={20} width={20} />}
					/>
					<Block flex={1} backgroundColor={themeValue.secondary} borderRadius={size.s_8}>
						<BottomSheetFlatList data={filteredUsers} renderItem={renderItem} />
					</Block>
				</Block>
			</BottomSheetModal>
		</SafeAreaView>
	);
};
