import { size, useTheme } from '@mezon/mobile-ui';
import debounce from 'lodash.debounce';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

type SearchThreadsProps = {
	inputValue?: string;
	onTextChanged?: (value: string) => void;
};
export const SearchThreadsBar = ({ onTextChanged, inputValue }: SearchThreadsProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [searchInput, setSearchInput] = useState<string>(inputValue);
	const { t } = useTranslation(['channelMenu']);

	const clearSearchInput = () => {
		setSearchInput('');
		onTextChanged('');
	};

	const debouncingTextChanged = debounce((value) => {
		onTextChanged(value);
	}, 300);

	const handleTextChange = (text) => {
		setSearchInput(text);
		debouncingTextChanged(text);
	};

	return (
		<View style={styles.searchBar}>
			<TextInput
				style={styles.searchInput}
				placeholder={t('menu.thread.searchThreads')}
				placeholderTextColor={themeValue.textDisabled}
				onChangeText={handleTextChange}
				value={searchInput}
			/>
			{!!searchInput?.length && (
				<Pressable onPress={clearSearchInput}>
					<MezonIconCDN icon={IconCDN.circleXIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
				</Pressable>
			)}
		</View>
	);
};
