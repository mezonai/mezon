import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { accountActions, useAppDispatch } from '@mezon/store-mobile';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { HistoryTransactionScreen } from '../profile/HistoryTransaction';
import { SendTokenScreen } from '../profile/SendToken';
import { WalletManageScreen } from '../profile/WalletManage';
import { style } from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.7;

const CustomDrawer = ({ onClose, onChangeActiveScreen, navigation, activeScreen }) => {
	const { themeValue } = useTheme();
	const { t: tStack } = useTranslation('screenStack');
	const styles = style(themeValue);

	return (
		<View style={[styles.drawerContainer]}>
			<SafeAreaView style={styles.drawerContent}>
				{/* Header */}
				<View style={[styles.drawerHeader]}>
					<Text style={[styles.headerTitle]}>{tStack('settingStack.menu')}</Text>
					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<Text style={styles.closeButtonText}>✕</Text>
					</TouchableOpacity>
				</View>

				{/* Menu Items */}
				<View style={styles.menuContainer}>
					<TouchableOpacity
						onPress={() => {
							onChangeActiveScreen('transfer');
						}}
						style={[styles.menuItem, activeScreen === 'transfer' && { backgroundColor: themeValue?.secondaryLight }]}
					>
						<MezonIconCDN icon={IconCDN.sendMoneyIcon} height={size.s_20} width={size.s_20} color={baseColor.bgSuccess} />
						<Text style={styles.menuText}>{tStack('settingStack.sendToken')}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => {
							onChangeActiveScreen('manage');
						}}
						style={[styles.menuItem, activeScreen === 'manage' && { backgroundColor: themeValue?.secondaryLight }]}
					>
						<View style={{ transform: [{ rotate: '180deg' }] }}>
							<MezonIconCDN icon={IconCDN.sendMoneyIcon} height={size.s_20} width={size.s_20} color={baseColor.bgSuccess} />
						</View>
						<Text style={styles.menuText}>{tStack('settingStack.walletManagement')}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.menuItem, activeScreen === 'history' && { backgroundColor: themeValue?.secondaryLight }]}
						onPress={() => {
							onChangeActiveScreen('history');
						}}
					>
						<MezonIconCDN icon={IconCDN.historyIcon} height={size.s_22} width={size.s_22} color={baseColor.bgSuccess} />
						<Text style={styles.menuText}>{tStack('settingStack.historyTransaction')}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.menuItem]}
						onPress={() => {
							navigation.goBack();
						}}
					>
						<MezonIconCDN icon={IconCDN.doorExitIcon} color={baseColor.redStrong} width={size.s_20} height={size.s_20} />
						<Text style={[styles.menuText, { color: baseColor.redStrong }]}>{tStack('settingStack.quit')}</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		</View>
	);
};

export const WalletScreen = React.memo(({ navigation, route }: any) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['common']);
	const { t: tStack } = useTranslation(['screenStack']);

	const styles = style(themeValue);

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
	const overlayOpacity = useRef(new Animated.Value(0)).current;
	const [activeScreen, setActiveScreen] = useState(route?.params?.activeScreen || 'transfer');
	const dispatch = useAppDispatch();

	useFocusEffect(
		useCallback(() => {
			dispatch(accountActions.getUserProfile({ noCache: true }));
		}, [dispatch])
	);

	const openDrawer = () => {
		setIsDrawerOpen(true);
		Animated.parallel([
			Animated.timing(translateX, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true
			}),
			Animated.timing(overlayOpacity, {
				toValue: 0.5,
				duration: 300,
				useNativeDriver: true
			})
		]).start();
	};

	const closeDrawer = useCallback(() => {
		Animated.parallel([
			Animated.timing(translateX, {
				toValue: -DRAWER_WIDTH,
				duration: 200,
				useNativeDriver: true
			}),
			Animated.timing(overlayOpacity, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true
			})
		]).start(() => {
			setIsDrawerOpen(false);
		});
	}, [overlayOpacity, translateX]);

	const onChangeActiveScreen = useCallback(
		(newScreen: string) => {
			setActiveScreen(newScreen);
			closeDrawer();
		},
		[closeDrawer]
	);

	return (
		<View style={[styles.container]}>
			<StatusBarHeight />

			<View style={styles.header}>
				<TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
					<View style={styles.hamburger}>
						<View style={[styles.hamburgerLine, { backgroundColor: themeValue?.white }]} />
						<View style={[styles.hamburgerLine, { backgroundColor: themeValue?.white }]} />
						<View style={[styles.hamburgerLine, { backgroundColor: themeValue?.white }]} />
					</View>
				</TouchableOpacity>
				<TouchableOpacity onPress={openDrawer}>
					<Text style={styles.headerText}>{activeScreen === 'manage' ? tStack('settingStack.walletManagement') : t('wallet')}</Text>
				</TouchableOpacity>
			</View>

			{activeScreen === 'transfer' ? (
				<SendTokenScreen navigation={navigation} route={route} />
			) : activeScreen === 'manage' ? (
				<WalletManageScreen />
			) : activeScreen === 'history' ? (
				<HistoryTransactionScreen />
			) : (
				<View />
			)}
			{/* Drawer Overlay and Content */}
			{isDrawerOpen && (
				<>
					{/* Overlay */}
					<Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
						<TouchableOpacity style={styles.overlayTouch} onPress={closeDrawer} activeOpacity={1} />
					</Animated.View>

					{/* Drawer */}
					<Animated.View
						style={[
							styles.drawer,
							{
								transform: [{ translateX }]
							}
						]}
					>
						<CustomDrawer
							onClose={closeDrawer}
							onChangeActiveScreen={onChangeActiveScreen}
							navigation={navigation}
							activeScreen={activeScreen}
						/>
					</Animated.View>
				</>
			)}
		</View>
	);
});
