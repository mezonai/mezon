import { useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

interface HeaderSearchMessageDmProps {
	initialSearchText?: string;
	onClearStoreInput?: (value: string) => void;
	onChangeText: (value: string) => void;
}

export default function HeaderSearchMessageDm({ initialSearchText, onClearStoreInput, onChangeText }: HeaderSearchMessageDmProps) {
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('common');
	const [textInput, setTextInput] = useState<string>(initialSearchText || '');

	const handleTextChange = (text: string) => {
		setTextInput(text);
		onChangeText(text);
	};

	const clearTextInput = () => {
		if (textInput?.length) {
			setTextInput('');
			onChangeText('');
			onClearStoreInput && onClearStoreInput('');
		}
	};

	const onGoBack = () => {
		navigation.goBack();
	};

	return (
		<View style={styles.headerContainer}>
			<TouchableOpacity onPress={onGoBack}>
				<MezonIconCDN icon={IconCDN.backArrowLarge} width={20} height={20} color={themeValue.text} />
			</TouchableOpacity>
			<View style={styles.searchBox}>
				<View style={styles.iconMargin}>
					<MezonIconCDN icon={IconCDN.magnifyingIcon} width={20} height={20} color={themeValue.text} />
				</View>
				<TextInput
					value={textInput}
					onChangeText={handleTextChange}
					style={styles.input}
					placeholderTextColor={themeValue.textDisabled}
					placeholder={t('search')}
					autoFocus
				/>
				{textInput?.length ? (
					<Pressable onPress={() => clearTextInput()}>
						<MezonIconCDN icon={IconCDN.circleXIcon} height={18} width={18} color={themeValue.text} />
					</Pressable>
				) : null}
			</View>
		</View>
	);
}
