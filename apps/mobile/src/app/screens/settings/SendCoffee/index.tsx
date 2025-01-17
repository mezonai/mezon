import { size, useTheme } from '@mezon/mobile-ui';
import { appActions, getStoreAsync, giveCoffeeActions, selectAllAccount, selectUpdateToken } from '@mezon/store-mobile';
import { safeJSONParse } from 'mezon-js';
import { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { APP_SCREEN, SettingScreenProps } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type ScreenSettingSendCoffee = typeof APP_SCREEN.SETTINGS.SEND_COFFEE;
export const SendCoffeeScreen = ({ navigation, route }: SettingScreenProps<ScreenSettingSendCoffee>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { formValue } = route.params;
	const jsonObject: ApiTokenSentEvent = safeJSONParse(formValue || '{}');
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [tokenCount, setTokenCount] = useState(jsonObject?.amount?.toString() || '1');
	const [note, setNote] = useState(jsonObject?.note || 'send token');
	const userProfile = useSelector(selectAllAccount);

	const tokenInWallet = useMemo(() => {
		return userProfile?.wallet ? safeJSONParse(userProfile?.wallet || '{}')?.value : 0;
	}, [userProfile?.wallet]);
	const getTokenSocket = useSelector(selectUpdateToken(userProfile?.user?.id ?? ''));

	const sendToken = async () => {
		const store = await getStoreAsync();
		try {
			if (Number(tokenCount || 0) <= 0) {
				Toast.show({
					type: 'error',
					text1: 'Token amount must be greater than zero'
				});
				return;
			}

			if (Number(tokenCount || 0) > Number(tokenInWallet) + Number(getTokenSocket)) {
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
				receiver_id: jsonObject?.receiver_id || '',
				extra_attribute: jsonObject?.extra_attribute || '',
				amount: Number(tokenCount || 1),
				note: note || ''
			};

			const res = store.dispatch(giveCoffeeActions.sendToken(tokenEvent));
			store.dispatch(giveCoffeeActions.updateTokenUser({ tokenEvent }));
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

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView style={styles.form}>
				<Text style={styles.heading}>Receiver Information</Text>
				<View>
					<Text style={styles.title}>User name</Text>
					<View style={styles.textField}>
						<TextInput
							style={styles.textInput}
							placeholderTextColor="#535353"
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
							value={jsonObject?.receiver_name || 'KOMO'}
							editable={false}
						/>
					</View>
				</View>
				<View>
					<Text style={styles.title}>Token count</Text>
					<View style={styles.textField}>
						<TextInput
							style={styles.textInput}
							value={tokenCount}
							keyboardType="numeric"
							placeholderTextColor="#535353"
							editable={!jsonObject?.amount}
							onChangeText={(text) => setTokenCount(text)}
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
							editable={!jsonObject?.note}
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
		</SafeAreaView>
	);
};
