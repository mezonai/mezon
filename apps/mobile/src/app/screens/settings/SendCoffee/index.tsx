import { useTheme } from '@mezon/mobile-ui';
import { appActions, getStoreAsync, giveCoffeeActions } from '@mezon/store-mobile';
import { TokenSentEvent } from 'mezon-js/dist/socket';
import { useState } from 'react';
import { Pressable, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { APP_SCREEN, SettingScreenProps } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type ScreenSettingSendCoffee = typeof APP_SCREEN.SETTINGS.SEND_COFFEE;
export const SendCoffeeScreen = ({ navigation, route }: SettingScreenProps<ScreenSettingSendCoffee>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { formValue } = route.params;
	const jsonObject: TokenSentEvent = JSON.parse(formValue);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const tokenEvent: TokenSentEvent = {
		sender_id: '1820658435042054144',
		sender_name: jsonObject.sender_name,
		receiver_id: '1833725412337782784',
		amount: jsonObject.amount
	};

	const sendToken = async () => {
		const store = await getStoreAsync();
		try {
			if (tokenEvent) {
				store.dispatch(appActions.setLoadingMainMobile(true));
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
			}
		} catch (err) {
			store.dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const handleConfirmSuccessful = () => {
		setShowConfirmModal(false);
		navigation.popToTop();
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.form}>
				<Text style={styles.heading}>Receiver Information</Text>
				<View>
					<Text style={styles.title}>User name</Text>
					<View style={styles.textField}>
						<TextInput style={styles.textInput} placeholderTextColor="#535353" value={tokenEvent.receiver_id} />
					</View>
				</View>
				<View>
					<Text style={styles.title}>Token count</Text>
					<View style={styles.textField}>
						<TextInput style={styles.textInput} placeholderTextColor="#535353" value={tokenEvent.amount.toString()} />
					</View>
				</View>
				<View>
					<Text style={styles.title}>Description</Text>
					<View style={styles.textField}>
						<TextInput
							style={[styles.textInput, { height: 'auto' }]}
							placeholderTextColor="#535353"
							autoCapitalize="none"
							numberOfLines={5}
							multiline={true}
							textAlignVertical="top"
						/>
					</View>
				</View>
			</View>
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
			>
				<View style={styles.modalContainer}>
					<View style={styles.heading}>
						<Text style={styles.heading}>Token sent successful</Text>
					</View>
					<View style={styles.button}>
						<TouchableOpacity onPress={handleConfirmSuccessful}>
							<Text style={styles.buttonTitle}>Ok</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};
