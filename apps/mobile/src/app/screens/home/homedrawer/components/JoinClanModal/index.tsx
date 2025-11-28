import {
	ActionEmitEvent,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_CLAN_ID,
	inviteLinkRegex,
	remove,
	save,
	validLinkInviteRegex
} from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { clansActions, getStoreAsync, inviteActions } from '@mezon/store-mobile';
import type { ApiInviteUserRes } from 'mezon-js/api.gen';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../componentUI/MezonInput';
import { ErrorInput } from '../../../../../components/ErrorInput';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { styles } from './JoinClanModal.styles';

const JoinClanModal = () => {
	const [inviteLink, setInviteLink] = useState<string>('');
	const [isValidInvite, setIsValidInvite] = useState<boolean>(true);
	const { t } = useTranslation(['userEmptyClan', 'common']);
	const { themeValue } = useTheme();

	const joinClan = async () => {
		const inviteId = extractIdFromUrl(inviteLink.trim());
		const isValidLinkInvite = Boolean(inviteId?.length === 19 && validLinkInviteRegex.test(inviteLink.trim()));
		setIsValidInvite(isValidLinkInvite);
		if (!isValidLinkInvite) return;

		try {
			const store = await getStoreAsync();
			const response = await store.dispatch(inviteActions.inviteUser({ inviteId }));
			const payload = response?.payload as ApiInviteUserRes;

			if (payload && payload?.clan_id) {
				await remove(STORAGE_CHANNEL_CURRENT_CACHE);
				save(STORAGE_CLAN_ID, payload.clan_id);
				store.dispatch(clansActions.joinClan({ clanId: payload.clan_id }));
				store.dispatch(clansActions.changeCurrentClan({ clanId: payload.clan_id }));
				await store.dispatch(clansActions.fetchClans({ noCache: true, isMobile: true }));
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			} else {
				Toast.show({
					type: 'error',
					text1: t('common:cannotJoinClan')
				});
			}
		} catch (error) {
			console.error('Error joining clan:', error);
		}
	};

	const extractIdFromUrl = (url: string) => {
		const match = url?.match(inviteLinkRegex);
		return match ? match[1] : '';
	};

	const onBack = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	return (
		<View style={styles.container}>
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<View style={styles.contentWrapper}>
				<View style={styles.headerSection}>
					<TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
						<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.text} width={size.s_30} height={size.s_30} />
					</TouchableOpacity>
					<Text style={[styles.title, { color: themeValue.text }]}>{t('joinClan.joinExistClan')}</Text>
					<Text style={[styles.description, { color: themeValue.textDisabled }]}>{t('joinClan.enterInvite')}</Text>
				</View>
				<MezonInput
					label={t('joinClan.labelInput')}
					onTextChange={setInviteLink}
					placeHolder={`https://mezon.ai/invite/1813407038846046912`}
					value={inviteLink}
				/>
				{!isValidInvite && <ErrorInput errorMessage={t('joinClan.errorMessage')} />}
				<Text style={[styles.textExample, { color: themeValue.textDisabled }]}>{t('joinClan.linkInviteEx')}</Text>
				<TouchableOpacity onPress={() => joinClan()} style={styles.btnInvite}>
					<Text style={styles.textInviteBtn}>{t('joinClan.joinInviteLink')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default JoinClanModal;
