/* eslint-disable @nx/enforce-module-boundaries */
import { ActionEmitEvent, CheckIcon } from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import { emojiRecentActions, useAppDispatch } from '@mezon/store-mobile';
import { getSrcEmoji } from '@mezon/utils';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Image, ImageStyle, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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
	isHaveUnlock: boolean;
}

const ProductDetailModal = ({ product, isHaveUnlock }: ProductDetailModalProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { t } = useTranslation(['token']);

	const closeModal = () => DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });

	const handleConfirmPurchase = async () => {
		try {
			if (product?.id) {
				const apiType = product?.type === 'emoji' ? 0 : 1;
				const response = await dispatch(emojiRecentActions.buyItemForSale({ id: product?.id, type: apiType }));
				if (!response?.type?.includes('rejected')) {
					Toast.show({
						type: 'success',
						props: {
							text2: 'Buy item successfully!',
							leadingIcon: <CheckIcon color={Colors.green} width={30} height={17} />
						}
					});
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
			children: (
				<MezonConfirm
					onConfirm={() => handleConfirmPurchase()}
					title={t('unlockItemTitle')}
					content={t('unlockItemDes')}
					confirmText={t('confirmUnlock')}
				/>
			)
		};

		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data: confirmData });
	};

	return (
		<View style={styles.container}>
			<TouchableWithoutFeedback onPress={closeModal}>
				<View style={styles.backdrop} />
			</TouchableWithoutFeedback>

			<View style={styles.modal}>
				<ScrollView showsVerticalScrollIndicator={false}>
					<View style={styles.imageContainer}>
						<Image
							source={{
								uri:
									product?.type === 'emoji'
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

					<View style={styles.infoContainer}>
						<Text style={styles.productName}>{product?.shortname}</Text>
						<View style={styles.featuresContainer}>
							<Text style={styles.featuresTitle}>{t('detailTitle')}</Text>
							<View style={[styles.featureRow]}>
								<Text style={styles.featureLabel}>{t('code')}:</Text>
								<Text style={styles.featureValue} numberOfLines={1}>
									{product?.id}3 12312 3123 123 123 123 123{' '}
								</Text>
							</View>
							<View style={styles.featureRow}>
								<Text style={styles.featureLabel}>{t('name')}:</Text>
								<Text style={styles.featureValue} numberOfLines={1}>
									{product?.shortname}
								</Text>
							</View>
						</View>
					</View>
				</ScrollView>

				{!isHaveUnlock && (
					<View style={styles.actionContainer}>
						<TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
							<MezonIconCDN icon={IconCDN.payingIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
							<Text style={styles.buyBtnText}>{t('unlockItemTitle')}</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>
		</View>
	);
};

export default memo(ProductDetailModal);
