import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { UsersClanEntity } from '@mezon/utils';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import MezonClanAvatar from '../../../componentUI/MezonClanAvatar';
import { UnbanUserChannelModal } from '../../../screens/home/homedrawer/components/UserProfile/component/UnbanUserChannelModal';
import { style } from './styles';

type BannedUserItemProps = {
	clanId: string;
	channelId: string;
	user: UsersClanEntity;
};

const BannedUserItem = memo(({ user, channelId, clanId }: BannedUserItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('userProfile');

	const handleUnbanUser = useCallback(() => {
		const data = {
			children: <UnbanUserChannelModal clanId={clanId} channelId={channelId} user={user} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [channelId, clanId, user]);

	return (
		<View style={styles.container}>
			<View style={styles.userWrapper}>
				<View style={styles.userAvatar}>
					<MezonClanAvatar
						image={user?.clanAvatar || user?.user?.avatarUrl}
						alt={user?.clanNick || user?.user?.displayName || user?.user?.username}
						imageHeight={100}
						imageWidth={100}
					/>
				</View>
				<Text style={styles.userName} numberOfLines={1}>
					{user?.clanNick || user?.user?.displayName || user?.user?.username}
				</Text>
			</View>
			<TouchableOpacity style={styles.unbanButton} onPress={handleUnbanUser}>
				<Text style={styles.buttonText}>{t('ban.unBanButton')}</Text>
			</TouchableOpacity>
		</View>
	);
});

export default BannedUserItem;
