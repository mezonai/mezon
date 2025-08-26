import { size, useTheme } from '@mezon/mobile-ui';
import {
	fetchListWalletLedger,
	selectAllAccount,
	selectCountWalletLedger,
	selectWalletLedger,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { formatNumber } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { ApiWalletLedger } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import { Pressable } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { API_FILTER_PARAMS, FilterType, LIMIT_WALLET, TRANSACTION_FILTERS } from '../../../constants/transaction';
import { TransactionItem } from './TransactionItem';
import { style } from './styles';

export const HistoryTransactionScreen = () => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const walletLedger = useAppSelector((state) => selectWalletLedger(state));
	const userProfile = useSelector(selectAllAccount);
	const count = useAppSelector((state) => selectCountWalletLedger(state));
	const [page, setPage] = useState(1);
	const [activeTab, setActiveTab] = useState<FilterType>(TRANSACTION_FILTERS.ALL);
	const [isLoadMore, setIsLoadMore] = useState(false);

	const totalPages = useMemo(() => (count === undefined ? 0 : Math.ceil(count / LIMIT_WALLET)), [count]);
	const isNextPage = useMemo(() => page < totalPages, [page, totalPages]);
	const [currentTransactionItem, setCurrentTransactionItem] = useState<string>('');

	const refList = useRef<any>(null);
	const tokenInWallet = useMemo(() => {
		return userProfile?.wallet || 0;
	}, [userProfile?.wallet]);

	useEffect(() => {
		dispatch(fetchListWalletLedger({ page, filter: API_FILTER_PARAMS[activeTab] }));
	}, [page, activeTab]);

	const loadMore = useCallback(() => {
		if (isNextPage && !isLoadMore) {
			dispatch(fetchListWalletLedger({ page: page + 1, filter: API_FILTER_PARAMS[activeTab] })).finally(() => {
				setPage((prev) => prev + 1);
				setIsLoadMore(false);
			});
		}
	}, [page, isNextPage, isLoadMore]);

	const onPressItem = useCallback(async (id: string) => {
		setCurrentTransactionItem(id);
	}, []);

	const renderItem = useCallback(
		({ item }: { item: ApiWalletLedger }) => {
			const isExpand = currentTransactionItem === item?.transaction_id;
			return <TransactionItem item={item} key={`token_receiver_${item.id}`} onPress={onPressItem} isExpand={isExpand} />;
		},
		[currentTransactionItem]
	);

	const ViewLoadMore = () => {
		return (
			<View style={styles.loadMoreChannelMessage}>
				<Flow size={size.s_30} color={'#ccc'} />
			</View>
		);
	};

	const onChangeActiveTab = useCallback((tab: FilterType) => {
		setCurrentTransactionItem('');
		setActiveTab(tab);
		setPage(1);
		refList?.current?.scrollToOffset({ offset: 0, animated: false });
	}, []);

	return (
		<View style={styles.container}>
			<LinearGradient
				start={{ x: 1, y: 1 }}
				end={{ x: 0, y: 1 }}
				colors={[themeValue.secondaryLight, themeValue.colorAvatarDefault]}
				style={styles.cardWallet}
			>
				<View style={styles.cardWalletWrapper}>
					<View style={styles.cardWalletLine}>
						<Text style={styles.cardTitle}>{t('debitAccount')}</Text>
						<Text style={styles.cardTitle}>{userProfile?.user?.username || userProfile?.user?.display_name}</Text>
					</View>
					<View style={styles.cardWalletLine}>
						<Text style={styles.cardTitle}>{t('balance')}</Text>
						<Text style={styles.cardAmount}>{tokenInWallet ? formatNumber(Number(tokenInWallet), 'vi-VN', 'VND') : '0'}</Text>
					</View>
				</View>
			</LinearGradient>
			<Text style={styles.heading}>{t('historyTransaction.title')}</Text>
			<View style={styles.tabFilter}>
				<Pressable
					style={[styles.itemFilter, activeTab === TRANSACTION_FILTERS.ALL && styles.itemFilterActive]}
					onPress={() => onChangeActiveTab('all')}
				>
					<Text style={[styles.textFilter, activeTab === TRANSACTION_FILTERS.ALL && { color: 'white' }]}>{t('all')}</Text>
				</Pressable>
				<Pressable
					style={[styles.itemFilter, activeTab === TRANSACTION_FILTERS.RECEIVED && styles.itemFilterActive]}
					onPress={() => onChangeActiveTab(TRANSACTION_FILTERS.RECEIVED)}
				>
					<Text style={[styles.textFilter, activeTab === TRANSACTION_FILTERS.RECEIVED && { color: 'white' }]}>{t('inComing')}</Text>
				</Pressable>
				<Pressable
					style={[styles.itemFilter, activeTab === TRANSACTION_FILTERS.SENT && styles.itemFilterActive]}
					onPress={() => onChangeActiveTab(TRANSACTION_FILTERS.SENT)}
				>
					<Text style={[styles.textFilter, activeTab === TRANSACTION_FILTERS.SENT && { color: 'white' }]}>{t('outGoing')}</Text>
				</Pressable>
			</View>
			<View style={{ flexGrow: 1 }}>
				<FlashList
					ref={refList}
					key={`walletLedger_${userProfile?.user?.id}`}
					data={walletLedger?.filter((item) => {
						if (activeTab === TRANSACTION_FILTERS.ALL) return true;
						if (activeTab === TRANSACTION_FILTERS.RECEIVED) return item.value > 0;
						if (activeTab === TRANSACTION_FILTERS.SENT) return item.value < 0;
						return false;
					})}
					renderItem={renderItem}
					removeClippedSubviews={true}
					showsVerticalScrollIndicator={false}
					estimatedItemSize={size.s_50}
					onEndReached={loadMore}
					onEndReachedThreshold={0.5}
					ListFooterComponent={isLoadMore ? <ViewLoadMore /> : null}
				/>
			</View>
		</View>
	);
};
