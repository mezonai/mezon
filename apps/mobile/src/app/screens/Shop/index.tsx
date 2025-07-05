import { size, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LogoMezonDark from '../../../assets/svg/logoMezonDark.svg';
import LogoMezonLight from '../../../assets/svg/logoMezonLight.svg';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import ProductSection from '../../components/Shop/ProductSection';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './styles';
import { useSelector } from 'react-redux';
import { selectEmojiOnSale, selectStickerOnSale } from '@mezon/store';

const ShopScreen = ({ navigation }: { navigation: any }) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const emojisRaw = useSelector(selectEmojiOnSale);
	const stickersRaw = useSelector(selectStickerOnSale);

	const { t } = useTranslation('token');

	const handleClose = () => navigation.goBack();

	const showViewAll = (type: 'emoji' | 'sticker') => {
		navigation.navigate(APP_SCREEN.SHOP.VIEWALL, {
			type,
			title: type === 'emoji' ? 'Emoji' : 'Sticker'
		});
	};

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
				<ProductSection title="Emoji" icon="😀" data={emojisRaw} type={'emoji'} onPress={() => showViewAll('emoji')} />
				<ProductSection title="Sticker" icon="🎨" data={stickersRaw} onPress={() => showViewAll('sticker')} />
			</ScrollView>
		</View>
	);
};

export default ShopScreen;
