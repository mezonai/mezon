import { size, useTheme } from '@mezon/mobile-ui';
import type { IEmoji } from '@mezon/utils';
import { FOR_SALE_CATE, PREDEFINED_EMOJI_CATEGORIES } from '@mezon/utils';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../constants/icon_cdn';
import { style } from '../../styles';
import EmojisPanel from '../EmojisPanel';

interface IEmojiCategoryProps {
	categoryName: string;
	emojisData: IEmoji[];
	onEmojiSelect: (emoji: IEmoji) => void;
}

const EmojiCategory = ({ emojisData, categoryName, onEmojiSelect }: IEmojiCategoryProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('common');
	const [isExpanded, setIsExpanded] = useState(categoryName !== FOR_SALE_CATE);

	const displayCategoryName = useMemo(() => {
		if (!categoryName) return '';
		return PREDEFINED_EMOJI_CATEGORIES.includes(categoryName) ? t(`emojiCategories.${categoryName}`) : categoryName;
	}, [categoryName, t]);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	if (emojisData?.length === 0) {
		return null;
	}
	return (
		<View style={styles.displayByCategories}>
			<TouchableOpacity onPress={toggleExpand} style={styles.categoryHeader}>
				<Text style={styles.titleCategories}>{displayCategoryName}</Text>
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
