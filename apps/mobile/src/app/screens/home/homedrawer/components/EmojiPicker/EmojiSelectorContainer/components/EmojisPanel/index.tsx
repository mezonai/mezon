import { useTheme } from '@mezon/mobile-ui';
import { IEmoji, getSrcEmoji } from '@mezon/utils';
import { FC, memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import useTabletLandscape from '../../../../../../../../hooks/useTabletLandscape';
import { style } from '../../styles';

type EmojisPanelProps = {
	emojisData: IEmoji[];
	onEmojiSelect: (emoji: IEmoji) => void;
};

const EmojisPanel: FC<EmojisPanelProps> = ({ emojisData, onEmojiSelect }) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);

	const renderEmoji = ({ item }: { item: IEmoji }) => (
		<TouchableOpacity style={styles.wrapperIconEmoji} key={item.id} onPress={() => onEmojiSelect(item)}>
			<FastImage source={{ uri: getSrcEmoji(item?.id) }} style={styles.iconEmoji} resizeMode={'contain'} />
		</TouchableOpacity>
	);

	return (
		<View style={styles.emojisPanel}>
			{emojisData?.length > 0 && emojisData.map((item) => (
				renderEmoji({ item })
			))}
		</View>
	);
};

export default memo(EmojisPanel);
