import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { emojiRecentActions, useAppDispatch } from '@mezon/store-mobile';
import { IEmoji, getSrcEmoji } from '@mezon/utils';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, FlatList, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import MezonConfirm from '../../../../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../../../../hooks/useTabletLandscape';
import { style } from '../../styles';

type EmojisPanelProps = {
	emojisData: IEmoji[];
	onEmojiSelect: (emoji: IEmoji) => void;
};

const EmojiItem = memo(({ item, onPress }: { item: IEmoji; onPress: (emoji: IEmoji) => void }) => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = style(themeValue, isTabletLandscape);

	return (
		<TouchableOpacity style={styles.wrapperIconEmoji} onPress={() => onPress(item)}>
			<FastImage source={{ uri: !item.src ? getSrcEmoji(item?.id) : item.src }} style={styles.iconEmoji} resizeMode={'contain'} />
			{item.is_for_sale && !item.src && (
				<View style={styles.wrapperIconEmojiLocked}>
					<MezonIconCDN icon={IconCDN.lockIcon} color={'#e1e1e1'} width={size.s_16} height={size.s_16} />
				</View>
			)}
		</TouchableOpacity>
	);
});

const EmojisPanel: FC<EmojisPanelProps> = ({ emojisData, onEmojiSelect }) => {
	const { t } = useTranslation(['token']);
	const dispatch = useAppDispatch();
	const COLUMNS = 9;
	const ITEM_HEIGHT = 40;

	const onBuyEmoji = useCallback(
		async (emoji: IEmoji) => {
			try {
				if (emoji.id) {
					const resp = await dispatch(emojiRecentActions.buyItemForSale({ id: emoji?.id, type: 0 }));
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
				console.error('Error buying emoji:', emoji);
				Toast.show({ type: 'error', text1: 'Failed to buy item.' });
			}
		},
		[dispatch]
	);

	const onPress = useCallback(
		(emoji: IEmoji) => {
			if (emoji?.is_for_sale && !emoji.src) {
				const data = {
					children: (
						<MezonConfirm
							onConfirm={() => onBuyEmoji(emoji)}
							title={t('unlockItemTitle')}
							content={t('unlockItemDes')}
							confirmText={t('confirmUnlock')}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			} else {
				onEmojiSelect(emoji);
			}
		},
		[onBuyEmoji, onEmojiSelect, t]
	);

	const getItemLayout = useCallback(
		(_, index) => ({
			length: ITEM_HEIGHT,
			offset: ITEM_HEIGHT * Math.floor(index / COLUMNS),
			index
		}),
		[]
	);

	const keyExtractor = useCallback((item: IEmoji) => `emoji-${item.id}`, []);

	const renderItem = useCallback(({ item }: { item: IEmoji }) => <EmojiItem item={item} onPress={onPress} />, [onPress]);

	const padData = useMemo(() => {
		if (!emojisData?.length) return [];
		const remainder = emojisData.length % COLUMNS;
		if (remainder === 0) return emojisData;

		const paddingCount = COLUMNS - remainder;
		const paddedItems = Array.from({ length: paddingCount }, (_, i) => ({
			id: `empty-${i}`,
			title: '',
			isEmpty: true
		}));

		return [...emojisData, ...paddedItems];
	}, [emojisData]);

	return (
		<FlatList
			data={padData}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			numColumns={COLUMNS}
			getItemLayout={getItemLayout}
			removeClippedSubviews={true}
			scrollEnabled={false}
			columnWrapperStyle={{ justifyContent: 'space-between' }}
			maxToRenderPerBatch={10}
			windowSize={10}
			initialNumToRender={10}
			keyboardShouldPersistTaps="handled"
			showsVerticalScrollIndicator={false}
			style={{ flex: 1 }}
		/>
	);
};

export default memo(EmojisPanel);
