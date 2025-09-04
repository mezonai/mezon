import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import MezonIconCDN from 'apps/mobile/src/app/componentUI/MezonIconCDN';
import { IconCDN } from 'apps/mobile/src/app/constants/icon_cdn';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { style } from './styles';

export interface OnboardingBottomSheetProps {
	actionList?: OnboardingItemProps[];
	finishedStep?: number;
	allSteps?: number;
}

export interface OnboardingItemProps {
	title: string;
	icon: any;
	value?: boolean;
	onPress?: () => void;
}

export const OnboardingBottomSheet = memo(({ actionList, finishedStep, allSteps }: OnboardingBottomSheetProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['onBoardingClan']);

	return (
		<View style={styles.wrapper}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject, { borderRadius: size.s_16 }]}
			/>
			<View style={styles.titleGroup}>
				<View style={styles.image}>
					<MezonIconCDN icon={IconCDN.magicIcon} height={size.s_60} width={size.s_60} useOriginalColor customStyle={{ zIndex: 5 }} />
					<View style={styles.background} />
					<View style={styles.thirdCircle} />
					<View style={styles.secondCircle} />
					<View style={styles.firstCircle} />
				</View>

				<Text style={styles.title}>{t('action.title')}</Text>
				<Text style={styles.description}>{t('action.description', { step: finishedStep, total: allSteps })}</Text>
			</View>
			{actionList?.map((item, index) => (
				<TouchableOpacity style={styles.container} key={index.toString()} onPress={item?.onPress}>
					<View style={styles.titleRow}>
						{item?.icon}
						<View>
							<Text style={styles.setupTitle}>{item.title}</Text>
						</View>
					</View>
					{item?.value ? (
						<MezonIconCDN icon={IconCDN.verifyIcon} height={size.s_24} width={size.s_24} color={baseColor.bgSuccess} />
					) : (
						<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={size.s_24} width={size.s_24} color={themeValue.text} />
					)}
				</TouchableOpacity>
			))}
		</View>
	);
});
