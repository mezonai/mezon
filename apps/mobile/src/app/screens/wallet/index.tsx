import { Icons } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { HistoryTransactionScreen } from '../profile/HistoryTransaction';
import { SendTokenScreen } from '../profile/SendToken';
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
					<Text style={[styles.headerTitle]}>Menu</Text>
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
						<Icons.SendMoney height={size.s_20} width={size.s_20} color={baseColor.gray} />
						<Text style={styles.menuText}>{tStack('settingStack.sendToken')}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => {
							onChangeActiveScreen('withdraw');
						}}
						style={[styles.menuItem, activeScreen === 'withdraw' && { backgroundColor: themeValue?.secondaryLight }]}
					>
						<View style={{ transform: [{ rotate: '180deg' }] }}>
							<Icons.SendMoney height={size.s_20} width={size.s_20} color={baseColor.gray} />
						</View>
						<Text style={styles.menuText}>{tStack('settingStack.withdrawToken')}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.menuItem, activeScreen === 'history' && { backgroundColor: themeValue?.secondaryLight }]}
						onPress={() => {
							onChangeActiveScreen('history');
						}}
					>
						<Icons.History height={size.s_20} width={size.s_20} color={baseColor.gray} />
						<Text style={styles.menuText}>{tStack('settingStack.historyTransaction')}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.menuItem]}
						onPress={() => {
							navigation.goBack();
						}}
					>
						<MezonIconCDN icon={IconCDN.doorExitIcon} color={baseColor.redStrong} width={size.s_20} height={size.s_20} />
						<Text style={[styles.menuText, { color: baseColor.redStrong }]}>Quit</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		</View>
	);
};

export const WalletScreen = React.memo(({ navigation, route }: any) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['common']);
	const styles = style(themeValue);

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
	const overlayOpacity = useRef(new Animated.Value(0)).current;
	const [activeScreen, setActiveScreen] = useState(route?.params?.activeScreen || 'transfer');

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
					<Text style={styles.headerText}>{t('wallet')}</Text>
				</TouchableOpacity>
			</View>

			{activeScreen === 'transfer' || activeScreen === 'withdraw' ? (
				<SendTokenScreen navigation={navigation} route={route} />
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
