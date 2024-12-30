import { useTheme } from '@mezon/mobile-ui';
import React, { useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

export const ConfirmPinScreen = ({ navigation, route }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [pin, setPin] = useState(['', '', '', '', '', '']);
	const inputRef = useRef(null);
	const directMessageId = route.params?.directMessageId as string;
	const pinCreated = route.params?.pin as string;

	const handleKeyPress = ({ nativeEvent }) => {
		if (nativeEvent.key === 'Backspace') {
			const newPin = [...pin];
			const lastIndex = newPin.findIndex((char) => char === '');
			const indexToDelete = lastIndex === -1 ? 5 : lastIndex - 1;
			if (indexToDelete >= 0) newPin[indexToDelete] = '';
			setPin(newPin);
		}
	};

	const handleChangeText = (text) => {
		const newPin = [...pin];
		const indexToUpdate = newPin.findIndex((char) => char === '');
		if (indexToUpdate !== -1 && text) {
			newPin[indexToUpdate] = text;
			setPin(newPin);
		}
		if (newPin.every((char) => char !== '')) {
			setPin(['', '', '', '', '', '']);
			if (newPin.join('') !== pinCreated) {
				Toast.show({
					type: 'error',
					text1: 'Created PIN and comfirm PIN is not compare'
				});
				navigation.goBack();
			} else {
				navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
					screen: APP_SCREEN.MESSAGES.MESSAGE_DETAIL,
					params: { directMessageId: directMessageId }
				});
			}
		}
	};

	const handleForcusInput = () => {
		inputRef?.current?.focus();
	};

	return (
		<View style={styles.container}>
			<Text style={styles.header}>Confirm your PIN</Text>
			<Text style={styles.description}>Make it memorable. You will need it when you switch to a new device</Text>
			<Pressable style={styles.pinContainer} onPress={handleForcusInput}>
				{pin.map((digit, index) => (
					<View key={index} style={styles.pinBox}>
						<Text style={styles.pinText}>{digit}</Text>
					</View>
				))}
				<TextInput
					style={styles.hiddenInput}
					value=""
					ref={inputRef}
					keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'number-pad'}
					maxLength={1}
					onChangeText={handleChangeText}
					onKeyPress={handleKeyPress}
					autoFocus
				/>
			</Pressable>
		</View>
	);
};
