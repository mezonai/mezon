import { useTheme } from '@mezon/mobile-ui';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

export const CreatePinScreen = ({ navigation, route }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [pin, setPin] = useState(['', '', '', '', '', '']);
	const inputRef = useRef(null);
	const directMessageId = route.params?.directMessageId as string;

	useEffect(() => {
		const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
			inputRef.current?.focus();
		});
		const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
			inputRef.current?.blur();
		});

		return () => {
			showSubscription.remove();
			hideSubscription.remove();
		};
	}, []);

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
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.CONFIRM_PIN,
				params: { pin: newPin.join(''), directMessageId: directMessageId }
			});
		}
	};

	const handleForcusInput = () => {
		inputRef?.current?.focus();
	};

	return (
		<View style={styles.container}>
			<Text style={styles.header}>Create your PIN</Text>
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
					keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
					maxLength={1}
					onChangeText={handleChangeText}
					onKeyPress={handleKeyPress}
					autoFocus
				/>
			</Pressable>
		</View>
	);
};
