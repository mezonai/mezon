import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import FEATURE_BG from './featureBg.png';
import { style } from './styles';

const WelcomeScreen = ({ navigation }) => {
	const styles = style();
	const { t } = useTranslation(['common']);
	const onGetStarted = () => {
		navigation.navigate(APP_SCREEN.LOGIN);
	};

	return (
		<View style={styles.welcomeContainer}>
			<LinearGradient colors={['#f0edfd', '#beb5f8', '#9774fa']} style={[StyleSheet.absoluteFill]} />
			<View />
			<View style={styles.welcomeContentWrapper}>
				<Text style={styles.title}>{t('login.welcomeToMezon')}</Text>
				<Text style={styles.subtitle}>{t('login.desWelcomeToMezon')}</Text>
				<FastImage source={FEATURE_BG} style={styles.welcomeImage} resizeMode={FastImage.resizeMode.contain} />
			</View>
			<TouchableOpacity style={[styles.otpButton, styles.welcomeButton]} onPress={() => onGetStarted()}>
				<Text style={[styles.otpButtonText]}>{t('login.getStarted')}</Text>
				<LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#501794', '#3E70A1']} style={[StyleSheet.absoluteFill]} />
			</TouchableOpacity>
		</View>
	);
};

export default WelcomeScreen;
