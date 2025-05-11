import { IOption } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { Text, TouchableOpacity, View } from 'react-native';
import { style } from './styles';

export const OptionChannelHeader = {
	Anonymous: 'Anonymous',
	Buzz: 'Buzz'
};

interface IListOptionProps {
	onPressOption?: (option: IOption) => void;
	options: IOption[];
}

const ChannelHeaderOptions = ({ onPressOption, options }: IListOptionProps) => {
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
			{options?.map((option, index) => <OptionItem option={option} key={`option_app_${option?.value}_${index}`} />)}
		</View>
	);
};

export default ChannelHeaderOptions;
