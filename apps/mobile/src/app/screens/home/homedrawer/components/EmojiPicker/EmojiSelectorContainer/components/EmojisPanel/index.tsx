import { ActionEmitEvent } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import { emojiRecentActions, selectAllAccount, useAppDispatch } from '@mezon/store-mobile';
import type { IEmoji } from '@mezon/utils';
import { ITEM_TYPE, getSrcEmoji } from '@mezon/utils';
import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../constants/icon_cdn';

const EmojiItem = memo(({ item, onPress, styles }: { item: IEmoji; onPress: (emoji: IEmoji) => void; styles: any }) => {
	if (item?.isEmpty) {
		return <View style={styles.wrapperIconEmoji} />;
	}
	return (
		<TouchableOpacity style={styles.wrapperIconEmoji} onPress={() => onPress(item)}>
			<FastImage source={{ uri: !item.src ? getSrcEmoji(item?.id) : item.src }} style={styles.iconEmoji} resizeMode={'contain'} />
			{item.isForSale && !item.src && (
				<View style={styles.wrapperIconEmojiLocked}>
					<MezonIconCDN icon={IconCDN.lockIcon} color={'#e1e1e1'} width={size.s_16} height={size.s_16} />
				</View>
			)}
		</TouchableOpacity>
	);
});

interface IEmojiRowProps {
	emojisData: IEmoji[];
	onEmojiSelect: (emoji: IEmoji) => void;
	styles?: any;
}

const EmojisPanel = ({ emojisData, onEmojiSelect, styles }: IEmojiRowProps) => {
	const { t } = useTranslation(['token', 'common']);
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);

	const onBuyEmoji = useCallback(
		async (emoji: IEmoji) => {
			try {
				if (emoji.id) {
					const resp = await dispatch(
						emojiRecentActions.buyItemForSale({
							id: emoji?.id,
							type: ITEM_TYPE.EMOJI,
							creatorId: emoji?.creatorId,
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
				console.error('Error buying emoji:', emoji);
				Toast.show({ type: 'error', text1: t('common:failedToBuyItem') });
			}
		},
		[t, userProfile?.user?.id, userProfile?.user?.username]
	);

	const onPress = useCallback(
		(emoji: IEmoji) => {
			if (emoji?.isForSale && !emoji.src) {
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

	return (
		<View style={styles.columnWrapper}>
			{emojisData.map((item) => (
				<EmojiItem key={item.id || `empty-${Math.random()}`} item={item} onPress={onPress} styles={styles} />
			))}
		</View>
	);
};

export default memo(EmojisPanel);
