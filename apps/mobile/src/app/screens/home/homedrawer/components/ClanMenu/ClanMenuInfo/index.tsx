import { CircleIcon } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { ClansEntity, selectClanMemberWithStatusIds, selectMembersClanCount } from '@mezon/store-mobile';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
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
			<MezonBadge title="Community Clan" />
			<View style={styles.inlineInfo}>
				<CircleIcon height={10} width={10} color="green" />
				<Text style={styles.inlineText}>{`${onlineMembers} ${t('info.online')}`}</Text>
			</View>

			<View style={styles.inlineInfo}>
				<CircleIcon height={10} width={10} color="gray" />
				<Text style={styles.inlineText}>{`${members} ${t('info.members')}`}</Text>
			</View>
		</View>
	);
}
