import { size, useTheme } from '@mezon/mobile-ui';
import { getSrcEmoji } from '@mezon/utils';
import { memo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { IProductDetail } from '../../ProductDetailModal';
import { style } from './styles';

interface IProductItemProps {
	product: IProductDetail;
	type: string;
	onPress?: (product: IProductDetail) => void;
}

const ProductItem = ({ product, type, onPress }: IProductItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const handlePress = () => {
		onPress?.({
			...product,
			type: product?.type || 'sticker'
		});
	};

	return (
		<TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
			<View style={styles.imageContainer}>
				<Image
					source={{
						uri:
							type === 'emoji'
								? product?.src || getSrcEmoji(product?.id || '')
								: product?.source || `${process.env.NX_BASE_IMG_URL}/stickers/${product?.id}.webp`
					}}
					style={styles.image}
					resizeMode="contain"
					alt={product?.shortname}
				/>
			</View>
			<View style={styles.content}>
				<Text style={styles.name} numberOfLines={1}>
					{product?.shortname}
				</Text>
				<View style={styles.buyBadge}>
					<MezonIconCDN icon={IconCDN.payingIcon} color={themeValue.textStrong} width={size.s_16} height={size.s_16} />
					<Text style={styles.buyBtnText}>Mua ngay</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};

export default memo(ProductItem);
