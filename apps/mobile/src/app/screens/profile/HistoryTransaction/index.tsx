import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { fetchListWalletLedger, selectCountWalletLedger, selectWalletLedger, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { formatNumber } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { ApiWalletLedger } from 'mezon-js/api.gen';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SeparatorWithLine } from '../../../components/Common';
import { APP_SCREEN, SettingScreenProps } from '../../../navigation/ScreenTypes';
import { TransactionModal } from './TransactionModal';
import { style } from './styles';

const limitWallet = 8;
type ScreenHistoryTransaction = typeof APP_SCREEN.SETTINGS.HISTORY_TRANSACTION;
export const HistoryTransactionScreen = ({ navigation }: SettingScreenProps<ScreenHistoryTransaction>) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const walletLedger = useAppSelector((state) => selectWalletLedger(state));
	const count = useAppSelector((state) => selectCountWalletLedger(state));
	const [page, setPage] = useState(1);
	const totalPages = count === undefined ? 0 : Math.ceil(count / limitWallet);
	const isNextPage = page < totalPages;
	const isPrevPage = page > 1;

	useEffect(() => {
		dispatch(fetchListWalletLedger({ page: page }));
	}, []);

	const handleNextPage = () => {
		if (count) {
			dispatch(fetchListWalletLedger({ page: page + 1 }));
			setPage(page + 1);
		}
	};

	const handlePrevPage = () => {
		if (count) {
			dispatch(fetchListWalletLedger({ page: page - 1 }));
			setPage(page - 1);
		}
	};

	const toggleDetails = (transactionId: string, isMinus: boolean) => {
		const data = {
			children: <TransactionModal transactionId={transactionId} isMinus={isMinus} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const valueText = (value: number) => {
		if (value > 0) return `+${formatNumber(value, 'vi-VN', 'VND')}`;
		else return `${formatNumber(value, 'vi-VN', 'VND')}`;
	};

	const renderItem = ({ item }: { item: ApiWalletLedger }) => {
		return (
			<Pressable key={`token_receiver_${item.id}`} style={styles.userItem} onPress={() => toggleDetails(item.transaction_id, item?.value < 0)}>
				<View>
					<Text style={styles.title}>{moment(item?.create_time).format('DD/MM/YYYY')}</Text>
					<Text style={styles.code}>{t('historyTransaction.transactionCode', { code: item?.transaction_id })}</Text>
				</View>
				<Text style={[styles.title, { color: item?.value > 0 ? baseColor.bgSuccess : baseColor.buzzRed }]}>{valueText(item.value)}</Text>
			</Pressable>
		);
	};

	return (
		<View style={styles.container}>
			<FlashList
				data={walletLedger}
				renderItem={renderItem}
				ItemSeparatorComponent={SeparatorWithLine}
				removeClippedSubviews={true}
				estimatedItemSize={size.s_50}
			/>
			<View style={styles.cursor}>
				<TouchableOpacity
					style={[styles.cursorItem, { backgroundColor: !isPrevPage ? themeValue.borderHighlight : themeValue.borderDim }]}
					disabled={!isPrevPage}
					onPress={handlePrevPage}
				>
					<Text style={styles.title}>{t('historyTransaction.previousPage')}</Text>
				</TouchableOpacity>
				<View style={styles.page}>
					<Text style={styles.title}>{page}</Text>
				</View>
				<TouchableOpacity
					style={[styles.cursorItem, { backgroundColor: !isNextPage ? themeValue.borderHighlight : themeValue.borderDim }]}
					disabled={!isNextPage}
					onPress={handleNextPage}
				>
					<Text style={styles.title}>{t('historyTransaction.nextPage')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};
