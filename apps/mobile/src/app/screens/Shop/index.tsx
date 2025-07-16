import { size, useTheme } from '@mezon/mobile-ui';
import { selectEmojiOnSale, selectStickerOnSale } from '@mezon/store-mobile';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import LogoMezonDark from '../../../assets/svg/logoMezonDark.svg';
import LogoMezonLight from '../../../assets/svg/logoMezonLight.svg';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import ProductSection from '../../components/Shop/ProductSection';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { style } from './styles';

const ShopScreen = ({ navigation }: { navigation: any }) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const emojisRaw = useSelector(selectEmojiOnSale);
	const stickersRaw = useSelector(selectStickerOnSale);

	const handleClose = () => navigation.goBack();

	return (
		<View style={styles.container}>
			<StatusBarHeight />
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
				{!!emojisRaw?.length && <ProductSection title="Emoji" icon="😀" data={emojisRaw} type={'emoji'} />}
				{!!stickersRaw?.length && <ProductSection title="Sticker" icon="🎨" data={stickersRaw} />}
			</ScrollView>
		</View>
	);
};

export default ShopScreen;
