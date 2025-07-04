import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { getSrcEmoji } from '@mezon/utils';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Image, ImageStyle, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import ProductDetailModal, { IProductDetail } from '../../ProductDetailModal';
import { style } from './styles';

interface IProductItemProps {
	product: IProductDetail;
	type: string;
}

const ProductItem = ({ product, type }: IProductItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['token']);
	const isHaveUnlock = type === 'emoji' ? !!product?.src : !!product?.source;

	const handlePress = () => {
		const data = {
			children: (
				<ProductDetailModal
					isHaveUnlock={isHaveUnlock}
					product={{
						...product,
						type: type as 'emoji' | 'sticker'
					}}
				/>
			)
		};

		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
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
					style={styles.image as ImageStyle}
					resizeMode="contain"
					alt={product?.shortname}
				/>
				{!isHaveUnlock && (
					<View style={styles.lockOverlay}>
						<MezonIconCDN icon={IconCDN.lockIcon} color={themeValue.text} width={size.s_40} height={size.s_40} />
					</View>
				)}
			</View>
			<View style={styles.content}>
				<Text style={styles.name} numberOfLines={1}>
					{product?.shortname}
				</Text>
				<View style={styles.buyBadge}>
					{!isHaveUnlock && <MezonIconCDN icon={IconCDN.payingIcon} color={themeValue.textStrong} width={size.s_16} height={size.s_16} />}
					<Text style={styles.buyBtnText}>{isHaveUnlock ? t('haveUnlocked') : t('unlockItemTitle')}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};

export default memo(ProductItem);
