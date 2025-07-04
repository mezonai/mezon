import { size, useTheme } from '@mezon/mobile-ui';
import { selectEmojiOnSale, selectStickerOnSale } from '@mezon/store';
import { useRoute } from '@react-navigation/native';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import LogoMezonDark from '../../../../assets/svg/logoMezonDark.svg';
import LogoMezonLight from '../../../../assets/svg/logoMezonLight.svg';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IProductDetail } from '../../../components/Shop/ProductDetailModal';
import ProductItem from '../../../components/Shop/ProductSection/ProductItem';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './ViewAll.styles';
import { memo } from 'react';

const ViewAllScreen = ({ navigation }) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const route = useRoute();
	const { type, title } = route.params as { type: 'emoji' | 'sticker'; title: string };

	const rawData: IProductDetail[] | any = type === 'emoji' ? useSelector(selectEmojiOnSale) : useSelector(selectStickerOnSale);

	const data = Array.isArray(rawData) ? rawData : [];

	const renderItem = ({ item }: { item: IProductDetail }) => <ProductItem product={item} type={type} />;

	const handleClose = () => navigation.goBack();
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={handleClose}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={size.s_24} width={size.s_24} color={themeValue.textStrong} />
				</TouchableOpacity>

				{themeBasic === 'dark' ? (
					<LogoMezonDark width={size.s_36} height={size.s_36} />
				) : (
					<LogoMezonLight width={size.s_36} height={size.s_36} />
				)}
				<Text style={styles.title}>
					<Text style={styles.mezonBold}>Mezon</Text>
					<Text style={styles.subtitle}> Shop</Text>
				</Text>
			</View>
			<FlatList data={data} renderItem={renderItem} keyExtractor={(item, index) => `${title}-${item?.id}-${index}`} numColumns={2} />
		</View>
	);
};

export default memo(ViewAllScreen);
