import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectEmojiOnSale, selectStickerOnSale } from '@mezon/store-mobile';
import { useCallback, useMemo } from 'react';
import { DeviceEventEmitter, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import LogoMezonDark from '../../../assets/svg/logoMezonDark.svg';
import LogoMezonLight from '../../../assets/svg/logoMezonLight.svg';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import ProductDetailModal, { IProductDetail } from '../../components/Shop/ProductDetailModal';
import ProductSection from '../../components/Shop/ProductSection';
import { IconCDN } from '../../constants/icon_cdn';
import { style } from './styles';

const ShopScreen = ({ navigation }: { navigation: any }) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const emojisRaw = useSelector(selectEmojiOnSale);
	const stickersRaw = useSelector(selectStickerOnSale);

	const handleClose = () => navigation.goBack();

	const handleProductPress = useCallback((product: IProductDetail) => {
		const data = {
			children: <ProductDetailModal product={product} />
		};

		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);

	return (
		<SafeAreaView style={styles.container}>
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

			<ScrollView style={styles.productContainer} showsVerticalScrollIndicator={false}>
				<ProductSection title="Emoji nổi bật" icon="😀" data={emojisRaw} onProductPress={handleProductPress} type={'emoji'} />
				<ProductSection title="Sticker nổi bật" icon="🎨" data={stickersRaw} onProductPress={handleProductPress} />
			</ScrollView>
		</SafeAreaView>
	);
};

export default ShopScreen;
