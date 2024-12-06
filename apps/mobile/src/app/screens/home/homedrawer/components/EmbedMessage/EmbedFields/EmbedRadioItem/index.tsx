import { useTheme } from '@mezon/mobile-ui';
import { IMessageRatioOption } from '@mezon/utils';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { MezonRadioButton } from '../../../../../../../componentUI';
import { style } from './styles';

interface EmbedRadioProps {
	option: IMessageRatioOption;
	checked: boolean;
	onCheck: () => void;
}

export const EmbedRadioButton = memo(({ option, checked, onCheck }: EmbedRadioProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View>
			<Text style={styles.name}>{option?.label}</Text>
			<View style={styles.option}>
				<Text style={styles.value}>{option?.description}</Text>
				<MezonRadioButton checked={checked} onChange={onCheck} />
			</View>
		</View>
	);
});
