import { size, useTheme } from '@mezon/mobile-ui';
import { FOR_SALE_CATE, IEmoji } from '@mezon/utils';
import { FC, memo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../constants/icon_cdn';
import { style } from '../../styles';
import EmojisPanel from '../EmojisPanel';

type EmojiCategoryProps = {
	categoryName?: string;
	emojisData?: IEmoji[];
	onEmojiSelect?: (emoji: IEmoji) => void;
};

const EmojiCategory: FC<EmojiCategoryProps> = ({ emojisData, categoryName, onEmojiSelect }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [isExpanded, setIsExpanded] = useState(categoryName !== FOR_SALE_CATE);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	if (emojisData?.length === 0) {
		return null;
	}
	return (
		<View style={styles.displayByCategories}>
			<TouchableOpacity onPress={toggleExpand} style={styles.categoryHeader}>
				<Text style={styles.titleCategories}>{categoryName}</Text>
				<MezonIconCDN
					icon={isExpanded ? IconCDN.chevronDownSmallIcon : IconCDN.chevronSmallRightIcon}
					color={themeValue.text}
					width={size.s_16}
					height={size.s_16}
					customStyle={styles.chevronIcon}
				/>
			</TouchableOpacity>
			{isExpanded && <EmojisPanel emojisData={emojisData} onEmojiSelect={onEmojiSelect} />}
		</View>
	);
};

export default memo(EmojiCategory);
