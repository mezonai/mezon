import { useTheme } from '@mezon/mobile-ui';
import { accountActions, appActions, useAppDispatch } from '@mezon/store-mobile';
import type { ApiLinkAccountConfirmRequest } from 'mezon-js/types';
import React, { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonButton from '../../../../componentUI/MezonButton';
import OTPInput from '../../../home/homedrawer/components/OTPInput';
import { style } from './styles';

interface IVerifyPhoneNumberProps {
	navigation: any;
	route: {
		params: {
			phoneNumber: string;
			requestId: string;
		};
	};
}

export const VerifyPhoneNumber = memo(({ navigation, route }: IVerifyPhoneNumberProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation('accountSetting');
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { phoneNumber, requestId } = route.params;
	const [otpCode, setOtpCode] = useState<string>('');
	const isValidOtp = /^\d{6}$/.test(otpCode);

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
					dispatch(accountActions.updatePhoneNumber(phoneNumber));
					Toast.show({
						type: 'success',
						text1: t('phoneNumberSetting.verifyPhoneNumber.success')
					});
					navigation.navigate('ROUTES.SETTINGS.ACCOUNT');
				} else {
					Toast.show({
						type: 'error',
						text1: t('phoneNumberSetting.updatePhoneNumber.failed'),
						text2: response?.payload?.message || ''
					});
				}
			} catch (error) {
				console.error('Error verify phone number: ', error);
			} finally {
				dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[requestId, t]
	);

	const handleOtpChange = useCallback((otp: string[]) => {
		setOtpCode(otp.join(''));
	}, []);

	return (
		<View style={styles.container}>
			<Text style={styles.subtitle}>{`${t('phoneNumberSetting.verifyPhoneNumber.description')} ${phoneNumber}`}</Text>
			<OTPInput onOtpChange={handleOtpChange} onOtpComplete={handleVerify} isSms={true} />

			<MezonButton
				title={t('phoneNumberSetting.verifyPhoneNumber.verifyButton')}
				titleStyle={styles.buttonTitle}
				onPress={() => handleVerify(otpCode)}
				containerStyle={[styles.verifyButton, isValidOtp ? styles.verifyButtonActive : {}]}
				disabled={!isValidOtp}
			/>
		</View>
	);
});
