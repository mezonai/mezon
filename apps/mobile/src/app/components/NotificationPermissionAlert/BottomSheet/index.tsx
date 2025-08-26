import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface BottomSheetProps {
	onDismiss?: () => void;
	onOpenSettings?: () => void;
}

export const NotificationBottomSheet: React.FC<BottomSheetProps> = ({ onDismiss, onOpenSettings }) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['notification']);
	const style = styles(themeValue);

	const handleOpenSettings = async () => {
		if (onOpenSettings) {
			onOpenSettings();
		}

		if (Platform.OS === 'ios') {
			await Linking.openURL('app-settings:');
		} else {
			await Linking.openSettings();
		}

		if (onDismiss) {
			onDismiss();
		}
	};

	const features = [
		{
			icon: '💬',
			title: t('permissionAlert.features.newMessages.title'),
			description: t('permissionAlert.features.newMessages.description')
		},
		{
			icon: '🔔',
			title: t('permissionAlert.features.mentions.title'),
			description: t('permissionAlert.features.mentions.description')
		},
		{
			icon: '🔕',
			title: t('permissionAlert.features.muteControl.title'),
			description: t('permissionAlert.features.muteControl.description')
		}
	];

	return (
		<View style={style.container}>
			<View style={style.content}>
				<View style={style.header}>
					<View style={style.iconContainer}>
						<Text style={style.bellIcon}>🔔</Text>
					</View>
					<Text style={style.title}>{t('permissionAlert.turnOnNotifications')}</Text>
					<Text style={style.subtitle}>{t('permissionAlert.permissionDescription')}</Text>
				</View>

				<View style={style.featuresList}>
					{features.map((feature, index) => (
						<View key={index} style={style.featureItem}>
							<View style={style.featureIconContainer}>
								<Text style={style.featureIcon}>{feature.icon}</Text>
							</View>
							<View style={style.featureTextContainer}>
								<Text style={style.featureTitle}>{feature.title}</Text>
								<Text style={style.featureDescription}>{feature.description}</Text>
							</View>
						</View>
					))}
				</View>

				<TouchableOpacity style={style.openSettingsButton} onPress={handleOpenSettings} activeOpacity={0.8}>
					<Text style={style.openSettingsButtonText}>{t('permissionAlert.openSettings')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};
