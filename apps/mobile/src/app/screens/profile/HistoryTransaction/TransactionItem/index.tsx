import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAllUsersByUser } from '@mezon/store-mobile';
import { CURRENCY, formatBalanceToString } from '@mezon/utils';
import type { Transaction } from 'mmn-client-js';
import moment from 'moment';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { TRANSACTION_ITEM } from '../../../../constants/transaction';
import TransactionDetailModal from '../TransactionDetailModal';
import { style } from './styles';

export const TransactionItem = ({ item, walletAddress }: { item: Transaction; walletAddress: string }) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);
	const styles = style(themeValue);
	const usersClan = useSelector(selectAllUsersByUser);

	const onPressItem = useCallback(async () => {
		const data = {
			children: <TransactionDetailModal usersClan={usersClan} transactionHash={item.hash} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [item, usersClan]);

	return (
		<Pressable style={styles.container} onPress={onPressItem}>
			<View style={styles.userItem}>
				<View
					style={[
						styles.expandIcon,
						{
							backgroundColor: walletAddress !== item?.from_address ? 'rgba(20,83,45,0.2)' : 'rgba(127,29,29,0.2)',
							transform: [{ rotateZ: walletAddress !== item?.from_address ? '180deg' : '0deg' }]
						}
					]}
				>
					<MezonIconCDN
						icon={IconCDN.chevronSmallRightIcon}
						color={walletAddress !== item?.from_address ? baseColor.bgSuccess : baseColor.buzzRed}
						width={size.s_20}
						height={size.s_20}
					/>
				</View>

				<View style={styles.userRowItem}>
					<View style={styles.userRowHeader}>
						<Text
							style={[
								styles.title,
								{
									color: walletAddress !== item?.from_address ? baseColor.bgSuccess : baseColor.buzzRed,
									fontWeight: 'bold'
								}
							]}
						>
							{formatBalanceToString((item.value || 0)?.toString())} {CURRENCY.SYMBOL}
						</Text>
						<Text style={styles.code}>
							{walletAddress !== item?.from_address ? t('historyTransaction.detail.received') : t('historyTransaction.detail.sent')}
						</Text>
					</View>
					<View style={styles.userRowHeader}>
						<Text style={styles.code}>
							{t('historyTransaction.transactionCode', {
								code: item.hash?.slice?.(-TRANSACTION_ITEM.ID_LENGTH)
							})}
						</Text>
						<Text style={styles.code}>{moment(new Date((item?.transaction_timestamp ?? 0) * 1000)).format('DD/MM/YYYY HH:mm')}</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);
};
