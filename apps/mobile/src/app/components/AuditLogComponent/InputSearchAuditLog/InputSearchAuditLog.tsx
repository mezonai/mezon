import { debounce } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { TextInput, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

export default function InputSearchAuditLog({ placeHolder, onChangeText }: { placeHolder: string; onChangeText: (searchText: string) => void }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const handleChangeText = debounce((text) => {
		onChangeText(text);
	}, 300);

	return (
		<View style={styles.searchMessage}>
			<TextInput placeholder={placeHolder} placeholderTextColor={themeValue.text} style={styles.searchInput} onChangeText={handleChangeText} />
			<MezonIconCDN icon={IconCDN.magnifyingIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
		</View>
	);
}
