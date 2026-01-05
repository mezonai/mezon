import { size, useTheme } from '@mezon/mobile-ui';
import {
	fetchLoadMoreTransaction,
	selectAddress,
	selectAllAccount,
	selectHasMore,
	selectTransactionHistory,
	transactionHistoryActions,
	useAppDispatch,
	useAppSelector,
	useWallet
} from '@mezon/store-mobile';
import { CURRENCY, formatBalanceToString } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import type { Transaction } from 'mmn-client-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import { Pressable } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import type { FilterType } from '../../../constants/transaction';
import { API_FILTER_PARAMS, TRANSACTION_FILTERS } from '../../../constants/transaction';
import { TransactionItem } from './TransactionItem';
import { style } from './styles';

export const HistoryTransactionScreen = () => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);
	const [activeTab, setActiveTab] = useState<FilterType>(TRANSACTION_FILTERS.ALL);
	const [isLoadMore, setIsLoadMore] = useState(false);
	const { walletDetail } = useWallet();
	const walletAddress = useSelector(selectAddress);
	const walletLedger = useAppSelector((state) => selectTransactionHistory(state));
	const hasMore = useAppSelector((state) => selectHasMore(state));
	const refList = useRef<any>(null);
	const tokenInWallet = useMemo(() => {
		return walletDetail?.balance || 0;
	}, [walletDetail?.balance]);

	const fetchInitial = useCallback(
		async (filter: FilterType) => {
			try {
				dispatch(transactionHistoryActions.resetTransactionHistory());
				await dispatch(
					fetchLoadMoreTransaction({
						address: walletAddress || '',
						filter: API_FILTER_PARAMS[filter],
						timeStamp: undefined,
						lastHash: undefined
					})
				);
			} catch (error) {
				console.error(`Error loading transactions:`, error);
			}
		},
		[dispatch, walletAddress]
	);

	const fetchLoadMore = useCallback(async () => {
		if (hasMore && !isLoadMore && walletLedger && walletLedger?.length > 0) {
			setIsLoadMore(true);
			try {
				const lastItem = walletLedger?.[walletLedger?.length - 1];
				await dispatch(
					fetchLoadMoreTransaction({
						address: walletAddress || '',
						filter: API_FILTER_PARAMS[activeTab],
						timeStamp: new Date(lastItem?.transaction_timestamp * 1000).toISOString(),
						lastHash: lastItem?.hash
					})
				);
			} catch (error) {
				console.error(`Error loading transactions:`, error);
			} finally {
				setIsLoadMore(false);
			}
		}
	}, [activeTab, dispatch, hasMore, isLoadMore, walletAddress, walletLedger]);

	useEffect(() => {
		fetchInitial(activeTab);
	}, [activeTab, fetchInitial]);

	const loadMore = useCallback(() => {
		fetchLoadMore();
	}, [fetchLoadMore]);

	const renderItem = useCallback(
		({ item }: { item: Transaction }) => {
			return <TransactionItem walletAddress={walletAddress} item={item} key={`token_receiver_${item.hash}`} />;
		},
		[walletAddress]
	);

	const ViewLoadMore = () => {
		return (
			<View style={styles.loadMoreChannelMessage}>
				<Flow size={size.s_30} color={'#ccc'} />
			</View>
		);
	};

	const onChangeActiveTab = useCallback((tab: FilterType) => {
		setActiveTab(tab);
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
						<Text style={styles.cardTitle}>{userProfile?.user?.username || userProfile?.user?.displayName}</Text>
					</View>
					<View style={styles.cardWalletLine}>
						<Text style={styles.cardTitle}>{t('balance')}</Text>
						<Text style={styles.cardAmount}>
							{formatBalanceToString((tokenInWallet || 0)?.toString())} {CURRENCY.SYMBOL}
						</Text>
					</View>
				</View>
			</LinearGradient>
			<Text style={styles.heading}>{t('historyTransaction.title')}</Text>
			<View style={styles.tabFilter}>
				<Pressable
					style={[styles.itemFilter, activeTab === TRANSACTION_FILTERS.ALL && styles.itemFilterActive]}
					onPress={() => onChangeActiveTab('all')}
				>
					<Text style={[styles.textFilter, activeTab === TRANSACTION_FILTERS.ALL && styles.textFilterActive]}>{t('all')}</Text>
				</Pressable>
				<Pressable
					style={[styles.itemFilter, activeTab === TRANSACTION_FILTERS.RECEIVED && styles.itemFilterActive]}
					onPress={() => onChangeActiveTab(TRANSACTION_FILTERS.RECEIVED)}
				>
					<Text style={[styles.textFilter, activeTab === TRANSACTION_FILTERS.RECEIVED && styles.textFilterActive]}>{t('inComing')}</Text>
				</Pressable>
				<Pressable
					style={[styles.itemFilter, activeTab === TRANSACTION_FILTERS.SENT && styles.itemFilterActive]}
					onPress={() => onChangeActiveTab(TRANSACTION_FILTERS.SENT)}
				>
					<Text style={[styles.textFilter, activeTab === TRANSACTION_FILTERS.SENT && styles.textFilterActive]}>{t('outGoing')}</Text>
				</Pressable>
			</View>
			<View style={styles.listContainer}>
				<FlashList
					ref={refList}
					key={`walletLedger_${userProfile?.user?.id}`}
					data={walletLedger ?? []}
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
