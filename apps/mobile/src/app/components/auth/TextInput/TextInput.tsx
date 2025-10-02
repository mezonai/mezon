import { useTheme } from '@mezon/mobile-ui';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { ErrorInput } from '../../ErrorInput';
import { style } from './styles';

interface UserTextInputProps {
	placeholder: string;
	isPass: boolean;
	value: string;
	onChangeText?: (text: string) => void;
	onBlur?: () => void;
	label: string;
	error: string;
	touched?: boolean;
	disable?: boolean;
	require?: boolean;
}

export const TextInputUser: React.FC<UserTextInputProps> = ({
	error,
	touched,
	label,
	placeholder,
	isPass,
	value,
	onChangeText,
	onBlur,
	disable = false,
	require = true
}) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [showPass, setShowPass] = useState<boolean>(true);

	return (
		<View style={styles.container}>
			<Text style={styles.label}>
				{label}
				{!!require && <Text style={styles.require}> *</Text>}
			</Text>
			<View style={styles.inputTexts}>
				<TextInput
					style={styles.inputText}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					onBlur={onBlur}
					secureTextEntry={isPass && showPass}
					placeholderTextColor="#535353"
					autoCapitalize="none"
					editable={!disable}
				/>
				{isPass && (
					<Pressable onPress={() => setShowPass(!showPass)}>
						{showPass ? (
							<MezonIconCDN icon={IconCDN.eyeIcon} color={themeValue.text} />
						) : (
							<MezonIconCDN icon={IconCDN.eyeSlashIcon} color={themeValue.text} />
						)}
					</Pressable>
				)}
			</View>

			{touched && error && <ErrorInput errorMessage={error} style={styles.errorText} />}
		</View>
	);
};
