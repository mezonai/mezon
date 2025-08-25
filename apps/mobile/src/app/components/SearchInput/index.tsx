import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
interface SearchInputProps {
	placeholder: string;
	input: string;
	setText: (text: string) => void;
	text: string;
}
const SearchInput: React.FC<SearchInputProps> = ({ placeholder, setText, text }) => {
	const { themeValue } = useTheme();
	return (
		<View style={styles.container}>
			<Feather name="search" size={20} style={styles.icon} />
			<TextInput
				placeholder={placeholder}
				style={styles.icon}
				placeholderTextColor={themeValue.textDisabled}
				onChangeText={setText}
				defaultValue={text}
			/>
		</View>
	);
};

export default SearchInput;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		borderRadius: 30,
		flexDirection: 'row',
		alignItems: 'center',
		height: 80,
		backgroundColor: 'black',
		paddingLeft: 10,
		paddingRight: 10,
		gap: 10
	},
	icon: {
		color: '#484848'
	}
});
