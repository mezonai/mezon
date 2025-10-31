import { useAccount } from '@mezon/core';
import { size } from '@mezon/mobile-ui';
import { accountActions, appActions } from '@mezon/store';
import { useAppDispatch } from '@mezon/store-mobile';
import React, { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { ErrorInput } from '../ErrorInput';
import { style } from './styles';

const UpdateUserName = () => {
	const styles = style();
	const [userName, setUserName] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isLandscape, setIsLandscape] = useState(false);
	const [isError, setIsError] = useState(false);
	const { updateUserName } = useAccount();
	const dispatch = useAppDispatch();
	const isTabletLandscape = useTabletLandscape();

	const { t } = useTranslation(['common']);
	const isFormValid = userName?.length >= 1;

	const checkOrientation = () => {
		const { width, height } = Dimensions.get('screen');
		setIsLandscape(width > height);
	};

	useEffect(() => {
		checkOrientation();

		const subscription = Dimensions.addEventListener('change', () => {
			checkOrientation();
		});

		return () => subscription?.remove();
	}, []);

	const handlePrimaryAction = async () => {
		try {
			setIsError(false);
			setIsLoading(true);
			const responseSession = await updateUserName(userName);
			if (responseSession) {
				dispatch(accountActions.getUserProfile({ noCache: true }));
				dispatch(appActions.setIsShowUpdateUsername(false));
			} else {
				setIsError(true);
			}
			setIsLoading(false);
		} catch (error) {
			setIsLoading(false);
			Toast.show({
				type: 'error',
				props: {
					text2: error?.message || 'Have some error, please try again!'
				}
			});
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.container} bounces={false} keyboardShouldPersistTaps={'handled'}>
			<LinearGradient colors={['#f0edfd', '#beb5f8', '#9774fa']} style={[StyleSheet.absoluteFillObject]} />

			<KeyboardAvoidingView
				style={styles.keyboardAvoidingView}
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
			>
				<View style={[styles.content, isLandscape && isTabletLandscape && { paddingTop: size.s_10 }]}>
					<Text style={styles.title}>{t('updateUsername.enterUsername')}</Text>
					<Text style={styles.subtitle}>{t('updateUsername.usernamePlaceholder')}</Text>

					<View style={styles.inputSection}>
						<View style={styles.inputWrapper}>
							<MezonIconCDN icon={IconCDN.userIcon} width={size.s_20} height={size.s_20} color={'#454545'} />
							<View style={styles.inputContainer}>
								<TextInput
									style={styles.emailInput}
									placeholder={t('updateUsername.yourName')}
									placeholderTextColor={styles.placeholder.color}
									value={userName}
									onChangeText={setUserName}
									autoCapitalize="none"
									autoCorrect={false}
									autoFocus={true}
									onSubmitEditing={handlePrimaryAction}
									underlineColorAndroid="transparent"
								/>
							</View>
						</View>
						<View style={styles.errorContainer}>{isError && <ErrorInput errorMessage={t('updateUsername.errorDuplicate')} />}</View>
					</View>

					<TouchableOpacity
						style={[styles.otpButton, !isFormValid && styles.otpButtonDisabled]}
						onPress={handlePrimaryAction}
						disabled={!isFormValid || isLoading}
					>
						{isLoading ? (
							<ActivityIndicator size="small" color="#FFFFFF" style={styles.activityIndicator} />
						) : (
							<Text style={[styles.otpButtonText]}>{t('updateUsername.update')}</Text>
						)}
						{isFormValid && (
							<LinearGradient
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								colors={['#501794', '#3E70A1']}
								style={[StyleSheet.absoluteFillObject]}
							/>
						)}
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</ScrollView>
	);
};

export default memo(UpdateUserName);
