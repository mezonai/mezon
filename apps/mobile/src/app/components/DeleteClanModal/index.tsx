import { useChannelMembersActions } from '@mezon/core';
import {
	ActionEmitEvent,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_CLAN_ID,
	STORAGE_MY_USER_ID,
	load,
	remove,
	save,
	setDefaultChannelLoader
} from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	clansActions,
	getStoreAsync,
	selectAllClans,
	selectCurrentClan,
	selectCurrentVoiceChannelId,
	useAppDispatch
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text } from 'react-native';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../componentUI/MezonConfirm';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { styles } from './DeleteClanModal.styles';

const DeleteClanModal = ({ isLeaveClan = false }: { isLeaveClan?: boolean }) => {
	const currentClan = useSelector(selectCurrentClan);
	const { t } = useTranslation(['deleteClan']);
	const dispatch = useAppDispatch();
	const clans = useSelector(selectAllClans);
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();
	const { removeMemberClan } = useChannelMembersActions();
	const currentChannelId = useSelector(selectCurrentVoiceChannelId);
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const currentClanName = useMemo(() => {
		return currentClan?.clan_name;
	}, [currentClan?.clan_name]);

	const onConfirm = async () => {
		if (isLeaveClan) {
			await removeMemberClan({
				channelId: currentChannelId,
				clanId: currentClan?.clan_id,
				userIds: [userId]
			});
		} else {
			await dispatch(clansActions.deleteClan({ clanId: currentClan?.clan_id || '' }));
		}
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		const store = await getStoreAsync();

		await remove(STORAGE_CHANNEL_CURRENT_CACHE);
		const indexClanJoin = currentClan?.clan_id === clans[0]?.clan_id ? 1 : 0;
		if (clans?.length === 1) {
			navigation.navigate(APP_SCREEN.MESSAGES.HOME);
			return;
		}
		if (clans?.[indexClanJoin]) {
			navigation.navigate(APP_SCREEN.HOME);
			store.dispatch(clansActions.joinClan({ clanId: clans?.[indexClanJoin]?.clan_id }));
			save(STORAGE_CLAN_ID, clans?.[indexClanJoin]?.clan_id);
			store.dispatch(clansActions.changeCurrentClan({ clanId: clans[indexClanJoin]?.clan_id }));
			const respChannel = await store.dispatch(channelsActions.fetchChannels({ clanId: clans[indexClanJoin]?.clan_id }));
			await setDefaultChannelLoader(respChannel.payload, clans[indexClanJoin]?.clan_id);
		} else {
			navigation.navigate(APP_SCREEN.MESSAGES.HOME);
		}
	};

	return (
		<MezonConfirm
			confirmText={t('deleteClanModal.confirm')}
			title={isLeaveClan ? t('deleteClanModal.titleLeaveClan') : t('deleteClanModal.title')}
			children={
				<Text style={[styles.contentText, { color: themeValue.white }]}>
					{t(isLeaveClan ? 'deleteClanModal.descriptionLeaveClan' : 'deleteClanModal.description', { currentClan: currentClanName })
						.split(currentClanName)
						.reduce((acc, part, index) => {
							if (index === 0) {
								return [part];
							}
							return [
								...acc,
								<Text key={index} style={{ fontWeight: 'bold' }}>
									{currentClanName}
								</Text>,
								part
							];
						}, [])}
				</Text>
			}
			onConfirm={onConfirm}
		/>
	);
};

export default DeleteClanModal;
