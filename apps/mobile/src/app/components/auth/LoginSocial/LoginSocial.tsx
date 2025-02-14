import { AppleIcon, GoogleIcon, IS_TABLET } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { style } from './styles';

export const LoginSocial = ({ onGoogleButtonPress, onAppleButtonPress }: any) => {
	const styles = style(useTheme().themeValue);
	const buttonSize = IS_TABLET ? size.s_20 : size.s_18;

	return (
		<View style={{ gap: size.s_20 }}>
			{Platform.OS === 'ios' && (
				<TouchableOpacity style={styles.appleButton} onPress={onAppleButtonPress}>
					<View style={styles.socialButtonsContainer}>
						<AppleIcon width={buttonSize} height={buttonSize} />
						<Text style={[styles.socialSigninButtonText, { color: 'white' }]}>Continue with Apple</Text>
					</View>
				</TouchableOpacity>
			)}
			<TouchableOpacity style={styles.googleButton} onPress={onGoogleButtonPress}>
				<View style={styles.socialButtonsContainer}>
					<GoogleIcon width={buttonSize} height={buttonSize} color={'#155EEF'} />
					<Text style={styles.socialSigninButtonText}>Continue with Google</Text>
				</View>
			</TouchableOpacity>
		</View>
	);
};
