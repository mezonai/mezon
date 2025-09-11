import { useTheme } from '@mezon/mobile-ui';
import type { ClansEntity } from '@mezon/store-mobile';
import { selectClanMemberWithStatusIds, selectMembersClanCount } from '@mezon/store-mobile';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import MezonBadge from '../../../../../../componentUI/MezonBadge';
import { style } from './styles';

interface ClanMenuInfoProps {
	clan: ClansEntity;
}
export default function ClanMenuInfo({ clan }: ClanMenuInfoProps) {
	const { t } = useTranslation(['clanMenu']);
	const styles = style(useTheme().themeValue);
	const onlineMembers = useSelector(selectClanMemberWithStatusIds)?.online?.length || 0;
	const members = useSelector(selectMembersClanCount);

	return (
		<View style={styles.info}>
			{clan?.is_community && <MezonBadge title={t('common.community')} />}
			<View style={styles.inlineInfo}>
				<MezonIconCDN icon={IconCDN.circleIcon} height={10} width={10} color="green" />
				<Text style={styles.inlineText}>{`${onlineMembers} ${t('info.online')}`}</Text>
			</View>

			<View style={styles.inlineInfo}>
				<MezonIconCDN icon={IconCDN.circleIcon} height={10} width={10} color="gray" />
				<Text style={styles.inlineText}>{`${members} ${t('info.members')}`}</Text>
			</View>
		</View>
	);
}
