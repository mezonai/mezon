import { baseColor, useTheme } from '@mezon/mobile-ui';
import { accountActions, selectAllAccount, useAppDispatch, walletActions } from '@mezon/store-mobile';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { formatTokenAmount } from '../profile/SendToken';
import CONFETTI from './Confetti.json';
import { style } from './styles';

interface IClaimData {
	split_money_id: number;
	amount: number;
	description: string;
}

export const ClaimMoneyScreen = React.memo(({ navigation, route }: any) => {
	const luckyMoneyId = route?.params?.luckyMoneyId;
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token', 'common']);
	const dispatch = useAppDispatch();
	const styles = style(themeValue);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isClaimingToWallet, setIsClaimingToWallet] = useState<boolean>(false);
	const [errorClaim, setErrorClaim] = useState<boolean>(false);
	const [dataClaimSuccess, setDataClaimSuccess] = useState<IClaimData | null>(null);

	const spinValue = useRef(new Animated.Value(0)).current;
	const userProfile = useSelector(selectAllAccount);

	useEffect(() => {
		if (isLoading) {
			Animated.loop(
				Animated.timing(spinValue, {
					toValue: 1,
					duration: 1500,
					easing: Easing.linear,
					useNativeDriver: true
				})
			).start();
		}
	}, [isLoading, spinValue]);

	useFocusEffect(
		useCallback(() => {
			dispatch(accountActions.getUserProfile({ noCache: true }));
			dispatch(
				walletActions.fetchWalletDetail({
					userId: userProfile?.user?.id
				})
			);
		}, [dispatch, userProfile?.user?.id])
	);

	const handleFetchClaim = useCallback(
		async (id: string) => {
			setIsLoading(true);
			setErrorClaim(false);
			setDataClaimSuccess(null);
			try {
				const response = await dispatch(
					walletActions.claimAmountRedEnvelopeQR({
						id,
						userId: userProfile?.user?.id
					})
				);
				const data = response?.payload as IClaimData;
				if (data && data?.amount !== undefined) {
					setDataClaimSuccess(data);
				} else {
					setErrorClaim(true);
				}
			} catch (error) {
				setErrorClaim(true);
			} finally {
				setIsLoading(false);
			}
		},
		[dispatch, userProfile?.user?.id]
	);
	useEffect(() => {
		if (luckyMoneyId) {
			handleFetchClaim(luckyMoneyId);
		}
	}, [handleFetchClaim, luckyMoneyId]);

	const handleClaimToWallet = async () => {
		if (!dataClaimSuccess || isClaimingToWallet) return;
		setIsClaimingToWallet(true);
		try {
			const resp = await dispatch(
				walletActions.claimRedEnvelopeQR({
					id: luckyMoneyId,
					splitMoneyId: dataClaimSuccess.split_money_id,
					userId: userProfile?.user?.id
				})
			);
			if (resp) {
				Toast.show({
					type: 'success',
					text1: t('claimSuccess'),
					text2: t('claimSuccessDesc')
				});
				navigation.goBack();
			} else {
				Toast.show({
					type: 'error',
					text1: t('claimFailed'),
					text2: t('claimFailedDesc')
				});
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('claimFailed'),
				text2: t('claimFailedDesc')
			});
		} finally {
			setIsClaimingToWallet(false);
		}
	};

	const spin = spinValue.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg']
	});

	const renderLoadingScreen = () => (
		<View style={[styles.container]}>
			<StatusBarHeight />
			<View style={styles.loadingContainer}>
				<Animated.View style={{ transform: [{ rotate: spin }] }}>
					<MezonIconCDN icon={IconCDN.logoMezon} width={80} height={80} />
				</Animated.View>
				<Text style={styles.loadingText}>{t('common:processing')}</Text>
				<Text style={styles.loadingSubText}>{t('pleaseWait')}</Text>
			</View>
		</View>
	);

	const renderErrorScreen = () => (
		<View style={[styles.container]}>
			<StatusBarHeight />
			<View style={styles.fullscreenModal}>
				<View style={styles.modalHeader}>
					<Text style={styles.errorText}>{t('claimFailed')}</Text>
					<Text style={styles.errorSubText}>{t('claimFailedDesc')}</Text>
				</View>

				<TouchableOpacity style={[styles.confirmButton, { marginHorizontal: 0 }]} onPress={() => navigation.goBack()}>
					<Text style={styles.confirmText}>{t('common:close')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	const renderSuccessScreen = () => (
		<View style={[styles.container]}>
			<LottieView source={CONFETTI} autoPlay loop={true} style={styles.confetti} />
			<StatusBarHeight />

			<View style={styles.fullscreenModal}>
				<View style={styles.modalHeader}>
					<View>
						<MezonIconCDN icon={IconCDN.tickIcon} color={baseColor.bgSuccess} width={100} height={100} />
					</View>
					<Text style={styles.successText}>{t('congratulation')}</Text>
					<Text style={styles.amountText}>+ {formatTokenAmount(String(dataClaimSuccess?.amount || 0))} ₫</Text>
					<View style={styles.infoMain}>
						{!!dataClaimSuccess?.description && (
							<View style={styles.infoRow}>
								<Text style={styles.label}>{t('note')}</Text>
								<Text style={[styles.value]} numberOfLines={1}>
									{dataClaimSuccess?.description}
								</Text>
							</View>
						)}

						<View style={styles.infoRow}>
							<Text style={styles.label}>{t('date')}</Text>
							<Text style={styles.value}>{moment().format('DD/MM/YYYY')}</Text>
						</View>
					</View>
				</View>
			</View>
			<TouchableOpacity style={[styles.confirmButton]} onPress={handleClaimToWallet} disabled={isClaimingToWallet}>
				{isClaimingToWallet ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.confirmText}>{t('claimToWallet')}</Text>}
			</TouchableOpacity>
		</View>
	);

	if (isLoading) {
		return renderLoadingScreen();
	}

	if (errorClaim) {
		return renderErrorScreen();
	}

	return renderSuccessScreen();
});
