import { IOption, ITypeOptionSearch } from '@mezon/mobile-components';
import { Colors, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import OptionSearch from '../OptionSearch';
import { style } from './ListOptionSearch.styles';

interface IListOptionSearchProps {
	onPressOption: (option: IOption) => void;
}

export const searchOptions = [
	{
		title: ITypeOptionSearch.FROM,
		content: 'user',
		value: 'username',
		icon: <MezonIconCDN icon={IconCDN.userIcon} color={Colors.textGray} />
	},
	{
		title: ITypeOptionSearch.MENTIONS,
		content: 'user',
		value: 'mention',
		icon: <MezonIconCDN icon={IconCDN.atIcon} color={Colors.textGray} />
	}
	// { title: ITypeOptionSearch.HAS, content: 'link, embed or file', value: 'attachment', icon: <LinkIcon /> },
	// { title: ITypeOptionSearch.BEFORE, content: 'specific data', value: 'username', icon: <CalendarDayIcon /> },
	// { title: ITypeOptionSearch.DURING, content: 'specific data', value: 'username' },
	// { title: ITypeOptionSearch.AFTER, content: 'specific data', value: 'username', icon: <CalendarPlusIcon /> },
	// { title: ITypeOptionSearch.PINED, content: 'true or false', value: 'username' }
];

const ListOptionSearch = ({ onPressOption }: IListOptionSearchProps) => {
	const { t } = useTranslation(['searchMessageChannel']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const handleSelectOption = (option) => {
		onPressOption(option);
	};

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
