import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { ActionEmitEvent, changeClan, getUpdateOrAddClanChannelCache, save, STORAGE_DATA_CLAN_CHANNEL_CACHE } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	directActions,
	getStore,
	getStoreAsync,
	selectCurrentClanId,
	selectDmGroupCurrentId,
	useAppDispatch,
} from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import MezonIconCDN from 'apps/mobile/src/app/componentUI/MezonIconCDN';
import { IconCDN } from 'apps/mobile/src/app/constants/icon_cdn';
import { APP_SCREEN } from 'apps/mobile/src/app/navigation/ScreenTypes';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import InviteToChannel from '../InviteToChannel';
import { style } from './JoinChannelMessageBS.style';
function JoinChannelMessageBS({ channel, icon }: { channel: IChannel, icon: IconCDN }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { dismiss } = useBottomSheetModal();
	const { t } = useTranslation(['channelVoice']);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();

	const jumpToChannel = async (channelId: string, clanId: string) => {
		const store = await getStoreAsync();
		store.dispatch(
			channelsActions.joinChannel({
				clanId,
				channelId,
				noFetchMembers: false,
				noCache: true
			})
		);
	};

	const navigation = useNavigation<any>();

	const handleJoinChannel = async () => {
		const store = getStore();
		const channelId = channel?.channel_id;
		const clanId = channel?.clan_id;

		const clanIdStore = selectCurrentClanId(store.getState());
		const currentDirectId = selectDmGroupCurrentId(store.getState());
		const currentClanId = currentDirectId ? '0' : clanIdStore;

		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		await jumpToChannel(channelId, clanId);

		if (currentDirectId) {
			dispatch(directActions.setDmGroupCurrentId(''));
			navigation.navigate(APP_SCREEN.HOME_DEFAULT);
		}

		if (currentClanId !== clanId) {
			changeClan(clanId);
		}
		DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
			isFetchMemberChannelDM: true
		});
		dismiss();
	};

	return (
		<View style={{ width: '100%', paddingVertical: size.s_10, paddingHorizontal: size.s_10 }}>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexGrow: 1, flexShrink: 1 }}>
					<TouchableOpacity
						onPress={() => {
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
						}}
						style={styles.buttonCircle}
					>
						<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} color={themeValue.textStrong} />
					</TouchableOpacity>
					<Text numberOfLines={2} style={[styles.text, { flexGrow: 1, flexShrink: 1 }]}>
						{channel?.channel_label}
					</Text>
				</View>
				<TouchableOpacity
					onPress={() => {
						const data = {
							snapPoints: ['70%', '90%'],
							children: <InviteToChannel isUnknownChannel={false} />
						};
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
					}}
					style={{
						backgroundColor: themeValue.tertiary,
						padding: size.s_8,
						borderRadius: size.s_22
					}}
				>
					<MezonIconCDN icon={IconCDN.userPlusIcon} color={themeValue.textStrong} />
				</TouchableOpacity>
			</View>
			<View style={{ alignItems: 'center', gap: size.s_6, marginTop: size.s_20 }}>
				<View
					style={{
						paddingVertical: size.s_10,
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					<View style={styles.iconChannel}>
						<MezonIconCDN icon={icon} width={size.s_36} height={size.s_36} color={themeValue.textStrong} />
					</View>
				</View>
				<Text style={styles.text}>{t('joinChannelMessageBS.channelMessage')}</Text>
				<Text style={styles.textDisable}>{t('joinChannelMessageBS.title')}</Text>
			</View>
			<View style={{ borderRadius: size.s_40, marginTop: size.s_20, marginBottom: size.s_10 }}>
				<View
					style={{
						gap: size.s_20,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingHorizontal: size.s_16,
						paddingBottom: size.s_16
					}}
				>
					<TouchableOpacity style={styles.btnJoinChannel} onPress={handleJoinChannel}>
						<Text style={styles.textBtnJoinChannel}>{t('joinChannelMessageBS.joinChannel')}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

export default React.memo(JoinChannelMessageBS);
