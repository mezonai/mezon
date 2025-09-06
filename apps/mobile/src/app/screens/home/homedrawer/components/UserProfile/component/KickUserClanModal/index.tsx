import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelMembersEntity, selectCurrentClan } from '@mezon/store-mobile';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import MezonButton, { EMezonButtonSize, EMezonButtonTheme } from '../../../../../../../componentUI/MezonButton';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../../../componentUI/MezonInput';
import StatusBarHeight from '../../../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
import { style } from './KickUserClanModal.style';

const KickUserClanModal = ({ user, onRemoveUserClan }: { user: ChannelMembersEntity; onRemoveUserClan: () => void }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['userProfile']);
	const [reason, setReason] = useState<string>('');
	const currentClan = useSelector(selectCurrentClan);

	return (
		<View style={styles.modalWrapper}>
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<View style={styles.headerRow}>
				<TouchableOpacity
					style={styles.leftClose}
					onPress={() => DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true })}
				>
					<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Are you sure?</Text>
				<View style={{ width: size.s_20 }} />
			</View>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'position'} style={{ flex: 1 }}>
				<View>
					<View style={styles.headerContent}>
						<Text style={styles.textError}>
							{t('kickUserClanModal.kickFromServer', { username: user?.user?.username || user?.['username'] })}
						</Text>
						<Text style={styles.clanName}>{currentClan?.clan_name}</Text>
					</View>
					<Text style={styles.description}>
						{t('kickUserClanModal.description', { username: user?.user?.username || user?.['username'] })}
					</Text>
					<View style={styles.textAreaBox}>
						<MezonInput
							label={t('kickUserClanModal.reasonKick', { username: user?.user?.username || user?.['username'] })}
							textarea
							inputStyle={{ height: size.s_70 }}
							onTextChange={setReason}
							value={reason}
							showBorderOnFocus
						/>
					</View>
				</View>

				<MezonButton
					onPress={onRemoveUserClan}
					title={t('kickUserClanModal.buttonName', { username: user?.user?.username || user?.['username'] })}
					type={EMezonButtonTheme.THEME}
					size={EMezonButtonSize.LG}
					containerStyle={styles.button}
					titleStyle={styles.textButton}
				/>
			</KeyboardAvoidingView>
		</View>
	);
};

export default KickUserClanModal;
