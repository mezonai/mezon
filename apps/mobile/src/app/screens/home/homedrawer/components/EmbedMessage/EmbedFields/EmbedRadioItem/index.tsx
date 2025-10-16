import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentUserId } from '@mezon/store-mobile';
import { IMessageRatioOption } from '@mezon/utils';
import { memo, useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonRadioButton from '../../../../../../../componentUI/MezonRadioButton';
import { style } from './styles';

interface EmbedRadioProps {
	option: IMessageRatioOption;
	checked: boolean;
	onCheck: () => void;
}

export const EmbedRadioButton = memo(({ option, checked, onCheck }: EmbedRadioProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentUserId = useSelector(selectCurrentUserId);

	useEffect(() => {
		if (Array.isArray(option?.extraData) && currentUserId) {
			if (option?.extraData?.includes(currentUserId)) {
				onCheck?.();
			}
		}
	}, [option?.extraData, currentUserId]);

	return (
		<View style={styles.option}>
			<View style={styles.itemDetail}>
				{option?.label && <Text style={styles.name}>{option?.label}</Text>}
				{option?.description && <Text style={styles.value}>{option?.description}</Text>}
			</View>
			<MezonRadioButton checked={checked} onChange={onCheck} />
		</View>
	);
});
