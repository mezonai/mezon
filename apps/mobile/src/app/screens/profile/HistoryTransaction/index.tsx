import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, Colors, size, useTheme } from '@mezon/mobile-ui';
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
import moment from 'moment';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import { Pressable } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';
import { TransactionModal } from './TransactionModal';

const limitWallet = 8;
export const HistoryTransactionScreen = () => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const walletLedger = useAppSelector((state) => selectWalletLedger(state));
	const userProfile = useSelector(selectAllAccount);
	const count = useAppSelector((state) => selectCountWalletLedger(state));
	const [page, setPage] = useState(1);
	const [activeTab, setActiveTab] = useState('all');
	const [isLoadMore, setIsLoadMore] = useState(false);

	const totalPages = count === undefined ? 0 : Math.ceil(count / limitWallet);
	const isNextPage = page < totalPages;

	const refList = useRef<any>(null);
	const tokenInWallet = useMemo(() => {
		return userProfile?.wallet || 0;
	}, [userProfile?.wallet]);

	useEffect(() => {
		dispatch(fetchListWalletLedger({ page }));
	}, [dispatch, page]);

	const loadMore = () => {
		if (isNextPage && !isLoadMore) {
			setIsLoadMore(true);
			dispatch(fetchListWalletLedger({ page: page + 1 })).finally(() => {
				setPage(page + 1);
				setIsLoadMore(false);
			});
		}
	};

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
				<View style={{ transform: [{ rotateY: item?.value < 0 ? '180deg' : '0deg' }] }}>
					<MezonIconCDN
						icon={IconCDN.moneyTransferIcon}
						color={item?.value > 0 ? baseColor.bgSuccess : baseColor.buzzRed}
						width={size.s_24}
						height={size.s_24}
					/>
				</View>
				<View style={styles.userRowItem}>
					<View>
						<Text style={styles.title}>{moment(item?.create_time).format('DD/MM/YYYY')}</Text>
						<Text style={styles.code}>{t('historyTransaction.transactionCode', { code: item?.transaction_id })}</Text>
					</View>
					<Text style={[styles.title, { color: item?.value > 0 ? baseColor.bgSuccess : baseColor.buzzRed, fontWeight: 'bold' }]}>
						{valueText(item.value)}
					</Text>
				</View>
			</Pressable>
		);
	};

	const ViewLoadMore = () => {
		return (
			<View style={styles.loadMoreChannelMessage}>
				<Flow size={size.s_30} color={Colors.tertiary} />
			</View>
		);
	};

	const onChangeActiveTab = (tab: string) => {
		setActiveTab(tab);
		refList?.current?.scrollToOffset({ offset: 0, animated: false });
	};

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
				<Pressable style={[styles.itemFilter, activeTab === 'all' && styles.itemFilterActive]} onPress={() => onChangeActiveTab('all')}>
					<Text style={[styles.textFilter, activeTab === 'all' && { color: 'white' }]}>{t('all')}</Text>
				</Pressable>
				<Pressable
					style={[styles.itemFilter, activeTab === 'incoming' && styles.itemFilterActive]}
					onPress={() => onChangeActiveTab('incoming')}
				>
					<Text style={[styles.textFilter, activeTab === 'incoming' && { color: 'white' }]}>{t('inComing')}</Text>
				</Pressable>
				<Pressable
					style={[styles.itemFilter, activeTab === 'outgoing' && styles.itemFilterActive]}
					onPress={() => onChangeActiveTab('outgoing')}
				>
					<Text style={[styles.textFilter, activeTab === 'outgoing' && { color: 'white' }]}>{t('outGoing')}</Text>
				</Pressable>
			</View>
			<FlashList
				ref={refList}
				data={walletLedger?.filter((item) => {
					if (activeTab === 'all') return true;
					if (activeTab === 'incoming') return item.value > 0;
					if (activeTab === 'outgoing') return item.value < 0;
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
	);
};
