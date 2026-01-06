import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelMembersEntity } from '@mezon/store-mobile';
import { channelMembersActions, useAppDispatch } from '@mezon/store-mobile';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import useTabletLandscape from '../../../../../../../hooks/useTabletLandscape';
import { style } from './styles';

interface IBuzzMessageModalProps {
	clanId: string;
	channelId: string;
	user: ChannelMembersEntity;
}

export const UnbanUserChannelModal = memo((props: IBuzzMessageModalProps) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { user, clanId, channelId } = props;
	const { t } = useTranslation('userProfile');
	const dispatch = useAppDispatch();

	const onUnbanUser = useCallback(async () => {
		dispatch(channelMembersActions.unbanUserChannel({ clanId, channelId, userIds: [user?.id] }));
		onClose();
	}, [channelId, clanId, dispatch, user?.id]);

	const onClose = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};
	return (
		<View style={styles.main}>
			<View style={[styles.container, isTabletLandscape && { maxWidth: '40%' }]}>
				<Text style={styles.modalTitle}>{t('ban.unbanTitle')}</Text>
				<View>
					<Text style={[styles.title, { marginBottom: size.s_20 }]}>
						{t('ban.unBanDescription', { userName: user?.clanNick || user.user?.displayName || user.user?.username })}
					</Text>
				</View>
				<TouchableOpacity onPress={onUnbanUser} style={styles.yesButton}>
					<Text style={styles.buttonText}>{t('ban.unBanButton')}</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={onClose} />
		</View>
	);
});
