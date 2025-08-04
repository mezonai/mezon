import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelMembersEntity, selectCurrentClan } from '@mezon/store-mobile';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonButton, { EMezonButtonSize, EMezonButtonTheme } from '../../../../../../../componentUI/MezonButton2';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../../../componentUI/MezonInput';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
import { style } from './KickUserClanModal.style';

const KickUserClanModal = ({ user, onRemoveUserClan }: { user: ChannelMembersEntity; onRemoveUserClan: () => void }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['userProfile']);
	const [reason, setReason] = useState<string>('');
	const currentClan = useSelector(selectCurrentClan);

	return (
		<View style={{ height: '100%', overflow: 'hidden' }}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'position'} style={{ flex: 1 }}>
				<View style={styles.container}>
					<View style={styles.headerContent}>
						<MezonIconCDN icon={IconCDN.userKickIcon} width={100} height={100} useOriginalColor />
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
