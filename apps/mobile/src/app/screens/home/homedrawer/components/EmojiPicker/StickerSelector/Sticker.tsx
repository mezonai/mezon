/* eslint-disable react/jsx-no-useless-fragment */
import { useAuth } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { emojiRecentActions, useAppDispatch } from '@mezon/store-mobile';
import { FOR_SALE_CATE, ITEM_TYPE } from '@mezon/utils';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, FlatList, ListRenderItem, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import MezonConfirm from '../../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import RenderAudioItem from './SoundStickerItem';
import { style } from './styles';

interface ISticker {
	stickerList: any[];
	categoryName: string;
	onClickSticker: (sticker: any) => void;
	forSale?: boolean;
	isAudio?: boolean;
}

const NUM_COLUMNS = 5;
const ITEM_MARGIN = 8;

const StickerItem = memo(({ item, onPress, isAudio, styles }: any) => {
	return (
		<>
			{isAudio ? (
				<>
					{item?.source && (
						<TouchableOpacity onPress={() => onPress(item)} style={[styles.audioContent, { margin: ITEM_MARGIN / 2 }]}>
							<RenderAudioItem audioURL={item?.source} />
							<Text style={styles.soundName} numberOfLines={1}>
								{item?.shortname}
							</Text>
						</TouchableOpacity>
					)}
				</>
			) : (
				<TouchableOpacity onPress={() => onPress(item)} style={[styles.content, { margin: ITEM_MARGIN / 2 }]}>
					<FastImage
						source={{
							uri: item?.source ? item?.source : `${process.env.NX_BASE_IMG_URL}/stickers/${item?.id}.webp`,
							cache: FastImage.cacheControl.immutable,
							priority: FastImage.priority.high
						}}
						style={{ height: '100%', width: '100%' }}
					/>
					{item?.is_for_sale && !item?.source && (
						<View style={styles.wrapperIconLocked}>
							<MezonIconCDN icon={IconCDN.lockIcon} color={'#e1e1e1'} width={size.s_30} height={size.s_30} />
						</View>
					)}
				</TouchableOpacity>
			)}
		</>
	);
});

export default memo(function Sticker({ stickerList, categoryName, onClickSticker, isAudio, forSale }: ISticker) {
	const { themeValue } = useTheme();
	const widthScreen = useWindowDimensions().width;
	const styles = style(themeValue, widthScreen);
	const { t } = useTranslation(['token']);
	const dispatch = useAppDispatch();
	const { userProfile } = useAuth();
	const [isExpanded, setIsExpanded] = useState(!(categoryName === FOR_SALE_CATE && forSale));

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
							props: {
								text2: 'Buy item successfully!',
								leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={30} height={17} />
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
		},
		[dispatch, userProfile?.user?.id, userProfile?.user?.username]
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
		(_: any, index: number) => ({
			length: isAudio ? styles.audioContent.height : styles.content.height,
			offset: (isAudio ? styles.audioContent.height : styles.content.height) * Math.floor(index / NUM_COLUMNS),
			index
		}),
		[isAudio, styles.audioContent.height, styles.content.height]
	);

	return (
		<View style={styles.session} key={`${categoryName}_stickers-parent`}>
			<TouchableOpacity onPress={toggleExpand} style={styles.sessionHeader}>
				<Text style={styles.sessionTitle}>{categoryName}</Text>
				<MezonIconCDN
					icon={isExpanded ? IconCDN.chevronDownSmallIcon : IconCDN.chevronSmallRightIcon}
					color={themeValue.text}
					width={size.s_16}
					height={size.s_16}
					customStyle={styles.chevronIcon}
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
					columnWrapperStyle={{ justifyContent: 'space-between' }}
				/>
			)}
		</View>
	);
});
