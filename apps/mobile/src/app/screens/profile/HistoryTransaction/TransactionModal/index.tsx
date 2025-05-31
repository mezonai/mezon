import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { fetchDetailTransaction, selectDetailedger, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { formatNumber } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import { style } from './styles';

interface ITransactionModalProps {
	transactionId: string;
	isMinus?: boolean;
}
export const TransactionModal = memo(({ transactionId, isMinus }: ITransactionModalProps) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);
	const detailLedger = useAppSelector((state) => selectDetailedger(state));
	const styles = style(themeValue, isTabletLandscape);
	const dispatch = useAppDispatch();

	const formatDate = useMemo(() => {
		const date = new Date(detailLedger?.create_time);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes} - ${day}/${month}/${year}`;
	}, [detailLedger?.create_time]);

	const note = useMemo(() => {
		const noteData = safeJSONParse(detailLedger?.metadata);
		return noteData?.note || detailLedger?.metadata || '';
	}, [detailLedger?.metadata]);

	const amount = useMemo(() => {
		if (isMinus) {
			return `-${formatNumber(detailLedger?.amount, 'vi-VN', 'VND')}`;
		}
		return `+${formatNumber(detailLedger?.amount, 'vi-VN', 'VND')}`;
	}, [detailLedger?.amount, isMinus]);

	useEffect(() => {
		dispatch(fetchDetailTransaction({ transId: transactionId }));
	}, [transactionId]);

	const handleClose = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	return (
		<View style={styles.main}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>{t('historyTransaction.detail.title')}</Text>
				</View>
				<View style={styles.row}>
					<Text style={styles.title}>{t('historyTransaction.detail.transactionId')}</Text>
					<Text style={styles.description}>{detailLedger?.trans_id}</Text>
				</View>
				<View style={styles.row}>
					<Text style={styles.title}>{t('historyTransaction.detail.time')}</Text>
					<Text style={styles.description}>{formatDate}</Text>
				</View>
				<View style={styles.row}>
					<Text style={styles.title}>{t('historyTransaction.detail.senderName')}</Text>
					<Text style={styles.description}>{detailLedger?.sender_username}</Text>
				</View>
				<View style={styles.row}>
					<Text style={styles.title}>{t('historyTransaction.detail.receiverName')}</Text>
					<Text style={styles.description}>{detailLedger?.receiver_username}</Text>
				</View>
				<View style={styles.row}>
					<Text style={styles.title}>{t('historyTransaction.detail.amount')}</Text>
					<Text style={[styles.description, { color: isMinus ? baseColor.buzzRed : baseColor.bgSuccess }]}>{amount}</Text>
				</View>
				<Text style={styles.title}>{t('historyTransaction.detail.note')}</Text>
				<View style={styles.noteField}>
					<Text style={styles.note}>{note}</Text>
				</View>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={handleClose} />
		</View>
	);
});
