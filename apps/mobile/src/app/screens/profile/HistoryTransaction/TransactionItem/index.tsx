import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { fetchTransactionDetail, selectAllUsersByUser, selectDetailTransaction, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { CURRENCY, formatBalanceToString } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { safeJSONParse } from 'mezon-js';
import type { Transaction } from 'mmn-client-js';
import moment from 'moment';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Pressable, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { TRANSACTION_DETAIL, TRANSACTION_ITEM } from '../../../../constants/transaction';
import { style } from './styles';

export const TransactionItem = ({ item, walletAddress }: { item: Transaction; walletAddress: string }) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);
	const styles = style(themeValue);
	const usersClan = useSelector(selectAllUsersByUser);
	const [isExpand, setIsExpand] = useState(false);

	const dispatch = useAppDispatch();
	const detailLedger = useAppSelector((state) => selectDetailTransaction(state));

	const [loadingDetail, setLoadingDetail] = useState(false);

	const animation = useRef(new Animated.Value(0)).current;
	const [detailHeight, setDetailHeight] = useState(0);

	useEffect(() => {
		if (isExpand) {
			Animated.timing(animation, {
				toValue: detailHeight,
				duration: 100,
				useNativeDriver: false
			}).start();
		} else {
			animation.setValue(0);
		}
	}, [isExpand, detailHeight]);

	const onPressItem = async () => {
		if (!isExpand) {
			setIsExpand(true);
			setDetailHeight(size.s_80);
			setLoadingDetail(true);
			dispatch(fetchTransactionDetail({ txHash: item.hash }));
			setLoadingDetail(false);
		} else {
			setIsExpand(false);
		}
	};

	const formatDate = useMemo(() => {
		if (!isExpand) return '';
		return moment(new Date((detailLedger?.transaction_timestamp ?? 0) * 1000)).format('DD/MM/YYYY HH:mm');
	}, [detailLedger?.transaction_timestamp, isExpand]);

	const onContainerLayout = (e) => {
		const h = e.nativeEvent.layout.height;
		if (h && h !== detailHeight) {
			setDetailHeight(h);
			if (isExpand) animation.setValue(h);
		}
	};

	const copyTransactionId = () => {
		if (detailLedger?.hash) {
			Clipboard.setString(detailLedger?.hash);
			Toast.show({
				type: 'success',
				props: {
					text2: t('historyTransaction.copied'),
					leadingIcon: <MezonIconCDN icon={IconCDN.copyIcon} color={themeValue.text} />
				}
			});
		}
	};
	const detailFields = useMemo(() => {
		const extraInfo = safeJSONParse(detailLedger?.extra_info || '{}');
		const sender = extraInfo?.UserSenderId ? usersClan.find((user) => user.id === extraInfo?.UserSenderId) : null;
		const receiver = extraInfo?.UserReceiverId ? usersClan.find((user) => user.id === extraInfo?.UserReceiverId) : null;
		return [
			{
				label: t('historyTransaction.detail.transactionId'),
				value: detailLedger?.hash
			},
			{
				label: t('historyTransaction.detail.senderName'),
				value: sender?.username || ''
			},
			{
				label: t('historyTransaction.detail.time'),
				value: formatDate
			},
			{
				label: t('historyTransaction.detail.receiverName'),
				value: receiver?.username || ''
			},
			{
				label: t('historyTransaction.detail.note'),
				value: detailLedger?.text_data || TRANSACTION_DETAIL.DEFAULT_NOTE
			},
			{
				label: t('historyTransaction.detail.amount'),
				value: `${formatBalanceToString(detailLedger?.value)} ${CURRENCY.SYMBOL}`
			}
		];
	}, [detailLedger, usersClan, t, formatDate]);

	const detailView = !loadingDetail ? (
		<View style={styles.detail} onLayout={onContainerLayout}>
			{detailFields.map((field, idx) => (
				<View key={`${item.hash}_${idx}`} style={styles.row}>
					<View style={styles.field}>
						<TouchableOpacity
							disabled={field.label !== t('historyTransaction.detail.transactionId')}
							onPress={copyTransactionId}
							style={styles.touchableRow}
						>
							<Text style={styles.title}>{field.label}</Text>
							{field.label === t('historyTransaction.detail.transactionId') && detailLedger?.hash && (
								<View style={styles.copyIconWrapper}>
									<Pressable onPress={copyTransactionId} style={styles.copyButton}>
										<MezonIconCDN icon={IconCDN.copyIcon} color={themeValue.text} width={size.s_16} height={size.s_16} />
									</Pressable>
								</View>
							)}
						</TouchableOpacity>
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
							backgroundColor: walletAddress !== item?.from_address ? 'rgba(20,83,45,0.2)' : 'rgba(127,29,29,0.2)',
							transform: [{ rotateZ: isExpand ? '90deg' : '0deg' }]
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
							{formatBalanceToString((item.value || 0)?.toString())}
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

			<Animated.View style={[styles.animatedContainer, { height: animation }]}>{detailView}</Animated.View>
		</Pressable>
	);
};
