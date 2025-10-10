import { baseColor, useTheme } from '@mezon/mobile-ui';
import { accountActions, useAppDispatch } from '@mezon/store-mobile';
import type { ApiLinkAccountConfirmRequest } from 'mezon-js/api.gen';
import React, { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonButton from '../../../../componentUI/MezonButton';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
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
				const response = await dispatch(accountActions.verifyPhone(payload as ApiLinkAccountConfirmRequest));
				if (response?.meta?.requestStatus === 'fulfilled') {
					dispatch(accountActions.updatePhoneNumber(phoneNumber));
					Toast.show({
						type: 'success',
						props: {
							text2: t('phoneNumberSetting.verifyPhoneNumber.success'),
							leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkLargeIcon} color={baseColor.green} />
						}
					});
					navigation.navigate('ROUTES.SETTINGS.ACCOUNT');
				} else {
					Toast.show({
						type: 'success',
						props: {
							text2: t('phoneNumberSetting.verifyPhoneNumber.failed'),
							leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
						}
					});
				}
			} catch (error) {
				console.error('Error verify phone number: ', error);
			}
		},
		[dispatch, navigation, requestId, t]
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
