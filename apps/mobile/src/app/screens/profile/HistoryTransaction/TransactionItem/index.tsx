import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { fetchDetailTransaction, selectDetailedger, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { formatNumber } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { safeJSONParse } from 'mezon-js';
import { ApiWalletLedger } from 'mezon-js/api.gen';
import moment from 'moment';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { TRANSACTION_ITEM } from '../../../../constants/transaction';
import { style } from './styles';

const valueText = (v: number) => (v > 0 ? `+${formatNumber(v, 'vi-VN', 'VND')}` : formatNumber(v, 'vi-VN', 'VND'));

export const TransactionItem = ({ item, isExpand, onPress }: { item: ApiWalletLedger; isExpand: boolean; onPress: (id: string) => void }) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);
	const styles = style(themeValue);

	const dispatch = useAppDispatch();
	const detailLedger = useAppSelector((s) => selectDetailedger(s));

	const [loadingDetail, setLoadingDetail] = useState(false);

	const animation = useRef(new Animated.Value(0)).current;
	const [detailHeight, setDetailHeight] = useState(0);

	useEffect(() => {
		if (isExpand) {
			Animated.timing(animation, {
				toValue: detailHeight,
				duration: 50,
				useNativeDriver: false
			}).start();
		} else {
			animation.setValue(0);
		}
	}, [isExpand, detailHeight]);

	const onPressItem = async () => {
		if (!isExpand) {
			onPress(item.transaction_id);
			setDetailHeight(size.s_80);
			setLoadingDetail(true);
			await dispatch(fetchDetailTransaction({ transId: item.transaction_id }));
			setLoadingDetail(false);
		} else {
			onPress('');
		}
	};

	const formatDate = useMemo(() => {
		if (!isExpand) return '';
		return moment(detailLedger?.create_time).format('HH:mm – DD/MM/YYYY');
	}, [detailLedger?.create_time, isExpand]);

	const note = useMemo(() => {
		if (!isExpand) return '';
		if (typeof detailLedger?.metadata === 'string') return detailLedger.metadata;
		const m = safeJSONParse(detailLedger?.metadata || '{}');
		return m?.note || detailLedger?.metadata || '';
	}, [detailLedger?.metadata, isExpand]);

	const onContainerLayout = (e) => {
		const h = e.nativeEvent.layout.height;
		if (h && h !== detailHeight) {
			setDetailHeight(h);
			if (isExpand) animation.setValue(h);
		}
	};

	const copyTransactionId = () => {
		if (detailLedger?.trans_id) {
			Clipboard.setString(detailLedger.trans_id);
			Toast.show({
				type: 'success',
				props: {
					text2: t('historyTransaction.copied'),
					leadingIcon: <MezonIconCDN icon={IconCDN.copyIcon} color={themeValue.text} />
				}
			});
		}
	};

	const detailView = !loadingDetail ? (
		<View style={styles.detail} onLayout={onContainerLayout}>
			{[
				{
					label: t('historyTransaction.detail.transactionId'),
					value: detailLedger?.trans_id
				},
				{
					label: t('historyTransaction.detail.senderName'),
					value: detailLedger?.sender_username
				},
				{
					label: t('historyTransaction.detail.time'),
					value: formatDate
				},
				{
					label: t('historyTransaction.detail.receiverName'),
					value: detailLedger?.receiver_username
				},
				{
					label: t('historyTransaction.detail.note'),
					value: note
				},
				{
					label: t('historyTransaction.detail.amount'),
					value: valueText(item.value)
				}
			].map((field, idx) => (
				<View key={`${item.transaction_id}_${idx}`} style={styles.row}>
					<View style={styles.field}>
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
							<Text style={styles.title}>{field.label}</Text>
							{field.label === t('historyTransaction.detail.transactionId') && detailLedger?.trans_id && (
								<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
									<Pressable onPress={copyTransactionId} style={{ padding: 4 }}>
										<MezonIconCDN icon={IconCDN.copyIcon} color={themeValue.text} width={size.s_16} height={size.s_16} />
									</Pressable>
								</View>
							)}
						</View>
						<Text style={styles.description}>{field.value ?? ''}</Text>
					</View>
				</View>
			))}
		</View>
	) : (
		<View style={styles.loading}>
			<ActivityIndicator size="small" color={themeValue.text} />
		</View>
	);

	return (
		<Pressable style={styles.container} onPress={onPressItem}>
			<View style={styles.userItem}>
				<View
					style={[
						styles.expandIcon,
						{
							backgroundColor: item.value > 0 ? 'rgba(20,83,45,0.2)' : 'rgba(127,29,29,0.2)',
							transform: [{ rotateZ: isExpand ? '90deg' : '0deg' }]
						}
					]}
				>
					<MezonIconCDN
						icon={IconCDN.chevronSmallRightIcon}
						color={item.value > 0 ? baseColor.bgSuccess : baseColor.buzzRed}
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
									color: item.value > 0 ? baseColor.bgSuccess : baseColor.buzzRed,
									fontWeight: 'bold'
								}
							]}
						>
							{valueText(item.value)}
						</Text>
						<Text style={styles.code}>{item.value > 0 ? t('historyTransaction.received') : t('historyTransaction.sent')}</Text>
					</View>
					<View style={styles.userRowHeader}>
						<Text style={styles.code}>
							{t('historyTransaction.transactionCode', {
								code: item.transaction_id.slice(-TRANSACTION_ITEM.ID_LENGTH)
							})}
						</Text>
						<Text style={styles.code}>{moment(item.create_time).format('DD/MM/YYYY')}</Text>
					</View>
				</View>
			</View>

			<Animated.View style={{ height: animation, overflow: 'hidden' }}>{detailView}</Animated.View>
		</Pressable>
	);
};
