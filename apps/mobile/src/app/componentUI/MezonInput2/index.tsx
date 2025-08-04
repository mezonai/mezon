import { useTheme } from '@mezon/mobile-ui';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { ErrorInput } from '../../components/ErrorInput';
import { validInput } from '../../utils/validate';
import { style } from './styles';

interface IMezonInput2 {
	placeHolder?: string;
	label?: string;
	errorMessage?: string;
	value: string;
	onTextChange?: (value: string) => void;
}

export default function MezonInput({ label, placeHolder, value, onTextChange, errorMessage }: IMezonInput2) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [isCheckValid, setIsCheckValid] = useState<boolean>(true);
	useEffect(() => {
		setIsCheckValid(validInput(value));
	}, [value]);
	return (
		<View>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				placeholderTextColor={themeValue.textDisabled}
				placeholder={placeHolder}
				style={styles.input}
				value={value}
				onChangeText={onTextChange}
				maxLength={64}
			/>
			{!isCheckValid && errorMessage && <ErrorInput style={styles.errorInput} errorMessage={errorMessage} />}
		</View>
	);
}
