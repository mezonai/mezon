import { useTheme } from '@mezon/mobile-ui';
import { IEmoji } from '@mezon/utils';
import { FC, memo } from 'react';
import { Text, View } from 'react-native';
import { style } from '../../styles';
import EmojisPanel from '../EmojisPanel';

type EmojiCategoryProps = {
	categoryName?: string;
	emojisData: IEmoji[];
	onEmojiSelect: (emoji: IEmoji) => void;
};

const EmojiCategory: FC<EmojiCategoryProps> = ({ emojisData, categoryName, onEmojiSelect }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View key={categoryName} style={styles.displayByCategories}>
			<Text style={styles.titleCategories}>{categoryName}</Text>
			<EmojisPanel emojisData={emojisData} onEmojiSelect={onEmojiSelect} />
		</View>
	);
};

export default memo(EmojiCategory);
