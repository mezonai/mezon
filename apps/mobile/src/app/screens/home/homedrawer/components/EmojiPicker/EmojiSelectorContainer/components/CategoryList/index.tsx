import { baseColor, useTheme } from '@mezon/mobile-ui';
import { FC, ReactNode, memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { style } from '../../styles';

type CategoryListProps = {
	categoriesWithIcons: Array<{
		name: string;
		icon: ReactNode;
	}>;
	selectedCategory: string;
	onSelectCategory: (categoryName: string) => void;
};

const CategoryList: FC<CategoryListProps> = ({ categoriesWithIcons, selectedCategory, onSelectCategory }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			style={styles.wrapperCateContainer}
			contentContainerStyle={styles.cateContainer}
		>
			{categoriesWithIcons?.length > 0 && categoriesWithIcons.map((item, index) => (
				<TouchableOpacity
					key={`${item.name}_cate_emoji${index}`}
					// onPress={() => onSelectCategory(item.name)}
					style={{
						...styles.cateItem,
						backgroundColor: item.name === selectedCategory ? baseColor.blurple : 'transparent'
					}}
				>
					{item.icon}
				</TouchableOpacity>
			))}
		</ScrollView>
	);
};

export default memo(CategoryList);
