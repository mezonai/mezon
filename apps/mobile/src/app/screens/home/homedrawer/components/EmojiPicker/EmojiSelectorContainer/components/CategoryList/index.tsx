import { baseColor, useTheme } from '@mezon/mobile-ui';
import { IEmoji } from '@mezon/utils';
import { FC, ReactNode, memo, useState } from 'react';
import { Pressable, ScrollView } from 'react-native-gesture-handler';
import { style } from '../../styles';

type CategoryListProps = {
	categoriesWithIcons: Array<{
		name: string;
		icon: ReactNode;
		emojis: IEmoji[];
	}>;
	setSelectedCategory: (name: string) => void;
};

const CategoryList: FC<CategoryListProps> = ({ categoriesWithIcons, setSelectedCategory }) => {
	const { themeValue } = useTheme();
	const [currentCate, setCurrentCate] = useState<string>('');
	const styles = style(themeValue);

	const onPress = (name) => {
		setCurrentCate(name);
		setSelectedCategory(name);
	};

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			style={styles.wrapperCateContainer}
			contentContainerStyle={styles.cateContainer}
		>
			{categoriesWithIcons?.length > 0 &&
				categoriesWithIcons.map((item, index) => {
					if (!item?.emojis?.length) {
						return null;
					}
					return (
						<Pressable
							key={`${item.name}_cate_emoji${index}`}
							onPress={() => onPress(item?.name)}
							style={{
								...styles.cateItem,
								backgroundColor: item.name === currentCate ? baseColor.blurple : 'transparent'
							}}
						>
							{item.icon}
						</Pressable>
					);
				})}
		</ScrollView>
	);
};

export default memo(CategoryList);
