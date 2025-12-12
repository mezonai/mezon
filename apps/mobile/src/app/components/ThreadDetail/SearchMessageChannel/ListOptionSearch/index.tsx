import type { IOption } from '@mezon/mobile-components';
import { ITypeOptionSearch } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import OptionSearch from '../OptionSearch';
import { style } from './ListOptionSearch.styles';

interface IListOptionSearchProps {
	onPressOption: (option: IOption) => void;
	isSearchGlobal?: boolean;
}

const ListOptionSearch = ({ onPressOption, isSearchGlobal = false }: IListOptionSearchProps) => {
	const { t } = useTranslation(['searchMessageChannel']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const handleSelectOption = (option) => {
		onPressOption(option);
	};

	const searchOptions = useMemo(() => {
		const options: IOption[] = [];

		if (isSearchGlobal) {
			options.push({
				title: ITypeOptionSearch.IN,
				content: t('filterOptions.inChannel'),
				value: 'channel_id',
				icon: <MezonIconCDN icon={IconCDN.channelText} color={themeValue.text} width={20} height={20} />
			});
		} else {
			options.push({
				title: ITypeOptionSearch.FROM,
				content: t('filterOptions.fromUser'),
				value: 'username',
				icon: <MezonIconCDN icon={IconCDN.userIcon} color={themeValue.text} width={20} height={20} />
			});
			options.push({
				title: ITypeOptionSearch.MENTIONS,
				content: t('filterOptions.mentionUser'),
				value: 'mention',
				icon: <MezonIconCDN icon={IconCDN.atIcon} color={themeValue.text} width={20} height={20} />
			});
		}
		return options;
	}, [isSearchGlobal, t]);

	return (
		<View style={styles.optionSearchContainer}>
			<Text style={styles.headerTitle}>{t('filterResults')}</Text>
			{searchOptions.map((option, index) => (
				<OptionSearch onSelect={handleSelectOption} option={option} key={`${option.value}_${index}`}></OptionSearch>
			))}
		</View>
	);
};

export default ListOptionSearch;
