import { ArrowLeftIcon, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Pressable, TextInput, TouchableOpacity, View } from 'react-native';
import { style } from './styles';

export default function HeaderSearchMessageDm({ onChangeText }: { onChangeText: (value: string) => void }) {
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [textInput, setTextInput] = useState<string>('');

	const handleTextChange = (text: string) => {
		setTextInput(text);
		onChangeText(text);
	};

	const clearTextInput = () => {
		if (textInput?.length) {
			setTextInput('');
			onChangeText('');
		}
	};

	const onGoBack = () => {
		navigation.goBack();
	};

	return (
		<View style={{ paddingHorizontal: size.s_10, paddingVertical: size.s_20, flexDirection: 'row', alignItems: 'center', gap: size.s_20 }}>
			<TouchableOpacity onPress={onGoBack}>
				<ArrowLeftIcon width={20} height={20} color={themeValue.text} />
			</TouchableOpacity>
			<View style={styles.searchBox}>
				<View style={{ marginRight: size.s_6 }}>
					<Icons.MagnifyingIcon width={20} height={20} color={themeValue.text} />
				</View>
				<TextInput
					value={textInput}
					onChangeText={handleTextChange}
					style={styles.input}
					placeholderTextColor={themeValue.text}
					placeholder={'search'}
					autoFocus
				/>
				{textInput?.length ? (
					<Pressable onPress={() => clearTextInput()}>
						<Icons.CircleXIcon height={18} width={18} color={themeValue.text} />
					</Pressable>
				) : null}
			</View>
		</View>
	);
}
