/* eslint-disable @nx/enforce-module-boundaries */
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { emojiRecentActions, useAppDispatch } from '@mezon/store-mobile';
import { getSrcEmoji } from '@mezon/utils';
import { memo } from 'react';
import { DeviceEventEmitter, Image, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonConfirm from '../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

export interface IProductDetail {
	id: string;
	src?: string;
	source?: string;
	logo: string;
	shortname: string;
	type: 'emoji' | 'sticker';
}

interface ProductDetailModalProps {
	product: IProductDetail;
}

const ProductDetailModal = ({ product }: ProductDetailModalProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();

	const closeModal = () => DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });

	const handleConfirmPurchase = async () => {
		try {
			if (product?.id) {
				const apiType = product?.type === 'emoji' ? 0 : 1;
				const response = await dispatch(emojiRecentActions.buyItemForSale({ id: product?.id, type: apiType }));
				if (!response?.type?.includes('rejected')) {
					Toast.show({ type: 'success', text1: 'Buy item successfully!' });
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
				} else {
					Toast.show({ type: 'error', text1: 'Failed to buy item.' });
				}
			}
		} catch (error) {
			console.error('Error buying sticker:', error);
			Toast.show({ type: 'error', text1: 'Failed to buy item.' });
		}
	};

	const handleBuy = () => {
		const confirmData = {
			children: <MezonConfirm title="..." content="..." confirmText="..." onConfirm={handleConfirmPurchase} />
		};

		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data: confirmData });
	};

	return (
		<View style={styles.container}>
			<TouchableWithoutFeedback onPress={closeModal}>
				<View style={styles.backdrop} />
			</TouchableWithoutFeedback>

			<View style={styles.modal}>
				<TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
					<Text style={styles.closeBtnText}>×</Text>
				</TouchableOpacity>
				<ScrollView showsVerticalScrollIndicator={false}>
					<View style={styles.imageContainer}>
						<Image
							source={{
								uri:
									product?.type === 'emoji'
										? product?.src || getSrcEmoji(product?.id || '')
										: product?.source || `${process.env.NX_BASE_IMG_URL}/stickers/${product?.id}.webp`
							}}
							style={styles.image}
							resizeMode="contain"
							alt={product?.shortname}
						/>
					</View>

					<View style={styles.infoContainer}>
						<Text style={styles.productName}>{product?.shortname}</Text>

						<View style={styles.featuresContainer}>
							<Text style={styles.featuresTitle}>Thông tin chi tiết:</Text>
							<View style={styles.featureRow}>
								<Text style={styles.featureLabel}>Mã sản phẩm:</Text>
								<Text style={styles.featureValue}>{product?.id}</Text>
							</View>
							<View style={styles.featureRow}>
								<Text style={styles.featureLabel}>Tên sản phẩm:</Text>
								<Text style={styles.featureValue}>{product?.shortname}</Text>
							</View>
						</View>
					</View>
				</ScrollView>

				<View style={styles.actionContainer}>
					<TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
						<MezonIconCDN icon={IconCDN.payingIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
						<Text style={styles.buyBtnText}>Mua ngay</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

export default memo(ProductDetailModal);
