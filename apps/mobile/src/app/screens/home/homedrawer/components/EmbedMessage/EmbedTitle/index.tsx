import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { memo } from 'react';
import { DeviceEventEmitter, Linking, Text, TouchableOpacity, View } from 'react-native';
import { style } from './styles';

interface EmbedDescriptionProps {
	title: string;
	url: string;
}

export const EmbedTitle = memo(({ title, url }: EmbedDescriptionProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const handleOpenUrl = async () => {
		try {
			if (url?.includes('/channel-app')) {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_NAVIGATION_DEEPLINK, url);
				return;
			}
			await Linking.openURL(url);
		} catch (err) {
			throw new Error(err);
		}
	};

	return (
		<View style={styles.container}>
			{url ? (
				<TouchableOpacity onPress={handleOpenUrl}>
					<Text style={styles.urlTitle}>{title}</Text>
				</TouchableOpacity>
			) : (
				<Text style={styles.title}>{title}</Text>
			)}
		</View>
	);
});
