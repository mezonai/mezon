import { useTheme } from '@mezon/mobile-ui';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, AppState, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { getNotificationPermission } from '../../../utils/pushNotificationHelpers';
import { styles } from './styles';

export const TopAlert: React.FC = () => {
	const { themeValue } = useTheme();
	const { t } = useTranslation();
	const style = styles(themeValue);

	const slideAnim = useRef(new Animated.Value(-100)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;
	const [visible, setVisible] = useState<boolean>(false);

	useEffect(() => {
		let isMounted = true;
		const check = async () => {
			try {
				const hasPermission = await getNotificationPermission(false);
				if (!hasPermission && isMounted) setVisible(true);
			} catch (e) {
				console.error('Error checking notification permission:', e);
			}
		};
		check();

		const sub = AppState.addEventListener('change', async (state) => {
			if (state === 'active') {
				try {
					const hasPermission = await getNotificationPermission(false);
					if (hasPermission) setVisible(false);
				} catch (e) {
					console.error('Error checking notification permission:', e);
				}
			}
		});

		return () => {
			isMounted = false;
			sub.remove();
		};
	}, []);

	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true
				}),
				Animated.timing(opacityAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true
				})
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: -100,
					duration: 300,
					useNativeDriver: true
				}),
				Animated.timing(opacityAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true
				})
			]).start();
		}
	}, [visible, slideAnim, opacityAnim]);

	const handleClose = () => {
		setVisible(false);
	};

	const handleEnablePress = async () => {
		try {
			if (Platform.OS === 'ios') {
				await Linking.openURL('app-settings:');
			} else {
				await Linking.openSettings();
			}
			setVisible(false);
		} catch (e) {
			setVisible(false);
		}
	};

	if (!visible) {
		return null;
	}

	return (
		<Animated.View
			style={[
				style.container,
				{
					transform: [{ translateY: slideAnim }],
					opacity: opacityAnim
				}
			]}
		>
			<View style={style.content}>
				<View style={style.textContainer}>
					<Text style={style.title}>{t('seeWhenAnswersAppear', { ns: 'notification' })}</Text>
					<Text style={style.subtitle}>{t('enablePushNotifications', { ns: 'notification' })}</Text>
				</View>

				<TouchableOpacity style={style.enableButton} onPress={handleEnablePress} activeOpacity={0.8}>
					<Text style={style.enableButtonText}>{t('enable', { ns: 'common' })}</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity style={style.closeButton} onPress={handleClose} activeOpacity={0.7}>
				<Text style={style.closeButtonText}>×</Text>
			</TouchableOpacity>
		</Animated.View>
	);
};
