import { size, useTheme } from '@mezon/mobile-ui';
import { Pressable, Text, View } from 'react-native';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

export const E2EEConfirmScreen = ({ navigation, route }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const directMessageId = route.params?.directMessageId as string;

	const handlePress = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.CREATE_PIN,
			params: { directMessageId: directMessageId }
		});
	};

	return (
		<View style={styles.container}>
			<Text style={styles.header}>Set up a way to access your chat history</Text>
			<Text style={styles.description}>
				With upgrade. access your chat history is changing. You can create a PIN to access your history if you switch device
			</Text>
			<View></View>
			<Pressable style={[styles.button, { bottom: size.s_80 }]}>
				<Text style={styles.buttonTitle} onPress={handlePress}>
					Create Pin
				</Text>
			</Pressable>
			<Pressable style={[styles.button, { backgroundColor: themeValue.secondary }]}>
				<Text style={[styles.buttonTitle, { color: '#5e65ee' }]}>More option</Text>
			</Pressable>
		</View>
	);
};
