import { useMemberStatus } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAllAccount, selectStatusInVoice, useAppSelector } from '@mezon/store-mobile';
import { EUserStatus } from '@mezon/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

type MemberInvoiceStatusProps = {
	userId: string;
};
export const MemberInvoiceStatus = ({ userId }: MemberInvoiceStatusProps) => {
	const { t } = useTranslation(['userProfile']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userVoiceStatus = useAppSelector((state) => selectStatusInVoice(state, userId));
	const getStatus = useMemberStatus(userId);
	const currentUserProfile = useAppSelector(selectAllAccount);

	const infoMemberStatus = useMemo(() => {
		if (userId !== currentUserProfile?.user?.id) {
			return getStatus;
		}
		return {
			status: currentUserProfile?.user?.status || EUserStatus.ONLINE,
			userStatus: currentUserProfile?.user?.userStatus
		};
	}, [currentUserProfile?.user?.id, currentUserProfile?.user?.status, currentUserProfile?.user?.userStatus, getStatus, userId]);

	if (!userVoiceStatus || infoMemberStatus?.status === EUserStatus.INVISIBLE) {
		return null;
	}

	return (
		<View style={styles.voiceContainer}>
			<MezonIconCDN icon={IconCDN.channelVoice} color={baseColor.green} width={size.s_12} height={size.s_12} />
			<Text style={styles.voiceText}>{t('voiceInfo.inVoice')}</Text>
		</View>
	);
};
