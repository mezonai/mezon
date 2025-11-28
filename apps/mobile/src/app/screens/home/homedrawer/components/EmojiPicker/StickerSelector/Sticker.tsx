/* eslint-disable react/jsx-no-useless-fragment */
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { emojiRecentActions, selectAllAccount, useAppDispatch } from '@mezon/store-mobile';
import { FOR_SALE_CATE, ITEM_TYPE } from '@mezon/utils';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageStyle, ListRenderItem } from 'react-native';
import { DeviceEventEmitter, FlatList, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import RenderAudioItem from './SoundStickerItem';
import { style } from './styles';

interface IStickerProps {
	stickerList: any[];
	categoryName: string;
	onClickSticker: (sticker: any) => void;
	forSale?: boolean;
	isAudio?: boolean;
}

const NUM_COLUMNS = 5;

const StickerItem = memo(({ item, onPress, isAudio, styles }: any) => {
	return (
		<>
			{isAudio ? (
				<>
					{item?.source && (
						<TouchableOpacity onPress={() => onPress(item)} style={[styles.audioContent, styles.itemMargin]}>
							<RenderAudioItem audioURL={item.source} />
							<Text style={styles.soundName} numberOfLines={1}>
								{item?.shortname}
							</Text>
						</TouchableOpacity>
					)}
				</>
			) : (
				<TouchableOpacity onPress={() => onPress(item)} style={[styles.content, styles.itemMargin]}>
					<FastImage
						source={{
							uri: item?.source ? item.source : `${process.env.NX_BASE_IMG_URL}/stickers/${item?.id}.webp`,
							cache: FastImage.cacheControl.immutable,
							priority: FastImage.priority.high
						}}
						style={styles.imageFull}
					/>
					{item?.is_for_sale && !item?.source && (
						<View style={styles.wrapperIconLocked}>
							<MezonIconCDN icon={IconCDN.lockIcon} color={styles.lockIconColor} width={size.s_30} height={size.s_30} />
						</View>
					)}
				</TouchableOpacity>
			)}
		</>
	);
});

const Sticker = ({ stickerList, categoryName, onClickSticker, isAudio, forSale }: IStickerProps) => {
	const { themeValue } = useTheme();
	const widthScreen = useWindowDimensions().width;
	const styles = style(themeValue, widthScreen);
	const { t } = useTranslation(['token', 'common']);
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);
	const [isExpanded, setIsExpanded] = useState(!(categoryName === FOR_SALE_CATE && forSale));

	const displayCategoryName = useMemo(() => {
		if (!categoryName) return '';
		return categoryName === FOR_SALE_CATE ? t('common:emojiCategories.forsale') : categoryName;
	}, [categoryName, t]);

	const stickersListByCategoryName = useMemo(() => {
		const data = stickerList?.filter((sticker) => {
			if (categoryName === FOR_SALE_CATE && forSale) {
				return sticker?.is_for_sale;
			}
			return sticker?.clan_name === categoryName && sticker?.source && !sticker?.is_for_sale;
		});
		if (!data?.length) return [];
		const remainder = data.length % NUM_COLUMNS;
		if (remainder === 0) return data;

		const paddingCount = NUM_COLUMNS - remainder;
		const paddedItems = Array.from({ length: paddingCount }, (_, i) => ({
			id: `empty-${i}`,
			title: '',
			isEmpty: true
		}));

		return [...data, ...paddedItems];
	}, [stickerList, categoryName, forSale]);

	const onBuySticker = useCallback(
		async (sticker: any) => {
			try {
				if (sticker.id) {
					const resp = await dispatch(
						emojiRecentActions.buyItemForSale({
							id: sticker?.id,
							type: ITEM_TYPE.STICKER,
							creatorId: sticker?.creator_id,
							username: userProfile?.user?.username,
							senderId: userProfile?.user?.id
						})
					);
					if (!resp?.type?.includes('rejected')) {
						Toast.show({
							type: 'success',
							text1: t('common:successBuyItem')
						});
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
					} else {
						Toast.show({ type: 'error', text1: t('common:failedToBuyItem') });
					}
				}
			} catch (error) {
				console.error('Error buying sticker:', error);
				Toast.show({ type: 'error', text1: t('common:failedToBuyItem') });
			}
		},
		[t, userProfile?.user?.id, userProfile?.user?.username]
	);

	const onPress = useCallback(
		(sticker: any) => {
			if (sticker?.is_for_sale && !sticker?.source) {
				const data = {
					children: (
						<MezonConfirm
							onConfirm={() => onBuySticker(sticker)}
							title={t('unlockItemTitle')}
							content={t('unlockItemDes')}
							confirmText={t('confirmUnlock')}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			} else {
				onClickSticker(sticker);
			}
		},
		[t, onBuySticker, onClickSticker]
	);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	const renderItem: ListRenderItem<any> = useCallback(
		({ item }) => <StickerItem item={item} onPress={onPress} isAudio={isAudio} styles={styles} />,
		[onPress, isAudio, styles]
	);

	const keyExtractor = useCallback((item: any) => `${item?.id}_${item?.clan_name}`, []);

	const getItemLayout = useCallback(
		(_: any, index: number) => {
			const itemHeight = (isAudio ? styles.audioContent.height : styles.content.height) as number;

			return {
				length: itemHeight,
				offset: itemHeight * Math.floor(index / NUM_COLUMNS),
				index
			};
		},
		[isAudio, styles.audioContent.height, styles.content.height]
	);

	return (
		<View key={`${categoryName}_stickers-parent`}>
			<TouchableOpacity onPress={toggleExpand} style={styles.sessionHeader}>
				<Text style={styles.sessionTitle}>{displayCategoryName}</Text>
				<MezonIconCDN
					icon={isExpanded ? IconCDN.chevronDownSmallIcon : IconCDN.chevronSmallRightIcon}
					color={themeValue.text}
					width={size.s_16}
					height={size.s_16}
					customStyle={styles.chevronIcon as ImageStyle}
				/>
			</TouchableOpacity>
			{isExpanded && (
				<FlatList
					data={stickersListByCategoryName}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					numColumns={NUM_COLUMNS}
					scrollEnabled={false}
					removeClippedSubviews={true}
					maxToRenderPerBatch={5}
					windowSize={5}
					getItemLayout={getItemLayout}
					initialNumToRender={5}
					style={styles.sessionContent}
					columnWrapperStyle={styles.columnWrapper}
				/>
			)}
		</View>
	);
};

export default memo(Sticker);
