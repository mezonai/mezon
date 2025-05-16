import { baseColor, useTheme } from '@mezon/mobile-ui';
import { FC, ReactNode, memo } from 'react';
import { DeviceEventEmitter, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { style } from '../../styles';
import { ActionEmitEvent } from '@mezon/mobile-components';

type CategoryListProps = {
	categoriesWithIcons: Array<{
		name: string;
		icon: ReactNode;
	}>;
	selectedCategory: string;
	// onSelectCategory: (categoryName: string) => void;
};

const CategoryList: FC<CategoryListProps> = ({ categoriesWithIcons, selectedCategory }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	console.log('categoriesWithIcons: ', categoriesWithIcons);

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
					onPress={() => DeviceEventEmitter.emit(ActionEmitEvent.ON_SCROLL_TO_CATEGORY_EMOJI, { name: item.name })}
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
