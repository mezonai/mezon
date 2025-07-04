import { size, useTheme } from '@mezon/mobile-ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import { IProductDetail } from '../ProductDetailModal';
import ProductItem from '../ProductSection/ProductItem';
import SectionBadge from '../ProductSection/SectionBadge';

interface IProductSectionProps {
	title: string;
	icon?: string;
	type?: string;
	data: IProductDetail[] | any;
	onPress?: () => void;
}

const ProductSection = ({ title, icon, type = 'sticker', data, onPress }: IProductSectionProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);

	const renderItem = ({ item }: { item: IProductDetail }) => <ProductItem product={item} type={type} />;
	const renderEmptyComponent = () => (
		<View
			style={{
				width: '100%',
				alignItems: 'center',
				justifyContent: 'center',
				paddingVertical: size.s_20,
				gap: size.s_8
			}}
		>
			<Text style={{ fontSize: size.s_50, marginBottom: size.s_4 }}>🛍️</Text>
			<Text
				style={{
					fontSize: size.s_15,
					color: themeValue.textDisabled,
					textAlign: 'center',
					lineHeight: size.s_20,
					maxWidth: 280
				}}
			>
				{t('emptyTitle', { item: title })}
			</Text>
		</View>
	);

	return (
		<View>
			<SectionBadge title={title} icon={icon} data={data} onPress={onPress} />
			{data?.length > 0 ? (
				<FlatList
					data={data}
					renderItem={renderItem}
					keyExtractor={(item, index) => `${title}-${item?.id}-${index}`}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingHorizontal: size.s_4 }}
				/>
			) : (
				renderEmptyComponent()
			)}
		</View>
	);
};

export default memo(ProductSection);
