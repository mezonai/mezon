import { IOption } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { style } from './styles';

export const OptionChannelApp = {
	Refresh: 'refresh'
};

interface IListOptionProps {
	onPressOption: (option: IOption) => void;
}

export const appsOptions = [
	{
		title: 'option',
		content: 'Refresh App',
		value: OptionChannelApp.Refresh,
		icon: <MezonIconCDN icon={IconCDN.reloadIcon} color={baseColor.gray} />
	}
];

const ChannelAppOptions = ({ onPressOption }: IListOptionProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const handleSelectOption = (option) => {
		onPressOption(option);
	};

	const OptionItem = ({ option }: { option: IOption }) => {
		return (
			<TouchableOpacity onPress={() => handleSelectOption(option)}>
				<View style={styles.wrapperOption}>
					{option?.icon}
					<View style={styles.content}>
						<Text numberOfLines={1} ellipsizeMode="tail" style={styles.textOption}>
							{option?.content}
						</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.optionSearchContainer}>
			{appsOptions?.map((option, index) => <OptionItem option={option} key={`option_app_${option?.value}_${index}`} />)}
		</View>
	);
};

export default ChannelAppOptions;
