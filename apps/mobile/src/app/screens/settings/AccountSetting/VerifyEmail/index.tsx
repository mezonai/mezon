/* eslint-disable @nx/enforce-module-boundaries */
import { useTheme } from '@mezon/mobile-ui';
import { accountActions, appActions, useAppDispatch } from '@mezon/store-mobile';
import type { ApiLinkAccountConfirmRequest } from 'mezon-js/types';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonButton from '../../../../componentUI/MezonButton';
import OTPInput from '../../../home/homedrawer/components/OTPInput';
import { style } from './styles';

interface IVerifyEmailProps {
	navigation: any;
	route: {
		params?: {
			email?: string;
			requestId?: string;
		};
	};
}

export const VerifyEmail = memo(({ navigation, route }: IVerifyEmailProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation('accountSetting');
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const email = route?.params?.email || '';
	const requestId = route?.params?.requestId || '';
	const [otpCode, setOtpCode] = useState<string>('');
	const isValidOtp = /^\d{6}$/.test(otpCode);
	const [isError, setIsError] = useState<boolean>(false);

	useEffect(() => {
		if (requestId) {
			setIsError(false);
		}
	}, [requestId]);

	const handleVerify = useCallback(
		async (otp: string) => {
			const payload = {
				otp_code: otp,
				req_id: requestId
			};

			try {
				dispatch(appActions.setLoadingMainMobile(true));
				const response = await dispatch(accountActions.verifyPhone({ data: payload as ApiLinkAccountConfirmRequest, isMobile: true }));
				if (response?.meta?.requestStatus === 'fulfilled') {
					dispatch(accountActions.updateEmail(email));
					Toast.show({
						type: 'success',
						text1: t('emailSetting.verifyEmail.success')
					});
					navigation.navigate('ROUTES.SETTINGS.ACCOUNT');
				} else {
					setIsError(true);
					Toast.show({
						type: 'error',
						text1: t('emailSetting.updateEmail.failed'),
						text2: response?.payload?.message || ''
					});
				}
			} catch (error) {
				setIsError(true);
				console.error('Error verify new email: ', error);
			} finally {
				dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[requestId, t]
	);

	const handleOtpChange = useCallback(
		(otp: string[]) => {
			if (isError) {
				setIsError(false);
			}
			setOtpCode(otp.join(''));
		},
		[isError]
	);

	return (
		<View style={styles.container}>
			<Text style={styles.subtitle}>{`${t('emailSetting.verifyEmail.description')} ${email}`}</Text>
			<OTPInput onOtpChange={handleOtpChange} onOtpComplete={handleVerify} isError={isError} />

			<MezonButton
				title={t('emailSetting.verifyEmail.verifyButton')}
				titleStyle={styles.buttonTitle}
				onPress={() => handleVerify(otpCode)}
				containerStyle={[styles.verifyButton, isValidOtp ? styles.verifyButtonActive : {}]}
				disabled={!isValidOtp}
			/>
		</View>
	);
});
