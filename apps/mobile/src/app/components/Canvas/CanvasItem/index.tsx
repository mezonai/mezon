import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectCanvasEntityById } from '@mezon/store-mobile';
import { memo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { style } from './styles';

type CanvasItemProps = {
	canvasId: string;
	channelId: string;
	onPressItem?: () => void;
};

const CanvasItem = memo(({ canvasId, channelId, onPressItem }: CanvasItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const canvas = useSelector((state) => selectCanvasEntityById(state, channelId, canvasId));
	const title = canvas?.title ? canvas?.title?.replace(/\n/g, ' ') : 'Untitled';

	return (
		<TouchableOpacity style={styles.container} onPress={onPressItem}>
			<Text style={styles.title} numberOfLines={1}>
				{title}
			</Text>
			<Icons.ChevronSmallRightIcon height={size.s_16} width={size.s_16} color={themeValue.text} />
		</TouchableOpacity>
	);
});

export default CanvasItem;
