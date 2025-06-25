import { size } from '@mezon/mobile-ui';
import { memo } from 'react';
import { FlatList, View } from 'react-native';
import { IProductDetail } from '../ProductDetailModal';
import ProductItem from '../ProductSection/ProductItem';
import SectionBadge from '../ProductSection/SectionBadge';

interface IProductSectionProps {
	title: string;
	icon?: string;
	type?: string;
	data: IProductDetail[];
	onProductPress?: (product: IProductDetail) => void;
}

const ProductSection = ({ title, icon, type = 'sticker', data, onProductPress }: IProductSectionProps) => {
	const renderItem = ({ item }: { item: IProductDetail }) => <ProductItem product={item} type={type} onPress={() => onProductPress?.(item)} />;

	return (
		<View>
			<SectionBadge title={title} icon={icon} />
			<FlatList
				data={data}
				renderItem={renderItem}
				keyExtractor={(item, index) => `${title}-${item?.id}-${index}`}
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: size.s_4 }}
			/>
		</View>
	);
};

export default memo(ProductSection);
